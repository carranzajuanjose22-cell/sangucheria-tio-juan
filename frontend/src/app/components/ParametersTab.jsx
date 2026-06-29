import { useState, useEffect } from "react";
import { Plus, X, Edit2, Trash2, ChevronDown } from "lucide-react";
import { ProductBuilder } from "../pages/ProductBuilder.jsx";
import { api } from "../pages/api.js";
import { nonNegative, isAllowedNumberInput } from "../utils/numbers.js";

export function ParametersTab() {
  const [services, setServices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [inputs, setInputs] = useState([]);

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
        } else if (!dbInputs.find((i) => i.name.toLowerCase().includes("mayonesa"))) {
          const newMayo = await api.post("/inputs", { name: "Mayonesa", isFood: true, price: 0 });
          dbInputs.push(newMayo);
        }
        setInputs(dbInputs);

        const dbPayments = await api.get("/payments");
        if (dbPayments.length === 0) {
          const defaults = [
            { name: "Efectivo", surcharge: 0 },
            { name: "Débito", surcharge: 10 },
            { name: "Transferencia", surcharge: 0 },
            { name: "QR", surcharge: 5 },
          ];
          const created = await Promise.all(defaults.map((p) => api.post("/payments", p)));
          setPayments(created);
        } else {
          setPayments(dbPayments);
        }
      } catch (error) {
        console.error("Error conectando con la base de datos:", error);
      }
    };
    loadData();
  }, []);

  const [activeModal, setActiveModal] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const openModal = (type, id) => {
    setActiveModal(type);
    setEditingId(id || null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingId(null);
  };

  const handleSaveService = async (data) => {
    try {
      if (editingId) {
        const updated = await api.put(`/services/${editingId}`, data);
        setServices(services.map((s) => (s.id === editingId ? updated : s)));
      } else {
        const created = await api.post("/services", data);
        setServices([...services, created]);
      }
      closeModal();
    } catch {
      alert("Error al guardar el servicio en la base de datos");
    }
  };

  const handleDeleteService = async (id) => {
    try {
      await api.delete(`/services/${id}`);
      setServices(services.filter((s) => s.id !== id));
    } catch {
      alert("Error al eliminar el servicio de la base de datos");
    }
  };

  const handleSavePayment = async (data) => {
    try {
      if (editingId) {
        const updated = await api.put(`/payments/${editingId}`, data);
        setPayments(payments.map((p) => (p.id === editingId ? updated : p)));
      } else {
        const created = await api.post("/payments", data);
        setPayments([...payments, created]);
      }
      closeModal();
    } catch {
      alert("Error al guardar el método de pago en la base de datos");
    }
  };

  const handleDeletePayment = async (id) => {
    try {
      await api.delete(`/payments/${id}`);
      setPayments(payments.filter((p) => p.id !== id));
    } catch {
      alert("Error al eliminar el método de pago de la base de datos");
    }
  };

  const handleSaveInput = async (data) => {
    try {
      if (editingId) {
        const updated = await api.put(`/inputs/${editingId}`, data);
        setInputs(inputs.map((i) => (i.id === editingId ? updated : i)));
      } else {
        const created = await api.post("/inputs", data);
        setInputs([...inputs, created]);
      }
      closeModal();
    } catch {
      alert("Error al guardar el insumo en la base de datos");
    }
  };

  const handleDeleteInput = async (id) => {
    try {
      await api.delete(`/inputs/${id}`);
      setInputs(inputs.filter((i) => i.id !== id));
    } catch {
      alert("Error al eliminar el insumo de la base de datos");
    }
  };

  return (
    <div className="space-y-8">
      <ParameterSection title="Servicios y Gastos" onAdd={() => openModal("service")} isEmpty={services.length === 0}>
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
                <td className="px-6 py-4 text-sm text-gray-900">{s.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">${s.cost}</td>
                <td className="px-6 py-4 text-sm font-medium text-right">
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

      <ParameterSection title="Métodos de Pago" onAdd={() => openModal("payment")} isEmpty={payments.length === 0}>
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
                <td className="px-6 py-4 text-sm text-gray-900">{p.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {p.surcharge > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      +{p.surcharge}%
                    </span>
                  ) : (
                    <span className="text-gray-500">Sin recargo</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-right">
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

      <ParameterSection title="Insumos" onAdd={() => openModal("input")} isEmpty={inputs.length === 0}>
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
                <td className="px-6 py-4 text-sm text-gray-900">{i.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{i.isFood ? "Alimenticio (Kg/Gramos)" : "Unidad"}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  ${i.price} {i.isFood ? "/ Kg" : "/ Unidad"}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-right">
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

      <ProductBuilder customInputs={inputs} />

      {activeModal === "service" && (
        <ServiceModal
          initialData={services.find((s) => s.id === editingId)}
          onClose={closeModal}
          onSave={handleSaveService}
        />
      )}
      {activeModal === "payment" && (
        <PaymentModal
          initialData={payments.find((p) => p.id === editingId)}
          onClose={closeModal}
          onSave={handleSavePayment}
        />
      )}
      {activeModal === "input" && (
        <InputModal
          initialData={inputs.find((i) => i.id === editingId)}
          onClose={closeModal}
          onSave={handleSaveInput}
        />
      )}
    </div>
  );
}

function ParameterSection({ title, onAdd, isEmpty, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((open) => !open);
          }
        }}
        className={`px-6 py-4 flex items-center justify-between bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors ${isOpen ? "border-b border-gray-200" : ""}`}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" /> Agregar
        </button>
      </div>
      {isOpen && (
        <div className="overflow-x-auto">
          {isEmpty ? (
            <div className="px-6 py-8 text-center text-sm text-gray-500">
              No hay registros de {title.toLowerCase()}.
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

function ModalWrapper({ title, onClose, children }) {
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

function ServiceModal({ onClose, onSave, initialData }) {
  const [name, setName] = useState(initialData?.name || "");
  const [cost, setCost] = useState(initialData?.cost?.toString() || "");

  return (
    <ModalWrapper title={initialData ? "Editar Servicio/Gasto" : "Agregar Servicio/Gasto"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name, cost: nonNegative(cost) });
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input required type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Costo</label>
          <input required type="number" step="0.01" min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" value={cost} onChange={(e) => { if (isAllowedNumberInput(e.target.value)) setCost(e.target.value); }} />
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

function PaymentModal({ onClose, onSave, initialData }) {
  const [name, setName] = useState(initialData?.name || "");
  const [surcharge, setSurcharge] = useState(initialData?.surcharge?.toString() || "0");

  return (
    <ModalWrapper title={initialData ? "Editar Método de Pago" : "Agregar Método de Pago"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name, surcharge: nonNegative(surcharge) });
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input required type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Recargo (%)</label>
          <input required type="number" step="0.01" min="0" max="100" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" value={surcharge} onChange={(e) => { if (isAllowedNumberInput(e.target.value)) setSurcharge(e.target.value); }} />
          <p className="mt-1 text-xs text-gray-500">Ingresa 0 si no hay recargo.</p>
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

function InputModal({ onClose, onSave, initialData }) {
  const [name, setName] = useState(initialData?.name || "");
  const [isFood, setIsFood] = useState(initialData ? initialData.isFood : true);
  const [price, setPrice] = useState(initialData?.price?.toString() || "");

  return (
    <ModalWrapper title={initialData ? "Editar Insumo" : "Agregar Insumo"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name, isFood, price: nonNegative(price) });
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input required type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex items-center py-2">
          <input id="isFoodToggle" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer" checked={isFood} onChange={(e) => setIsFood(e.target.checked)} />
          <label htmlFor="isFoodToggle" className="ml-2 block text-sm text-gray-900 cursor-pointer">
            Es insumo alimenticio (Se pesa en Kg/Gramos)
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{isFood ? "Precio por Kg" : "Precio por Unidad"}</label>
          <input required type="number" step="0.01" min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" value={price} onChange={(e) => { if (isAllowedNumberInput(e.target.value)) setPrice(e.target.value); }} />
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
