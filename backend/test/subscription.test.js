'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createClient } = require('@libsql/client');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createSubscriptionService, subscriptionStatus } = require('../src/services/subscriptionService');
const { createSubscriptionRouter, requireActiveSubscription } = require('../src/routes/subscriptionRoutes');
const { authMiddleware } = require('../src/middleware/auth');

async function fixture(t) {
  const client = createClient({ url: 'file::memory:' });
  t.after(() => client.close());
  await client.execute('CREATE TABLE cloud_store (key TEXT PRIMARY KEY, value TEXT)');
  const clock = () => new Date('2026-11-13T15:00:00Z');
  return { client, clock, service: createSubscriptionService(client, clock) };
}

test('el estado compartido persiste entre dispositivos y reactivaciones', async (t) => {
  const { client, clock, service } = await fixture(t);
  const otherDevice = createSubscriptionService(client, clock);
  assert.equal((await otherDevice.getStatus()).isExpired, false);
  await service.update({ deadline: '1970-01-01T00:00:00.000Z', paymentWarning: true });
  assert.equal((await otherDevice.getStatus()).isExpired, true);
  assert.equal((await otherDevice.getStatus()).paymentWarning, true);
  await otherDevice.update({ deadline: null });
  assert.equal((await service.getStatus()).isExpired, false);
  assert.equal((await service.getStatus()).paymentWarning, true);
  await service.update({ paymentWarning: false });
  assert.equal((await otherDevice.getStatus()).paymentWarning, false);
});

test('actualizaciones de campos distintos conservan ambos cambios', async (t) => {
  const { service } = await fixture(t);
  await Promise.all([service.update({ deadline: '20' }), service.update({ paymentWarning: true })]);
  const status = await service.getStatus();
  assert.equal(status.deadline, '20');
  assert.equal(status.paymentWarning, true);
});

test('valida datos antes de persistir y conserva el estado si falla', async (t) => {
  const { service } = await fixture(t);
  await service.update({ deadline: '20' });
  for (const patch of [null, [], {}, { deadline: '32' }, { deadline: '0' }, { deadline: '2026-11-13' },
    { deadline: 'basura' }, { deadline: 20 }, { paymentWarning: 'true' }, { role: 'Creador' },
    { deadline: null, paymentWarning: 1 }]) {
    await assert.rejects(service.update(patch), { status: 400 });
    assert.equal((await service.getStatus()).deadline, '20');
  }
});

test('el corte mensual usa la fecha argentina, incluso cerca de medianoche', () => {
  const settings = { deadline: '13' };
  const lastMinute = subscriptionStatus(settings, new Date('2026-11-14T02:59:59Z'));
  assert.equal(lastMinute.isExpired, false);
  assert.equal(lastMinute.isWarningPhase, true);
  assert.equal(lastMinute.daysRemaining, 0);
  assert.equal(subscriptionStatus(settings, new Date('2026-11-14T03:00:00Z')).isExpired, true);
  assert.equal(subscriptionStatus(settings, new Date('2026-11-08T15:00:00Z')).isWarningPhase, true);
  assert.equal(subscriptionStatus(settings, new Date('2026-11-07T15:00:00Z')).isWarningPhase, false);
});

test('el corte 31 se ajusta al último día en meses cortos y años bisiestos', () => {
  for (const date of ['2026-02-28T15:00:00Z', '2028-02-29T15:00:00Z', '2026-04-30T15:00:00Z']) {
    const status = subscriptionStatus({ deadline: '31' }, new Date(date));
    assert.equal(status.isExpired, false);
    assert.equal(status.daysRemaining, 0);
    assert.equal(status.isWarningPhase, true);
  }
});

test('las fechas absolutas vencen en el instante exacto', () => {
  const settings = { deadline: '2026-11-13T15:00:00.000Z' };
  assert.equal(subscriptionStatus(settings, new Date('2026-11-13T14:59:59Z')).isExpired, false);
  assert.equal(subscriptionStatus(settings, new Date(settings.deadline)).isExpired, true);
});

async function apiFixture(t, service) {
  process.env.JWT_SECRET = 'subscription-regression-tests-only';
  const app = express();
  app.use(express.json());
  app.use('/api/subscription', createSubscriptionRouter(service));
  app.get('/api/protected', authMiddleware, requireActiveSubscription(service), (_req, res) => res.json({ ok: true }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return (role, endpoint = '/subscription', patch) => fetch(`http://127.0.0.1:${server.address().port}/api${endpoint}`, {
    method: patch === undefined ? 'GET' : 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(role ? { Authorization: `Bearer ${jwt.sign({ role }, process.env.JWT_SECRET)}` } : {}),
    },
    ...(patch === undefined ? {} : { body: JSON.stringify(patch) }),
  });
}

test('API: solo el creador modifica; todos consultan; bloqueo y reactivación se comparten', async (t) => {
  const { service } = await fixture(t);
  const request = await apiFixture(t, service);
  assert.equal((await request(null)).status, 401);
  for (const role of ['Admin', 'Empleado', 'Usuario']) {
    assert.equal((await request(role, '/subscription', { deadline: null })).status, 403);
  }
  const blocked = await request('Creador', '/subscription', { deadline: '1970-01-01T00:00:00.000Z' });
  assert.equal(blocked.status, 200);
  assert.equal(blocked.headers.get('cache-control'), 'no-store');
  for (const role of ['Admin', 'Empleado']) {
    const status = await request(role);
    assert.equal(status.status, 200);
    assert.equal((await status.json()).isExpired, true);
    const protectedResponse = await request(role, '/protected');
    assert.equal(protectedResponse.status, 403);
    assert.equal((await protectedResponse.json()).code, 'SUBSCRIPTION_EXPIRED');
  }
  assert.equal((await request('Creador', '/protected')).status, 200);
  assert.equal((await request('Creador', '/subscription', { deadline: null })).status, 200);
  assert.equal((await request('Admin', '/protected')).status, 200);
  assert.equal((await request('Empleado', '/protected')).status, 200);
  assert.equal((await request('Creador', '/subscription', { deadline: '99' })).status, 400);
});

test('un fallo del servidor devuelve 503, sin inventar un vencimiento', async (t) => {
  const unavailable = async () => { throw new Error('database unavailable'); };
  const request = await apiFixture(t, { getStatus: unavailable, update: unavailable });
  for (const path of ['/subscription', '/protected']) {
    const response = await request('Admin', path);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, undefined);
  }
  assert.equal((await request('Creador', '/subscription', { deadline: null })).status, 503);
});
