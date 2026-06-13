import { useState, useEffect } from "react";
import { Archive, DollarSign, Calendar, Eye, X, Receipt, Tag, TrendingUp, Filter } from "lucide-react";

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

export function Registers() {
  const [registers, setRegisters] = useState<RegisterCloseRecord[]>([]);
  const [selectedRegister, setSelectedRegister] = useState<RegisterCloseRecord | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");

  useEffect(() => {
    // Load closed registers from localStorage
    const saved = localStorage.getItem("pos_registers");
    if (saved) {
      setRegisters(JSON.parse(saved));
    }
  }, []);

  // Get unique employees from registers
  const uniqueEmployees = Array.from(new Set(registers.map(r => r.employee)));

  // Filter registers based on date and employee
  const filteredRegisters = registers.filter(record => {
    const matchesDate = !filterDate || new Date(record.date).toLocaleDateString("es-AR") === new Date(filterDate).toLocaleDateString("es-AR");
    const matchesEmployee = !filterEmployee || record.employee === filterEmployee;
    return matchesDate && matchesEmployee;
  });

  // Helper to aggregate sales by product for a specific register
  const getProductSummary = (sales: SaleRecord[]) => {
    const summary: Record<string, { name: string, quantity: number, revenue: number }> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!summary[item.id]) {
          summary[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        summary[item.id].quantity += item.quantity;
        summary[item.id].revenue += (item.price * item.quantity);
      });
    });
    return Object.values(summary).sort((a, b) => b.revenue - a.revenue);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consulta de Cajas</h1>
        <p className="text-gray-500">Historial de cierres de caja por día</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Filter className="text-gray-400 w-5 h-5" />
            <h3 className="font-medium text-gray-900">Filtros</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Todos los empleados</option>
                {uniqueEmployees.map((employee) => (
                  <option key={employee} value={employee}>
                    {employee}
                  </option>
                ))}
              </select>
            </div>
            {(filterDate || filterEmployee) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterDate("");
                    setFilterEmployee("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Fecha y Hora</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Caja</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Empleado</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Cant. Ventas</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Ingreso Total</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRegisters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Archive className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    {registers.length === 0
                      ? "No hay registros de cajas cerradas aún."
                      : "No se encontraron registros con los filtros aplicados."}
                  </td>
                </tr>
              ) : (
                filteredRegisters.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString("es-AR")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(record.date).toLocaleTimeString("es-AR", { hour12: false })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {record.registerNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.employee}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium text-right">
                      {record.totalSalesCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-600 font-bold text-right">
                      ${record.totalIncome}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedRegister(record)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                        title="Ver detalle"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl text-gray-900">Detalle de Caja: {selectedRegister.registerNumber}</h3>
                <div className="text-gray-500 text-sm mt-1 space-y-1">
                  <p className="flex items-center gap-2">
                    <Calendar size={14} />
                    Cerrada: {new Date(selectedRegister.date).toLocaleDateString("es-AR")} - {new Date(selectedRegister.date).toLocaleTimeString("es-AR", { hour12: false })}
                  </p>
                  {selectedRegister.openedAt && (
                    <p className="flex items-center gap-2">
                      <Calendar size={14} />
                      Abierta: {new Date(selectedRegister.openedAt).toLocaleDateString("es-AR")} - {new Date(selectedRegister.openedAt).toLocaleTimeString("es-AR", { hour12: false })}
                    </p>
                  )}
                  <p>Atendió: {selectedRegister.employee}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRegister(null)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-white space-y-8">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-900">Monto Inicial</p>
                      <p className="text-xl font-bold text-purple-700">${selectedRegister.initialCash || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <Receipt size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total Tickets</p>
                      <p className="text-xl font-bold text-blue-700">{selectedRegister.totalSalesCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-900">Ingresos</p>
                      <p className="text-xl font-bold text-green-700">${selectedRegister.totalIncome}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Total en Caja</p>
                      <p className="text-xl font-bold text-yellow-700">${(selectedRegister.initialCash || 0) + selectedRegister.totalIncome}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Breakdown */}
              {selectedRegister.sales && selectedRegister.sales.length > 0 ? (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Tag size={18} className="text-gray-400" />
                    Resumen de Productos Vendidos
                  </h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden mb-8">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-sm font-medium text-gray-600">Producto</th>
                          <th className="px-4 py-3 text-sm font-medium text-gray-600 text-center">Cant.</th>
                          <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right">Recaudación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getProductSummary(selectedRegister.sales).map((prod, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{prod.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-center">{prod.quantity}</td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">${prod.revenue}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200 font-bold">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-sm text-gray-900 text-right">TOTAL</td>
                          <td className="px-4 py-3 text-sm text-green-600 text-right">${selectedRegister.totalIncome}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Individual Tickets */}
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Receipt size={18} className="text-gray-400" />
                    Detalle por Ticket
                  </h4>
                  <div className="space-y-4">
                    {selectedRegister.sales.map((sale) => (
                      <div key={sale.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                        <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold uppercase mr-2">
                              #{sale.id}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(sale.date).toLocaleTimeString("es-AR", { hour12: false })}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-gray-900">${sale.total}</span>
                            {sale.payments && sale.payments.length > 0 ? (
                              <div className="mt-1 space-y-0.5">
                                {sale.payments.map((payment, idx) => (
                                  <p key={idx} className="text-xs text-gray-500">
                                    {payment.method} ${payment.amount.toFixed(2)}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 uppercase">{sale.paymentMethod}</p>
                            )}
                          </div>
                        </div>
                        <ul className="space-y-1">
                          {sale.items.map((item, idx) => (
                            <li key={idx} className="text-sm flex justify-between text-gray-700">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="text-gray-500">${item.price * item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                  <Archive className="mx-auto w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-900 font-medium">Sin detalle disponible</p>
                  <p className="text-sm text-gray-500 mt-1">Este cierre de caja no contiene el detalle de los productos vendidos.</p>
                </div>
              )}

            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
              <button 
                onClick={() => setSelectedRegister(null)}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
