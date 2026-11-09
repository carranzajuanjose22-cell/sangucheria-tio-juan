export const ARGENTINA_ZONE = 'America/Argentina/Buenos_Aires';

export function formatAttendanceDate(value) {
  return value ? new Date(value).toLocaleString('es-AR', { timeZone: ARGENTINA_ZONE, dateStyle: 'short', timeStyle: 'short' }) : '—';
}

export function formatMinutes(value = 0) {
  const minutes = Math.max(0, Math.floor(value));
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

export function argentinaInput(value) {
  if (!value) return '';
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function inputToUTC(value) {
  const date = new Date(`${value}:00-03:00`);
  if (!Number.isFinite(date.getTime())) throw new Error('Revisá los horarios ingresados.');
  return date.toISOString();
}

export function pendingKey() {
  const user = JSON.parse(localStorage.getItem('pos_user') || '{}');
  return `attendance_pending:${user.id}`;
}

export const statusLabels = { active: 'Activa', finished: 'Finalizada', review: 'Pendiente de revisión' };
