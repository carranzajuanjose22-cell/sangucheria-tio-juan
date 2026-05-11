import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { Plus, Minus, Search, Trash2, Receipt, ShoppingCart, Printer, X, Lock, CheckCircle2, ChevronRight, Tag, Unlock, TrendingDown } from "lucide-react";

// Mock products
const mockProducts = [
  { id: "1", name: "Sánguche de Paleta", price: 3500 },
  { id: "2", name: "Sánguche de Jamón Crudo", price: 5000 },
  { id: "3", name: "Sánguche de Salame", price: 4200 },
  { id: "4", name: "Café con Leche", price: 1800 },
  { id: "5", name: "Jugo de Naranja", price: 2000 },
  { id: "6", name: "Porción de Torta", price: 3200 },
];

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type PaymentMethod = "Efectivo" | "Débito" | "Transferencia" | "QR";

type Payment = {
  method: PaymentMethod;
  amount: number;
};

export type SaleRecord = {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod | string; // Keep for backward compatibility
  payments?: Payment[]; // New field for multiple payments
  employee: string;
  registerNumber: string;
};

type Expense = {
  id: string;
  date: string;
  description: string;
  amount: number;
  employee: string;
};

type RegisterState = {
  isOpen: boolean;
  initialCash: number;
  openedAt: string;
  openedBy: string;
};

export function EmployeePos() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const userName = isAdmin ? "Admin" : "Empleado #1";

  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([{ method: "Efectivo", amount: 0 }]);
  const [modalState, setModalState] = useState<"none" | "success" | "ticket" | "openRegister" | "closeRegister" | "closeSuccess" | "expense">("none");
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null);
  const [registerState, setRegisterState] = useState<RegisterState | null>(null);
  const [initialCashInput, setInitialCashInput] = useState("");
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  useEffect(() => {
    // Load register state
    const loadRegisterState = () => {
      const saved = localStorage.getItem("register_state");
      if (saved) {
        setRegisterState(JSON.parse(saved));
      } else {
        setRegisterState(null);
      }
    };

    loadRegisterState();

    // Refresh every 2 seconds to sync with admin changes
    const interval = setInterval(loadRegisterState, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadSales = () => {
      const saved = localStorage.getItem("pos_sales");
      if (saved) {
        setSales(JSON.parse(saved));
      } else {
        setSales([]);
      }
    };

    loadSales();

    const interval = setInterval(loadSales, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadExpenses = () => {
      const saved = localStorage.getItem("pos_expenses");
      if (saved) {
        setExpenses(JSON.parse(saved));
      } else {
        setExpenses([]);
      }
    };

    loadExpenses();

    const interval = setInterval(loadExpenses, 2000);
    return () => clearInterval(interval);
  }, []);

  // Generate current date for display
  const currentDate = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isRegisterClosed = !registerState?.isOpen;
  const totalSalesToday = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalExpensesToday = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const filteredProducts = mockProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: { id: string; name: string; price: number }) => {
    setCart(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(current => {
      return current.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty > 0 ? newQty : 0 };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const setQuantity = (id: string, quantity: number) => {
    setCart(current => {
      return current.map(item => {
        if (item.id === id) {
          return { ...item, quantity: quantity > 0 ? quantity : 1 };
        }
        return item;
      });
    });
  };

  const removeFromCart = (id: string) => {
    setCart(current => current.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;

  const addPaymentMethod = () => {
    setPayments([...payments, { method: "Efectivo", amount: 0 }]);
  };

  const removePaymentMethod = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const updatePayment = (index: number, field: keyof Payment, value: any) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setPayments(newPayments);
  };

  const handleRegisterSale = () => {
    if (cart.length === 0 || isRegisterClosed) return;
    if (totalPaid < total) {
      alert(`Falta pagar $${remaining.toFixed(2)}`);
      return;
    }

    // Generate payment method string for backward compatibility
    const paymentMethodStr = payments.length === 1
      ? payments[0].method
      : payments.map(p => `${p.method} ($${p.amount})`).join(" + ");

    const newSale: SaleRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      items: [...cart],
      total,
      paymentMethod: paymentMethodStr,
      payments: [...payments],
      employee: userName,
      registerNumber: "Caja 01",
    };

    // Save sale to local storage
    const existingSales = JSON.parse(localStorage.getItem("pos_sales") || "[]");
    const updatedSales = [...existingSales, newSale];
    localStorage.setItem("pos_sales", JSON.stringify(updatedSales));
    setSales(updatedSales);

    setLastSale(newSale);
    setModalState("success");
    setCart([]);
    setPayments([{ method: "Efectivo", amount: 0 }]);
  };

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
      openedBy: userName,
    };

    localStorage.setItem("register_state", JSON.stringify(newRegisterState));
    setRegisterState(newRegisterState);
    setInitialCashInput("");
    setModalState("none");
  };

  const handleRegisterExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (!expenseDesc.trim() || isNaN(amount) || amount <= 0) {
      alert("Por favor ingresa una descripción y un monto válido");
      return;
    }
    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      description: expenseDesc.trim(),
      amount,
      employee: userName,
    };
    const existingExpenses = JSON.parse(localStorage.getItem("pos_expenses") || "[]");
    const updatedExpenses = [...existingExpenses, newExpense];
    localStorage.setItem("pos_expenses", JSON.stringify(updatedExpenses));
    setExpenses(updatedExpenses);
    setExpenseDesc("");
    setExpenseAmount("");
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
      totalIncome: existingSales.reduce((acc: number, sale: SaleRecord) => acc + sale.total, 0),
      totalExpenses: existingExpenses.reduce((acc: number, exp: Expense) => acc + exp.amount, 0),
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

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col gap-4">
      
      {/* Top Header Row for Register Info */}
      <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 capitalize">{currentDate}</h1>
          <p className={`text-sm ${isRegisterClosed ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            Caja {isRegisterClosed ? 'Cerrada' : 'Abierta'}: #01 • {userName}
          </p>
          {registerState?.isOpen && (
            <p className="text-xs text-gray-400 mt-1">
              Monto inicial: ${registerState.initialCash}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isRegisterClosed ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
            <span className={`text-sm font-medium ${isRegisterClosed ? 'text-red-700' : 'text-green-700'}`}>
              {isRegisterClosed ? 'Caja Cerrada' : 'Operando'}
            </span>
          </div>
          {registerState?.isOpen && (
            <button
              onClick={() => setModalState("expense")}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <TrendingDown size={14} />
              Compras / Gastos
            </button>
          )}
          {registerState?.isOpen ? (
            <button
              onClick={() => setModalState("closeRegister")}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              <Lock size={14} />
              Cerrar Caja
            </button>
          ) : (
            <button
              onClick={() => setModalState("openRegister")}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <Unlock size={14} />
              Abrir Caja
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Product List Section */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar producto..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isRegisterClosed}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => !isRegisterClosed && addToCart(product)}
                  disabled={isRegisterClosed}
                  className="flex flex-col text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none"
                >
                  <span className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                    {product.name}
                  </span>
                  <span className="mt-2 text-blue-600 font-bold">
                    ${product.price}
                  </span>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500">
                  No se encontraron productos.
                </div>
              )}
            </div>
          </div>

          {/* Overlay when register is closed */}
          {isRegisterClosed && (
            <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px] flex items-center justify-center z-10">
              <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-gray-900 font-bold text-lg">Caja Cerrada</p>
                <p className="text-gray-500 text-sm text-center">No se pueden registrar ventas</p>
              </div>
            </div>
          )}
        </div>

        {/* Cart / Register Section */}
        <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden shrink-0 relative">
          <div className="p-4 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-gray-500" />
              Venta Actual
            </h2>
            <span className="text-sm font-medium px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <ShoppingCart className="w-12 h-12 mb-4 text-gray-300" />
                <p>Agrega productos a la cuenta</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 p-3 border border-gray-100 bg-gray-50/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-gray-900 line-clamp-1">{item.name}</span>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">${item.price}</span>
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-2 py-1 hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => setQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-12 text-center font-medium text-sm border-0 focus:ring-0 focus:outline-none"
                        />
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-2 py-1 hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 font-medium">Total a cobrar</span>
              <span className="text-2xl font-bold text-gray-900">${total}</span>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Formas de Pago</label>
                <button
                  onClick={addPaymentMethod}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  disabled={isRegisterClosed}
                >
                  <Plus className="w-3 h-3" />
                  Agregar
                </button>
              </div>

              <div className="space-y-2">
                {payments.map((payment, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select
                      value={payment.method}
                      onChange={(e) => updatePayment(index, "method", e.target.value as PaymentMethod)}
                      className="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border bg-white text-sm"
                      disabled={isRegisterClosed}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Débito">Débito</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="QR">QR</option>
                    </select>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={payment.amount || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            updatePayment(index, "amount", value === '' ? 0 : parseFloat(value));
                          }
                        }}
                        className="w-full pl-5 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="0.00"
                        disabled={isRegisterClosed}
                      />
                    </div>
                    {payments.length > 1 && (
                      <button
                        onClick={() => removePaymentMethod(index)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        disabled={isRegisterClosed}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Payment summary */}
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total pagado:</span>
                  <span className="font-medium text-gray-900">${totalPaid.toFixed(2)}</span>
                </div>
                {remaining > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Falta:</span>
                    <span className="font-bold text-red-600">${remaining.toFixed(2)}</span>
                  </div>
                )}
                {remaining < 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Cambio:</span>
                    <span className="font-bold text-green-600">${Math.abs(remaining).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleRegisterSale}
              disabled={cart.length === 0 || isRegisterClosed || totalPaid < total}
              className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-colors ${
                cart.length === 0 || isRegisterClosed || totalPaid < total
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-sm"
              }`}
            >
              Registrar Venta
            </button>
          </div>

          {/* Overlay when register is closed */}
          {isRegisterClosed && (
            <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px] flex items-center justify-center z-10">
              <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-gray-900 font-bold text-lg">Caja Cerrada</p>
                <p className="text-gray-500 text-sm text-center">No se pueden registrar ventas</p>
              </div>
            </div>
          )}
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

      {/* EXPENSE MODAL */}
      {modalState === "expense" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Registrar Compra / Gasto</h3>
              <button
                onClick={() => {
                  setModalState("none");
                  setExpenseDesc("");
                  setExpenseAmount("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (Ej. Insumos, Limpieza)
                </label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Descripción del gasto"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Retirado de Caja
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={expenseAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setExpenseAmount(value);
                      }
                    }}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setModalState("none");
                  setExpenseDesc("");
                  setExpenseAmount("");
                }}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterExpense}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Registrar Gasto
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
                  <div className="flex justify-between text-sm border-b border-blue-200 pb-2 mb-2">
                    <span className="text-gray-600">Gastos y Compras:</span>
                    <span className="font-medium text-red-600">-${totalExpensesToday}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm">
                    <span className="text-gray-900">Total en Caja (Esperado):</span>
                    <span className="text-blue-700">${(registerState?.initialCash || 0) + totalSalesToday - totalExpensesToday}</span>
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

      {/* SUCCESS & TICKET MODALS */}
      {(modalState === "success" || modalState === "ticket") && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">
                {modalState === "success" ? "Detalle de Venta Registrada" : "Vista Previa del Ticket"}
              </h3>
              <button 
                onClick={() => setModalState("none")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body: Success Details vs Ticket Preview */}
            {modalState === "success" ? (
              <div className="p-6">
                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">¡Venta Exitosa!</h4>
                  <p className="text-gray-500">El pago ha sido procesado correctamente.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-2"><Receipt size={16} /> Ticket</span>
                      <span className="font-medium uppercase text-blue-600">#{lastSale.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Monto Total</span>
                      <span className="font-bold text-gray-900">${lastSale.total}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <span className="text-gray-500 text-sm block mb-2">Forma(s) de Pago</span>
                      {lastSale.payments && lastSale.payments.length > 0 ? (
                        <div className="space-y-1">
                          {lastSale.payments.map((payment, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700">{payment.method}</span>
                              <span className="font-medium text-gray-900">${payment.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">{lastSale.paymentMethod}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Tag size={16} className="text-gray-400" />
                      Productos Incluidos
                    </h5>
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-32 overflow-y-auto">
                      {lastSale.items.map(item => (
                        <div key={item.id} className="p-3 flex justify-between items-center text-sm hover:bg-gray-50">
                          <span className="text-gray-700">{item.quantity}x {item.name}</span>
                          <span className="font-medium">${item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Ticket Preview Content */
              <div className="p-6 bg-white font-mono text-sm max-h-[60vh] overflow-y-auto">
                <div className="text-center mb-6">
                  <h4 className="font-bold text-lg mb-1">LOCAL DE SÁNGUCHES</h4>
                  <p className="text-gray-500 text-xs">Ticket de Venta Original</p>
                  <p className="text-gray-500 text-xs mt-2">
                    {new Date(lastSale.date).toLocaleDateString("es-AR")} - {new Date(lastSale.date).toLocaleTimeString("es-AR", { hour12: false })}
                  </p>
                </div>

                <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Caja:</span>
                    <span className="font-medium">{lastSale.registerNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Atendido por:</span>
                    <span className="font-medium">{lastSale.employee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ticket #:</span>
                    <span className="font-medium uppercase">{lastSale.id}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="font-bold border-b border-gray-200 pb-2 flex justify-between">
                    <span>Cant. Desc</span>
                    <span>Importe</span>
                  </div>
                  {lastSale.items.map(item => (
                    <div key={item.id} className="flex justify-between text-gray-700">
                      <div>
                        {item.quantity}x {item.name}
                      </div>
                      <span>${item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-900 pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>TOTAL</span>
                    <span>${lastSale.total}</span>
                  </div>
                  <div className="mt-3 text-xs border-t border-gray-300 pt-2">
                    <span className="text-gray-500 block mb-1">Medio(s) de Pago:</span>
                    {lastSale.payments && lastSale.payments.length > 0 ? (
                      <div className="space-y-1">
                        {lastSale.payments.map((payment, idx) => (
                          <div key={idx} className="flex justify-between text-gray-700">
                            <span className="uppercase">{payment.method}</span>
                            <span>${payment.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-between text-gray-500">
                        <span className="uppercase">{lastSale.paymentMethod}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              {modalState === "success" ? (
                <>
                  <button
                    onClick={() => setModalState("none")}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cerrar y Continuar
                  </button>
                  <button
                    onClick={() => setModalState("ticket")}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Ver Ticket
                    <ChevronRight size={18} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      alert("Imprimiendo ticket...");
                      setModalState("none");
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    <Printer size={18} />
                    Imprimir
                  </button>
                  <button
                    onClick={() => setModalState("success")}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Volver al Detalle
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
