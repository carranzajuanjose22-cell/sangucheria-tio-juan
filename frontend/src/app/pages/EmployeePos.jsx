import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { Plus, Minus, Search, Trash2, Receipt, ShoppingCart, Printer, X, Lock, CheckCircle2, ChevronRight, Tag, Unlock, TrendingDown, LayoutGrid } from "lucide-react";

export function EmployeePos() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const userName = isAdmin ? "Admin" : "Empleado #1";

  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [payments, setPayments] = useState([]);
  const [modalState, setModalState] = useState("none");
  const [lastSale, setLastSale] = useState(null);
  const [registerState, setRegisterState] = useState(null);
  const [initialCashInput, setInitialCashInput] = useState("");
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [migaMatrix, setMigaMatrix] = useState([]);
  const [otherProducts, setOtherProducts] = useState([]);
  const [migaTitle, setMigaTitle] = useState("Sándwiches de Miga");
  const [migaHeaders, setMigaHeaders] = useState(["Docena", "Media Docena", "Plancha de 3"]);
  const [migaOptionModal, setMigaOptionModal] = useState(false);
  const [pendingMigaProduct, setPendingMigaProduct] = useState(null);
  const [availablePayments, setAvailablePayments] = useState([]);

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
    const loadPayments = () => {
      const saved = localStorage.getItem("pos_payments");
      let loaded = saved
        ? JSON.parse(saved)
        : [{ id: "1", name: "Efectivo", surcharge: 0 }, { id: "2", name: "Débito", surcharge: 10 }, { id: "3", name: "Transferencia", surcharge: 0 }, { id: "4", name: "QR", surcharge: 5 }];
      setAvailablePayments(loaded);
      setPayments((prev) => prev.length === 0 && loaded.length > 0 ? [{ method: loaded[0].name, amount: 0 }] : prev);
    };
    loadPayments();
    const interval = setInterval(loadPayments, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadMiga = () => {
      const savedProduct = localStorage.getItem("pos_miga_product");
      if (savedProduct) {
        const parsed = JSON.parse(savedProduct);
        setMigaTitle(parsed.name || "Sándwiches de Miga");
        const headers = parsed.varieties.length > 0 ? parsed.varieties[0].presentations.map((p) => p.name) : ["Docena", "Media Docena", "Plancha de 3"];
        setMigaHeaders(headers);
        setMigaMatrix(parsed.varieties.map((v) => {
          const presObj = {};
          v.presentations.forEach((p) => { presObj[p.name] = { id: p.id, name: `${p.name} de ${v.name}`, price: p.price || 0 }; });
          return { variety: v.name, presentations: presObj };
        }));
      }
    };
    loadMiga();
    const interval = setInterval(loadMiga, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem("pos_sales");
      setSales(saved ? JSON.parse(saved) : []);
    };
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem("pos_expenses");
      setExpenses(saved ? JSON.parse(saved) : []);
    };
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentDate = new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const isRegisterClosed = !registerState?.isOpen;
  const totalSalesToday = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalExpensesToday = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const filteredMiga = migaMatrix.filter((row) => row.variety.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredOther = otherProducts.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const handleConfirmMigaOption = (option) => {
    if (pendingMigaProduct) {
      const finalName = option ? `${pendingMigaProduct.name} (${option})` : pendingMigaProduct.name;
      const finalId = option ? `${pendingMigaProduct.id}-${option}` : pendingMigaProduct.id;
      addToCart({ ...pendingMigaProduct, name: finalName, id: finalId });
    }
    setMigaOptionModal(false);
    setPendingMigaProduct(null);
  };

  const updateQuantity = (id, delta) => {
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(item.quantity + delta, 0) } : item).filter((item) => item.quantity > 0));
  };

  const setQuantity = (id, quantity) => {
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: quantity > 0 ? quantity : 1 } : item));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const mainMethod = availablePayments.find((p) => p.name === payments[0]?.method);
  const surchargePercent = mainMethod?.surcharge || 0;
  const surchargeAmount = (cartSubtotal * surchargePercent) / 100;
  const total = cartSubtotal + surchargeAmount;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;

  const updatePayment = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setPayments(newPayments);
  };

  const handleRegisterSale = () => {
    if (cart.length === 0 || isRegisterClosed) return;
    if (totalPaid < total) { alert(`Falta pagar $${remaining.toFixed(2)}`); return; }
    const paymentMethodStr = payments.length === 1 ? payments[0].method : payments.map((p) => `${p.method} ($${p.amount})`).join(" + ");
    const newSale = { id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), items: [...cart], total, paymentMethod: paymentMethodStr, payments: [...payments], employee: userName, registerNumber: "Caja 01" };
    const existingSales = JSON.parse(localStorage.getItem("pos_sales") || "[]");
    const updatedSales = [...existingSales, newSale];
    localStorage.setItem("pos_sales", JSON.stringify(updatedSales));
    setSales(updatedSales);
    setLastSale(newSale);
    setModalState("success");
    setCart([]);
    setPayments([{ method: availablePayments[0]?.name || "", amount: 0 }]);
  };

  const handleOpenRegister = () => {
    const cashAmount = parseFloat(initialCashInput);
    if (isNaN(cashAmount) || cashAmount < 0) { alert("Por favor ingresa un monto válido"); return; }
    const newState = { isOpen: true, initialCash: cashAmount, openedAt: new Date().toISOString(), openedBy: userName };
    localStorage.setItem("register_state", JSON.stringify(newState));
    setRegisterState(newState);
    setInitialCashInput("");
    setModalState("none");
  };

  const handleRegisterExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (!expenseDesc.trim() || isNaN(amount) || amount <= 0) { alert("Por favor ingresa una descripción y un monto válido"); return; }
    const newExpense = { id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), description: expenseDesc.trim(), amount, employee: userName };
    const existingExpenses = JSON.parse(localStorage.getItem("pos_expenses") || "[]");
    const updatedExpenses = [...existingExpenses, newExpense];
    localStorage.setItem("pos_expenses", JSON.stringify(updatedExpenses));
    setExpenses(updatedExpenses);
    setExpenseDesc(""); setExpenseAmount(""); setModalState("none");
  };

  const handleCloseRegister = () => {
    if (!registerState) return;
    const existingSales = JSON.parse(localStorage.getItem("pos_sales") || "[]");
    const existingExpenses = JSON.parse(localStorage.getItem("pos_expenses") || "[]");
    const closeRecord = {
      id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(),
      totalSalesCount: existingSales.length,
      totalIncome: existingSales.reduce((acc, sale) => acc + sale.total, 0),
      totalExpenses: existingExpenses.reduce((acc, exp) => acc + exp.amount, 0),
      employee: registerState.openedBy, registerNumber: "Caja 01",
      sales: existingSales, expenses: existingExpenses,
      initialCash: registerState.initialCash, openedAt: registerState.openedAt,
    };
    const existingRegisters = JSON.parse(localStorage.getItem("pos_registers") || "[]");
    localStorage.setItem("pos_registers", JSON.stringify([closeRecord, ...existingRegisters]));
    localStorage.removeItem("register_state"); localStorage.removeItem("pos_sales"); localStorage.removeItem("pos_expenses");
    setRegisterState(null); setSales([]); setExpenses([]); setModalState("closeSuccess");
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 capitalize">{currentDate}</h1>
          <p className={`text-sm ${isRegisterClosed ? "text-red-600 font-medium" : "text-gray-500"}`}>
            Caja {isRegisterClosed ? "Cerrada" : "Abierta"}: #01 • {userName}
          </p>
          {registerState?.isOpen && <p className="text-xs text-gray-400 mt-1">Monto inicial: ${registerState.initialCash}</p>}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isRegisterClosed ? "bg-red-500" : "bg-green-500 animate-pulse"}`}></div>
            <span className={`text-sm font-medium ${isRegisterClosed ? "text-red-700" : "text-green-700"}`}>{isRegisterClosed ? "Caja Cerrada" : "Operando"}</span>
          </div>
          {registerState?.isOpen && (
            <button onClick={() => setModalState("expense")} className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
              <TrendingDown size={14} /> Compras / Gastos
            </button>
          )}
          {registerState?.isOpen ? (
            <button onClick={() => setModalState("closeRegister")} className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
              <Lock size={14} /> Cerrar Caja
            </button>
          ) : (
            <button onClick={() => setModalState("openRegister")} className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">
              <Unlock size={14} /> Abrir Caja
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Buscar producto..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={isRegisterClosed} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {filteredMiga.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 px-1 flex items-center gap-2"><LayoutGrid className="text-blue-600" size={20} /> Cuadro de {migaTitle}</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-sm font-bold text-gray-700 border-r border-gray-200">Variedad</th>
                        {migaHeaders.map((header) => <th key={header} className="px-4 py-3 text-sm font-bold text-gray-700 text-center border-r border-gray-200 last:border-0">{header}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredMiga.map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30">
                          <td className="px-4 py-3 font-bold text-gray-900 border-r border-gray-200 bg-gray-50/50">{row.variety}</td>
                          {migaHeaders.map((pres) => {
                            const product = row.presentations[pres];
                            if (!product) return <td key={pres} className="px-2 py-2 border-r border-gray-200 last:border-0"></td>;
                            return (
                              <td key={pres} className="px-2 py-2 border-r border-gray-200 last:border-0 align-middle">
                                <button
                                  onClick={() => {
                                    if (!isRegisterClosed) {
                                      const requiresOptions = /jamón|jamon|paleta|ternera/i.test(row.variety);
                                      if (requiresOptions) { setPendingMigaProduct(product); setMigaOptionModal(true); }
                                      else addToCart(product);
                                    }
                                  }}
                                  disabled={isRegisterClosed}
                                  className="w-full h-full flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                  <span className="text-blue-600 font-black text-base group-hover:scale-110 transition-transform">${product.price}</span>
                                  <span className="text-[10px] text-gray-400 font-semibold uppercase mt-1 tracking-wider">Agregar</span>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {filteredOther.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 px-1 flex items-center gap-2"><Tag className="text-orange-500" size={20} /> Otros Productos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredOther.map((product) => (
                    <button key={product.id} onClick={() => !isRegisterClosed && addToCart(product)} disabled={isRegisterClosed} className="flex flex-col text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-orange-400 hover:shadow-md transition-all group disabled:opacity-50">
                      <span className="font-medium text-gray-900 group-hover:text-orange-600 line-clamp-2">{product.name}</span>
                      <span className="mt-2 text-orange-500 font-bold">${product.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredMiga.length === 0 && filteredOther.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                <LayoutGrid className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-bold text-gray-500">No hay productos en tu catálogo</p>
                <p className="text-sm mt-2 text-center max-w-sm">Ve a <span className="font-medium text-gray-700">Configuración</span> y haz clic en "Guardar Catálogo" para que aparezcan aquí.</p>
              </div>
            )}
          </div>

          {isRegisterClosed && (
            <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px] flex items-center justify-center z-10">
              <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"><Lock className="w-8 h-8 text-red-600" /></div>
                <p className="text-gray-900 font-bold text-lg">Caja Cerrada</p>
                <p className="text-gray-500 text-sm text-center">No se pueden registrar ventas</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden shrink-0 relative">
          <div className="p-4 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center"><Receipt className="w-5 h-5 mr-2 text-gray-500" /> Venta Actual</h2>
            <div className="flex gap-2 items-center">
              {cart.length > 0 && (
                <button onClick={() => { if (confirm("¿Vaciar el carrito?")) { setCart([]); setPayments([{ method: availablePayments[0]?.name || "", amount: 0 }]); } }} className="text-xs font-medium px-2.5 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200">Vaciar</button>
              )}
              <span className="text-sm font-medium px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400"><ShoppingCart className="w-12 h-12 mb-4 text-gray-300" /><p>Agrega productos a la cuenta</p></div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 p-3 border border-gray-100 bg-gray-50/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-gray-900 line-clamp-1">{item.name}</span>
                      <button onClick={() => setCart((c) => c.filter((i) => i.id !== item.id))} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">${item.price}</span>
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 hover:bg-gray-100 text-gray-600"><Minus className="w-4 h-4" /></button>
                        <input type="number" min="1" value={item.quantity} onChange={(e) => setQuantity(item.id, parseInt(e.target.value) || 1)} className="w-12 text-center font-medium text-sm border-0 focus:ring-0 focus:outline-none" />
                        <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 hover:bg-gray-100 text-gray-600"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <div className="space-y-1 mb-4">
              <div className="flex justify-between items-center text-sm text-gray-600"><span>Subtotal</span><span>${cartSubtotal.toFixed(2)}</span></div>
              {surchargeAmount > 0 && <div className="flex justify-between items-center text-sm text-orange-600"><span>Recargo ({surchargePercent}%)</span><span>${surchargeAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                <span className="text-gray-900 font-medium">Total a cobrar</span>
                <span className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Formas de Pago</label>
                <button onClick={() => setPayments([...payments, { method: availablePayments[0]?.name || "", amount: 0 }])} className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1" disabled={isRegisterClosed}>
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              </div>
              <div className="space-y-2">
                {payments.map((payment, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select value={payment.method} onChange={(e) => updatePayment(index, "method", e.target.value)} className="flex-1 border-gray-300 rounded-lg py-2 px-3 border bg-white text-sm" disabled={isRegisterClosed}>
                      {availablePayments.map((p) => <option key={p.id} value={p.name}>{p.name} {p.surcharge > 0 ? `(+${p.surcharge}%)` : ""}</option>)}
                    </select>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                      <input type="text" inputMode="decimal" value={payment.amount || ""} onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d*$/.test(v)) updatePayment(index, "amount", v === "" ? 0 : parseFloat(v)); }} className="w-full pl-5 pr-2 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0.00" disabled={isRegisterClosed} />
                    </div>
                    {payments.length > 1 && (
                      <button onClick={() => setPayments(payments.filter((_, i) => i !== index))} className="p-2 text-gray-400 hover:text-red-600" disabled={isRegisterClosed}>
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Total pagado:</span><span className="font-medium text-gray-900">${totalPaid.toFixed(2)}</span></div>
                {remaining > 0 && <div className="flex justify-between text-sm"><span className="text-red-600">Falta:</span><span className="font-bold text-red-600">${remaining.toFixed(2)}</span></div>}
                {remaining < 0 && <div className="flex justify-between text-sm"><span className="text-green-600">Cambio:</span><span className="font-bold text-green-600">${Math.abs(remaining).toFixed(2)}</span></div>}
              </div>
            </div>

            <button onClick={handleRegisterSale} disabled={cart.length === 0 || isRegisterClosed || totalPaid < total} className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-colors ${cart.length === 0 || isRegisterClosed || totalPaid < total ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-sm"}`}>
              Registrar Venta
            </button>
          </div>

          {isRegisterClosed && (
            <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px] flex items-center justify-center z-10">
              <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"><Lock className="w-8 h-8 text-red-600" /></div>
                <p className="text-gray-900 font-bold text-lg">Caja Cerrada</p>
                <p className="text-gray-500 text-sm text-center">No se pueden registrar ventas</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalState === "openRegister" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b p-4 flex justify-between items-center"><h3 className="font-bold text-gray-900">Abrir Caja</h3><button onClick={() => { setModalState("none"); setInitialCashInput(""); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
            <div className="p-6">
              <div className="flex flex-col items-center mb-6"><div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3"><Unlock size={32} /></div><h4 className="text-xl font-bold text-gray-900 mb-2">Apertura de Caja</h4><p className="text-gray-600 text-center">Ingresa el monto inicial en efectivo.</p></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Monto Inicial</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span><input type="text" inputMode="decimal" value={initialCashInput} onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d*$/.test(v)) setInitialCashInput(v); }} className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-medium" placeholder="0.00" autoFocus /></div></div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3"><button onClick={() => { setModalState("none"); setInitialCashInput(""); }} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancelar</button><button onClick={handleOpenRegister} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700">Abrir Caja</button></div>
          </div>
        </div>
      )}

      {modalState === "expense" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b p-4 flex justify-between items-center"><h3 className="font-bold text-gray-900">Registrar Compra / Gasto</h3><button onClick={() => { setModalState("none"); setExpenseDesc(""); setExpenseAmount(""); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label><input type="text" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Descripción del gasto" autoFocus /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Monto Retirado de Caja</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span><input type="text" inputMode="decimal" value={expenseAmount} onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d*$/.test(v)) setExpenseAmount(v); }} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="0.00" /></div></div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3"><button onClick={() => { setModalState("none"); setExpenseDesc(""); setExpenseAmount(""); }} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancelar</button><button onClick={handleRegisterExpense} className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-medium hover:bg-orange-600">Registrar Gasto</button></div>
          </div>
        </div>
      )}

      {modalState === "closeRegister" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b p-4 flex justify-between items-center"><h3 className="font-bold text-gray-900">Confirmar Cierre de Caja</h3><button onClick={() => setModalState("none")} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
            <div className="p-6">
              <div className="flex flex-col items-center mb-6"><div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3"><Lock size={32} /></div><h4 className="text-xl font-bold text-gray-900 mb-2">¿Cerrar la caja?</h4>
                <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Monto inicial:</span><span className="font-medium">${registerState?.initialCash || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Ventas:</span><span className="font-medium">{sales.length}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Ingresos:</span><span className="font-medium text-green-600">${totalSalesToday}</span></div>
                  <div className="flex justify-between text-sm border-b border-blue-200 pb-2"><span className="text-gray-600">Gastos:</span><span className="font-medium text-red-600">-${totalExpensesToday}</span></div>
                  <div className="flex justify-between font-bold text-sm"><span>Total en Caja:</span><span className="text-blue-700">${(registerState?.initialCash || 0) + totalSalesToday - totalExpensesToday}</span></div>
                </div>
                <p className="text-red-600 font-medium text-sm mt-4">⚠️ Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3"><button onClick={() => setModalState("none")} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancelar</button><button onClick={handleCloseRegister} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700">Cerrar Caja</button></div>
          </div>
        </div>
      )}

      {modalState === "closeSuccess" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 flex flex-col items-center"><div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3"><CheckCircle2 size={32} /></div><h4 className="text-xl font-bold text-gray-900 mb-2">¡Caja Cerrada Exitosamente!</h4><p className="text-gray-600 text-center">El cierre ha sido registrado.</p></div>
            <div className="p-4 border-t bg-gray-50"><button onClick={() => setModalState("none")} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">Entendido</button></div>
          </div>
        </div>
      )}

      {(modalState === "success" || modalState === "ticket") && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">{modalState === "success" ? "Detalle de Venta Registrada" : "Vista Previa del Ticket"}</h3>
              <button onClick={() => setModalState("none")} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {modalState === "success" ? (
              <div className="p-6">
                <div className="flex flex-col items-center mb-6"><div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3"><CheckCircle2 size={32} /></div><h4 className="text-xl font-bold text-gray-900">¡Venta Exitosa!</h4><p className="text-gray-500">El pago ha sido procesado correctamente.</p></div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-2"><Receipt size={16} /> Ticket</span><span className="font-medium uppercase text-blue-600">#{lastSale.id}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Monto Total</span><span className="font-bold">${lastSale.total}</span></div>
                    <div className="border-t pt-3">
                      <span className="text-gray-500 text-sm block mb-2">Forma(s) de Pago</span>
                      {lastSale.payments?.length > 0 ? lastSale.payments.map((p, idx) => <div key={idx} className="flex justify-between text-sm"><span>{p.method}</span><span className="font-medium">${p.amount.toFixed(2)}</span></div>) : <div className="flex justify-between"><span>{lastSale.paymentMethod}</span></div>}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Productos Incluidos</h5>
                    <div className="border border-gray-200 rounded-lg divide-y max-h-32 overflow-y-auto">
                      {lastSale.items.map((item) => <div key={item.id} className="p-3 flex justify-between text-sm"><span>{item.quantity}x {item.name}</span><span className="font-medium">${item.price * item.quantity}</span></div>)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-white font-mono text-sm max-h-[60vh] overflow-y-auto">
                <div className="text-center mb-6"><h4 className="font-bold text-lg mb-1">LOCAL DE SÁNGUCHES</h4><p className="text-gray-500 text-xs">{new Date(lastSale.date).toLocaleDateString("es-AR")} - {new Date(lastSale.date).toLocaleTimeString("es-AR", { hour12: false })}</p></div>
                <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4 space-y-2">
                  <div className="flex justify-between"><span className="text-gray-500">Caja:</span><span>{lastSale.registerNumber}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Atendido por:</span><span>{lastSale.employee}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ticket #:</span><span className="uppercase">{lastSale.id}</span></div>
                </div>
                <div className="space-y-3 mb-4">
                  {lastSale.items.map((item) => <div key={item.id} className="flex justify-between text-gray-700"><div>{item.quantity}x {item.name}</div><span>${item.price * item.quantity}</span></div>)}
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg"><span>TOTAL</span><span>${lastSale.total}</span></div>
                  <div className="mt-3 text-xs border-t pt-2">
                    <span className="text-gray-500 block mb-1">Medio(s) de Pago:</span>
                    {lastSale.payments?.length > 0 ? lastSale.payments.map((p, idx) => <div key={idx} className="flex justify-between"><span className="uppercase">{p.method}</span><span>${p.amount.toFixed(2)}</span></div>) : <span className="uppercase">{lastSale.paymentMethod}</span>}
                  </div>
                </div>
              </div>
            )}
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              {modalState === "success" ? (
                <><button onClick={() => setModalState("none")} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cerrar y Continuar</button><button onClick={() => setModalState("ticket")} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">Ver Ticket <ChevronRight size={18} /></button></>
              ) : (
                <><button onClick={() => { alert("Imprimiendo..."); setModalState("none"); }} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800"><Printer size={18} /> Imprimir</button><button onClick={() => setModalState("success")} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Volver</button></>
              )}
            </div>
          </div>
        </div>
      )}

      {migaOptionModal && pendingMigaProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b p-4 flex justify-between items-center"><h3 className="font-bold text-gray-900">Variante del Sándwich</h3><button onClick={() => { setMigaOptionModal(false); setPendingMigaProduct(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
            <div className="p-6">
              <p className="text-center text-gray-600 mb-6">¿Con qué acompañamiento se preparará <strong>{pendingMigaProduct.name}</strong>?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleConfirmMigaOption("Con Queso")} className="py-3 px-4 bg-yellow-100 text-yellow-800 font-bold rounded-xl border border-yellow-200 hover:bg-yellow-200">Con Queso</button>
                <button onClick={() => handleConfirmMigaOption("Con Verdura")} className="py-3 px-4 bg-green-100 text-green-800 font-bold rounded-xl border border-green-200 hover:bg-green-200">Con Verdura</button>
                <button onClick={() => handleConfirmMigaOption("Surtido / Mixto")} className="py-3 px-4 bg-orange-100 text-orange-800 font-bold rounded-xl border border-orange-200 hover:bg-orange-200 col-span-2">Surtido (Mitad y Mitad)</button>
                <button onClick={() => handleConfirmMigaOption("")} className="py-3 px-4 bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 col-span-2">Sin Aclaración / Normal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
