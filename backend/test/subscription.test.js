'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createClient } = require('@libsql/client');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createSubscriptionService, subscriptionStatus, nextCutoff } = require('../src/services/subscriptionService');
const { createSubscriptionRouter } = require('../src/routes/subscriptionRoutes');
const { createAuthMiddleware } = require('../src/middleware/auth');

async function fixture(t) {
  const client = createClient({ url: 'file::memory:' });
  t.after(() => client.close());
  await client.batch([
    'CREATE TABLE Subscription (id TEXT PRIMARY KEY, cutoffDay INTEGER, paidThrough TEXT, blocked INTEGER DEFAULT 0, paymentWarning INTEGER DEFAULT 0, updatedAt TEXT)',
    'CREATE TABLE SubscriptionPayment (id TEXT PRIMARY KEY, paidAt TEXT DEFAULT CURRENT_TIMESTAMP, paidThrough TEXT, amount REAL, notes TEXT, createdBy TEXT)',
    `INSERT INTO Subscription (id, cutoffDay, paidThrough) VALUES ('main', 20, '2026-11-20')`,
  ], 'write');
  const clock = () => new Date('2026-11-13T15:00:00Z');
  return { client, clock, service: createSubscriptionService(client, clock) };
}

test('el estado compartido conserva bloqueo, reactivación y avisos entre dispositivos', async (t) => {
  const { client, clock, service } = await fixture(t);
  const otherDevice = createSubscriptionService(client, clock);
  assert.equal((await otherDevice.getStatus()).isExpired, false);
  await service.setBlocked(true);
  await service.setPaymentWarning(true);
  assert.equal((await otherDevice.getStatus()).isExpired, true);
  assert.equal((await otherDevice.getStatus()).paymentWarning, true);
  await otherDevice.setBlocked(false);
  assert.equal((await service.getStatus()).isExpired, false);
  assert.equal((await service.getStatus()).paymentWarning, true);
  await service.setPaymentWarning(false);
  assert.equal((await otherDevice.getStatus()).paymentWarning, false);
});

test('los cambios de campos distintos no se pisan', async (t) => {
  const { service } = await fixture(t);
  await Promise.all([service.setCutoffDay(20), service.setPaymentWarning(true)]);
  const status = await service.getStatus();
  assert.equal(status.cutoffDay, 20);
  assert.equal(status.paymentWarning, true);
});

test('valida datos antes de persistir y conserva el estado si falla', async (t) => {
  const { service } = await fixture(t);
  for (const day of [null, 0, 32, -1, 1.5, '20', NaN]) await assert.rejects(service.setCutoffDay(day), { status: 400 });
  await assert.rejects(service.setPaymentWarning('true'), { status: 400 });
  await assert.rejects(service.setBlocked('false'), { status: 400 });
  await assert.rejects(service.renew({ amount: -1 }), { status: 400 });
  assert.equal((await service.getStatus()).cutoffDay, 20);
  assert.equal((await service.getPayments()).length, 0);
});

test('el corte usa el fin del día argentino y conserva el instante de las fechas ISO', () => {
  const config = { cutoffDay: 13, paidThrough: '2026-11-13' };
  const lastMinute = subscriptionStatus(config, new Date('2026-11-14T02:59:58Z'));
  assert.equal(lastMinute.isExpired, false);
  assert.equal(lastMinute.isWarningPhase, true);
  assert.equal(subscriptionStatus(config, new Date('2026-11-14T03:00:00Z')).isExpired, true);
  assert.equal(nextCutoff(13, new Date('2026-11-13T15:00:00Z')).toISOString(), '2026-11-14T02:59:59.999Z');
  const exact = { paidThrough: '2026-11-13T15:00:00.000Z' };
  assert.equal(subscriptionStatus(exact, new Date('2026-11-13T14:59:59Z')).isExpired, false);
  assert.equal(subscriptionStatus(exact, new Date(exact.paidThrough)).isExpired, true);
});

test('el corte 31 se ajusta a meses cortos y años bisiestos', () => {
  for (const [date, expected] of [
    ['2026-02-01T15:00:00Z', '2026-03-01T02:59:59.999Z'],
    ['2028-02-01T15:00:00Z', '2028-03-01T02:59:59.999Z'],
    ['2026-04-01T15:00:00Z', '2026-05-01T02:59:59.999Z'],
    ['2026-12-31T15:00:00Z', '2027-01-01T02:59:59.999Z'],
  ]) assert.equal(nextCutoff(31, new Date(date)).toISOString(), expected);
});

test('un nuevo mes no reactiva un período impago y quitar el bloqueo no renueva', async (t) => {
  const { client, service } = await fixture(t);
  const december = createSubscriptionService(client, () => new Date('2026-12-01T15:00:00Z'));
  assert.equal((await december.getStatus()).isExpired, true);
  await december.setBlocked(false);
  assert.equal((await december.getStatus()).isExpired, true);
  assert.equal(subscriptionStatus({}).isExpired, true);
  assert.equal(subscriptionStatus({ paidThrough: 'inválido' }).isExpired, true);
  assert.equal((await service.getStatus()).isExpired, false);
});

test('la renovación conserva historial de pagos y limpia bloqueo y aviso', async (t) => {
  const { service } = await fixture(t);
  await service.setBlocked(true);
  await service.setPaymentWarning(true);
  const result = await service.renew({ amount: 12000, notes: 'Transferencia', userId: 'creator' });
  assert.equal(result.isExpired, false);
  assert.equal(result.blocked, false);
  assert.equal(result.paymentWarning, false);
  const [payment] = await service.getPayments();
  assert.equal(payment.amount, 12000);
  assert.equal(payment.notes, 'Transferencia');
  assert.equal(payment.createdBy, 'creator');
  assert.equal(payment.paidThrough, result.paidThrough);
});

async function apiFixture(t, service) {
  process.env.JWT_SECRET = 'subscription-regression-tests-only';
  const app = express();
  app.use(express.json());
  app.use('/api/subscription', createSubscriptionRouter(service));
  app.get('/api/protected', createAuthMiddleware(service), (_req, res) => res.json({ ok: true }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return (role, endpoint = '/subscription/status', data, method = 'POST') => fetch(`http://127.0.0.1:${server.address().port}/api${endpoint}`, {
    method: data === undefined ? 'GET' : method,
    headers: {
      'Content-Type': 'application/json',
      ...(role ? { Authorization: `Bearer ${jwt.sign({ role, userId: 'creator' }, process.env.JWT_SECRET)}` } : {}),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
}

test('API: conserva permisos, consulta de vencidos, bloqueo y registro de renovación', async (t) => {
  const { service } = await fixture(t);
  const request = await apiFixture(t, service);
  assert.equal((await request(null)).status, 401);
  for (const role of ['Admin', 'Empleado', 'Usuario']) {
    for (const [path, method, data] of [['block', 'POST', {}], ['renew', 'POST', {}], ['unblock', 'POST', {}],
      ['configure', 'PUT', { cutoffDay: 20 }], ['payment-warning', 'PUT', { active: true }]]) {
      assert.equal((await request(role, `/subscription/${path}`, data, method)).status, 403);
    }
    assert.equal((await request(role, '/subscription/payments')).status, 403);
  }
  assert.equal((await request('Creador', '/subscription/block', {})).status, 200);
  for (const role of ['Admin', 'Empleado']) {
    const response = await request(role);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).isExpired, true);
    const blocked = await request(role, '/protected');
    assert.equal(blocked.status, 402);
    assert.equal((await blocked.json()).code, 'SUBSCRIPTION_EXPIRED');
  }
  assert.equal((await request('Creador', '/protected')).status, 200);
  assert.equal((await request('Creador', '/subscription/renew', { amount: 5000 })).status, 200);
  assert.equal((await request('Admin', '/protected')).status, 200);
  assert.equal((await request('Empleado', '/protected')).status, 200);
  assert.equal((await (await request('Creador', '/subscription/payments')).json()).length, 1);
  assert.equal((await request('Creador', '/subscription/configure', { cutoffDay: 99 }, 'PUT')).status, 400);
  assert.equal((await request('Creador', '/subscription/payment-warning', { active: 'false' }, 'PUT')).status, 400);
});

test('un fallo del servidor devuelve 503, sin inventar un vencimiento', async (t) => {
  const unavailable = async () => { throw new Error('database unavailable'); };
  const request = await apiFixture(t, { getStatus: unavailable, renew: unavailable });
  for (const path of ['/subscription/status', '/protected']) {
    const response = await request('Admin', path);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, undefined);
  }
  assert.equal((await request('Creador', '/subscription/renew', {})).status, 503);
});
