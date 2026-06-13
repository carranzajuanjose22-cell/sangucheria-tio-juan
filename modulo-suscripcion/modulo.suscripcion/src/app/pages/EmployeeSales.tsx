import { useState, useEffect } from "react";
import { Receipt, Clock, CreditCard, Eye, Printer, X } from "lucide-react";
import { SaleRecord } from "./EmployeePos";

export function EmployeeSales() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);

  useEffect(() => {
    const loadSales = () => {
      const savedSales = localStorage.getItem("pos_sales");
      if (savedSales) {
        setSales(JSON.parse(savedSales));
      } else {
        setSales([]);
      }
    };

    loadSales();
    
    // In a real app we might want to listen to storage events or use a global state,
    // but since we navigate between routes, the component will remount and run useEffect.
    window.addEventListener("storage", loadSales);
    return () => window.removeEventListener("storage", loadSales);
  }, []);

  const totalToday = sales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col gap-6">
      
      <div className="flex flex-wrap items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas del Turno Actual</h1>
          <p className="text-gray-500 mt-1">
            Caja Abierta: #01 • {sales.length} ventas realizadas
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">Recaudación en Caja</p>
          <p className="text-3xl font-bold text-green-600">${totalToday}</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 p-6">
          {sales.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Receipt className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No hay ventas registradas aún</p>
              <p className="text-sm">Las ventas que realices aparecerán aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sales.slice().reverse().map((sale) => (
                <div 
                  key={sale.id} 
                  className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-gray-50/50"
                  onClick={() => setSelectedSale(sale)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-medium uppercase">
                      #{sale.id}
                    </span>
                    <span className="flex items-center text-sm text-gray-500 gap-1.5">
                      <Clock size={14} />
                      {new Date(sale.date).toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                      {sale.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-end border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <CreditCard size={16} />
                      {sale.payments && sale.payments.length > 1
                        ? `${sale.payments.length} métodos`
                        : sale.payments && sale.payments.length === 1
                        ? sale.payments[0].method
                        : sale.paymentMethod}
                    </div>
                    <span className="text-lg font-bold text-gray-900">${sale.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TICKET MODAL FOR REPRINTING */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Detalle de Venta</h3>
              <button 
                onClick={() => setSelectedSale(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 bg-white font-mono text-sm">
              <div className="text-center mb-6">
                <h4 className="font-bold text-lg mb-1">LOCAL DE SÁNGUCHES</h4>
                <p className="text-gray-500 text-xs">Copia de Ticket</p>
                <p className="text-gray-500 text-xs mt-2">
                  {new Date(selectedSale.date).toLocaleDateString("es-AR")} - {new Date(selectedSale.date).toLocaleTimeString("es-AR", { hour12: false })}
                </p>
              </div>

              <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Caja:</span>
                  <span className="font-medium">{selectedSale.registerNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Atendido por:</span>
                  <span className="font-medium">{selectedSale.employee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ticket #:</span>
                  <span className="font-medium uppercase">{selectedSale.id}</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="font-bold border-b border-gray-200 pb-2 flex justify-between">
                  <span>Cant. Desc</span>
                  <span>Importe</span>
                </div>
                {selectedSale.items.map(item => (
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
                  <span>${selectedSale.total}</span>
                </div>
                <div className="mt-3 text-xs border-t border-gray-300 pt-2">
                  <span className="text-gray-500 block mb-1">Medio(s) de Pago:</span>
                  {selectedSale.payments && selectedSale.payments.length > 0 ? (
                    <div className="space-y-1">
                      {selectedSale.payments.map((payment, idx) => (
                        <div key={idx} className="flex justify-between text-gray-700">
                          <span className="uppercase">{payment.method}</span>
                          <span>${payment.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-between text-gray-500">
                      <span className="uppercase">{selectedSale.paymentMethod}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  alert("Re-imprimiendo ticket...");
                  setSelectedSale(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                <Printer size={18} />
                Re-imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
