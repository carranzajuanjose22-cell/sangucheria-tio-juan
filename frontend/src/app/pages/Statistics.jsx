import { useState, useEffect } from "react";
import { DollarSign, Package, Users, CreditCard, Wallet, TrendingUp, TrendingDown, ArrowRight, ShoppingCart, X, Calendar } from "lucide-react";
import { nonNegative, isAllowedDecimalInput } from "../utils/numbers.js";
import { api } from "./api.js";

export function Statistics() {
  const [registers, setRegisters] = useState([]);
  const [currentSales, setCurrentSales] = useState([]);
  const [services, setServices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [dateRange, setDateRange] = useState("week");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purchaseDesc, setPurchaseDesc] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [catalog, setCatalog] = useState(null);
  const [currentExpenses, setCurrentExpenses] = useState([]);

  const loadData = async () => {
    const [savedRegs, savedPurchases, savedCatalog, savedSales, savedExpenses] = await Promise.all([
      api.get("/store/pos_registers").catch(() => []),
      api.get("/store/pos_purchases").catch(() => []),
      api.get("/catalog/MIGA").catch(() => null),
      api.get("/store/pos_sales").catch(() => []),
      api.get("/store/pos_expenses").catch(() => []),
    ]);
    setRegisters(savedRegs || []);
    setPurchases(savedPurchases || []);
    setCatalog(savedCatalog);
    setCurrentSales(savedSales || []);
    setCurrentExpenses(savedExpenses || []);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.get("/services")
      .then((data) => setServices(data))
      .catch(() => {});
  }, []);

  const todayStr = () => new Date().toLocaleDateString("es-AR");

  const getFilteredRegisters = () => {
    if (dateRange === "today") return registers.filter((r) => new Date(r.date).toLocaleDateString("es-AR") === todayStr());
    const now = new Date();
    const cutoff = new Date();
    if (dateRange === "week") cutoff.setDate(now.getDate() - 7);
    else if (dateRange === "month") cutoff.setDate(now.getDate() - 30);
    else return registers;
    return registers.filter((r) => new Date(r.date) >= cutoff);
  };

  const filteredRegisters = getFilteredRegisters();

  const getFilteredCurrentSales = () => {
    if (dateRange === "today") return currentSales.filter((s) => new Date(s.date).toLocaleDateString("es-AR") === todayStr());
    if (dateRange === "all") return currentSales;
    const now = new Date();
    const cutoff = new Date();
    if (dateRange === "week") cutoff.setDate(now.getDate() - 7);
    else cutoff.setDate(now.getDate() - 30);
    return currentSales.filter((s) => new Date(s.date) >= cutoff);
  };

  const filteredSales = [
    ...filteredRegisters.flatMap((r) => r.sales || []),
    ...getFilteredCurrentSales(),
  ];

  const getFilteredPurchases = () => {
    if (dateRange === "today") return purchases.filter((p) => new Date(p.date).toLocaleDateString("es-AR") === todayStr());
    const now = new Date();
    const cutoff = new Date();
    if (dateRange === "week") cutoff.setDate(now.getDate() - 7);
    else if (dateRange === "month") cutoff.setDate(now.getDate() - 30);
    else return purchases;
    return purchases.filter((p) => new Date(p.date) >= cutoff);
  };

  const filteredPurchases = getFilteredPurchases();
  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.amount, 0);
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const filteredCurrentExpenses = (() => {
    if (dateRange === "today") return currentExpenses.filter((e) => new Date(e.date).toLocaleDateString("es-AR") === todayStr());
    if (dateRange === "all") return currentExpenses;
    const cutoff = new Date();
    if (dateRange === "week") cutoff.setDate(cutoff.getDate() - 7);
    else cutoff.setDate(cutoff.getDate() - 30);
    return currentExpenses.filter((e) => new Date(e.date) >= cutoff);
  })();
  const totalVariableExpenses =
    filteredRegisters.reduce((sum, r) => sum + (r.totalExpenses || 0), 0) +
    filteredCurrentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyFixedExpenses = services.reduce((sum, s) => sum + (s.cost || 0), 0);
  const netBalance = totalRevenue - totalVariableExpenses - totalPurchases;
  const productsSold = filteredSales.reduce((sum, sale) => sum + sale.items.reduce((s2, item) => s2 + item.quantity, 0), 0);

  let totalEfectivo = 0, totalVirtual = 0;
  filteredSales.forEach((sale) => {
    if (sale.payments?.length > 0) {
      sale.payments.forEach((p) => { if (p.method.toLowerCase() === "efectivo") totalEfectivo += p.amount; else totalVirtual += p.amount; });
    } else {
      if (sale.paymentMethod?.toLowerCase() === "efectivo") totalEfectivo += sale.total;
      else totalVirtual += sale.total;
    }
  });

  let totalDocenas = 0;
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      let matched = false;
      if (catalog) {
        const baseId = item.id.split("-")[0];
        catalog.varieties?.forEach((v) => {
          const pres = v.presentations.find((p) => p.id === baseId);
          if (pres && pres.name.toLowerCase() === "docena") {
            totalDocenas += item.quantity;
            matched = true;
          }
        });
      }
      if (!matched) {
        const n = item.name.toLowerCase();
        if (n.includes("docena") && !n.includes("media")) totalDocenas += item.quantity;
      }
    });
  });
  const tachosMayonesa = Math.floor(totalDocenas / 3);

  const productStats = {};
  filteredSales.forEach((sale, saleIdx) => {
    sale.items.forEach((item) => {
      if (!productStats[item.name]) productStats[item.name] = { quantity: 0, revenue: 0, lastSaleIdx: saleIdx };
      productStats[item.name].quantity += item.quantity;
      productStats[item.name].revenue += item.price * item.quantity;
      productStats[item.name].lastSaleIdx = saleIdx;
    });
  });
  const allProducts = Object.entries(productStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.lastSaleIdx - a.lastSaleIdx);

  const employeeHoursStats = {};
  filteredRegisters.forEach((record) => {
    if (record.openedAt && record.date) {
      const diffHours = (new Date(record.date) - new Date(record.openedAt)) / 3600000;
      if (!employeeHoursStats[record.employee]) employeeHoursStats[record.employee] = { hours: 0, shifts: 0 };
      employeeHoursStats[record.employee].hours += diffHours;
      employeeHoursStats[record.employee].shifts += 1;
    }
  });
  const employeeHoursArray = Object.entries(employeeHoursStats).map(([name, stats]) => ({ name, ...stats })).sort((a, b) => b.hours - a.hours);

  const handleRegisterPurchase = async () => {
    const amount = nonNegative(purchaseAmount);
    if (!purchaseDesc.trim() || amount <= 0) { alert("Por favor ingresa una etiqueta y un monto válido"); return; }
    try {
      const newPurchase = { id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), description: purchaseDesc.trim(), amount };
      const updated = [...purchases, newPurchase];
      await api.post("/store/pos_purchases", updated);
      setPurchases(updated);
      setPurchaseDesc(""); setPurchaseAmount(""); setIsModalOpen(false);
    } catch (err) {
      alert("Error al registrar la compra. Revisa tu conexión.");
    }
  };

  const formatHours = (h) => `${Math.floor(h)}h ${Math.round((h - Math.floor(h)) * 60).toString().padStart(2, "0")}m`;

  const rangeButtons = [{ id: "today", label: "Hoy" }, { id: "week", label: "Última Semana" }, { id: "month", label: "Último Mes" }, { id: "all", label: "Todo" }];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-gray-500">Análisis de ventas y rendimiento</p>
        </div>
        <div className="flex gap-2">
          {rangeButtons.map(({ id, label }) => (
            <button key={id} onClick={() => setDateRange(id)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${dateRange === id ? "bg-brand-1 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: "Ingresos Totales", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, bg: "bg-green-100", color: "text-green-600" },
          { label: "Efectivo", value: `$${totalEfectivo.toFixed(2)}`, icon: DollarSign, bg: "bg-emerald-100", color: "text-emerald-600" },
          { label: "Virtual", value: `$${totalVirtual.toFixed(2)}`, icon: CreditCard, bg: "bg-brand-4", color: "text-brand-1" },
          { label: "Productos Vendidos", value: productsSold, icon: Package, bg: "bg-brand-4", color: "text-brand-1" },
          { label: "Mayonesa (Tachos)", value: tachosMayonesa, icon: Package, bg: "bg-yellow-200", color: "text-yellow-700", special: true },
        ].map(({ label, value, icon: Icon, bg, color, special }) => (
          <div key={label} className={`${special ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200"} p-6 rounded-xl border shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-medium ${special ? "text-yellow-800" : "text-gray-600"}`}>{label}</p>
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`} /></div>
            </div>
            <p className={`text-3xl font-bold ${special ? "text-yellow-900" : "text-gray-900"}`}>{value}</p>
            {special && <p className="text-xs text-yellow-700 mt-2">1 tacho cada 3 docenas vendidas</p>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Wallet className="w-5 h-5 text-gray-500" /> Balance General</h3>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-1.5 bg-brand-1 text-white rounded-lg text-sm font-medium hover:bg-brand-1-dark">
              <ShoppingCart size={16} /> Ingresar Compra
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex-1 w-full space-y-4">
              {[
                { icon: TrendingUp, label: "Ingresos (Ventas)", value: `$${totalRevenue.toFixed(2)}`, bg: "bg-green-50/50 border-green-100", iconBg: "bg-green-100 text-green-600", textColor: "text-green-700" },
                { icon: TrendingDown, label: "Gastos Operativos (Caja)", value: `-$${totalVariableExpenses.toFixed(2)}`, bg: "bg-brand-1/10 border-brand-1/20", iconBg: "bg-brand-1/15 text-brand-1", textColor: "text-brand-1-dark" },
                { icon: ShoppingCart, label: "Compras de Insumos", value: `-$${totalPurchases.toFixed(2)}`, bg: "bg-yellow-50/50 border-yellow-100", iconBg: "bg-yellow-100 text-yellow-600", textColor: "text-yellow-700" },
              ].map(({ icon: Icon, label, value, bg, iconBg, textColor }) => (
                <div key={label} className={`flex justify-between items-center p-4 ${bg} rounded-xl border`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center`}><Icon size={20} /></div>
                    <span className="font-medium">{label}</span>
                  </div>
                  <span className={`font-bold ${textColor} text-lg`}>{value}</span>
                </div>
              ))}
            </div>
            <div className="hidden md:flex items-center justify-center px-4"><ArrowRight className="text-gray-300 w-8 h-8" /></div>
            <div className={`flex-1 w-full p-8 rounded-2xl border flex flex-col items-center justify-center text-center ${netBalance >= 0 ? "bg-brand-4/50 border-brand-3/60" : "bg-brand-1/10 border-brand-1/25"}`}>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Ganancia Neta Estimada</p>
              <p className={`text-5xl font-black ${netBalance >= 0 ? "text-brand-1" : "text-brand-1"}`}>${netBalance.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-4 max-w-[250px]">Balance de ingresos menos gastos variables y compras del período.</p>
              <div className="mt-4 text-xs text-gray-400 bg-white/50 border border-gray-200 rounded-lg px-3 py-2">
                <p>Gastos fijos mensuales (servicios):</p>
                <p className="font-bold text-gray-500">${monthlyFixedExpenses.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Package className="w-5 h-5 text-gray-500" /> Desglose de Productos</h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-[400px]">
            {allProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-4">
                {allProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-brand-4 text-brand-1 rounded-full flex items-center justify-center font-bold text-sm">{index + 1}</span>
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

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-gray-500" /> Horas Trabajadas por Cajero</h3>
          </div>
          <div className="p-6">
            {employeeHoursArray.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-4">
                {employeeHoursArray.map((emp) => {
                  const maxHours = Math.max(...employeeHoursArray.map((e) => e.hours));
                  const percentage = maxHours > 0 ? (emp.hours / maxHours) * 100 : 0;
                  return (
                    <div key={emp.name}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{emp.name}</p>
                          <p className="text-sm text-gray-500">{emp.shifts} turno{emp.shifts !== 1 ? "s" : ""}</p>
                        </div>
                        <p className="font-bold text-gray-900">{formatHours(emp.hours)}</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-brand-1 h-3 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-gray-500" /> Detalle de Compras de Insumos</h3>
        </div>
        <div className="p-0 overflow-x-auto">
          {filteredPurchases.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay compras registradas en este período</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">Fecha</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">Descripción</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPurchases.slice().reverse().map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 text-gray-600"><Calendar size={14} /><span className="text-sm">{new Date(purchase.date).toLocaleDateString("es-AR")}</span></div>
                    </td>
                    <td className="px-6 py-3"><span className="font-medium text-gray-900">{purchase.description}</span></td>
                    <td className="px-6 py-3 text-right"><span className="font-bold text-brand-1">-${purchase.amount.toFixed(2)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Registrar Compra de Insumos</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta / Descripción</label>
                <input type="text" value={purchaseDesc} onChange={(e) => setPurchaseDesc(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-3" placeholder="¿Qué insumos compraste?" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto del Gasto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input type="text" inputMode="decimal" value={purchaseAmount} onChange={(e) => { const v = e.target.value; if (isAllowedDecimalInput(v)) setPurchaseAmount(v); }} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-3" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleRegisterPurchase} className="flex-1 bg-brand-1 text-white py-2.5 rounded-lg font-medium hover:bg-brand-1-dark">Registrar Gasto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
