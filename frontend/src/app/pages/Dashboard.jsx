import { useState, useEffect } from "react";
import { Receipt, ShoppingCart, Clock, Lock, Unlock, X, CheckCircle2, Eye } from "lucide-react";
import { nonNegative, isAllowedDecimalInput } from "../utils/numbers.js";

export function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [registerState, setRegisterState] = useState(null);
  const [modalState, setModalState] = useState("none");
  const [initialCashInput, setInitialCashInput] = useState("");
  const [registers, setRegisters] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem("register_state");
      if (saved) setRegisterState(JSON.parse(saved));
      else setRegisterState(null);
    };
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem("pos_sales");
      if (saved) setSales(JSON.parse(saved));
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem("pos_expenses");
      if (saved) setExpenses(JSON.parse(saved));
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = () => {
      const savedRegisters = localStorage.getItem("pos_registers");
      if (savedRegisters) setRegisters(JSON.parse(savedRegisters));
      const savedServices = localStorage.getItem("pos_services");
      if (savedServices) setServices(JSON.parse(savedServices));
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenRegister = () => {
    const cashAmount = nonNegative(initialCashInput);
    const newState = { isOpen: true, initialCash: cashAmount, openedAt: new Date().toISOString(), openedBy: "Admin" };
    localStorage.setItem("register_state", JSON.stringify(newState));
    setRegisterState(newState);
    setInitialCashInput("");
    setModalState("none");
  };

  const handleCloseRegister = () => {
    if (!registerState) return;
    const existingSales = JSON.parse(localStorage.getItem("pos_sales") || "[]");
    const existingExpenses = JSON.parse(localStorage.getItem("pos_expenses") || "[]");
    const closeRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      totalSalesCount: existingSales.length,
      totalIncome: existingSales.reduce((acc, sale) => acc + sale.total, 0),
      totalExpenses: existingExpenses.reduce((acc, exp) => acc + exp.amount, 0),
      employee: registerState.openedBy,
      registerNumber: "Caja 01",
      sales: existingSales,
      expenses: existingExpenses,
      initialCash: registerState.initialCash,
      openedAt: registerState.openedAt,
    };
    const existingRegisters = JSON.parse(localStorage.getItem("pos_registers") || "[]");
    localStorage.setItem("pos_registers", JSON.stringify([closeRecord, ...existingRegisters]));
    localStorage.removeItem("register_state");
    localStorage.removeItem("pos_sales");
    localStorage.removeItem("pos_expenses");
    setRegisterState(null);
    setSales([]);
    setExpenses([]);
    setModalState("closeSuccess");
  };

  const currentDate = currentTime.toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const currentTimeStr = currentTime.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const totalSalesToday = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalExpensesToday = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const currentMonthRegisters = registers.filter((r) => {
    const d = new Date(r.date);
    return d.getMonth() === currentTime.getMonth() && d.getFullYear() === currentTime.getFullYear();
  });
  const monthlyIncome = currentMonthRegisters.reduce((sum, r) => sum + (r.totalIncome || 0), 0) + totalSalesToday;
  const monthlyVariableExpenses = currentMonthRegisters.reduce((sum, r) => sum + (r.totalExpenses || 0), 0) + totalExpensesToday;
  const monthlyBalance = monthlyIncome - monthlyVariableExpenses;
  const fixedExpensesTotal = services.reduce((sum, s) => sum + (s.cost || 0), 0);
  const coveragePercent = fixedExpensesTotal > 0 ? Math.min((Math.max(monthlyBalance, 0) / fixedExpensesTotal) * 100, 100) : 0;
  const isCovered = monthlyBalance >= fixedExpensesTotal && fixedExpensesTotal > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold capitalize">{currentDate}</h1>
            <p className="mt-1 text-blue-100">Panel de Administración</p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg">
            <Clock className="w-5 h-5" />
            <span className="text-2xl font-bold font-mono">{currentTimeStr}</span>
          </div>
        </div>
      </div>

      <div className={`border-2 rounded-2xl shadow-sm overflow-hidden ${registerState?.isOpen ? "bg-green-50/30 border-green-200" : "bg-gray-50 border-gray-200"}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${registerState?.isOpen ? "bg-green-500" : "bg-gray-400"}`}>
                {registerState?.isOpen ? <Unlock className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{registerState?.isOpen ? "Caja Abierta - En Operación" : "Caja Cerrada"}</h2>
                <p className="text-gray-600 mt-1">
                  {registerState?.isOpen
                    ? `Abierta el ${new Date(registerState.openedAt).toLocaleDateString("es-AR")} a las ${new Date(registerState.openedAt).toLocaleTimeString("es-AR", { hour12: false })}`
                    : "No hay caja abierta actualmente"}
                </p>
              </div>
            </div>
            {registerState?.isOpen ? (
              <button onClick={() => setModalState("closeRegister")} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">
                <Lock size={16} /> Cerrar Caja
              </button>
            ) : (
              <button onClick={() => setModalState("openRegister")} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600">
                <Unlock size={16} /> Abrir Caja
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[
              { label: "Efectivo Inicial", value: `$${registerState?.isOpen ? registerState.initialCash.toFixed(2) : "0.00"}` },
              { label: "Ventas Realizadas", value: sales.length },
              { label: "Total Vendido", value: `$${totalSalesToday.toFixed(2)}` },
              { label: "Gastos Registrados", value: `$${totalExpensesToday.toFixed(2)}`, red: true },
              { label: "Efectivo en Caja", value: `$${registerState?.isOpen ? (registerState.initialCash + totalSalesToday - totalExpensesToday).toFixed(2) : "0.00"}`, green: true },
            ].map(({ label, value, red, green }) => (
              <div key={label} className="bg-white rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">{label}</p>
                <p className={`text-2xl font-bold ${red ? "text-red-600" : green ? "text-green-600" : "text-gray-900"}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-3 gap-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cobertura de Gastos Fijos <span className="text-sm font-normal text-gray-500">(Mes Actual)</span></h3>
                <p className="text-sm text-gray-500 mt-1">Balance: <span className="font-medium">${Math.max(monthlyBalance, 0).toFixed(2)}</span> / Meta: <span className="font-medium">${fixedExpensesTotal.toFixed(2)}</span></p>
              </div>
              {isCovered && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  <CheckCircle2 size={16} /> Gastos Cubiertos
                </span>
              )}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${isCovered ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${coveragePercent}%` }} />
            </div>
            <p className="text-right text-xs text-gray-500 mt-2 font-medium">{coveragePercent.toFixed(1)}%</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 min-h-[300px] flex items-center justify-center p-8">
            {sales.length === 0 ? (
              <div className="text-center">
                <ShoppingCart className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No se han realizado ventas aún</p>
              </div>
            ) : (
              <div className="w-full space-y-3">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Últimas Ventas</h3>
                {sales.slice().reverse().slice(0, 5).map((sale) => {
                  const paymentDisplay = sale.payments?.length > 1 ? `${sale.payments.length} métodos` : sale.payments?.[0]?.method || sale.paymentMethod;
                  return (
                    <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Ticket #{sale.id}</p>
                          <p className="text-sm text-gray-500">{new Date(sale.date).toLocaleTimeString("es-AR", { hour12: false })} • {paymentDisplay}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="font-bold text-gray-900">${sale.total}</p>
                          <p className="text-xs text-gray-500">{sale.items.length} producto{sale.items.length !== 1 ? "s" : ""}</p>
                        </div>
                        <button onClick={() => setSelectedTicket(sale)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg">
                          <Eye size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalState === "openRegister" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Abrir Caja</h3>
              <button onClick={() => { setModalState("none"); setInitialCashInput(""); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3"><Unlock size={32} /></div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Apertura de Caja</h4>
                <p className="text-gray-600 text-center">Ingresa el monto inicial en efectivo para el cambio del día.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monto Inicial</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input type="text" inputMode="decimal" value={initialCashInput} onChange={(e) => { const v = e.target.value; if (isAllowedDecimalInput(v)) setInitialCashInput(v); }} className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-medium" placeholder="0.00" autoFocus />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button onClick={() => { setModalState("none"); setInitialCashInput(""); }} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleOpenRegister} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700">Abrir Caja</button>
            </div>
          </div>
        </div>
      )}

      {modalState === "closeRegister" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Confirmar Cierre de Caja</h3>
              <button onClick={() => setModalState("none")} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3"><Lock size={32} /></div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">¿Cerrar la caja?</h4>
                <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Monto inicial:</span><span className="font-medium">${registerState?.initialCash || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Ventas:</span><span className="font-medium">{sales.length}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Ingresos:</span><span className="font-medium text-green-600">${totalSalesToday}</span></div>
                  <div className="flex justify-between text-sm border-b border-blue-200 pb-2"><span className="text-gray-600">Gastos:</span><span className="font-medium text-red-600">-${totalExpensesToday}</span></div>
                  <div className="flex justify-between font-bold text-sm"><span>Total en Caja:</span><span className="text-blue-700">${(registerState?.initialCash || 0) + totalSalesToday - totalExpensesToday}</span></div>
                </div>
                <p className="text-red-600 font-medium text-sm mt-4 text-center">⚠️ Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button onClick={() => setModalState("none")} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCloseRegister} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700">Cerrar Caja</button>
            </div>
          </div>
        </div>
      )}

      {modalState === "closeSuccess" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3"><CheckCircle2 size={32} /></div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">¡Caja Cerrada Exitosamente!</h4>
              <p className="text-gray-600 text-center">Puedes consultar los detalles en la sección de "Cajas".</p>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setModalState("none")} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">Entendido</button>
            </div>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Detalle del Ticket #{selectedTicket.id}</h3>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                <span>{new Date(selectedTicket.date).toLocaleDateString("es-AR")} - {new Date(selectedTicket.date).toLocaleTimeString("es-AR", { hour12: false })}</span>
                <span>Cajero: {selectedTicket.employee}</span>
              </div>
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Productos Vendidos</h4>
                {selectedTicket.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{item.quantity}x {item.name}</span>
                    <span className="font-medium">${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span><span className="text-blue-600">${selectedTicket.total}</span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <span className="block mb-1">Medio(s) de Pago:</span>
                  {selectedTicket.payments?.length > 0 ? (
                    selectedTicket.payments.map((p, idx) => (
                      <div key={idx} className="flex justify-between"><span className="uppercase">{p.method}</span><span className="font-medium">${p.amount.toFixed(2)}</span></div>
                    ))
                  ) : (
                    <div className="flex justify-between"><span className="uppercase">{selectedTicket.paymentMethod}</span><span className="font-medium">${selectedTicket.total}</span></div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setSelectedTicket(null)} className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
