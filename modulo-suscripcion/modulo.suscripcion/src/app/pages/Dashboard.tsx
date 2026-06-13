import { useState, useEffect } from "react";
import { DollarSign, Receipt, ShoppingCart, Clock, Calendar, Activity, Lock, Unlock, X, CheckCircle2 } from "lucide-react";

type SaleItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type SaleRecord = {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  paymentMethod: string;
  employee: string;
  registerNumber: string;
};

type RegisterState = {
  isOpen: boolean;
  initialCash: number;
  openedAt: string;
  openedBy: string;
};

export function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [registerState, setRegisterState] = useState<RegisterState | null>(null);
  const [modalState, setModalState] = useState<"none" | "openRegister" | "closeRegister" | "closeSuccess">("none");
  const [initialCashInput, setInitialCashInput] = useState("");

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load register state
    const loadRegisterState = () => {
      const saved = localStorage.getItem("register_state");
      if (saved) {
        setRegisterState(JSON.parse(saved));
      }
    };

    loadRegisterState();

    // Refresh every 2 seconds
    const interval = setInterval(loadRegisterState, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Load current day's sales
    const loadSales = () => {
      const saved = localStorage.getItem("pos_sales");
      if (saved) {
        setSales(JSON.parse(saved));
      }
    };

    loadSales();

    // Refresh sales every 5 seconds
    const interval = setInterval(loadSales, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenRegister = () => {
    const cashAmount = parseFloat(initialCashInput);
    if (isNaN(cashAmount) || cashAmount < 0) {
      alert("Por favor ingresa un monto válido");
      return;
    }

    const newRegisterState: RegisterState = {
      isOpen: true,
      initialCash: cashAmount,
      openedAt: new Date().toISOString(),
      openedBy: "Admin",
    };

    localStorage.setItem("register_state", JSON.stringify(newRegisterState));
    setRegisterState(newRegisterState);
    setInitialCashInput("");
    setModalState("none");
  };

  const handleCloseRegister = () => {
    if (!registerState) return;

    const existingSales = JSON.parse(localStorage.getItem("pos_sales") || "[]");

    // Create a register close record
    const closeRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      totalSalesCount: existingSales.length,
      totalIncome: existingSales.reduce((acc: number, sale: SaleRecord) => acc + sale.total, 0),
      employee: registerState.openedBy,
      registerNumber: "Caja 01",
      sales: existingSales,
      initialCash: registerState.initialCash,
      openedAt: registerState.openedAt,
    };

    const existingRegisters = JSON.parse(localStorage.getItem("pos_registers") || "[]");
    localStorage.setItem("pos_registers", JSON.stringify([closeRecord, ...existingRegisters]));

    // Clear register state and sales
    localStorage.removeItem("register_state");
    localStorage.removeItem("pos_sales");

    setRegisterState(null);
    setSales([]);
    setModalState("closeSuccess");
  };

  const currentDate = currentTime.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentTimeStr = currentTime.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const totalSalesToday = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItemsSold = sales.reduce((sum, sale) =>
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Date and Time */}
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

      {/* Live Register Status */}
      <div className={`border-2 rounded-2xl shadow-sm overflow-hidden ${
        registerState?.isOpen ? "bg-green-50/30 border-green-200" : "bg-gray-50 border-gray-200"
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                registerState?.isOpen ? "bg-green-500" : "bg-gray-400"
              }`}>
                {registerState?.isOpen ? (
                  <Unlock className="w-8 h-8 text-white" />
                ) : (
                  <Lock className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {registerState?.isOpen ? "Caja Abierta - En Operación" : "Caja Cerrada"}
                </h2>
                <p className="text-gray-600 mt-1">
                  {registerState?.isOpen ? (
                    <>
                      Abierta el {new Date(registerState.openedAt).toLocaleDateString("es-AR")} a las{" "}
                      {new Date(registerState.openedAt).toLocaleTimeString("es-AR", { hour12: false })}
                    </>
                  ) : (
                    "No hay caja abierta actualmente"
                  )}
                </p>
              </div>
            </div>
            {registerState?.isOpen ? (
              <button
                onClick={() => setModalState("closeRegister")}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                <Lock size={16} />
                Cerrar Caja
              </button>
            ) : (
              <button
                onClick={() => setModalState("openRegister")}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                <Unlock size={16} />
                Abrir Caja
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Efectivo Inicial</p>
              <p className="text-2xl font-bold text-gray-900">
                ${registerState?.isOpen ? registerState.initialCash.toFixed(2) : "0.00"}
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Ventas Realizadas</p>
              <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Total Vendido</p>
              <p className="text-2xl font-bold text-gray-900">${totalSalesToday.toFixed(2)}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Efectivo en Caja</p>
              <p className="text-2xl font-bold text-green-600">
                ${registerState?.isOpen ? (registerState.initialCash + totalSalesToday).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>

          {/* Recent Sales */}
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
                  const paymentDisplay = sale.payments && sale.payments.length > 1
                    ? `${sale.payments.length} métodos`
                    : sale.payments && sale.payments.length === 1
                    ? sale.payments[0].method
                    : sale.paymentMethod;

                  return (
                    <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Ticket #{sale.id}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(sale.date).toLocaleTimeString("es-AR", { hour12: false })} • {paymentDisplay}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${sale.total}</p>
                        <p className="text-xs text-gray-500">{sale.items.length} producto{sale.items.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OPEN REGISTER MODAL */}
      {modalState === "openRegister" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Abrir Caja</h3>
              <button
                onClick={() => {
                  setModalState("none");
                  setInitialCashInput("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                  <Unlock size={32} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Apertura de Caja</h4>
                <p className="text-gray-600 text-center">
                  Ingresa el monto inicial en efectivo para el cambio del día.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Inicial (Efectivo para Cambio)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={initialCashInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only numbers and decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setInitialCashInput(value);
                      }
                    }}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-medium"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setModalState("none");
                  setInitialCashInput("");
                }}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleOpenRegister}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Abrir Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE REGISTER CONFIRMATION */}
      {modalState === "closeRegister" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Confirmar Cierre de Caja</h3>
              <button
                onClick={() => setModalState("none")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
                  <Lock size={32} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">¿Cerrar la caja?</h4>
                <p className="text-gray-600 text-center mb-4">
                  Se registrará el cierre del día con todas las ventas realizadas.
                </p>

                <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monto inicial:</span>
                    <span className="font-medium text-gray-900">${registerState?.initialCash || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ventas registradas:</span>
                    <span className="font-medium text-gray-900">{sales.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ingresos del día:</span>
                    <span className="font-medium text-green-600">${totalSalesToday}</span>
                  </div>
                </div>

                <p className="text-red-600 font-medium text-sm mt-4 text-center">
                  ⚠️ Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => setModalState("none")}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseRegister}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE SUCCESS MODAL */}
      {modalState === "closeSuccess" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">¡Caja Cerrada Exitosamente!</h4>
                <p className="text-gray-600 text-center mb-4">
                  El cierre ha sido registrado correctamente en el sistema.
                </p>
                <p className="text-gray-500 text-sm text-center">
                  Puedes consultar los detalles en la sección de "Cajas".
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setModalState("none")}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
