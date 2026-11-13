import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Pencil, History, X, RefreshCw } from 'lucide-react';
import { api } from './api.js';
import { AttendanceStatus } from '../components/AttendanceStatus.jsx';
import { argentinaInput, formatAttendanceDate, formatMinutes, inputToUTC } from '../utils/attendance.js';

const fieldClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-1';

function AuditDetails({ entries }) {
  if (!entries.length) return <p className="text-gray-500">Sin correcciones registradas.</p>;
  return <div className="space-y-4">{entries.map(entry => <article key={entry.id} className="border rounded-lg p-4 text-sm space-y-2">
    <p className="font-semibold">{entry.actorName} · {formatAttendanceDate(entry.changedAt)}</p><p className="whitespace-pre-wrap">{entry.reason}</p>
    <p>Entrada: {formatAttendanceDate(entry.before.started_at)} → {formatAttendanceDate(entry.after.started_at)}</p>
    <p>Salida: {formatAttendanceDate(entry.before.ended_at)} → {formatAttendanceDate(entry.after.ended_at)}</p>
    <p>Duración: {entry.before.duration_minutes == null ? 'Abierta' : formatMinutes(entry.before.duration_minutes)} → {entry.after.duration_minutes == null ? 'Abierta' : formatMinutes(entry.after.duration_minutes)}</p>
  </article>)}</div>;
}

export function AttendanceAdmin() {
  const [filters, setFilters] = useState({ period: 'week', employeeId: '', status: 'all', from: '', to: '' });
  const [data, setData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [edit, setEdit] = useState(null);
  const [audit, setAudit] = useState(null);
  const [legacy, setLegacy] = useState(null);
  const [legacyError, setLegacyError] = useState('');
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editError, setEditError] = useState('');
  const lock = useRef(false);
  const sequence = useRef(0);

  const load = useCallback(async () => {
    const seq = ++sequence.current;
    if (filters.period === 'custom' && (!filters.from || !filters.to)) {
      setData(null); setError('Elegí las fechas Desde y Hasta para consultar el período.'); return;
    }
    try {
      const result = await api.get(`/attendance/admin?${new URLSearchParams(filters)}`);
      if (seq === sequence.current) { setData(result); setEmployees(result.employees); setError(''); }
    } catch (err) { if (seq === sequence.current) setError(err.message); }
  }, [filters]);

  useEffect(() => {
    setData(null);
    load(); const poll = setInterval(load, 15000);
    return () => { clearInterval(poll); sequence.current++; };
  }, [load]);

  const updateFilter = (key, value) => setFilters(previous => ({ ...previous, [key]: value }));
  const updateEdit = (key, value) => setEdit(previous => ({ ...previous, [key]: value }));
  const openEdit = row => {
    setEditError('');
    setEdit({ row, start: argentinaInput(row.startedAt), end: argentinaInput(row.endedAt), reason: '', requestId: crypto.randomUUID(), submitted: null });
  };
  const save = async event => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setEditError(''); setNotice('');
    try {
      const body = edit.submitted || {
        requestId: edit.requestId, version: edit.row.version, reason: edit.reason.trim(),
        startedAt: edit.start === argentinaInput(edit.row.startedAt) ? edit.row.startedAt : inputToUTC(edit.start),
        endedAt: !edit.end ? null : edit.end === argentinaInput(edit.row.endedAt) ? edit.row.endedAt : inputToUTC(edit.end),
      };
      if (body.reason.length < 3) throw Object.assign(new Error('Indicá un motivo de al menos 3 caracteres.'), { status: 400 });
      if (body.endedAt && Date.parse(body.endedAt) < Date.parse(body.startedAt)) throw Object.assign(new Error('La salida no puede ser anterior a la entrada.'), { status: 400 });
      setEdit(previous => ({ ...previous, submitted: body }));
      await api.put(`/attendance/${edit.row.id}`, body);
      setEdit(null); setNotice('Corrección guardada con su historial de auditoría.'); await load();
    } catch (err) {
      setEditError(err.message);
      if (err.status >= 400 && err.status < 500) setEdit(previous => ({ ...previous, submitted: null, requestId: crypto.randomUUID() }));
    } finally { setBusy(false); lock.current = false; }
  };
  const showAudit = async row => {
    setError('');
    try { setAudit({ row, entries: await api.get(`/attendance/${row.id}/audit`) }); }
    catch (err) { setError(err.message); }
  };
  const showLegacy = async () => {
    setLegacyLoading(true); setLegacyError('');
    try { setLegacy(await api.get('/attendance/legacy')); }
    catch (err) { setLegacyError(err.message); }
    finally { setLegacyLoading(false); }
  };

  return <div className="max-w-7xl mx-auto space-y-6">
    <div className="flex flex-wrap justify-between items-start gap-3"><div><h1 className="text-2xl font-bold flex gap-3 items-center"><Clock className="text-brand-1" /> Jornadas laborales</h1><p className="text-gray-500 mt-1">Fichajes individuales · Horarios de Argentina</p></div><button onClick={load} className="flex items-center gap-2 border bg-white rounded-lg px-4 py-2"><RefreshCw size={16} /> Actualizar</button></div>
    {error && <p role="alert" className="p-4 rounded-xl bg-red-50 text-red-800">{error}</p>}
    {notice && <p role="status" className="p-4 rounded-xl bg-green-50 text-green-800">{notice}</p>}
    <section className="bg-white border rounded-xl p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <label className="text-sm font-medium">Empleada<select className={`${fieldClass} mt-1`} value={filters.employeeId} onChange={e => updateFilter('employeeId', e.target.value)}><option value="">Todas</option>{employees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="text-sm font-medium">Período<select className={`${fieldClass} mt-1`} value={filters.period} onChange={e => updateFilter('period', e.target.value)}>{[['today', 'Hoy'], ['week', 'Esta semana'], ['month', 'Este mes'], ['custom', 'Fecha o rango'], ['all', 'Todo el historial']].map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>
      <label className="text-sm font-medium">Estado<select className={`${fieldClass} mt-1`} value={filters.status} onChange={e => updateFilter('status', e.target.value)}><option value="all">Todos</option><option value="active">Activa</option><option value="finished">Finalizada</option><option value="review">Pendiente de revisión</option></select></label>
      {filters.period === 'custom' && <><label className="text-sm font-medium">Desde<input type="date" required min="2000-01-01" className={`${fieldClass} mt-1`} value={filters.from} onInput={e => updateFilter('from', e.target.value)} /></label><label className="text-sm font-medium">Hasta<input type="date" required min={filters.from || '2000-01-01'} className={`${fieldClass} mt-1`} value={filters.to} onInput={e => updateFilter('to', e.target.value)} /></label><p className="text-xs text-gray-500 self-end">Para consultar un solo día, elegí la misma fecha en ambos campos.</p></>}
    </section>
    <section className="bg-white border rounded-xl overflow-hidden"><div className="px-5 py-4 border-b"><h2 className="font-bold">Horas finalizadas por empleada</h2><p className="text-xs text-gray-500 mt-1">Las jornadas abiertas no suman horas definitivas. El filtro de estado se aplica al detalle; los resúmenes incluyen todas las finalizadas. Semana: lunes a domingo.</p></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50"><tr>{['Empleada', 'Hoy', 'Esta semana', 'Este mes', 'Período seleccionado'].map(t => <th key={t} className="px-5 py-3 whitespace-nowrap">{t}</th>)}</tr></thead><tbody>{data?.totals.map(p => <tr key={p.id} className="border-t"><td className="px-5 py-4 font-semibold">{p.name}</td>{['todayMinutes', 'weekMinutes', 'monthMinutes', 'periodMinutes'].map(k => <td key={k} className="px-5 py-4 whitespace-nowrap">{formatMinutes(p[k])}</td>)}</tr>)}</tbody></table></div></section>
    <section className="bg-white border rounded-xl overflow-hidden"><div className="px-5 py-4 border-b"><h2 className="font-bold">Historial de jornadas</h2><p className="text-xs text-gray-500 mt-1">Se muestran las jornadas que se superponen con el período. Duración de cada jornada completa; los resúmenes recortan al período. Más de 16 horas requiere revisión.</p></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50"><tr>{['Empleada', 'Entrada / fecha', 'Salida', 'Duración', 'Estado', 'Acciones'].map(t => <th className="px-5 py-3 whitespace-nowrap" key={t}>{t}</th>)}</tr></thead><tbody>{data?.shifts.map(row => <tr key={row.id} className="border-t"><td className="px-5 py-4 font-semibold">{row.employeeName}</td><td className="px-5 py-4 whitespace-nowrap">{formatAttendanceDate(row.startedAt)}</td><td className="px-5 py-4 whitespace-nowrap">{formatAttendanceDate(row.endedAt)}</td><td className="px-5 py-4 whitespace-nowrap">{row.active ? `${formatMinutes(row.elapsedMinutes)} (provisional)` : formatMinutes(row.durationMinutes)}</td><td className="px-5 py-4"><AttendanceStatus status={row.status} active={row.active} /></td><td className="px-5 py-4"><div className="flex gap-3"><button aria-label={`Corregir jornada de ${row.employeeName}`} onClick={() => openEdit(row)} className="text-brand-1 flex gap-1 items-center"><Pencil size={16} />Corregir</button><button aria-label={`Ver auditoría de ${row.employeeName}`} onClick={() => showAudit(row)} className="text-gray-600 flex gap-1 items-center"><History size={16} />Historial</button></div></td></tr>)}</tbody></table>{!data ? <p className="p-6 text-gray-500" role="status">Cargando jornadas…</p> : !data.shifts.length && <p className="p-6 text-gray-500">No hay jornadas para estos filtros.</p>}</div></section>
    <section className="bg-white border rounded-xl p-5 space-y-3"><h2 className="font-bold">Histórico del método anterior: caja</h2><p className="text-sm text-gray-600">Estimaciones conservadas al habilitar el nuevo sistema. No representan fichajes reales y no se suman a las jornadas nuevas.</p><button onClick={showLegacy} disabled={legacyLoading} className="border rounded-lg px-4 py-2 text-sm disabled:opacity-50">{legacyLoading ? 'Cargando…' : 'Consultar histórico de caja'}</button>
      {legacyError && <p role="alert" className="text-red-700">{legacyError}</p>}
      {legacy && <><p className="text-xs text-gray-500">Copia conservada: {formatAttendanceDate(legacy.capturedAt)}</p>{legacy.openState?.isOpen && <p className="text-sm text-amber-800">Había una caja abierta por {legacy.openState.openedBy || 'persona no identificada'} desde {formatAttendanceDate(legacy.openState.openedAt)}. Se conserva como registro incompleto, sin horas definitivas.</p>}
        <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50"><tr>{['Abrió', 'Cerró', 'Entrada de caja', 'Cierre de caja', 'Horas guardadas (estimación)'].map(t => <th key={t} className="p-3 whitespace-nowrap">{t}</th>)}</tr></thead><tbody>{legacy.registers.map((r, index) => <tr key={r.id || index} className="border-t"><td className="p-3">{r.openedBy || 'Sin dato'}</td><td className="p-3">{r.closedBy || r.employee || 'Sin dato'}</td><td className="p-3 whitespace-nowrap">{formatAttendanceDate(r.openedAt)}</td><td className="p-3 whitespace-nowrap">{formatAttendanceDate(r.date || r.closedAt)}</td><td className="p-3">{r.shiftHours != null && Number.isFinite(Number(r.shiftHours)) ? formatMinutes(Math.round(Number(r.shiftHours) * 60)) : 'Sin duración guardada'}</td></tr>)}</tbody></table>{!legacy.registers.length && <p className="p-3 text-gray-500">No había cierres históricos al habilitar jornadas.</p>}</div></>}
    </section>
    {edit && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onKeyDown={e => { if (e.key === 'Escape' && !busy && !edit.submitted) setEdit(null); }}><section role="dialog" aria-modal="true" aria-labelledby="correction-title" className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"><div className="p-5 border-b flex justify-between gap-3"><h2 id="correction-title" className="font-bold text-lg">Corregir jornada · {edit.row.employeeName}</h2><button aria-label="Cerrar corrección" disabled={busy || !!edit.submitted} onClick={() => setEdit(null)}><X size={20} /></button></div><form onSubmit={save} className="p-5 space-y-4">
      <p className="text-sm text-gray-600">Horarios de Argentina. La modificación conservará los valores anteriores y el motivo. Dejá la salida vacía para mantenerla abierta.</p>
      {editError && <p role="alert" className="text-red-800 bg-red-50 rounded-lg p-3">{editError}</p>}
      {edit.submitted && <p role="status" className="text-amber-800">Verificá el resultado reintentando la misma corrección.</p>}
      <label className="block text-sm font-medium">Entrada<input autoFocus type="datetime-local" required min="2000-01-01T00:00" disabled={busy || !!edit.submitted} className={`${fieldClass} mt-1`} value={edit.start} onInput={e => updateEdit('start', e.target.value)} /></label>
      <label className="block text-sm font-medium">Salida<input type="datetime-local" min={edit.start} disabled={busy || !!edit.submitted} className={`${fieldClass} mt-1`} value={edit.end} onInput={e => updateEdit('end', e.target.value)} /></label>
      <label className="block text-sm font-medium">Motivo obligatorio<textarea required minLength={3} maxLength={1000} disabled={busy || !!edit.submitted} className={`${fieldClass} mt-1`} rows={3} value={edit.reason} onChange={e => updateEdit('reason', e.target.value)} /></label>
      <button type="submit" disabled={busy} className="w-full bg-brand-1 hover:bg-brand-1-dark text-white font-bold px-5 py-3 rounded-lg disabled:opacity-50">{busy ? 'Guardando…' : edit.submitted ? 'Reintentar corrección' : 'Guardar corrección'}</button>
      {editError && !edit.submitted && <button type="button" onClick={() => { setEdit(null); load(); }} className="underline text-sm">Cancelar y actualizar datos</button>}
    </form></section></div>}
    {audit && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onKeyDown={e => { if (e.key === 'Escape') setAudit(null); }}><section role="dialog" aria-modal="true" aria-labelledby="audit-title" className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div className="p-5 border-b flex justify-between"><h2 className="font-bold text-lg" id="audit-title">Auditoría · {audit.row.employeeName}</h2><button autoFocus aria-label="Cerrar auditoría" onClick={() => setAudit(null)}><X size={20} /></button></div><div className="p-5"><AuditDetails entries={audit.entries} /></div></section></div>}
  </div>;
}
