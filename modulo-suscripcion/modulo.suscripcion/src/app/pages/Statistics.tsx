import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, ShoppingCart, Calendar, BarChart3, Package } from "lucide-react";

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
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("week");

  useEffect(() => {
    const saved = localStorage.getItem("pos_registers");
    if (saved) {
      setRegisters(JSON.parse(saved));
    }
  }, []);

  // Calculate statistics
  const allSales = registers.flatMap(r => r.sales || []);

  // Filter by date range
  const getFilteredSales = () => {
    const now = new Date();
    const cutoffDate = new Date();

    if (dateRange === "week") {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (dateRange === "month") {
      cutoffDate.setDate(now.getDate() - 30);
    } else {
      return allSales;
    }

    return allSales.filter(sale => new Date(sale.date) >= cutoffDate);
  };

  const filteredSales = getFilteredSales();

  // Total revenue
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

  // Total transactions
  const totalTransactions = filteredSales.length;

  // Average ticket
  const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Products sold
  const productsSold = filteredSales.reduce((sum, sale) =>
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  // Top selling products
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

  const topProducts = Object.entries(productStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Payment methods breakdown
  const paymentMethodStats: Record<string, { count: number; total: number }> = {};
  filteredSales.forEach(sale => {
    if (sale.payments && sale.payments.length > 0) {
      sale.payments.forEach(payment => {
        if (!paymentMethodStats[payment.method]) {
          paymentMethodStats[payment.method] = { count: 0, total: 0 };
        }
        paymentMethodStats[payment.method].count += 1;
        paymentMethodStats[payment.method].total += payment.amount;
      });
    } else {
      const method = sale.paymentMethod;
      if (!paymentMethodStats[method]) {
        paymentMethodStats[method] = { count: 0, total: 0 };
      }
      paymentMethodStats[method].count += 1;
      paymentMethodStats[method].total += sale.total;
    }
  });

  const paymentMethods = Object.entries(paymentMethodStats)
    .map(([method, stats]) => ({ method, ...stats }))
    .sort((a, b) => b.total - a.total);

  // Sales by day of week
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const salesByDay: Record<number, number> = {};
  filteredSales.forEach(sale => {
    const day = new Date(sale.date).getDay();
    salesByDay[day] = (salesByDay[day] || 0) + sale.total;
  });

  const salesByDayArray = dayNames.map((name, index) => ({
    day: name,
    total: salesByDay[index] || 0
  }));

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
            <p className="text-sm font-medium text-gray-600">Transacciones</p>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalTransactions}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">${averageTicket.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Productos Vendidos</p>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{productsSold}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-500" />
              Productos Más Vendidos
            </h3>
          </div>
          <div className="p-6">
            {topProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
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

        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-500" />
              Métodos de Pago
            </h3>
          </div>
          <div className="p-6">
            {paymentMethods.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => {
                  const percentage = totalRevenue > 0 ? (method.total / totalRevenue) * 100 : 0;
                  return (
                    <div key={method.method}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{method.method}</p>
                          <p className="text-sm text-gray-500">{method.count} transacciones</p>
                        </div>
                        <p className="font-bold text-gray-900">${method.total.toFixed(2)}</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
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

      {/* Sales by Day */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            Ventas por Día de la Semana
          </h3>
        </div>
        <div className="p-6">
          {salesByDayArray.every(d => d.total === 0) ? (
            <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
          ) : (
            <div className="space-y-4">
              {salesByDayArray.map((dayData) => {
                const maxSale = Math.max(...salesByDayArray.map(d => d.total));
                const percentage = maxSale > 0 ? (dayData.total / maxSale) * 100 : 0;
                return (
                  <div key={dayData.day}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900 w-24">{dayData.day}</p>
                      <p className="font-bold text-gray-900">${dayData.total.toFixed(2)}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all"
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
  );
}
