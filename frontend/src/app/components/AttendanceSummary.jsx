import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Clock } from 'lucide-react';
import { api } from '../pages/api.js';
import { formatMinutes } from '../utils/attendance.js';

export function AttendanceSummary({ period }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    setData(null);
    const load = async () => {
      try { const result = await api.get(`/attendance/admin?period=${period}`); if (mounted) { setData(result); setError(''); } }
      catch (err) { if (mounted) setError(err.message); }
    };
    load(); const timer = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(timer); };
  }, [period]);
  return <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"><div className="px-6 py-4 border-b bg-gray-50"><h3 className="text-lg font-bold flex items-center gap-2"><Clock size={20} /> Horas trabajadas por empleada</h3><p className="text-sm text-gray-500 mt-1">Solo jornadas finalizadas. Los históricos de caja se consultan por separado.</p></div><div className="p-6 space-y-4">
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!data && !error && <p role="status">Cargando jornadas…</p>}
    {data?.totals.filter(p => p.periodMinutes > 0).map(p => <div key={p.id} className="flex justify-between gap-4"><span className="font-medium">{p.name}</span><strong>{formatMinutes(p.periodMinutes)}</strong></div>)}
    {data && !data.totals.some(p => p.periodMinutes > 0) && <p className="text-gray-500">No hay horas finalizadas en este período.</p>}
    <Link to="/admin/attendance" className="inline-block text-brand-1 font-medium underline">Ver jornadas e histórico anterior</Link>
  </div></section>;
}
