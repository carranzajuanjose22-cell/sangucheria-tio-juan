import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Play, Square, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router';
import { api } from './api.js';
import { AttendanceStatus } from '../components/AttendanceStatus.jsx';
import { formatAttendanceDate, formatMinutes, pendingKey } from '../utils/attendance.js';

export function EmployeeAttendance() {
  const { onAttendanceChange, requiredStart, returnTo } = useOutletContext() || {};
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(() => {
    try { return JSON.parse(localStorage.getItem(pendingKey()) || 'null'); } catch { return null; }
  });
  const [elapsed, setElapsed] = useState(0);
  const sample = useRef(null);
  const lock = useRef(false);
  const requestSequence = useRef(0);

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    try {
      const result = await api.get('/attendance/me');
      if (sequence !== requestSequence.current) return;
      setData(result);
      sample.current = { server: Date.parse(result.serverNow), received: performance.now(), started: result.active ? Date.parse(result.active.startedAt) : null };
      setElapsed(result.active?.elapsedMinutes || 0);
      setError('');
      onAttendanceChange?.(result);
      return result;
    } catch (err) { if (sequence === requestSequence.current) setError(err.message); }
  }, [onAttendanceChange]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 15000);
    const tick = setInterval(() => {
      const s = sample.current;
      if (s?.started != null) setElapsed(Math.max(0, Math.floor((s.server + performance.now() - s.received - s.started) / 60000)));
    }, 1000);
    const visible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(poll); clearInterval(tick); document.removeEventListener('visibilitychange', visible); requestSequence.current++; };
  }, [load]);

  const act = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true); setNotice(''); setError('');
    const operation = pending || { requestId: crypto.randomUUID(), kind: data.active ? 'finish' : 'start', id: data.active?.id };
    try {
      // Preserve the same request across network failures and browser restarts.
      localStorage.setItem(pendingKey(), JSON.stringify(operation));
      setPending(operation);
      await api.post(operation.kind === 'start' ? '/attendance/start' : `/attendance/${operation.id}/finish`, { requestId: operation.requestId });
      localStorage.removeItem(pendingKey()); setPending(null);
      setNotice(operation.kind === 'start' ? 'Entrada registrada correctamente.' : 'Salida registrada correctamente.');
      const result = await load();
      if (operation.kind === 'start' && requiredStart && result?.active) {
        navigate(['/employee', '/employee/sales'].includes(returnTo) ? returnTo : '/employee', { replace: true });
      }
    } catch (err) {
      if (err.status >= 400 && err.status < 500) { localStorage.removeItem(pendingKey()); setPending(null); await load(); }
      setError(err.message);
    } finally { setBusy(false); lock.current = false; }
  };

  return <div className="max-w-5xl mx-auto space-y-6">
    <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Clock className="text-brand-1" /> Mi jornada</h1><p className="text-gray-500 mt-1">Registrá tu entrada y salida. Tu jornada es independiente de la caja.</p></div>
    {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">{error} <button className="underline ml-2" onClick={load}>Actualizar estado</button></div>}
    {notice && <div role="status" className="bg-green-50 text-green-800 border border-green-200 rounded-xl p-4 flex gap-2"><CheckCircle2 size={20} />{notice}</div>}
    {requiredStart && <p role="status" className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl">Para usar el sistema, primero tenés que iniciar tu jornada de trabajo.</p>}
    {pending && !busy && <p role="status" className="bg-amber-50 text-amber-900 p-4 rounded-xl">Hay una operación sin confirmar. Reintentá para verificarla sin duplicar registros.</p>}
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
      {!data ? <p role="status">Cargando jornada…</p> : <>
        <div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-bold">{data.active ? 'Jornada activa' : 'Sin jornada activa'}</h2>{data.active && <AttendanceStatus status={data.active.status} active />}</div>
        {data.active ? <><p className="text-gray-600 mt-4">Entrada: <strong>{formatAttendanceDate(data.active.startedAt)}</strong></p><p className="text-4xl font-bold text-brand-1 mt-5 tabular-nums">{formatMinutes(elapsed)}</p><p className="text-sm text-gray-500 mt-2">Tiempo provisional. Se contabiliza al registrar la salida.</p></> : <p className="mt-4 text-gray-600">Iniciá tu jornada cuando empieces a trabajar.</p>}
        {data.active?.status === 'review' && <p className="mt-4 text-amber-800">Esta jornada supera las 16 horas. Si olvidaste fichar tu salida, solicitá una corrección al administrador.</p>}
      </>}
      <button disabled={busy || (!data && !pending) || (!!error && !pending)} onClick={act} className={`mt-6 w-full sm:w-auto px-6 py-3 rounded-xl text-white font-bold flex justify-center items-center gap-2 disabled:opacity-50 ${data?.active ? 'bg-brand-1 hover:bg-brand-1-dark' : 'bg-green-700 hover:bg-green-800'}`}>
        {pending ? <RefreshCw size={20} /> : data?.active ? <Square size={20} /> : <Play size={20} />}{busy ? 'Registrando…' : pending ? 'Reintentar registro' : data?.active ? 'Finalizar jornada' : 'Iniciar jornada'}
      </button>
      <p className="text-xs text-gray-500 mt-4">Horarios de Argentina · Registro oficial en el servidor</p>
    </section>
    <div className="grid sm:grid-cols-3 gap-4">{[['Hoy', data?.todayMinutes], ['Esta semana', data?.weekMinutes], ['Este mes', data?.monthMinutes]].map(([label, value]) => <div key={label} className="bg-white border border-gray-200 p-5 rounded-xl"><p className="text-gray-500">{label}</p><p className="text-2xl font-bold mt-1">{value == null ? '—' : formatMinutes(value)}</p><p className="text-xs text-gray-500 mt-1">Horas finalizadas</p></div>)}</div>
    <section className="bg-white border border-gray-200 rounded-xl overflow-hidden"><h2 className="font-bold p-5 border-b">Mis últimas jornadas</h2><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50"><tr>{['Entrada', 'Salida', 'Duración', 'Estado'].map(t => <th key={t} className="px-5 py-3">{t}</th>)}</tr></thead><tbody>{data?.recent.map(row => <tr key={row.id} className="border-t"><td className="px-5 py-4 whitespace-nowrap">{formatAttendanceDate(row.startedAt)}</td><td className="px-5 py-4 whitespace-nowrap">{formatAttendanceDate(row.endedAt)}</td><td className="px-5 py-4">{row.active ? 'Provisional' : formatMinutes(row.durationMinutes)}</td><td className="px-5 py-4"><AttendanceStatus status={row.status} active={row.active} /></td></tr>)}</tbody></table>{data && !data.recent.length && <p className="p-6 text-gray-500">Todavía no registraste jornadas.</p>}</div></section>
  </div>;
}
