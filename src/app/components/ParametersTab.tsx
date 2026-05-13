import { useState, useEffect } from "react";
import { Plus, X, Edit2, Trash2 } from "lucide-react";
import { ProductBuilder } from "../pages/ProductBuilder";
import { api } from "../pages/api";

type Service = { id: string; name: string; cost: number };
type PaymentMethod = { id: string; name: string; surcharge: number };
type InputItem = { id: string; name: string; isFood: boolean; price: number };

export function ParametersTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [inputs, setInputs] = useState<InputItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const dbServices = await api.get("/services");
        setServices(dbServices);

        let dbInputs = await api.get("/inputs");
        if (dbInputs.length === 0) {
          const defaultMayo = await api.post("/inputs", { name: "Mayonesa", isFood: true, price: 0 });
          const defaultPan = await api.post("/inputs", { name: "Pan de Miga (Unidad)", isFood: false, price: 0 });
          dbInputs = [defaultMayo, defaultPan];
        } else if (!dbInputs.find((i: any) => i.name.toLowerCase().includes("mayonesa"))) {
          const newMayo = await api.post("/inputs", { name: "Mayonesa", isFood: true, price: 0 });
          dbInputs.push(newMayo);
        }
        setInputs(dbInputs);
      } catch (error) {
        console.error("Error conectando con la base de datos:", error);
      }
    };
    loadData();

    const savedPayments = localStorage.getItem("pos_payments");
    if (savedPayments) {
      setPayments(JSON.parse(savedPayments));
    } else {
      const defaultPayments = [
        { id: "1", name: "Efectivo", surcharge: 0 },
        { id: "2", name: "Débito", surcharge: 10 },
        { id: "3", name: "Transferencia", surcharge: 0 },
        { id: "4", name: "QR", surcharge: 5 },
      ];
      setPayments(defaultPayments);
      localStorage.setItem("pos_payments", JSON.stringify(defaultPayments));
    }
  }, []);

  const [activeModal, setActiveModal] = useState<"service" | "payment" | "input" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openModal = (type: "service" | "payment" | "input", id?: string) => {
    setActiveModal(type);
    setEditingId(id || null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingId(null);
  };

  const handleSaveService = async (data: Omit<Service, "id">) => {
    try {
      if (editingId) {
        const updated = await api.put(`/services/${editingId}`, data);
        setServices(services.map(s => s.id === editingId ? updated : s));
      } else {
        const created = await api.post('/services', data);
        setServices([...services, created]);
      }
      closeModal();
    } catch (e) {
      alert("Error al guardar el servicio en la base de datos");
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await api.delete(`/services/${id}`);
      setServices(services.filter(s => s.id !== id));
    } catch (e) {
      alert("Error al eliminar el servicio de la base de datos");
    }
  };

  const handleSaveInput = async (data: Omit<InputItem, "id">) => {
    try {
      if (editingId) {
        const updated = await api.put(`/inputs/${editingId}`, data);
        setInputs(inputs.map(i => i.id === editingId ? updated : i));
      } else {
        const created = await api.post('/inputs', data);
        setInputs([...inputs, created]);
      }
      closeModal();
    } catch (e) {
      alert("Error al guardar el insumo en la base de datos");
    }
  };

  const handleDeleteInput = async (id: string) => {
    try {
      await api.delete(`/inputs/${id}`);
      setInputs(inputs.filter(i => i.id !== id));
    } catch (e) {
      alert("Error al eliminar el insumo de la base de datos");
    }
  };

  return (
    <div className="space-y-8">
      {/* Services Section */}
      <ParameterSection
        title="Servicios y Gastos"
        onAdd={() => openModal("service")}
        isEmpty={services.length === 0}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.map((s) => (
              <tr key={s.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${s.cost}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  <button onClick={() => openModal("service", s.id)} className="text-blue-600 hover:text-blue-900 mr-3 inline-block">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteService(s.id)} className="text-red-600 hover:text-red-900 inline-block">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ParameterSection>

      {/* Payment Methods Section */}
      <ParameterSection
        title="Métodos de Pago"
        onAdd={() => openModal("payment")}
        isEmpty={payments.length === 0}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recargo (%)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {p.surcharge > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      +{p.surcharge}%
                    </span>
                  ) : (
                    <span className="text-gray-500">Sin recargo</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  <button onClick={() => openModal("payment", p.id)} className="text-blue-600 hover:text-blue-900 mr-3 inline-block">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeletePayment(p.id)} className="text-red-600 hover:text-red-900 inline-block">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ParameterSection>

      {/* Inputs Section */}
      <ParameterSection
        title="Insumos"
        onAdd={() => openModal("input")}
        isEmpty={inputs.length === 0}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inputs.map((i) => (
              <tr key={i.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{i.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {i.isFood ? "Alimenticio (Kg/Gramos)" : "Unidad"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${i.price} {i.isFood ? "/ Kg" : "/ Unidad"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  <button onClick={() => openModal("input", i.id)} className="text-blue-600 hover:text-blue-900 mr-3 inline-block">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteInput(i.id)} className="text-red-600 hover:text-red-900 inline-block">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ParameterSection>

      {/* Módulo Dinámico de Productos Finales */}
      <ProductBuilder customInputs={inputs} />

      {/* Modals */}
      {activeModal === "service" && (
        <ServiceModal
          initialData={services.find(s => s.id === editingId)}
          onClose={closeModal}
          onSave={handleSaveService}
        />
      )}
      {activeModal === "payment" && (
        <PaymentModal
          initialData={payments.find(p => p.id === editingId)}
          onClose={closeModal}
          onSave={handleSavePayment}
        />
      )}
      {activeModal === "input" && (
        <InputModal
          initialData={inputs.find(i => i.id === editingId)}
          onClose={closeModal}
          onSave={handleSaveInput}
        />
      )}
    </div>
  );
}

// Subcomponents

function ParameterSection({
  title,
  onAdd,
  isEmpty,
  children,
}: {
  title: string;
  onAdd: () => void;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        <button
          onClick={onAdd}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" /> Agregar
        </button>
      </div>
      <div className="overflow-x-auto">
        {isEmpty ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">No hay registros de {title.toLowerCase()}.</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// --- Modals ---

function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function ServiceModal({ onClose, onSave, initialData }: { onClose: () => void; onSave: (data: Omit<Service, "id">) => void; initialData?: Service }) {
  const [name, setName] = useState(initialData?.name || "");
  const [cost, setCost] = useState(initialData?.cost.toString() || "");

  return (
    <ModalWrapper title={initialData ? "Editar Servicio/Gasto" : "Agregar Servicio/Gasto"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name, cost: Number(cost) });
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            required
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Costo</label>
          <input
            required
            type="number"
            step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>
        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            {initialData ? "Guardar Cambios" : "Registrar"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function PaymentModal({ onClose, onSave, initialData }: { onClose: () => void; onSave: (data: Omit<PaymentMethod, "id">) => void; initialData?: PaymentMethod }) {
  const [name, setName] = useState(initialData?.name || "");
  const [surcharge, setSurcharge] = useState(initialData?.surcharge.toString() || "0");

  return (
    <ModalWrapper title={initialData ? "Editar Método de Pago" : "Agregar Método de Pago"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name, surcharge: Number(surcharge) });
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            required
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Recargo (%)</label>
          <div className="relative mt-1">
            <input
              required
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg pr-8"
              value={surcharge}
              onChange={(e) => setSurcharge(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Ingresa 0 si no hay recargo. Ejemplo: 5 para aplicar 5% de recargo.
          </p>
        </div>
        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            {initialData ? "Guardar Cambios" : "Registrar"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function InputModal({ onClose, onSave, initialData }: { onClose: () => void; onSave: (data: Omit<InputItem, "id">) => void; initialData?: InputItem }) {
  const [name, setName] = useState(initialData?.name || "");
  const [isFood, setIsFood] = useState(initialData ? initialData.isFood : true);
  const [price, setPrice] = useState(initialData?.price.toString() || "");

  return (
    <ModalWrapper title={initialData ? "Editar Insumo" : "Agregar Insumo"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name, isFood, price: Number(price) });
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            required
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex items-center py-2">
          <input
            id="isFoodToggle"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            checked={isFood}
            onChange={(e) => setIsFood(e.target.checked)}
          />
          <label htmlFor="isFoodToggle" className="ml-2 block text-sm text-gray-900 cursor-pointer">
            Es insumo alimenticio (Se pesa en Kg/Gramos)
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {isFood ? "Precio por Kg" : "Precio por Unidad"}
          </label>
          <input
            required
            type="number"
            step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            {initialData ? "Guardar Cambios" : "Registrar"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
