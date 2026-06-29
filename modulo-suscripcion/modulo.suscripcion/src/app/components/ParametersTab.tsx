import { useState } from "react";
import { Plus, X, Edit2, Trash2, ChevronDown } from "lucide-react";

type Service = { id: string; name: string; cost: number };
type PaymentMethod = { id: string; name: string; surcharge: number };
type InputItem = { id: string; name: string; isFood: boolean; price: number };
type ProductInput = { inputId?: string; name: string; quantity: string; cost: number };

type FinalProduct = {
  id: string;
  name: string;
  unitCost: number;
  customQuantity: number;
  customPrice: number;
  ingredients: ProductInput[];
};

export function ParametersTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([
    { id: "1", name: "Efectivo", surcharge: 0 },
    { id: "2", name: "Débito", surcharge: 10 },
    { id: "3", name: "Transferencia", surcharge: 0 },
    { id: "4", name: "QR", surcharge: 5 },
  ]);
  const [inputs, setInputs] = useState<InputItem[]>([]);
  const [products, setProducts] = useState<FinalProduct[]>([]);

  const [activeModal, setActiveModal] = useState<"service" | "payment" | "input" | "product" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openModal = (type: "service" | "payment" | "input" | "product", id?: string) => {
    setActiveModal(type);
    setEditingId(id || null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingId(null);
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
                  <button onClick={() => setServices(services.filter(x => x.id !== s.id))} className="text-red-600 hover:text-red-900 inline-block">
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
                  <button onClick={() => setPayments(payments.filter(x => x.id !== p.id))} className="text-red-600 hover:text-red-900 inline-block">
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
                  <button onClick={() => setInputs(inputs.filter(x => x.id !== i.id))} className="text-red-600 hover:text-red-900 inline-block">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ParameterSection>

      {/* Final Products Section */}
      <ParameterSection
        title="Productos Finales"
        onAdd={() => openModal("product")}
        isEmpty={products.length === 0}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit. (Venta)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Personalizado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Unitario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insumos</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((p) => {
              const totalCost = p.ingredients.reduce((sum, ing) => sum + ing.cost, 0);
              return (
                <tr key={p.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${p.unitCost}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {p.customQuantity > 0 && p.customPrice > 0 ? (
                      <span>{p.customQuantity} cant. / ${p.customPrice}</span>
                    ) : (
                      <span className="text-gray-400 italic">No configurado</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                    ${totalCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="space-y-0.5">
                      {p.ingredients.map((ing, idx) => {
                        const inputItem = inputs.find(i => i.id === ing.inputId);
                        const unit = inputItem?.isFood ? "gr." : "U.";
                        return (
                          <div key={idx} className="text-xs text-gray-600">
                            • {ing.name} <span className="text-gray-400">({ing.quantity} {unit})</span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <button onClick={() => openModal("product", p.id)} className="text-blue-600 hover:text-blue-900 mr-3 inline-block">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setProducts(products.filter(x => x.id !== p.id))} className="text-red-600 hover:text-red-900 inline-block">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ParameterSection>

      {/* Modals */}
      {activeModal === "service" && (
        <ServiceModal
          initialData={services.find(s => s.id === editingId)}
          onClose={closeModal}
          onSave={(data) => {
            if (editingId) {
              setServices(services.map(s => s.id === editingId ? { ...s, ...data } : s));
            } else {
              setServices([...services, { ...data, id: Date.now().toString() }]);
            }
            closeModal();
          }}
        />
      )}
      {activeModal === "payment" && (
        <PaymentModal
          initialData={payments.find(p => p.id === editingId)}
          onClose={closeModal}
          onSave={(data) => {
            if (editingId) {
              setPayments(payments.map(p => p.id === editingId ? { ...p, ...data } : p));
            } else {
              setPayments([...payments, { ...data, id: Date.now().toString() }]);
            }
            closeModal();
          }}
        />
      )}
      {activeModal === "input" && (
        <InputModal
          initialData={inputs.find(i => i.id === editingId)}
          onClose={closeModal}
          onSave={(data) => {
            if (editingId) {
              setInputs(inputs.map(i => i.id === editingId ? { ...i, ...data } : i));
            } else {
              setInputs([...inputs, { ...data, id: Date.now().toString() }]);
            }
            closeModal();
          }}
        />
      )}
      {activeModal === "product" && (
        <ProductModal
          initialData={products.find(p => p.id === editingId)}
          inputs={inputs}
          onClose={closeModal}
          onSave={(data) => {
            if (editingId) {
              setProducts(products.map(p => p.id === editingId ? { ...p, ...data } : p));
            } else {
              setProducts([...products, { ...data, id: Date.now().toString() }]);
            }
            closeModal();
          }}
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
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div
        className={`px-6 py-4 flex items-center justify-between bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors ${isOpen ? "border-b border-gray-200" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" /> Agregar
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="overflow-x-auto">
          {isEmpty ? <div className="px-6 py-8 text-center text-sm text-gray-500">No hay registros de {title.toLowerCase()}.</div> : children}
        </div>
      )}
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

function ProductModal({
  inputs,
  onClose,
  onSave,
  initialData,
}: {
  inputs: InputItem[];
  onClose: () => void;
  onSave: (data: Omit<FinalProduct, "id">) => void;
  initialData?: FinalProduct;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [unitCost, setUnitCost] = useState(initialData?.unitCost.toString() || "");
  const [hasCustomPrice, setHasCustomPrice] = useState(
    initialData ? (initialData.customQuantity > 0 || initialData.customPrice > 0) : false
  );
  const [customQty, setCustomQty] = useState(initialData?.customQuantity.toString() || "");
  const [customPrice, setCustomPrice] = useState(initialData?.customPrice.toString() || "");

  type FormIngredient = { inputId: string; name: string; quantity: string };
  const [ingredients, setIngredients] = useState<FormIngredient[]>(
    initialData?.ingredients?.map(ing => ({ inputId: ing.inputId || "", name: ing.name, quantity: ing.quantity })) ||
    [{ inputId: "", name: "", quantity: "" }]
  );

  const addIngredientRow = () => {
    setIngredients([...ingredients, { inputId: "", name: "", quantity: "" }]);
  };

  const removeIngredientRow = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof FormIngredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    
    if (field === "inputId") {
      const selectedInput = inputs.find(i => i.id === value);
      if (selectedInput) {
        newIngredients[index].name = selectedInput.name;
      } else {
        newIngredients[index].name = "";
      }
    }
    setIngredients(newIngredients);
  };

  const calculateCost = (inputId: string, quantityStr: string) => {
    const input = inputs.find(i => i.id === inputId);
    if (!input) return 0;

    // Extrae el primer número de la cadena (ej: "200gr" -> 200, "1 unidad" -> 1)
    const match = quantityStr.match(/[\d.]+/);
    const num = match ? parseFloat(match[0]) : 0;

    if (input.isFood) {
      // Si es alimenticio se asume que la cantidad se da en gramos y el precio en kg
      return (num / 1000) * input.price;
    } else {
      // Si es por unidad, se asume precio por unidad
      return num * input.price;
    }
  };

  // Calcular el total de los costos de los insumos
  const totalIngredientsCost = ingredients.reduce((sum, ing) => {
    if (ing.inputId && ing.quantity) {
      return sum + calculateCost(ing.inputId, ing.quantity);
    }
    return sum;
  }, 0);

  return (
    <ModalWrapper title={initialData ? "Editar Producto Final" : "Agregar Producto Final"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            name,
            unitCost: Number(unitCost),
            customQuantity: hasCustomPrice ? Number(customQty) : 0,
            customPrice: hasCustomPrice ? Number(customPrice) : 0,
            ingredients: ingredients
              .filter((ing) => ing.name && ing.quantity)
              .map(ing => ({
                inputId: ing.inputId,
                name: ing.name,
                quantity: ing.quantity,
                cost: calculateCost(ing.inputId, ing.quantity)
              })),
          });
        }}
        className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pb-2"
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Precio Unitario (Venta)</label>
          <input
            required
            type="number"
            step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
          />
        </div>

        <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-blue-900">Precio Personalizado (Venta)</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasCustomPrice}
                onChange={(e) => setHasCustomPrice(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-700">Activar</span>
            </label>
          </div>
          {hasCustomPrice && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Cantidad</label>
                <input
                  required={hasCustomPrice}
                  type="number"
                  className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Precio</label>
                <input
                  required={hasCustomPrice}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                />
              </div>
            </div>
          )}
          {!hasCustomPrice && (
            <p className="text-xs text-gray-500 italic">
              Activa esta opción para definir un precio especial por cantidad (ej: 3 por $100)
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-900">Insumos y Cantidades</label>
            <button
              type="button"
              onClick={addIngredientRow}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center"
            >
              <Plus className="w-3 h-3 mr-1" />
              Añadir otro
            </button>
          </div>

          <div className="space-y-3">
            {ingredients.map((ing, idx) => {
              const cost = calculateCost(ing.inputId, ing.quantity);
              return (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1">
                    {inputs.length === 0 ? (
                      <input
                        type="text"
                        required
                        placeholder="Ej. Paleta"
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={ing.name}
                        onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                      />
                    ) : (
                      <select
                        required
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={ing.inputId}
                        onChange={(e) => updateIngredient(idx, "inputId", e.target.value)}
                      >
                        <option value="">Selecciona insumo...</option>
                        {inputs.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="w-[30%]">
                    <input
                      required
                      type="text"
                      placeholder="Ej. 200gr, 1 unidad"
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(idx, "quantity", e.target.value)}
                    />
                  </div>
                  <div className="w-[20%] flex flex-col justify-center mt-1">
                    <div className="h-[38px] w-full flex items-center px-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium overflow-hidden">
                      ${cost.toFixed(2)}
                    </div>
                  </div>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredientRow(idx)}
                      className="mt-1 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Total Costo Unitario */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-900">Costo Unitario</label>
            <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm font-semibold text-green-700">
                ${totalIngredientsCost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end mt-4">
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            {initialData ? "Guardar Cambios" : "Registrar"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
