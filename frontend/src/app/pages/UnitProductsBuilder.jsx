import { useState, useEffect } from "react";
import { Tag, Plus, Save, X, Edit2, Trash2, ChevronDown } from "lucide-react";
import { api } from "./api.js";
import { nonNegative, isAllowedNumberInput } from "../utils/numbers.js";
import { normalizeUnitProductsCatalog } from "../utils/unitProductsCatalog.js";

export function UnitProductsBuilder() {
  const [catalog, setCatalog] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", wholesalePrice: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await api.get("/catalog/OTROS");
        setCatalog(normalizeUnitProductsCatalog(saved));
      } catch {
        setCatalog(normalizeUnitProductsCatalog(null));
      }
      setHasUnsavedChanges(false);
    };
    load();
  }, []);

  const updateCatalog = (next) => {
    setCatalog(next);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!catalog) return;
    try {
      const normalized = normalizeUnitProductsCatalog(catalog);
      await api.post("/catalog/OTROS", normalized);
      localStorage.setItem("pos_other_products", JSON.stringify(normalized));
      window.dispatchEvent(new Event("catalog-updated"));
      setCatalog(normalized);
      setHasUnsavedChanges(false);
      alert("Productos guardados correctamente.");
    } catch {
      alert("Error al guardar los productos.");
    }
  };

  const openModal = (product) => {
    if (product) {
      setEditingId(product.id);
      setForm({
        name: product.name,
        price: product.price > 0 ? String(product.price) : "",
        wholesalePrice: product.wholesalePrice > 0 ? String(product.wholesalePrice) : "",
      });
    } else {
      setEditingId(null);
      setForm({ name: "", price: "", wholesalePrice: "" });
    }
    setModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (!catalog || !form.name.trim()) {
      alert("Ingresá el nombre del producto.");
      return;
    }

    const payload = {
      id: editingId || crypto.randomUUID(),
      name: form.name.trim(),
      price: nonNegative(form.price),
      wholesalePrice: nonNegative(form.wholesalePrice),
    };

    const products = editingId
      ? catalog.products.map((p) => (p.id === editingId ? payload : p))
      : [...catalog.products, payload];

    updateCatalog({ ...catalog, products });
    setModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (!catalog || !confirm("¿Eliminar este producto?")) return;
    updateCatalog({
      ...catalog,
      products: catalog.products.filter((p) => p.id !== id),
    });
  };

  if (!catalog) return null;

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
        className={`px-6 py-4 flex items-center justify-between bg-orange-50/50 cursor-pointer hover:bg-orange-100/50 transition-colors ${isOpen ? "border-b border-gray-200" : ""}`}
      >
        <div className="flex items-center gap-3">
          <Tag className="text-orange-500" size={20} />
          <h2 className="text-lg font-medium text-gray-900">Otros Productos (por unidad)</h2>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openModal(null);
          }}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700"
        >
          <Plus className="w-4 h-4 mr-1" /> Agregar
        </button>
      </div>

      {isOpen && (
        <div>
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Bebidas, postres u otros ítems que se venden por unidad en el POS.
            </p>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors ${hasUnsavedChanges ? "bg-orange-500 hover:bg-orange-600" : "bg-green-600 hover:bg-green-700"}`}
            >
              <Save size={16} /> {hasUnsavedChanges ? "Guardar Productos *" : "Guardar Productos"}
            </button>
          </div>

          {catalog.products.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              No hay productos cargados. Agregá gaseosas, alfajores, etc.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Minorista</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Mayorista</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {catalog.products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-purple-800">${product.wholesalePrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-right">
                      <button onClick={() => openModal(product)} className="text-blue-600 hover:text-blue-900 mr-3 inline-block">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 inline-block">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingId ? "Editar Producto" : "Agregar Producto"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProduct();
              }}
              className="px-6 py-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  required
                  autoFocus
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Gaseosa, Alfajor, Agua"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio minorista ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={form.price}
                  onChange={(e) => { if (isAllowedNumberInput(e.target.value)) setForm({ ...form, price: e.target.value }); }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio mayorista ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={form.wholesalePrice}
                  onChange={(e) => { if (isAllowedNumberInput(e.target.value)) setForm({ ...form, wholesalePrice: e.target.value }); }}
                />
                <p className="mt-1 text-xs text-gray-500">Opcional. Dejá en 0 si no aplica.</p>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700">
                  {editingId ? "Guardar Cambios" : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
