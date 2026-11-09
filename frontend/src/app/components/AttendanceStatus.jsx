import { statusLabels } from '../utils/attendance.js';

export function AttendanceStatus({ status, active }) {
  const color = status === 'review' ? 'bg-amber-100 text-amber-900' : active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${color}`}>{statusLabels[status]}{status === 'review' && active ? ' · abierta' : ''}</span>;
}
