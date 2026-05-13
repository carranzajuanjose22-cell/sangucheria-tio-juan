import { useState, useEffect } from "react";
import { DollarSign, Package, Users, CreditCard, Wallet, TrendingUp, TrendingDown, ArrowRight, ShoppingCart, X, Trash2, Calendar } from "lucide-react";

type SaleItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type Payment = {
  method: string;
  amount: number;
};

type SaleRecord = {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  paymentMethod: string;
  payments?: Payment[];
  employee: string;
  registerNumber: string;
};

type RegisterCloseRecord = {
  id: string;
  date: string;
  totalSalesCount: number;
  totalIncome: number;
  employee: string;
  registerNumber: string;
  sales?: SaleRecord[];
  initialCash?: number;
  openedAt?: string;
};

type PurchaseRecord = {
  id: string;
  date: string;
  description: string;
  amount: number;
};

export function Statistics() {
  const [registers, setRegisters] = useState<RegisterCloseRecord[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("week");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purchaseDesc, setPurchaseDesc] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [catalog, setCatalog] = useState<any>(null);
  const [inputs, setInputs] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("pos_registers");
    if (saved) {
      setRegisters(JSON.parse(saved));
    }

    const savedServices = localStorage.getItem("pos_services");
    if (savedServices) {
      setServices(JSON.parse(savedServices));
    }

    const savedPurchases = localStorage.getItem("pos_purchases");
    if (savedPurchases) {
      setPurchases(JSON.parse(savedPurchases));
    }

    const savedCatalog = localStorage.getItem("pos_miga_product");
    if (savedCatalog) setCatalog(JSON.parse(savedCatalog));
    
    const savedInputs = localStorage.getItem("pos_inputs");
    if (savedInputs) setInputs(JSON.parse(savedInputs));
  }, []);

  // Filter by date range for registers
  const getFilteredRegisters = () => {
    const now = new Date();
    const cutoffDate = new Date();

    if (dateRange === "week") {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (dateRange === "month") {
      cutoffDate.setDate(now.getDate() - 30);
    } else {
      return registers;
    }

    return registers.filter(r => new Date(r.date) >= cutoffDate);
  };

  const filteredRegisters = getFilteredRegisters();
  const filteredSales = filteredRegisters.flatMap(r => r.sales || []);

  // Filter by date range for purchases
  const getFilteredPurchases = () => {
    const now = new Date();
    const cutoffDate = new Date();
    if (dateRange === "week") cutoffDate.setDate(now.getDate() - 7);
    else if (dateRange === "month") cutoffDate.setDate(now.getDate() - 30);
    else return purchases;
    return purchases.filter(p => new Date(p.date) >= cutoffDate);
  };
  const filteredPurchases = getFilteredPurchases();
  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.amount, 0);

  // Total revenue
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

  // Gastos Variables (Retirados de Caja)
  const totalVariableExpenses = filteredRegisters.reduce((sum, r) => sum + (r.totalExpenses || 0), 0);

  // Gastos Fijos (Servicios - Prorrateados según los días seleccionados)
  const monthlyFixedExpenses = services.reduce((sum, s) => sum + (s.cost || 0), 0);
  let daysToCalculate = 30;
  if (dateRange === "week") {
    daysToCalculate = 7;
  } else if (dateRange === "all") {
    const uniqueDays = new Set(registers.map(r => new Date(r.date).toLocaleDateString("es-AR"))).size;
    daysToCalculate = uniqueDays === 0 ? 1 : uniqueDays;
  }
  const totalFixedExpenses = (monthlyFixedExpenses / 30) * daysToCalculate;

  const netBalance = totalRevenue - totalVariableExpenses - totalFixedExpenses - totalPurchases;

  // Products sold
  const productsSold = filteredSales.reduce((sum, sale) =>
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  // Efectivo vs Virtual
  let totalEfectivo = 0;
  let totalVirtual = 0;

  filteredSales.forEach(sale => {
    if (sale.payments && sale.payments.length > 0) {
      sale.payments.forEach(payment => {
        if (payment.method.toLowerCase() === "efectivo") {
          totalEfectivo += payment.amount;
        } else {
          totalVirtual += payment.amount;
        }
      });
    } else {
      if (sale.paymentMethod.toLowerCase() === "efectivo") {
        totalEfectivo += sale.total;
      } else {
        totalVirtual += sale.total;
      }
    }
  });

  // Calcular consumo de Pan de Miga y Tachos de Mayonesa
  let totalPanDeMigaConsumed = 0;
  const panDeMigaInput = inputs.find(i => i.name.toLowerCase().includes("miga") && i.name.toLowerCase().includes("pan"));

  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      let itemMatched = false;
      if (catalog && panDeMigaInput) {
        const baseId = item.id.split('-')[0];
        catalog.varieties.forEach((v: any) => {
          const pres = v.presentations.find((p: any) => p.id === baseId);
          if (pres) {
            const recipeItem = pres.recipe.find((r: any) => r.insumoId === panDeMigaInput.id);
            if (recipeItem) {
              totalPanDeMigaConsumed += recipeItem.quantity * item.quantity;
              itemMatched = true;
            }
          }
        });
      }
      
      if (!itemMatched) {
        const nameLow = item.name.toLowerCase();
        if (nameLow.includes("docena") && !nameLow.includes("media")) {
          totalPanDeMigaConsumed += 12 * item.quantity;
        } else if (nameLow.includes("media docena")) {
          totalPanDeMigaConsumed += 6 * item.quantity;
        } else if (nameLow.includes("plancha")) {
          totalPanDeMigaConsumed += 3 * item.quantity;
        }
      }
    });
  });

  const tachosMayonesa = Math.floor(totalPanDeMigaConsumed / 18);

  // All products breakdown
  const productStats: Record<string, { quantity: number; revenue: number }> = {};
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productStats[item.name]) {
        productStats[item.name] = { quantity: 0, revenue: 0 };
      }
      productStats[item.name].quantity += item.quantity;
      productStats[item.name].revenue += item.price * item.quantity;
    });
  });

  const allProducts = Object.entries(productStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);

  // Employee Hours
  const employeeHoursStats: Record<string, { hours: number; shifts: number }> = {};
  filteredRegisters.forEach(record => {
    if (record.openedAt && record.date) {
      const start = new Date(record.openedAt).getTime();
      const end = new Date(record.date).getTime();
      const diffHours = (end - start) / (1000 * 60 * 60);
      
      if (!employeeHoursStats[record.employee]) {
        employeeHoursStats[record.employee] = { hours: 0, shifts: 0 };
      }
      employeeHoursStats[record.employee].hours += diffHours;
      employeeHoursStats[record.employee].shifts += 1;
    }
  });

  const employeeHoursArray = Object.entries(employeeHoursStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.hours - a.hours);

  const handleRegisterPurchase = () => {
    const amount = parseFloat(purchaseAmount);
    if (!purchaseDesc.trim() || isNaN(amount) || amount <= 0) {
      alert("Por favor ingresa una etiqueta y un monto válido");
      return;
    }
    const newPurchase: PurchaseRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      description: purchaseDesc.trim(),
      amount,
    };
    const updatedPurchases = [...purchases, newPurchase];
    localStorage.setItem("pos_purchases", JSON.stringify(updatedPurchases));
    setPurchases(updatedPurchases);
    setPurchaseDesc("");
    setPurchaseAmount("");
    setIsModalOpen(false);
  };

  const handleDeletePurchase = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este registro de compra?")) {
      const updatedPurchases = purchases.filter(p => p.id !== id);
      localStorage.setItem("pos_purchases", JSON.stringify(updatedPurchases));
      setPurchases(updatedPurchases);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-gray-500">Análisis de ventas y rendimiento</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange("week")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === "week"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Última Semana
          </button>
          <button
            onClick={() => setDateRange("month")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === "month"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Último Mes
          </button>
          <button
            onClick={() => setDateRange("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Todo
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Efectivo</p>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">${totalEfectivo.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Virtual (Transf/QR/Débito)</p>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">${totalVirtual.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Productos Vendidos</p>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{productsSold}</p>
        </div>

        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-yellow-800">Mayonesa (Tachos)</p>
            <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-yellow-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-yellow-900">{tachosMayonesa}</p>
          <p className="text-xs text-yellow-700 mt-2">Cada 18 u. de pan de miga</p>
        </div>
      </div>

      {/* Balance General Panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-gray-500" />
            Balance General
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
            >
              <ShoppingCart size={16} />
              Ingresar Compra
            </button>
            <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">
              {dateRange === 'week' ? 'Período: Últimos 7 días' : dateRange === 'month' ? 'Período: Últimos 30 días' : `Período: Histórico (${daysToCalculate} días)`}
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            
            <div className="flex-1 w-full space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50/50 rounded-xl border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <span className="font-medium text-green-900">Ingresos (Ventas)</span>
                </div>
                <span className="font-bold text-green-700 text-lg">${totalRevenue.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-red-50/50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <TrendingDown size={20} />
                  </div>
                  <span className="font-medium text-red-900">Gastos Operativos (Caja)</span>
                </div>
                <span className="font-bold text-red-700 text-lg">-${totalVariableExpenses.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-yellow-50/50 rounded-xl border border-yellow-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                    <ShoppingCart size={20} />
                  </div>
                  <span className="font-medium text-yellow-900">Compras de Insumos</span>
                </div>
                <span className="font-bold text-yellow-700 text-lg">-${totalPurchases.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                    <TrendingDown size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-orange-900">Gastos Fijos (Servicios)</span>
                    <span className="text-xs text-orange-700/80">Prorrateado a {daysToCalculate} días</span>
                  </div>
                </div>
                <span className="font-bold text-orange-700 text-lg">-${totalFixedExpenses.toFixed(2)}</span>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center px-4">
              <ArrowRight className="text-gray-300 w-8 h-8" />
            </div>

            <div className={`flex-1 w-full p-8 rounded-2xl border flex flex-col items-center justify-center text-center ${
              netBalance >= 0 ? 'bg-blue-50/50 border-blue-200' : 'bg-red-50/50 border-red-200'
            }`}>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Ganancia Neta Estimada</p>
              <p className={`text-5xl font-black ${netBalance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                ${netBalance.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-4 max-w-[250px]">
                Balance final considerando ingresos, insumos y servicios de este período.
              </p>
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos Vendidos (Desglose) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-500" />
              Desglose de Productos
            </h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-[400px]">
            {allProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-4">
                {allProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.quantity} unidades</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">${product.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hours Worked by Employee */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              Horas Trabajadas por Cajero
            </h3>
          </div>
          <div className="p-6">
            {employeeHoursArray.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-4">
                {employeeHoursArray.map((emp) => {
                  const maxHours = Math.max(...employeeHoursArray.map(e => e.hours));
                  const percentage = maxHours > 0 ? (emp.hours / maxHours) * 100 : 0;
                  
                  const formatHours = (h: number) => {
                    const hours = Math.floor(h);
                    const minutes = Math.round((h - hours) * 60).toString().padStart(2, '0');
                    return `${hours}h ${minutes}m`;
                  };

                  return (
                    <div key={emp.name}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{emp.name}</p>
                          <p className="text-sm text-gray-500">{emp.shifts} turno{emp.shifts !== 1 ? 's' : ''}</p>
                        </div>
                        <p className="font-bold text-gray-900">{formatHours(emp.hours)}</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-indigo-500 h-3 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historial de Compras */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-500" />
            Detalle de Compras de Insumos
          </h3>
        </div>
        <div className="p-0 overflow-x-auto">
          {filteredPurchases.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay compras registradas en este período</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">Fecha</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">Descripción / Etiqueta</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600 text-right">Monto</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPurchases.slice().reverse().map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={14} />
                        <span className="text-sm">
                          {new Date(purchase.date).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-medium text-gray-900">{purchase.description}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="font-bold text-red-600">-${purchase.amount.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => handleDeletePurchase(purchase.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL DE COMPRAS DE INSUMOS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Registrar Compra de Insumos</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etiqueta / Descripción (Ej. Carne, Pan, Verduras)
                </label>
                <input
                  type="text"
                  value={purchaseDesc}
                  onChange={(e) => setPurchaseDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="¿Qué insumos compraste?"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto del Gasto
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={purchaseAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setPurchaseAmount(value);
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
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterPurchase}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Registrar Gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
