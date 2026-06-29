import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { Plus, Minus, Search, Trash2, Receipt, ShoppingCart, Printer, X, Lock, CheckCircle2, ChevronRight, Tag, Unlock, TrendingDown, LayoutGrid, Clock, DollarSign, CreditCard, AppWindow } from "lucide-react";
import { api } from "./api.js";
import { nonNegative, isAllowedDecimalInput } from "../utils/numbers.js";
import {
  calculateSaleTotals,
  buildInitialPayments,
  applyPaymentMethodChange,
  removePaymentLine,
} from "../utils/payments.js";
import { usePosStore } from "../hooks/usePosStore.js";
import { closeRegister, appendSale } from "../utils/register.js";

export function EmployeePos() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const userName = (() => {
    try {
      const stored = localStorage.getItem("pos_user");
      if (stored) {
        const u = JSON.parse(stored);
        return u.name || u.email || (isAdmin ? "Admin" : "Colaborador");
      }
    } catch {}
    return isAdmin ? "Admin" : "Colaborador";
  })();

  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [payments, setPayments] = useState([]);
  const [modalState, setModalState] = useState("none");
  const [lastSale, setLastSale] = useState(null);
  const [initialCashInput, setInitialCashInput] = useState("");
  const {
    register_state: registerState,
    pos_sales: sales,
    pos_expenses: expenses,
    pos_pending_orders: pendingOrders,
    refresh: refreshPosStore,
  } = usePosStore();
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [migaMatrix, setMigaMatrix] = useState([]);
  const [otherProducts] = useState([]);
  const [migaTitle, setMigaTitle] = useState("Sándwiches de Miga");
  const [migaHeaders, setMigaHeaders] = useState(["Docena", "Media Docena", "Plancha de 3"]);
  const [migaOptionModal, setMigaOptionModal] = useState(false);
  const [payingOrder, setPayingOrder] = useState(null);
  const [pendingMigaProduct, setPendingMigaProduct] = useState(null);
  const [customNote, setCustomNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [advanceNote, setAdvanceNote] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [availablePayments, setAvailablePayments] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [eggCount, setEggCount] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [unitSaleModal, setUnitSaleModal] = useState(null); // Para venta por unidad
  const [unitQuantity, setUnitQuantity] = useState(1);

  useEffect(() => {
    const loadInputs = async () => {
      try {
        const data = await api.get("/inputs");
        setInputs(data);
      } catch (error) {
        console.error("Error cargando insumos en POS:", error);
      }
    };
    loadInputs();
    const interval = setInterval(loadInputs, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const data = await api.get("/payments");
        if (data.length > 0) {
          localStorage.setItem("pos_payments", JSON.stringify(data));
          setAvailablePayments(data);
          setPayments((prev) => prev.length === 0 ? [{ method: data[0].name, amount: 0 }] : prev);
          return;
        }
      } catch {}
      // Fallback a cache local si la API no responde
      const saved = localStorage.getItem("pos_payments");
      const loaded = saved
        ? JSON.parse(saved)
        : [{ id: "1", name: "Efectivo", surcharge: 0 }, { id: "2", name: "Débito", surcharge: 10 }, { id: "3", name: "Transferencia", surcharge: 0 }, { id: "4", name: "QR", surcharge: 5 }];
      setAvailablePayments(loaded);
      setPayments((prev) => prev.length === 0 && loaded.length > 0 ? [{ method: loaded[0].name, amount: 0 }] : prev);
    };
    loadPayments();
    const interval = setInterval(loadPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const applyMigaData = (parsed) => {
      setMigaTitle(parsed.name || "Sándwiches de Miga");
      const headers = parsed.varieties.length > 0 ? parsed.varieties[0].presentations.map((p) => p.name) : ["Docena", "Media Docena", "Plancha de 3"];
      setMigaHeaders(headers);
      setMigaMatrix(parsed.varieties.map((v) => {
        const presObj = {};
        v.presentations.forEach((p) => { presObj[p.name] = { ...p, name: `${p.name} de ${v.name}` }; });
        return { variety: v.name, presentations: presObj, varietyData: v };
      }));
    };

    const loadMigaFromApi = async () => {
      try {
        const data = await api.get("/catalog/MIGA");
        if (!data) return;
        localStorage.setItem("pos_miga_product", JSON.stringify(data));
        applyMigaData(data);
      } catch {
        const savedProduct = localStorage.getItem("pos_miga_product");
        if (savedProduct) applyMigaData(JSON.parse(savedProduct));
      }
    };

    loadMigaFromApi();
    const interval = setInterval(loadMigaFromApi, 30000);
    const onCatalogUpdate = () => loadMigaFromApi();
    window.addEventListener("catalog-updated", onCatalogUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("catalog-updated", onCatalogUpdate);
    };
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

  const handleVarietyClick = (variety, presentationName) => {
    if (isRegisterClosed) return;

    const nameLower = variety.name.toLowerCase();
    const hasUnitPrice = typeof variety.unitPrice === 'number' && variety.unitPrice > 0;
    const isSpecialVariety = nameLower.includes("paleta") || nameLower.includes("pebete");

    if (hasUnitPrice && isSpecialVariety) {
      setUnitQuantity(1);
      setUnitSaleModal(variety);
    } else {
      const product = variety.presentations.find(p => p.name === presentationName);
      if (product) {
        setPendingMigaProduct({ ...product, name: `${product.name} de ${variety.name}` });
        setCustomNote("");
        setEggCount(0);
        setSelectedVariant(null);
        setMigaOptionModal(true);
      }
    }
  };


  const handleConfirmMigaOption = (option) => {
    if (pendingMigaProduct) {
      let finalName = option ? `${pendingMigaProduct.name} (${option})` : pendingMigaProduct.name;
      let finalPrice = pendingMigaProduct.price || 0;
      
      if (eggCount > 0) {
        const eggInput = inputs.find((i) => i.name.toLowerCase().includes("huevo"));
        const eggPrice = eggInput ? eggInput.price : 0;
        finalPrice += eggPrice * eggCount;
        finalName += ` + ${eggCount} Huevo${eggCount > 1 ? "s" : ""}`;
      }
      
      const finalId = option ? `${pendingMigaProduct.id}-${option}-e${eggCount}` : `${pendingMigaProduct.id}-e${eggCount}`;
      addToCart({ ...pendingMigaProduct, name: finalName, id: finalId, price: finalPrice });
    }
    setMigaOptionModal(false);
    setPendingMigaProduct(null);
  };

  const addUnitToCart = () => {
    if (!unitSaleModal || unitQuantity <= 0) return;
    const { name, unitPrice } = unitSaleModal;
    const cartId = `unit-${unitSaleModal.id}`;
    const item = {
      id: cartId,
      name: `${name} (Unidad)`,
      price: unitPrice,
      quantity: 1, // La cantidad se maneja en el wrapper addToCart
    };
    // Usamos el mismo addToCart, pero con la cantidad deseada
    setCart(current => [...current, { ...item, quantity: unitQuantity }]);
    setUnitSaleModal(null);
  };


  const updateQuantity = (id, delta) => {
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(item.quantity + delta, 0) } : item).filter((item) => item.quantity > 0));
  };

  const setQuantity = (id, quantity) => {
    const safeQty = Math.max(1, nonNegative(quantity));
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: safeQty } : item));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currentSubtotal = payingOrder ? payingOrder.total : cartSubtotal;
  const advanceAmount = payingOrder?.advanceAmount || 0;
  const {
    surchargePercent,
    surchargeAmount,
    total,
    amountDue,
  } = calculateSaleTotals(
    currentSubtotal,
    advanceAmount,
    payments[0]?.method,
    availablePayments
  );
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remaining = amountDue - totalPaid;

  const updatePayment = (index, field, value) => {
    if (field === "method" && payingOrder) {
      setPayments(applyPaymentMethodChange(
        payments,
        index,
        value,
        payingOrder.total,
        advanceAmount,
        availablePayments
      ));
      return;
    }

    const newPayments = [...payments];
    const safeValue = field === "amount" ? nonNegative(value) : value;
    newPayments[index] = { ...newPayments[index], [field]: safeValue };
    setPayments(newPayments);
  };

  const handleLoadOrder = async () => {
    if (cart.length === 0 || isRegisterClosed) return;
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      items: [...cart],
      total: cartSubtotal,
      customerName: customerName.trim(),
      advanceNote: advanceNote.trim(),
      advanceAmount: nonNegative(advanceAmount)
    };
    try {
      const updated = [...pendingOrders, newOrder];
      await api.post("/store/pos_pending_orders", updated);
      await refreshPosStore();
      setCart([]);
      setCustomerName("");
      setAdvanceNote("");
      setAdvanceAmount("");
    } catch (err) {
      alert("Error al cargar la orden. Revisa tu conexión a internet.");
    }
  };

  const handleDirectCharge = (keepInPrep) => {
    if (cart.length === 0 || isRegisterClosed) return;
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      items: [...cart],
      total: cartSubtotal,
      customerName: customerName.trim(),
      advanceNote: advanceNote.trim(),
      advanceAmount: nonNegative(advanceAmount),
      isDirectCharge: true,
      keepInPrep: keepInPrep
    };
    setPayingOrder(newOrder);
    setPayments(buildInitialPayments(newOrder.total, newOrder.advanceAmount || 0, availablePayments));
    setModalState("payment");
  };

  const handleDeliverOrder = async (id) => {
    try {
      const updated = pendingOrders.filter(o => o.id !== id);
      await api.post("/store/pos_pending_orders", updated);
      await refreshPosStore();
    } catch (err) {
      alert("Error al entregar la orden.");
    }
  };

  const handleDiscardOrder = async (id) => {
    if (confirm("¿Estás seguro de descartar este pedido?")) {
      try {
        const updated = pendingOrders.filter(o => o.id !== id);
        await api.post("/store/pos_pending_orders", updated);
        await refreshPosStore();
      } catch (err) {
        alert("Error al descartar la orden.");
      }
    }
  };

  const handleOpenPayment = (order) => {
    setPayingOrder(order);
    setPayments(buildInitialPayments(order.total, order.advanceAmount || 0, availablePayments));
    setModalState("payment");
  };

  const handleRegisterSale = async () => {
    if (!payingOrder || isRegisterClosed) return;
    if (totalPaid < amountDue) {
      alert(`Falta pagar $${remaining.toFixed(2)}`);
      return;
    }
    
    const finalPayments = [...payments];
    if (payingOrder.advanceAmount > 0) {
      finalPayments.unshift({ method: "Seña", amount: payingOrder.advanceAmount });
    }
    const paymentMethodStr = finalPayments.length === 1 ? finalPayments[0].method : finalPayments.map((p) => `${p.method} ($${p.amount})`).join(" + ");
    const newSale = { id: payingOrder.id, date: new Date().toISOString(), items: [...payingOrder.items], total, paymentMethod: paymentMethodStr, payments: finalPayments, employee: userName, registerNumber: "Caja 01" };
    try {
      await appendSale(newSale);
      setLastSale(newSale);

      if (payingOrder.keepInPrep) {
        const newPrepOrder = {
          ...payingOrder,
          isPaid: true,
          advanceNote: payingOrder.advanceNote || "Pagado"
        };
        const updatedPending = [...pendingOrders, newPrepOrder];
        await api.post("/store/pos_pending_orders", updatedPending);
      } else {
        const updatedPending = pendingOrders.filter(o => o.id !== payingOrder.id);
        await api.post("/store/pos_pending_orders", updatedPending);
      }

      await refreshPosStore();

    if (payingOrder.isDirectCharge) {
      setCart([]);
      setCustomerName("");
      setAdvanceNote("");
      setAdvanceAmount("");
    }

    setModalState("success");
    setPayingOrder(null);
    setPayments([{ method: availablePayments[0]?.name || "", amount: 0 }]);
    } catch (err) {
      alert(err.message || "Error al registrar la venta. Revisa la conexión.");
    }
  };

  const handleOpenRegister = async () => {
    try {
      const cashAmount = nonNegative(initialCashInput);
      const newState = { isOpen: true, initialCash: cashAmount, openedAt: new Date().toISOString(), openedBy: userName };
      await api.post("/store/register_state", newState);
      await refreshPosStore();
      setInitialCashInput("");
      setModalState("none");
    } catch (err) {
      alert(err.message || "Error de conexión. Revisá tu conexión a internet.");
    }
  };

  const handleRegisterExpense = async () => {
    try {
      const amount = nonNegative(expenseAmount);
      if (!expenseDesc.trim() || amount <= 0) { alert("Por favor ingresa una descripción y un monto válido"); return; }
      const newExpense = { id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), description: expenseDesc.trim(), amount, employee: userName };
      const existingExpenses = await api.get("/store/pos_expenses").catch(() => []) || [];
      const updatedExpenses = [...existingExpenses, newExpense];
      await api.post("/store/pos_expenses", updatedExpenses);
      await refreshPosStore();
      setExpenseDesc(""); setExpenseAmount(""); setModalState("none");
    } catch (err) {
      alert("Error al registrar el gasto.");
    }
  };

  const handleCloseRegister = async () => {
    if (!registerState) return;
    try {
      await closeRegister({ employee: userName, closedBy: userName });
      await refreshPosStore();
      setModalState("closeSuccess");
    } catch (err) {
      alert(err.message || "Error al cerrar la caja. Revisá tu conexión a internet.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-8">
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

      <div className="flex flex-col lg:flex-row gap-6 h-[65vh] min-h-[500px]">
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
                      {/* El thead se genera dinámicamente en el componente que no está aquí */}
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredMiga.map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30">
                          <td className="px-4 py-3 font-bold text-gray-900 border-r border-gray-200 bg-gray-50/50">{row.variety}</td>
                          {migaHeaders.map((pres) => {
                            const product = row.presentations[pres];
                            if (!product) return <td key={pres} className="px-2 py-2 border-r border-gray-200 last:border-0"></td>;
                            const presentation = row.presentations[pres];
                            const fullVariety = migaMatrix.find(m => m.variety === row.variety)?.varietyData;

                            return (
                              <td key={pres} className="px-2 py-2 border-r border-gray-200 last:border-0 align-middle">
                                <button
                                  onClick={() => {
                                    if (!isRegisterClosed) {
                                    setPendingMigaProduct(product);
                                    setCustomNote("");
                                    setEggCount(0);
                                    setSelectedVariant(null);
                                    setMigaOptionModal(true);
                                    if (fullVariety) {
                                      handleVarietyClick(fullVariety, pres);
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
                        <input type="number" min="1" value={item.quantity} onChange={(e) => { const qty = parseInt(e.target.value, 10); if (e.target.value !== "" && (Number.isNaN(qty) || qty < 0)) return; setQuantity(item.id, qty || 1); }} className="w-12 text-center font-medium text-sm border-0 focus:ring-0 focus:outline-none" />
                        <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 hover:bg-gray-100 text-gray-600"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                placeholder="Nombre Cliente (Opcional)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500 bg-white"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={isRegisterClosed || cart.length === 0}
              />
              <input
                type="text"
                placeholder="Nota (Ej: Pagado)"
                className="w-1/4 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-green-500 bg-white"
                value={advanceNote}
                onChange={(e) => setAdvanceNote(e.target.value)}
                disabled={isRegisterClosed || cart.length === 0}
              />
              <div className="relative w-1/4">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Seña"
                  className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-green-500 bg-white"
                  value={advanceAmount}
                  onChange={(e) => { const v = e.target.value; if (isAllowedDecimalInput(v)) setAdvanceAmount(v); }}
                  disabled={isRegisterClosed || cart.length === 0}
                />
              </div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-900 font-medium text-lg">Total del Pedido</span>
              <span className="text-3xl font-bold text-blue-600">${cartSubtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <button onClick={() => handleDirectCharge(false)} disabled={cart.length === 0 || isRegisterClosed} className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-colors ${cart.length === 0 || isRegisterClosed ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 shadow-sm flex justify-center items-center gap-2"}`}>
                <Receipt size={18} /> Cobrar (Entrega Inmediata)
              </button>
              <div className="flex gap-2">
                <button onClick={handleLoadOrder} disabled={cart.length === 0 || isRegisterClosed} className={`flex-1 py-2 px-2 rounded-xl font-bold transition-colors ${cart.length === 0 || isRegisterClosed ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-orange-100 text-orange-700 hover:bg-orange-200 shadow-sm flex flex-col justify-center items-center gap-1"}`}>
                  <Clock size={18} />
                  <span className="text-xs text-center leading-tight">Cargar<br/>Orden</span>
                </button>
                <button onClick={() => handleDirectCharge(true)} disabled={cart.length === 0 || isRegisterClosed} className={`flex-1 py-2 px-2 rounded-xl font-bold text-white transition-colors ${cart.length === 0 || isRegisterClosed ? "bg-gray-300 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 shadow-sm flex flex-col justify-center items-center gap-1"}`}>
                  <CreditCard size={18} />
                  <span className="text-xs text-center leading-tight">Cobrar y<br/>Preparar</span>
                </button>
              </div>
            </div>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-orange-500" /> Pedidos en Preparación ({pendingOrders.length})
          </h2>
        </div>
        {pendingOrders.length === 0 ? (
          <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>No hay pedidos en preparación actualmente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingOrders.map(order => (
              <div key={order.id} className="border border-orange-200 bg-orange-50/30 rounded-xl p-4 flex flex-col h-64">
                <div className="flex justify-between items-start mb-3 border-b border-orange-100 pb-3">
                  <div>
                    <span className="font-bold text-gray-900">Orden #{order.id.toUpperCase()}</span>
                    {order.customerName && (
                      <p className="font-bold text-orange-600 text-sm mt-0.5">{order.customerName}</p>
                    )}
                    {order.isPaid && (
                      <p className="inline-block mt-1 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded shadow-sm mr-1">
                        ¡PAGADO!
                      </p>
                    )}
                    {order.advanceNote && (
                      <p className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded border border-green-200 mr-1">
                        Nota: {order.advanceNote}
                      </p>
                    )}
                    {order.advanceAmount > 0 && (
                      <p className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded border border-blue-200">
                        Seña: ${order.advanceAmount}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{new Date(order.date).toLocaleTimeString("es-AR", {hour12: false})}</p>
                  </div>
                  <span className="font-bold text-blue-700">${order.total.toFixed(2)}</span>
                </div>
                <ul className="flex-1 space-y-1 mb-4 overflow-y-auto pr-1">
                  {order.items.map(item => (
                    <li key={item.id} className="text-sm text-gray-700 flex justify-between font-medium">
                      <span>{item.quantity}x {item.name}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-auto">
                  {order.isPaid ? (
                    <button onClick={() => handleDeliverOrder(order.id)} className="flex-1 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 py-2">Entregado / Retirar</button>
                  ) : (
                    <>
                      <button onClick={() => handleDiscardOrder(order.id)} className="px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">Descartar</button>
                      <button onClick={() => handleOpenPayment(order)} className="flex-1 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600">Cobrar y Registrar</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalState === "openRegister" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b p-4 flex justify-between items-center"><h3 className="font-bold text-gray-900">Abrir Caja</h3><button onClick={() => { setModalState("none"); setInitialCashInput(""); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
            <div className="p-6">
              <div className="flex flex-col items-center mb-6"><div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3"><Unlock size={32} /></div><h4 className="text-xl font-bold text-gray-900 mb-2">Apertura de Caja</h4><p className="text-gray-600 text-center">Ingresa el monto inicial en efectivo.</p></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Monto Inicial</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span><input type="text" inputMode="decimal" value={initialCashInput} onChange={(e) => { const v = e.target.value; if (isAllowedDecimalInput(v)) setInitialCashInput(v); }} className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-medium" placeholder="0.00" autoFocus /></div></div>
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
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Monto Retirado de Caja</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span><input type="text" inputMode="decimal" value={expenseAmount} onChange={(e) => { const v = e.target.value; if (isAllowedDecimalInput(v)) setExpenseAmount(v); }} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="0.00" /></div></div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3"><button onClick={() => { setModalState("none"); setExpenseDesc(""); setExpenseAmount(""); }} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancelar</button><button onClick={handleRegisterExpense} className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-medium hover:bg-orange-600">Registrar Gasto</button></div>
          </div>
        </div>
      )}

      {modalState === "closeRegister" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Confirmar Cierre de Caja</h3>
              <button onClick={() => setModalState("none")} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6">
              {pendingOrders.length > 0 && (
                <div className="mb-5 bg-red-50 border border-red-300 rounded-xl p-4 flex gap-3 items-start">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-bold text-red-700 text-sm">No se puede cerrar la caja</p>
                    <p className="text-red-600 text-sm mt-1">
                      Hay <strong>{pendingOrders.length} pedido{pendingOrders.length > 1 ? "s" : ""} en preparación</strong> sin resolver.
                      Entregá o descartá todos los pedidos antes de cerrar la caja.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex flex-col items-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${pendingOrders.length > 0 ? "bg-gray-100 text-gray-400" : "bg-red-100 text-red-600"}`}>
                  <Lock size={32} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">¿Cerrar la caja?</h4>
                <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Monto inicial:</span><span className="font-medium">${registerState?.initialCash || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Ventas:</span><span className="font-medium">{sales.length}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Ingresos:</span><span className="font-medium text-green-600">${totalSalesToday}</span></div>
                  <div className="flex justify-between text-sm border-b border-blue-200 pb-2"><span className="text-gray-600">Gastos:</span><span className="font-medium text-red-600">-${totalExpensesToday}</span></div>
                  <div className="flex justify-between font-bold text-sm"><span>Total en Caja:</span><span className="text-blue-700">${(registerState?.initialCash || 0) + totalSalesToday - totalExpensesToday}</span></div>
                </div>
                {pendingOrders.length === 0 && (
                  <p className="text-red-600 font-medium text-sm mt-4">⚠️ Esta acción no se puede deshacer</p>
                )}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button onClick={() => setModalState("none")} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">
                {pendingOrders.length > 0 ? "Volver" : "Cancelar"}
              </button>
              <button
                onClick={handleCloseRegister}
                disabled={pendingOrders.length > 0}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                  pendingOrders.length > 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                Cerrar Caja
              </button>
            </div>
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

      {modalState === "payment" && payingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 border-b p-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-gray-900">Cobrar y Registrar Venta</h3>
              <button onClick={() => { setModalState("none"); setPayingOrder(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              {(payingOrder.advanceNote || payingOrder.advanceAmount > 0) && (
                <div className="mb-4 bg-green-50 p-3 rounded-xl border border-green-200 flex flex-col gap-1">
                  {payingOrder.advanceNote && (
                    <div className="flex items-center gap-2">
                      <Tag className="text-green-600 w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-bold text-green-800">Nota: <span className="font-medium text-green-700">{payingOrder.advanceNote}</span></p>
                    </div>
                  )}
                  {payingOrder.advanceAmount > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="text-green-600 w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-bold text-green-800">Seña / Adelanto: <span className="font-medium text-green-700">${payingOrder.advanceAmount.toFixed(2)}</span></p>
                    </div>
                  )}
                </div>
              )}
              <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 font-medium">Subtotal del Pedido</span>
                  <span className="text-lg font-bold text-gray-900">${payingOrder.total.toFixed(2)}</span>
                </div>
                {payingOrder.advanceAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600 mb-2">
                    <span>Adelanto / Seña</span>
                    <span className="font-bold">-${payingOrder.advanceAmount.toFixed(2)}</span>
                  </div>
                )}
                {surchargeAmount > 0 && (
                  <div className="flex justify-between items-center text-orange-600 mb-2">
                    <span>Recargo ({surchargePercent}%)</span>
                    <span className="font-bold">${surchargeAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                  <span className="text-gray-900 font-bold">Total a Cobrar</span>
                  <span className="text-2xl font-black text-blue-700">${amountDue.toFixed(2)}</span>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Formas de Pago</label>
                  {(() => {
                    const usedMethods = payments.map((p) => p.method);
                    const nextMethod = availablePayments.find((p) => !usedMethods.includes(p.name));
                    return nextMethod ? (
                      <button onClick={() => setPayments([...payments, { method: nextMethod.name, amount: 0 }])} className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Agregar
                      </button>
                    ) : null;
                  })()}
                </div>
                <div className="space-y-2">
                  {payments.map((payment, index) => {
                    const otherMethods = payments.filter((_, i) => i !== index).map((p) => p.method);
                    const options = availablePayments.filter((p) => !otherMethods.includes(p.name));
                    return (
                    <div key={index} className="flex gap-2 items-center">
                      <select value={payment.method} onChange={(e) => updatePayment(index, "method", e.target.value)} className="flex-1 border-gray-300 rounded-lg py-2 px-3 border bg-white text-sm">
                        {options.map((p) => <option key={p.id} value={p.name}>{p.name} {p.surcharge > 0 ? `(+${p.surcharge}%)` : ""}</option>)}
                      </select>
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                        <input type="text" inputMode="decimal" value={payment.amount || ""} onChange={(e) => { const v = e.target.value; if (isAllowedDecimalInput(v)) updatePayment(index, "amount", v === "" ? 0 : v); }} className="w-full pl-5 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                      </div>
                      {payments.length > 1 && (
                        <button
                          onClick={() => setPayments(removePaymentLine(
                            payments,
                            index,
                            payingOrder.total,
                            advanceAmount,
                            availablePayments
                          ))}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Total ingresado:</span><span className="font-medium text-gray-900">${totalPaid.toFixed(2)}</span></div>
                  {remaining > 0 && <div className="flex justify-between text-sm"><span className="text-red-600">Falta cobrar:</span><span className="font-bold text-red-600">${remaining.toFixed(2)}</span></div>}
                  {remaining < 0 && <div className="flex justify-between text-sm"><span className="text-green-600">Cambio a devolver:</span><span className="font-bold text-green-600">${Math.abs(remaining).toFixed(2)}</span></div>}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3 shrink-0">
              <button onClick={() => { setModalState("none"); setPayingOrder(null); }} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleRegisterSale} disabled={totalPaid < amountDue} className={`flex-1 py-2.5 rounded-lg font-bold text-white transition-colors ${totalPaid < amountDue ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 shadow-sm"}`}>Confirmar Venta</button>
            </div>
          </div>
        </div>
      )}

      {migaOptionModal && pendingMigaProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 border-b p-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-gray-900">Variante del Sándwich</h3>
              <button onClick={() => { setMigaOptionModal(false); setPendingMigaProduct(null); setSelectedVariant(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-center text-gray-600 mb-4">¿Con qué acompañamiento se preparará <strong>{pendingMigaProduct.name}</strong>?</p>

              {/* Selección de huevo */}
              <div className="mb-6 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                <h4 className="text-sm font-bold text-gray-800 mb-3 text-center">Agregado de Huevo</h4>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setEggCount(num)}
                      className={`py-2 px-1 font-bold rounded-lg border text-sm transition-colors ${
                        eggCount === num
                          ? "bg-orange-500 text-white border-orange-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {num === 0 ? "Nada" : `${num} Huevo${num > 1 ? "s" : ""}`}
                    </button>
                  ))}
                </div>
                {eggCount > 0 && inputs.some((i) => i.name.toLowerCase().includes("huevo")) && (
                  <p className="text-xs text-orange-600 mt-2 font-medium text-center">
                    + ${(inputs.find((i) => i.name.toLowerCase().includes("huevo"))?.price * eggCount).toFixed(2)} al total de esta variedad
                  </p>
                )}
                {eggCount > 0 && !inputs.some((i) => i.name.toLowerCase().includes("huevo")) && (
                  <p className="text-xs text-red-500 mt-2 font-medium text-center">
                    ⚠️ Insumo "Huevo" no encontrado en Configuración. El precio será $0.
                  </p>
                )}
              </div>

              {/* Botones de variante — solo seleccionan, no confirman */}
              {(() => {
                const nameLower = pendingMigaProduct.name.toLowerCase();
                const isJamonSalame = (nameLower.includes("jamón") || nameLower.includes("jamon")) && nameLower.includes("salame");
                const isBondiolaCrudo = nameLower.includes("bondiola") && nameLower.includes("crudo");

                if (isJamonSalame) {
                  return (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">De Jamón</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {["Jamón y Queso", "Jamón y Verdura"].map((opt) => (
                            <button key={opt} onClick={() => { setSelectedVariant(opt); setCustomNote(""); }}
                              className={`py-2 px-3 font-medium rounded-lg border text-sm transition-colors ${
                                selectedVariant === opt
                                  ? opt.includes("Queso") ? "bg-yellow-400 text-yellow-900 border-yellow-500 shadow-sm" : "bg-green-500 text-white border-green-600 shadow-sm"
                                  : opt.includes("Queso") ? "bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100" : "bg-green-50 text-green-800 border-green-200 hover:bg-green-100"
                              }`}>
                              {opt.includes("Queso") ? "Con Queso" : "Con Verdura"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">De Salame</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {["Salame y Queso", "Salame y Verdura"].map((opt) => (
                            <button key={opt} onClick={() => { setSelectedVariant(opt); setCustomNote(""); }}
                              className={`py-2 px-3 font-medium rounded-lg border text-sm transition-colors ${
                                selectedVariant === opt
                                  ? opt.includes("Queso") ? "bg-yellow-400 text-yellow-900 border-yellow-500 shadow-sm" : "bg-green-500 text-white border-green-600 shadow-sm"
                                  : opt.includes("Queso") ? "bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100" : "bg-green-50 text-green-800 border-green-200 hover:bg-green-100"
                              }`}>
                              {opt.includes("Queso") ? "Con Queso" : "Con Verdura"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                } else if (isBondiolaCrudo) {
                  return (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">De Bondiola</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {["Bondiola y Queso", "Bondiola y Verdura"].map((opt) => (
                            <button key={opt} onClick={() => { setSelectedVariant(opt); setCustomNote(""); }}
                              className={`py-2 px-3 font-medium rounded-lg border text-sm transition-colors ${
                                selectedVariant === opt
                                  ? opt.includes("Queso") ? "bg-yellow-400 text-yellow-900 border-yellow-500 shadow-sm" : "bg-green-500 text-white border-green-600 shadow-sm"
                                  : opt.includes("Queso") ? "bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100" : "bg-green-50 text-green-800 border-green-200 hover:bg-green-100"
                              }`}>
                              {opt.includes("Queso") ? "Con Queso" : "Con Verdura"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">De Crudo</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {["Crudo y Queso", "Crudo y Verdura"].map((opt) => (
                            <button key={opt} onClick={() => { setSelectedVariant(opt); setCustomNote(""); }}
                              className={`py-2 px-3 font-medium rounded-lg border text-sm transition-colors ${
                                selectedVariant === opt
                                  ? opt.includes("Queso") ? "bg-yellow-400 text-yellow-900 border-yellow-500 shadow-sm" : "bg-green-500 text-white border-green-600 shadow-sm"
                                  : opt.includes("Queso") ? "bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100" : "bg-green-50 text-green-800 border-green-200 hover:bg-green-100"
                              }`}>
                              {opt.includes("Queso") ? "Con Queso" : "Con Verdura"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { opt: "Con Queso", label: "Con Queso", base: "yellow" },
                        { opt: "Con Verdura", label: "Con Verdura", base: "green" },
                        { opt: "Surtido / Mixto", label: "Surtido (Mitad y Mitad)", base: "orange", full: true },
                      ].map(({ opt, label, base, full }) => (
                        <button
                          key={opt}
                          onClick={() => { setSelectedVariant(opt); setCustomNote(""); }}
                          className={`py-3 px-4 font-bold rounded-xl border transition-colors ${full ? "col-span-2" : ""} ${
                            selectedVariant === opt
                              ? base === "yellow" ? "bg-yellow-400 text-yellow-900 border-yellow-500 shadow-sm"
                                : base === "green" ? "bg-green-500 text-white border-green-600 shadow-sm"
                                : "bg-orange-500 text-white border-orange-600 shadow-sm"
                              : base === "yellow" ? "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
                                : base === "green" ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                                : "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  );
                }
              })()}

              {/* Nota especial */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">Combinación Especial / Notas</label>
                <input
                  type="text"
                  placeholder="Ej: 9 de Jamón, 3 de Salame"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"
                  value={customNote}
                  onChange={(e) => { setCustomNote(e.target.value); if (e.target.value.trim()) setSelectedVariant(null); }}
                />
              </div>
            </div>

            {/* Pie con Cancelar / Confirmar */}
            <div className="p-4 border-t bg-gray-50 flex gap-3 shrink-0">
              <button
                onClick={() => { setMigaOptionModal(false); setPendingMigaProduct(null); setSelectedVariant(null); setCustomNote(""); setEggCount(0); }}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const option = customNote.trim() || selectedVariant;
                  handleConfirmMigaOption(option);
                  setSelectedVariant(null);
                }}
                disabled={!customNote.trim() && !selectedVariant}
                className={`flex-1 py-2.5 rounded-lg font-bold text-white transition-colors ${
                  !customNote.trim() && !selectedVariant
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-sm"
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {unitSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <AppWindow className="text-blue-600" size={20} /> Seleccionar Opción de Venta
              </h3>
              <button onClick={() => setUnitSaleModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-center text-lg font-semibold mb-6">¿Cómo deseas vender <span className="text-blue-600">{unitSaleModal.name}</span>?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opción por Unidad */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex flex-col items-center justify-center">
                  <h4 className="font-bold text-blue-800 text-lg mb-3">Por Unidad</h4>
                  <p className="text-3xl font-black text-blue-900 mb-4">${(unitSaleModal.unitPrice || 0).toFixed(2)}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setUnitQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 bg-blue-200 text-blue-800 rounded-full font-bold">-</button>
                    <input
                      type="number"
                      value={unitQuantity}
                      onChange={(e) => setUnitQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center font-bold text-lg bg-transparent border-b-2 border-blue-300 focus:outline-none"
                    />
                    <button onClick={() => setUnitQuantity(q => q + 1)} className="w-8 h-8 bg-blue-200 text-blue-800 rounded-full font-bold">+</button>
                  </div>
                  <button onClick={addUnitToCart} className="mt-5 w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700">
                    Agregar {unitQuantity} {unitQuantity > 1 ? 'unidades' : 'unidad'}
                  </button>
                </div>

                {/* Opciones por Presentación */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-800 text-lg mb-3 text-center">Por Presentación</h4>
                  <div className="space-y-2">
                    {unitSaleModal.presentations.map(pres => (
                      <button
                        key={pres.id}
                        onClick={() => {
                          handleVarietyClick(unitSaleModal, pres.name); // Reutiliza la lógica para abrir el modal de opciones
                          setUnitSaleModal(null);
                        }}
                        className="w-full flex justify-between items-center p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400"
                      >
                        <span className="font-medium">{pres.name}</span>
                        <span className="font-bold text-gray-800">${pres.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
