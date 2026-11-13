'use strict';

const { randomUUID } = require('node:crypto');
const { bounds, durationMinutes, shiftView, totalMinutes, validDate } = require('../utils/attendanceTime');

function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }

function createAttendanceService(client, clock = Date.now) {
  async function user(db, actor) {
    if (typeof actor?.userId !== 'string' || !actor.userId) fail('Identidad de usuario inválida', 403);
    const result = await db.execute({ sql: 'SELECT id, name, email, role, status FROM "User" WHERE id=?', args: [actor.userId] });
    const row = result.rows[0];
    if (!row || row.status !== 'Activo') fail('Usuario inexistente o inactivo', 403);
    return row;
  }

  async function write(actor, requestId, fingerprint, action) {
    if (typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,100}$/.test(requestId)) fail('Identificador de solicitud inválido');
    let tx;
    try {
      tx = await client.transaction('write');
      const person = await user(tx, actor);
      const previous = (await tx.execute({ sql: 'SELECT * FROM AttendanceRequest WHERE actor_id=? AND request_id=?', args: [person.id, requestId] })).rows[0];
      if (previous) {
        if (previous.fingerprint !== fingerprint) fail('El identificador ya pertenece a otra operación', 409);
        await tx.commit();
        return JSON.parse(previous.response_json);
      }
      const result = await action(tx, person, clock());
      await tx.execute({ sql: 'INSERT INTO AttendanceRequest VALUES (?,?,?,?)', args: [person.id, requestId, fingerprint, JSON.stringify(result)] });
      await tx.commit();
      return result;
    } catch (error) {
      if (tx) await tx.rollback().catch(() => {});
      if (/attendance_overlap|attendance_one_active|UNIQUE constraint failed: AttendanceShift.employee_id/.test(error.message)) fail('La jornada se superpone con otra jornada de esta empleada', 409);
      if (/SQLITE_BUSY|SQLITE_LOCKED/.test(error.code || error.message)) fail('Otra operación está en curso. Reintentá la misma solicitud.', 409);
      throw error;
    } finally { if (tx) tx.close(); }
  }

  async function start(actor, requestId) {
    return write(actor, requestId, 'start', async (tx, person, now) => {
      const active = (await tx.execute({ sql: 'SELECT id FROM AttendanceShift WHERE employee_id=? AND ended_at IS NULL', args: [person.id] })).rows[0];
      if (active) fail('Ya tenés una jornada activa', 409);
      const id = randomUUID();
      await tx.execute({ sql: 'INSERT INTO AttendanceShift(id,employee_id,employee_name,started_at,created_at) VALUES (?,?,?,?,?)', args: [id, person.id, person.name || person.email, now, now] });
      const row = (await tx.execute({ sql: 'SELECT * FROM AttendanceShift WHERE id=?', args: [id] })).rows[0];
      return shiftView(row, now);
    });
  }

  async function finish(actor, id, requestId) {
    return write(actor, requestId, `finish:${id}`, async (tx, person, now) => {
      const row = (await tx.execute({ sql: 'SELECT * FROM AttendanceShift WHERE id=? AND employee_id=?', args: [id, person.id] })).rows[0];
      if (!row) fail('Jornada no encontrada', 404);
      if (row.ended_at == null) {
        if (now < Number(row.started_at)) fail('El reloj del servidor es anterior a la entrada', 409);
        await tx.execute({ sql: 'UPDATE AttendanceShift SET ended_at=?,duration_minutes=?,version=version+1 WHERE id=?', args: [now, durationMinutes(Number(row.started_at), now), id] });
      }
      return shiftView((await tx.execute({ sql: 'SELECT * FROM AttendanceShift WHERE id=?', args: [id] })).rows[0], now);
    });
  }

  async function correct(actor, id, data) {
    const { requestId, reason, startedAt, endedAt, version } = data;
    return write(actor, requestId, JSON.stringify(['correct', id, reason, startedAt, endedAt, version]), async (tx, person, now) => {
      if (person.role !== 'Admin') fail('Acceso restringido a administradores', 403);
      if (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 1000) fail('Indicá un motivo de entre 3 y 1000 caracteres');
      const parse = value => {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !validDate(value.slice(0, 10))) fail('Horario inválido: debe incluir fecha válida y zona horaria');
        const time = Date.parse(value);
        if (!Number.isFinite(time) || time < Date.parse('2000-01-01T00:00:00Z') || time > now) fail('El horario es inválido o está en el futuro');
        return time;
      };
      const start = parse(startedAt), end = endedAt === null ? null : parse(endedAt);
      if (end !== null && end < start) fail('La salida no puede ser anterior a la entrada');
      const before = (await tx.execute({ sql: 'SELECT * FROM AttendanceShift WHERE id=?', args: [id] })).rows[0];
      if (!before) fail('Jornada no encontrada', 404);
      if (!Number.isInteger(version) || Number(before.version) !== version) fail('La jornada cambió. Actualizá los datos antes de corregir.', 409);
      await tx.execute({ sql: 'UPDATE AttendanceShift SET started_at=?,ended_at=?,duration_minutes=?,reviewed=?,version=version+1 WHERE id=?', args: [start, end, end === null ? null : durationMinutes(start, end), end === null ? 0 : 1, id] });
      const after = (await tx.execute({ sql: 'SELECT * FROM AttendanceShift WHERE id=?', args: [id] })).rows[0];
      await tx.execute({ sql: 'INSERT INTO AttendanceAudit VALUES (?,?,?,?,?,?,?,?)', args: [randomUUID(), id, person.id, person.name || person.email, now, reason.trim(), JSON.stringify(before), JSON.stringify(after)] });
      return shiftView(after, now);
    });
  }

  async function me(actor) {
    const person = await user(client, actor), now = clock();
    const rows = (await client.execute({ sql: 'SELECT * FROM AttendanceShift WHERE employee_id=? ORDER BY started_at DESC', args: [person.id] })).rows;
    return { serverNow: new Date(now).toISOString(), active: rows.find(r => r.ended_at == null) ? shiftView(rows.find(r => r.ended_at == null), now) : null,
      todayMinutes: totalMinutes(rows, bounds('today', now)), weekMinutes: totalMinutes(rows, bounds('week', now)), monthMinutes: totalMinutes(rows, bounds('month', now)),
      recent: rows.slice(0, 20).map(r => shiftView(r, now)) };
  }

  async function admin(actor, filters = {}) {
    const person = await user(client, actor);
    if (person.role !== 'Admin') fail('Acceso restringido a administradores', 403);
    const now = clock(), range = bounds(filters.period || 'week', now, filters.from, filters.to);
    if (filters.status && !['all', 'active', 'finished', 'review'].includes(filters.status)) fail('Estado inválido');
    const rows = (await client.execute('SELECT * FROM AttendanceShift ORDER BY started_at DESC')).rows;
    const allViews = rows.map(row => shiftView(row, now));
    const selected = rows.filter(row => !filters.employeeId || row.employee_id === filters.employeeId);
    const shifts = allViews.filter(row => (!filters.employeeId || row.employeeId === filters.employeeId)
      && (!filters.status || filters.status === 'all' || row.status === filters.status)
      && (!range || Date.parse(row.startedAt) < range.end && (row.endedAt === null || Date.parse(row.endedAt) > range.start)));
    const people = (await client.execute('SELECT id,name,email FROM "User" ORDER BY name')).rows;
    const names = new Map(people.map(p => [p.id, p.name || p.email]));
    for (const row of rows) if (!names.has(row.employee_id)) names.set(row.employee_id, row.employee_name);
    const employees = [...names].map(([id, name]) => ({ id, name }));
    const totals = employees.filter(p => !filters.employeeId || p.id === filters.employeeId).map(p => {
      const employeeRows = selected.filter(r => r.employee_id === p.id);
      return { ...p, todayMinutes: totalMinutes(employeeRows, bounds('today', now)), weekMinutes: totalMinutes(employeeRows, bounds('week', now)), monthMinutes: totalMinutes(employeeRows, bounds('month', now)), periodMinutes: totalMinutes(employeeRows, range) };
    });
    return { serverNow: new Date(now).toISOString(), shifts, employees, totals, reviewAfterHours: 16 };
  }

  async function audit(actor, id) {
    const person = await user(client, actor);
    if (person.role !== 'Admin') fail('Acceso restringido a administradores', 403);
    return (await client.execute({ sql: 'SELECT * FROM AttendanceAudit WHERE shift_id=? ORDER BY changed_at DESC', args: [id] })).rows.map(r => ({ id: r.id, actorName: r.actor_name, changedAt: new Date(Number(r.changed_at)).toISOString(), reason: r.reason, before: JSON.parse(r.before_json), after: JSON.parse(r.after_json) }));
  }

  async function legacy(actor) {
    const person = await user(client, actor);
    if (person.role !== 'Admin') fail('Acceso restringido a administradores', 403);
    const row = (await client.execute("SELECT * FROM AttendanceLegacy WHERE id='cash_v1'")).rows[0];
    if (!row) return { registers: [], openState: null, capturedAt: null };
    return { registers: JSON.parse(row.registers_json), openState: row.open_state_json ? JSON.parse(row.open_state_json) : null, capturedAt: row.captured_at };
  }

  return { start, finish, correct, me, admin, audit, legacy };
}

module.exports = { createAttendanceService };
