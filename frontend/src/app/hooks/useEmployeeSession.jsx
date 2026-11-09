import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { api } from '../pages/api.js';
import { formatAttendanceDate, pendingKey } from '../utils/attendance.js';

export function useEmployeeSession() {
  const location = useLocation(), navigate = useNavigate();
  const [attendance, setAttendance] = useState(null);
  const [error, setError] = useState('');
  const [logoutShift, setLogoutShift] = useState(null);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const lock = useRef(false), sequence = useRef(0), dialogRef = useRef(null);
  const attendanceChanged = useCallback(result => {
    sequence.current++; setAttendance(result); setError('');
  }, []);
  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    try {
      const result = await api.get('/attendance/me');
      if (request === sequence.current) { setAttendance(result); setError(''); }
    } catch (err) { if (request === sequence.current) setError(err.message); }
  }, []);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 15000);
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { sequence.current++; clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [refresh, location.pathname]);
  useEffect(() => { if (logoutShift) dialogRef.current?.focus(); }, [logoutShift]);
  const clearSession = () => {
    localStorage.removeItem('pos_token'); localStorage.removeItem('pos_user'); localStorage.removeItem('userRole');
    navigate('/', { replace: true });
  };
  const handleLogout = async () => {
    if (lock.current) return;
    lock.current = true; setLogoutBusy(true); setLogoutError('');
    try {
      const result = await api.get('/attendance/me');
      attendanceChanged(result);
      if (result.active) setLogoutShift(result.active);
      else clearSession();
    } catch (err) { setLogoutError(`No se pudo verificar tu jornada. ${err.message}`); }
    finally { lock.current = false; setLogoutBusy(false); }
  };
  const finishAndLogout = async () => {
    if (lock.current) return;
    lock.current = true; setLogoutBusy(true); setLogoutError('');
    try {
      const saved = JSON.parse(localStorage.getItem(pendingKey()) || 'null');
      if (saved && (saved.kind !== 'finish' || saved.id !== logoutShift.id)) throw new Error('Hay un fichaje sin confirmar. Cancelá y resolvelo en Mi jornada antes de finalizar.');
      const operation = saved || { requestId: crypto.randomUUID(), kind: 'finish', id: logoutShift.id };
      localStorage.setItem(pendingKey(), JSON.stringify(operation));
      await api.post(`/attendance/${operation.id}/finish`, { requestId: operation.requestId });
      localStorage.removeItem(pendingKey());
      const result = await api.get('/attendance/me');
      attendanceChanged(result);
      if (result.active) {
        setLogoutShift(result.active);
        throw new Error('La jornada cambió desde otra sesión. Revisá la jornada activa antes de salir.');
      }
      clearSession();
    } catch (err) { setLogoutError(err.message); }
    finally { lock.current = false; setLogoutBusy(false); }
  };
  const requiredStart = attendance !== null && !attendance.active;
  const content = <>
    {logoutError && !logoutShift && <p role="alert" className="mb-4 bg-red-50 text-red-800 rounded-xl p-4">{logoutError}</p>}
    {error ? <section role="alert" className="bg-white border rounded-xl p-6 space-y-4"><h1 className="text-xl font-bold">No pudimos verificar tu jornada</h1><p>{error}</p><button onClick={refresh} className="bg-brand-1 text-white px-5 py-3 rounded-lg">Reintentar</button></section>
      : attendance === null ? <p role="status">Verificando tu jornada…</p>
      : requiredStart && location.pathname !== '/employee/attendance' ? <Navigate to="/employee/attendance" replace state={{ returnTo: location.pathname }} />
      : <Outlet context={{ onAttendanceChange: attendanceChanged, requiredStart, returnTo: location.state?.returnTo }} />}
  </>;
  const dialog = logoutShift && <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
    <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-description" className="w-full max-w-lg bg-white rounded-xl shadow-xl p-6 space-y-5" onKeyDown={event => {
      if (event.key === 'Escape' && !logoutBusy) { setLogoutShift(null); setLogoutError(''); }
      if (event.key === 'Tab') {
        const buttons = [...dialogRef.current.querySelectorAll('button:not(:disabled)')];
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }}>
      <h2 id="logout-title" className="text-xl font-bold">¿Querés finalizar tu jornada antes de salir?</h2>
      <p id="logout-description" className="text-gray-600">Tenés una jornada activa desde {formatAttendanceDate(logoutShift.startedAt)}. Si salís sin finalizarla, seguirá abierta.</p>
      {logoutError && <p role="alert" className="bg-red-50 text-red-800 rounded-lg p-3">{logoutError}</p>}
      <div className="flex flex-col gap-3">
        <button disabled={logoutBusy} onClick={finishAndLogout} className="bg-brand-1 text-white font-semibold rounded-lg px-4 py-3 disabled:opacity-50">{logoutBusy ? 'Finalizando…' : 'Finalizar jornada y salir'}</button>
        <button disabled={logoutBusy} onClick={clearSession} className="border border-gray-300 rounded-lg px-4 py-3 disabled:opacity-50">Salir sin finalizar la jornada</button>
        <button disabled={logoutBusy} onClick={() => { setLogoutShift(null); setLogoutError(''); }} className="text-gray-600 rounded-lg px-4 py-2 disabled:opacity-50">Cancelar</button>
      </div>
    </section>
  </div>;
  return { handleLogout, logoutBusy, content, dialog };
}
