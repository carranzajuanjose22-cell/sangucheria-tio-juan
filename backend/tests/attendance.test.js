'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createClient } = require('@libsql/client');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');
const jwt = require('jsonwebtoken');
const { ensureAttendanceTables } = require('../src/models/attendanceSchema');
const { createAttendanceService } = require('../src/services/attendanceService');
const { createAttendanceRouter } = require('../src/routes/attendanceRoutes');
const { bounds, totalMinutes } = require('../src/utils/attendanceTime');

const ana = { userId: 'ana' }, bea = { userId: 'bea' }, admin = { userId: 'admin' };
const legacyRegisters = [{ id: 'old', openedBy: 'Ana', closedBy: 'Ana', openedAt: '2026-10-01T09:00:00Z', date: '2026-10-01T17:00:00Z', shiftHours: 8, shiftWorker: 'Ana' }];

async function setup(t, initial = '2026-11-08T12:00:00Z') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tio-juan-attendance-'));
  const url = `file:${path.join(directory, 'test.db').replaceAll('\\', '/')}`;
  const client = createClient({ url });
  t.after(() => {
    client.close();
    // The native libSQL driver can retain Windows file handles until GC.
    for (const file of fs.readdirSync(directory)) {
      try { fs.unlinkSync(path.join(directory, file)); }
      catch (error) { if (error.code !== 'EBUSY' && error.code !== 'EPERM') throw error; }
    }
    if (!fs.readdirSync(directory).length) fs.rmdirSync(directory);
  });
  await client.batch([
    'CREATE TABLE "User" (id TEXT PRIMARY KEY, name TEXT, email TEXT, role TEXT, status TEXT)',
    `INSERT INTO "User" VALUES ('ana','Ana','ana@test','Cajero','Activo'),('bea','Bea','bea@test','Cajero','Activo'),('admin','Admin','admin@test','Admin','Activo')`,
    'CREATE TABLE cloud_store(key TEXT PRIMARY KEY,value TEXT)',
    { sql: 'INSERT INTO cloud_store VALUES (?,?)', args: ['pos_registers', JSON.stringify(legacyRegisters)] },
    { sql: 'INSERT INTO cloud_store VALUES (?,?)', args: ['register_state', JSON.stringify({ isOpen: true, openedBy: 'Ana', openedAt: '2026-11-07T10:00:00Z' })] },
  ], 'write');
  await ensureAttendanceTables(client);
  let now = Date.parse(initial);
  const service = createAttendanceService(client, () => now);
  return { service, client, url, time: value => { now = Date.parse(value); }, now: () => now };
}

test('1. entrada/salida normal, duración oficial y nueva jornada posterior', async t => {
  const f = await setup(t);
  const started = await f.service.start(ana, randomUUID());
  assert.equal(started.durationMinutes, null);
  f.time('2026-11-08T20:00:35Z');
  const ended = await f.service.finish(ana, started.id, randomUUID());
  assert.equal(ended.durationMinutes, 480);
  assert.equal(ended.status, 'finished');
  const me = await f.service.me(ana);
  assert.equal(me.todayMinutes, 480); assert.equal(me.active, null);
  assert.notEqual((await f.service.start(ana, randomUUID())).id, started.id);
});

test('2. dos empleadas pueden tener jornadas activas simultáneas', async t => {
  const f = await setup(t);
  await f.service.start(ana, randomUUID()); await f.service.start(bea, randomUUID());
  assert.equal((await f.service.admin(admin, { period: 'all' })).shifts.length, 2);
  assert.equal((await f.service.me(ana)).active.employeeId, 'ana');
  assert.equal((await f.service.me(bea)).active.employeeId, 'bea');
});

test('3. doble inicio rechazado, incluso por restricción en SQL', async t => {
  const f = await setup(t); await f.service.start(ana, randomUUID());
  await assert.rejects(f.service.start(ana, randomUUID()), { status: 409 });
  await assert.rejects(f.client.execute({ sql: 'INSERT INTO AttendanceShift(id,employee_id,employee_name,started_at,created_at) VALUES (?,?,?,?,?)', args: ['duplicate', 'ana', 'Ana', f.now(), f.now()] }));
});

test('4. reinicio de cliente/servicio conserva la jornada en base de datos', async t => {
  const f = await setup(t); const first = await f.service.start(ana, randomUUID());
  const other = createClient({ url: f.url });
  try {
    const reloaded = createAttendanceService(other, f.now);
    assert.equal((await reloaded.me(ana)).active.id, first.id);
  } finally { other.close(); }
});

test('5 y 8. medianoche, límites de semana/mes y zona independiente del host', async t => {
  const f = await setup(t, '2026-11-01T02:00:00Z'); // Oct 31, 23 Argentina
  const shift = await f.service.start(ana, randomUUID());
  f.time('2026-11-01T05:00:00Z');
  assert.equal((await f.service.finish(ana, shift.id, randomUUID())).durationMinutes, 180);
  assert.equal((await f.service.admin(admin, { period: 'custom', from: '2026-10-31', to: '2026-10-31' })).totals.find(p => p.id === 'ana').periodMinutes, 60);
  assert.equal((await f.service.me(ana)).monthMinutes, 120);
  const rows = [{ started_at: Date.parse('2026-11-09T02:00:00Z'), ended_at: Date.parse('2026-11-09T05:00:00Z') }];
  const oldTZ = process.env.TZ;
  try {
    for (const zone of ['UTC', 'Asia/Tokyo', 'America/Argentina/Buenos_Aires']) {
      process.env.TZ = zone;
      assert.equal(totalMinutes(rows, bounds('week', Date.parse('2026-11-08T15:00:00Z'))), 60);
      assert.equal(totalMinutes(rows, bounds('week', Date.parse('2026-11-09T15:00:00Z'))), 120);
    }
  } finally { if (oldTZ === undefined) delete process.env.TZ; else process.env.TZ = oldTZ; }
});

test('6. olvido: revisión después de 16 h, sin salida ficticia ni horas definitivas', async t => {
  const f = await setup(t); const shift = await f.service.start(ana, randomUUID());
  f.time('2026-11-09T10:00:00Z');
  const me = await f.service.me(ana);
  assert.equal(me.active.id, shift.id); assert.equal(me.active.status, 'review');
  assert.equal(me.active.endedAt, null); assert.equal(me.todayMinutes, 0); assert.equal(me.weekMinutes, 0);
  assert.equal((await f.service.admin(admin, { period: 'all', status: 'review' })).shifts.length, 1);
});

test('7. corrección manual con motivo, auditoría y control de versión', async t => {
  const f = await setup(t); const shift = await f.service.start(ana, randomUUID());
  f.time('2026-11-08T20:00:00Z');
  const data = { requestId: randomUUID(), version: 1, startedAt: shift.startedAt, endedAt: '2026-11-08T19:00:00Z', reason: 'Olvidó registrar la salida' };
  const corrected = await f.service.correct(admin, shift.id, data);
  assert.equal(corrected.durationMinutes, 420); assert.equal(corrected.version, 2);
  const audit = await f.service.audit(admin, shift.id);
  assert.equal(audit.length, 1); assert.equal(audit[0].before.ended_at, null);
  assert.equal(audit[0].after.ended_at, Date.parse(data.endedAt)); assert.equal(audit[0].actorName, 'Admin');
  assert.equal((await f.service.correct(admin, shift.id, data)).version, 2);
  assert.equal((await f.service.audit(admin, shift.id)).length, 1);
  await assert.rejects(f.service.correct(admin, shift.id, { ...data, requestId: randomUUID() }), { status: 409 });
  await assert.rejects(f.service.correct(admin, shift.id, { ...data, version: 2, requestId: randomUUID(), reason: '' }), { status: 400 });
  await assert.rejects(f.service.correct(admin, shift.id, { ...data, version: 2, requestId: randomUUID(), endedAt: '2026-11-08T10:00:00Z' }), { status: 400 });
  await assert.rejects(f.service.correct(admin, shift.id, { ...data, version: 2, requestId: randomUUID(), endedAt: '2026-11-09T10:00:00Z' }), { status: 400 });
});

test('7b. superposiciones rechazadas y corrección fallida no altera datos ni auditoría', async t => {
  const f = await setup(t);
  const one = await f.service.start(ana, randomUUID()); f.time('2026-11-08T13:00:00Z'); await f.service.finish(ana, one.id, randomUUID());
  f.time('2026-11-08T14:00:00Z'); const two = await f.service.start(ana, randomUUID()); f.time('2026-11-08T15:00:00Z'); await f.service.finish(ana, two.id, randomUUID());
  await assert.rejects(f.service.correct(admin, two.id, { requestId: randomUUID(), version: 2, reason: 'Corregir entrada', startedAt: '2026-11-08T12:30:00Z', endedAt: '2026-11-08T15:00:00Z' }), { status: 409 });
  assert.equal((await f.service.audit(admin, two.id)).length, 0);
  assert.equal((await f.service.me(ana)).recent[0].startedAt, two.startedAt);
});

test('9. abrir/cerrar caja conserva finanzas y no altera jornadas ni calcula horas', async t => {
  const f = await setup(t); const shift = await f.service.start(ana, randomUUID());
  const before = (await f.client.execute('SELECT * FROM AttendanceShift')).rows;
  const store = { register_state: { isOpen: true, openedBy: 'Ana', openedAt: '2026-11-08T10:00:00Z', initialCash: 100 }, pos_pending_orders: [], pos_sales: [{ id: 'sale', total: 50, paymentMethod: 'Efectivo' }], pos_expenses: [{ amount: 10 }], pos_registers: [...legacyRegisters] };
  const db = { select: () => ({ from: () => ({ where: async key => store[key] === undefined ? [] : [{ value: JSON.stringify(store[key]) }] }) }), update: () => ({ set: ({ value }) => ({ where: async key => { store[key] = JSON.parse(value); } }) }), insert: () => ({ values: async ({ key, value }) => { store[key] = JSON.parse(value); } }) };
  const context = { module: { exports: {} }, crypto: { randomUUID }, require: name => {
    if (name === '../db') return { db };
    if (name === '../models/schema') return { cloud_store: { key: 'key' } };
    if (name === 'drizzle-orm') return { eq: (_, key) => key };
    throw Error(name);
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/services/storeService.js'), 'utf8'), context);
  const cash = await context.module.exports.closeRegister({ employee: 'Ana', closedBy: 'Ana' });
  assert.equal(cash.expectedCash, 140); assert.equal(cash.totalIncome, 50); assert.equal(cash.shiftHours, undefined);
  assert.equal(store.register_state.isOpen, false); assert.equal(store.pos_sales.length, 0); assert.deepEqual(store.pos_registers[1], legacyRegisters[0]);
  await context.module.exports.setValue('register_state', { isOpen: true, openedBy: 'Bea', openedAt: new Date().toISOString(), initialCash: 0 });
  assert.deepEqual((await f.client.execute('SELECT * FROM AttendanceShift')).rows, before);
  assert.equal((await f.service.me(ana)).active.id, shift.id);
});

test('10. snapshot histórico idempotente, completo y separado de los totales', async t => {
  const f = await setup(t);
  await f.client.execute({ sql: 'UPDATE cloud_store SET value=? WHERE key=?', args: [JSON.stringify([...legacyRegisters, { id: 'new-cash' }]), 'pos_registers'] });
  await ensureAttendanceTables(f.client);
  const old = await f.service.legacy(admin);
  assert.deepEqual(old.registers, legacyRegisters); assert.equal(old.openState.isOpen, true);
  assert.equal((await f.service.me(ana)).monthMinutes, 0);
  assert.equal(JSON.parse((await f.client.execute("SELECT value FROM cloud_store WHERE key='pos_registers'")).rows[0].value).length, 2);
});

test('11. autorización por usuario/rol y usuarios inactivos', async t => {
  const f = await setup(t); const shift = await f.service.start(ana, randomUUID());
  await assert.rejects(f.service.finish(bea, shift.id, randomUUID()), { status: 404 });
  for (const promise of [f.service.admin(ana), f.service.audit(ana, shift.id), f.service.legacy(ana), f.service.correct(ana, shift.id, { requestId: randomUUID() })]) await assert.rejects(promise, { status: 403 });
  await f.client.execute("UPDATE User SET status='Inactivo' WHERE id='ana'");
  await assert.rejects(f.service.me(ana), { status: 403 });
});

test('12. reintentos de inicio/salida no duplican ni cierran una jornada posterior', async t => {
  const f = await setup(t); const request = randomUUID();
  const first = await f.service.start(ana, request);
  assert.equal((await f.service.start(ana, request)).id, first.id);
  f.time('2026-11-08T13:00:00Z');
  const finishRequest = randomUUID(); const ended = await f.service.finish(ana, first.id, finishRequest);
  const second = await f.service.start(ana, randomUUID());
  assert.deepEqual(await f.service.finish(ana, first.id, finishRequest), ended);
  assert.equal((await f.service.me(ana)).active.id, second.id);
  assert.equal((await f.service.finish(ana, first.id, randomUUID())).endedAt, ended.endedAt);
  await assert.rejects(f.service.finish(ana, second.id, request), { status: 409 });
  assert.equal((await f.client.execute('SELECT count(*) AS n FROM AttendanceShift')).rows[0].n, 2);
});

test('12b. solicitudes concurrentes mantienen una única jornada y permiten reintentar', async t => {
  const f = await setup(t); const otherClient = createClient({ url: f.url });
  try {
    const other = createAttendanceService(otherClient, f.now);
    const results = await Promise.allSettled([f.service.start(ana, randomUUID()), other.start(ana, randomUUID())]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(results.find(r => r.status === 'rejected').reason.status, 409);
    assert.equal((await f.client.execute('SELECT count(*) AS n FROM AttendanceShift WHERE ended_at IS NULL')).rows[0].n, 1);
  } finally { otherClient.close(); }
});

test('11b. rutas HTTP verifican token y no aceptan identidad de empleada en el cuerpo', async t => {
  const f = await setup(t);
  // Use the real token validation middleware without loading the production DB/subscription service.
  const context = { module: { exports: {} }, process: { env: { JWT_SECRET: 'test-only-secret' } }, require: name => {
    if (name === 'jsonwebtoken') return jwt;
    if (name === '../services/subscriptionService') return { getStatus: async () => ({ isExpired: false }) };
    throw Error(name);
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/middleware/auth.js'), 'utf8'), context);
  const app = express(); app.use(express.json()); app.use('/attendance', createAttendanceRouter(f.service, context.module.exports.authMiddleware));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const endpoint = `http://127.0.0.1:${server.address().port}/attendance`;
  const token = jwt.sign({ userId: 'ana', role: 'Cajero' }, 'test-only-secret');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  assert.equal((await fetch(`${endpoint}/me`)).status, 401);
  assert.equal((await fetch(`${endpoint}/admin`, { headers })).status, 403);
  const response = await fetch(`${endpoint}/start`, { method: 'POST', headers, body: JSON.stringify({ requestId: randomUUID(), employeeId: 'bea', startedAt: '2020-01-01T00:00:00Z' }) });
  assert.equal(response.status, 200);
  const row = await response.json(); assert.equal(row.employeeId, 'ana'); assert.equal(row.startedAt, new Date(f.now()).toISOString());
  assert.equal((await fetch(`${endpoint}/legacy`, { headers })).status, 403);
});

test('precisión: suma minutos oficiales y los distribuye sin perderlos entre períodos', () => {
  const rows = [{ started_at: 0, ended_at: 40000 }, { started_at: 50000, ended_at: 90000 }];
  assert.equal(totalMinutes(rows), 0);
  const crossing = [{ started_at: 30000, ended_at: 150000 }];
  assert.equal(totalMinutes(crossing), 2);
  assert.equal(totalMinutes(crossing, { start: 0, end: 60000 }) + totalMinutes(crossing, { start: 60000, end: 200000 }), 2);
  assert.throws(() => bounds('custom', Date.now(), '2026-02-30', '2026-03-02'), { status: 400 });
});
