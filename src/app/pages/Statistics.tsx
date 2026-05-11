import { useState, useEffect } from "react";
import { DollarSign, Package, Users, CreditCard, Wallet, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

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

export function Statistics() {
  const [registers, setRegisters] = useState<RegisterCloseRecord[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("week");

  useEffect(() => {
    const saved = localStorage.getItem("pos_registers");
    if (saved) {
      setRegisters(JSON.parse(saved));
    }

    const savedServices = localStorage.getItem("pos_services");
    if (savedServices) {
      setServices(JSON.parse(savedServices));
    }
  }, []);

  // Calculate statistics
  const allSales = registers.flatMap(r => r.sales || []);

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

  const netBalance = totalRevenue - totalVariableExpenses - totalFixedExpenses;

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
      </div>

      {/* Balance General Panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-gray-500" />
            Balance General
          </h3>
          <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 border border-gray-200 rounded-lg shadow-sm">
            {dateRange === 'week' ? 'Período: Últimos 7 días' : dateRange === 'month' ? 'Período: Últimos 30 días' : `Período: Histórico (${daysToCalculate} días)`}
          </span>
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
    </div>
  );
}
