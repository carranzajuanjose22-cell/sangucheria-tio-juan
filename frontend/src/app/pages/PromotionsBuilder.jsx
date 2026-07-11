import { useState, useEffect, useMemo } from "react";
import { Gift, Plus, Save, X, Edit2, Trash2, ChevronDown } from "lucide-react";
import { api } from "./api.js";
import { nonNegative, isAllowedNumberInput } from "../utils/numbers.js";
import { normalizeMigaCatalog } from "../utils/migaCatalog.js";
import { normalizeUnitProductsCatalog } from "../utils/unitProductsCatalog.js";
import {
  buildSellableItems,
  getPromotionRegularTotal,
  getPromotionSummaryLabel,
  normalizePromotionsCatalog,
} from "../utils/promotionsCatalog.js";

const emptyComponent = () => ({ sellableId: "", quantity: "1" });

export function PromotionsBuilder() {
  const [catalog, setCatalog] = useState(null);
  const [migaProduct, setMigaProduct] = useState(null);
  const [otrosProduct, setOtrosProduct] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", components: [emptyComponent(), emptyComponent()] });

  const sellableItems = useMemo(
    () => buildSellableItems(migaProduct, otrosProduct),
    [migaProduct, otrosProduct]
  );

  const sellableById = useMemo(
    () => Object.fromEntries(sellableItems.map((item) => [item.id, item])),
    [sellableItems]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [miga, otros, promos] = await Promise.all([
          api.get("/catalog/MIGA").catch(() => null),
          api.get("/catalog/OTROS").catch(() => null),
          api.get("/catalog/PROMOCIONES").catch(() => null),
        ]);
        setMigaProduct(normalizeMigaCatalog(miga));
        setOtrosProduct(normalizeUnitProductsCatalog(otros));
        setCatalog(normalizePromotionsCatalog(promos));
      } catch {
        setMigaProduct(normalizeMigaCatalog(null));
        setOtrosProduct(normalizeUnitProductsCatalog(null));
        setCatalog(normalizePromotionsCatalog(null));
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
      const normalized = normalizePromotionsCatalog(catalog);
      await api.post("/catalog/PROMOCIONES", normalized);
      localStorage.setItem("pos_promotions", JSON.stringify(normalized));
      window.dispatchEvent(new Event("catalog-updated"));
      setCatalog(normalized);
      setHasUnsavedChanges(false);
      alert("Promociones guardadas correctamente.");
    } catch {
      alert("Error al guardar las promociones.");
    }
  };

  const resetForm = () => {
    setForm({ name: "", price: "", components: [emptyComponent(), emptyComponent()] });
    setEditingId(null);
  };

  const openModal = (promotion) => {
    if (promotion) {
      setEditingId(promotion.id);
      setForm({
        name: promotion.name,
        price: promotion.price > 0 ? String(promotion.price) : "",
        components: promotion.components.map((c) => ({
          sellableId: c.sellableId,
          quantity: String(c.quantity || 1),
        })),
      });
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const updateComponent = (index, field, value) => {
    setForm((current) => {
      const components = [...current.components];
      components[index] = { ...components[index], [field]: value };
      return { ...current, components };
    });
  };

  const handleSavePromotion = () => {
    if (!catalog || !form.name.trim()) {
      alert("Ingresá el nombre de la promoción.");
      return;
    }

    const components = form.components
      .filter((c) => c.sellableId)
      .map((c) => ({
        sellableId: c.sellableId,
        label: sellableById[c.sellableId]?.name || "Producto",
        quantity: Math.max(1, nonNegative(c.quantity || 1)),
      }));

    if (components.length < 2) {
      alert("Seleccioná al menos 2 productos para la promoción.");
      return;
    }

    const payload = {
      id: editingId || crypto.randomUUID(),
      name: form.name.trim(),
      price: nonNegative(form.price),
      components,
    };

    const promotions = editingId
      ? catalog.promotions.map((p) => (p.id === editingId ? payload : p))
      : [...catalog.promotions, payload];

    updateCatalog({ ...catalog, promotions });
    setModalOpen(false);
    resetForm();
  };

  const handleDelete = (id) => {
    if (!catalog || !confirm("¿Eliminar esta promoción?")) return;
    updateCatalog({
      ...catalog,
      promotions: catalog.promotions.filter((p) => p.id !== id),
    });
  };

  const previewComponents = form.components
    .filter((c) => c.sellableId)
    .map((c) => ({
      sellableId: c.sellableId,
      label: sellableById[c.sellableId]?.name || "",
      quantity: Math.max(1, nonNegative(c.quantity || 1)),
    }));

  const previewRegular = getPromotionRegularTotal(
    { components: previewComponents },
    sellableItems
  );
  const previewPromo = nonNegative(form.price || 0);
  const previewSavings = Math.max(0, previewRegular - previewPromo);

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
        className={`px-6 py-4 flex items-center justify-between bg-brand-4/50 cursor-pointer hover:bg-brand-4/70 transition-colors ${isOpen ? "border-b border-gray-200" : ""}`}
      >
        <div className="flex items-center gap-3">
          <Gift className="text-brand-1" size={20} />
          <h2 className="text-lg font-medium text-gray-900">Promociones</h2>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openModal(null);
          }}
          disabled={sellableItems.length < 2}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-brand-1 rounded-lg hover:bg-brand-1-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-1" /> Agregar
        </button>
      </div>

      {isOpen && (
        <div>
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              Combiná productos del catálogo de miga u otros productos a un precio promocional.
            </p>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shrink-0 ${hasUnsavedChanges ? "bg-brand-1 hover:bg-brand-1-dark" : "bg-green-600 hover:bg-green-700"}`}
            >
              <Save size={16} /> {hasUnsavedChanges ? "Guardar Promociones *" : "Guardar Promociones"}
            </button>
          </div>

          {sellableItems.length < 2 && (
            <div className="px-6 py-4 text-sm text-brand-1-dark bg-brand-4 border-b border-brand-3/30">
              Cargá al menos 2 productos en el catálogo de miga u otros productos antes de crear promociones.
            </div>
          )}

          {catalog.promotions.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              No hay promociones. Ej: Docena de Jamón + Gaseosa a precio combo.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promoción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Incluye</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Promo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {catalog.promotions.map((promo) => {
                  const regular = getPromotionRegularTotal(promo, sellableItems);
                  return (
                    <tr key={promo.id}>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{promo.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md">{getPromotionSummaryLabel(promo)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="font-bold text-brand-1-dark">${promo.price.toFixed(2)}</span>
                        {regular > promo.price && (
                          <span className="block text-xs text-green-600 mt-0.5">
                            Ahorro ${(regular - promo.price).toFixed(2)} (antes ${regular.toFixed(2)})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right">
                        <button onClick={() => openModal(promo)} className="text-brand-1 hover:text-brand-1-dark mr-3 inline-block">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(promo.id)} className="text-brand-1 hover:text-brand-1-dark inline-block">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-lg font-medium text-gray-900">
                {editingId ? "Editar Promoción" : "Nueva Promoción"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSavePromotion();
              }}
              className="px-6 py-4 space-y-4 overflow-y-auto flex-1"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre de la promoción</label>
                <input
                  required
                  autoFocus
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Combo Docena + Gaseosa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Productos incluidos</label>
                <div className="space-y-2">
                  {form.components.map((component, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <select
                        required={index < 2}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                        value={component.sellableId}
                        onChange={(e) => updateComponent(index, "sellableId", e.target.value)}
                      >
                        <option value="">Seleccionar producto...</option>
                        {["Miga", "Miga (unidad)", "Otros productos"].map((group) => {
                          const groupItems = sellableItems.filter((item) => item.group === group);
                          if (groupItems.length === 0) return null;
                          return (
                            <optgroup key={group} label={group}>
                              {groupItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} (${item.price.toFixed(2)})
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>
                      <input
                        type="number"
                        min="1"
                        className="w-16 px-2 py-2 text-sm border border-gray-300 rounded-lg"
                        value={component.quantity}
                        onChange={(e) => {
                          if (isAllowedNumberInput(e.target.value)) updateComponent(index, "quantity", e.target.value);
                        }}
                        title="Cantidad"
                      />
                      {form.components.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, components: form.components.filter((_, i) => i !== index) })}
                          className="p-2 text-gray-400 hover:text-brand-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, components: [...form.components, emptyComponent()] })}
                  className="mt-2 text-xs font-medium text-brand-1-dark hover:text-brand-1-dark flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Agregar otro producto
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Precio promocional ($)</label>
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

              {previewComponents.length >= 2 && (
                <div className="bg-brand-4/50 border border-brand-4 rounded-lg p-3 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">Precio normal:</span> ${previewRegular.toFixed(2)}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Precio promo:</span> ${previewPromo.toFixed(2)}
                  </p>
                  {previewSavings > 0 && (
                    <p className="text-green-700 font-semibold mt-1">
                      El cliente ahorra ${previewSavings.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-1 rounded-lg hover:bg-brand-1-dark">
                  {editingId ? "Guardar Cambios" : "Crear Promoción"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
