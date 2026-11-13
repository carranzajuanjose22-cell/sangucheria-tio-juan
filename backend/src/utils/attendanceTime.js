'use strict';

const ZONE = 'America/Argentina/Buenos_Aires';
const REVIEW_AFTER_MS = 16 * 60 * 60 * 1000;
const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

function argentinaDate(timestamp) {
  const parts = Object.fromEntries(dateFormatter.formatToParts(new Date(timestamp)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && value >= '2000-01-01' && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function addDays(date, days) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

function midnight(date) {
  // Modern Argentine civil dates use UTC-03; no browser or host timezone involved.
  return Date.parse(`${date}T00:00:00-03:00`);
}

function bounds(period = 'today', now = Date.now(), from, to) {
  const today = argentinaDate(now);
  let start = today, end = today;
  if (period === 'all') return null;
  if (period === 'week') {
    const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
    start = addDays(today, -(weekday === 0 ? 6 : weekday - 1));
    end = addDays(start, 6);
  } else if (period === 'month') {
    start = `${today.slice(0, 7)}-01`;
    end = addDays(new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 1)).toISOString().slice(0, 10), -1);
  } else if (period === 'custom') {
    if (!validDate(from) || !validDate(to) || from > to) throw Object.assign(new Error('Rango de fechas inválido'), { status: 400 });
    start = from; end = to;
  } else if (period !== 'today') {
    throw Object.assign(new Error('Período inválido'), { status: 400 });
  }
  return { start: midnight(start), end: midnight(addDays(end, 1)) };
}

function durationMinutes(start, end, range = null) {
  if (end == null) return 0;
  const lower = range ? Math.max(start, range.start) : start;
  const upper = range ? Math.min(end, range.end) : end;
  return Math.floor(Math.max(0, upper - lower) / 60000);
}

function shiftView(row, now) {
  const active = row.ended_at == null;
  return {
    id: row.id, employeeId: row.employee_id, employeeName: row.employee_name,
    startedAt: new Date(Number(row.started_at)).toISOString(),
    endedAt: active ? null : new Date(Number(row.ended_at)).toISOString(),
    durationMinutes: active ? null : Number(row.duration_minutes),
    elapsedMinutes: durationMinutes(Number(row.started_at), active ? now : Number(row.ended_at)),
    status: !row.reviewed && (active ? now : Number(row.ended_at)) - Number(row.started_at) > REVIEW_AFTER_MS
      ? 'review' : active ? 'active' : 'finished',
    active, version: Number(row.version),
  };
}

// Account for complete minutes per shift. A minute belongs to the period in
// which it completes; adjacent periods therefore add up to the stored duration.
function totalMinutes(rows, range) {
  return rows.reduce((sum, row) => {
    if (row.ended_at == null) return sum;
    const start = Number(row.started_at), end = Number(row.ended_at);
    const throughEnd = durationMinutes(start, Math.min(end, range?.end ?? Infinity));
    const beforeStart = durationMinutes(start, Math.min(end, range?.start ?? start));
    return sum + Math.max(0, throughEnd - beforeStart);
  }, 0);
}

module.exports = { ZONE, REVIEW_AFTER_MS, argentinaDate, bounds, durationMinutes, shiftView, totalMinutes, validDate };
