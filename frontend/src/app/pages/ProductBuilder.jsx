import { useState, useEffect } from "react";
import { Package, Plus, Settings2, Save, X, Calculator, Trash2, RotateCcw, Pencil, Check, ChevronDown } from "lucide-react";
import { api } from "./api.js";
import { nonNegative, isAllowedNumberInput } from "../utils/numbers.js";

function createMigaTemplate(withUnitPrices = false) {
  const rnd = () => Math.random().toString(36).substr(2, 9);
  const makePres = () => [
    { id: rnd(), name: "Docena", price: 0, recipe: [], recipe2: [] },
    { id: rnd(), name: "Media Docena", price: 0, recipe: [], recipe2: [] },
    { id: rnd(), name: "Plancha de 3", price: 0, recipe: [], recipe2: [] }
  ];
  return {
    id: rnd(),
    name: "Sándwiches de Miga",
    varieties: [
      { id: rnd(), name: "Paleta", presentations: makePres(), unitPrice: withUnitPrices ? 0 : undefined },
      { id: rnd(), name: "Jamón o Salame", presentations: makePres(), unitPrice: withUnitPrices ? 0 : undefined },
      { id: rnd(), name: "Bondiola o Crudo", presentations: makePres(), unitPrice: withUnitPrices ? 0 : undefined },
      { id: rnd(), name: "Ternera", presentations: makePres(), unitPrice: withUnitPrices ? 0 : undefined },
    ],
  };
}

function VarietyCard({
  variety,
  handleDeleteVariety,
  calculateRecipeCost,
  isEditing,
  editingPrice,
  startEditPrice,
  confirmEditPrice,
  cancelEditPrice,
  setEditingPrice,
  openRecipeModal,
  updateVarietyField,
}) {
  const [isOpen, setIsOpen] = useState(true);

  const nameLower = variety.name.toLowerCase();
  const isJamonSalame = (nameLower.includes("jamón") || nameLower.includes("jamon")) && nameLower.includes("salame");
  const isBondiolaCrudo = nameLower.includes("bondiola") && nameLower.includes("crudo");
  const isCombined = isJamonSalame || isBondiolaCrudo;
  const name1 = isJamonSalame ? "Jamón" : isBondiolaCrudo ? "Bondiola" : "";
  const name2 = isJamonSalame ? "Salame" : isBondiolaCrudo ? "Crudo" : "";

  const [editingUnitPrice, setEditingUnitPrice] = useState(false);
  const [unitPriceValue, setUnitPriceValue] = useState(String(variety.unitPrice || ""));

  const handleConfirmUnitPrice = () => {
    updateVarietyField(variety.id, 'unitPrice', nonNegative(unitPriceValue));
    setEditingUnitPrice(false);
  };

  const handleCancelUnitPrice = () => {
    setUnitPriceValue(String(variety.unitPrice || ""));
    setEditingUnitPrice(false);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className={`bg-blue-50/50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-blue-100/50 transition-colors ${isOpen ? 'border-b border-gray-200' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <h3 className="font-bold text-blue-900 text-lg flex items-center gap-2">{variety.name} <ChevronDown className={`w-5 h-5 text-blue-400 transition-transform ${isOpen ? "" : "-rotate-90"}`} /></h3>
        <button onClick={(e) => { e.stopPropagation(); handleDeleteVariety(variety.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
      </div>
      {isOpen && (
        <>
          <div className="overflow-x-auto">
            {isCombined && <h4 className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-50 border-b border-gray-200">Precios y Costos ({name1})</h4>}
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">Presentación</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600 w-40">Precio ($)</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">Costo Calculado</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center w-28">Acciones</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Insumos (Receta)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variety.presentations.map((pres) => {
                  const cost = calculateRecipeCost(pres.recipe || []);
                  const margin = cost > 0 ? ((pres.price - cost) / cost) * 100 : 0;
                  const editing = isEditing(variety.id, pres.id);
                  return (
                    <tr key={pres.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{pres.name}</td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <input
                            autoFocus
                            type="text"
                            inputMode="decimal"
                            value={editingPrice.value}
                            onChange={(e) => { if (isAllowedNumberInput(e.target.value)) setEditingPrice({ ...editingPrice, value: e.target.value }); }}
                            onKeyDown={(e) => { if (e.key === "Enter") confirmEditPrice(); if (e.key === "Escape") cancelEditPrice(); }}
                            className="w-full px-3 py-1.5 border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0.00"
                          />
                        ) : (
                          <span className="font-semibold text-gray-800">${pres.price.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">${cost.toFixed(2)}</span>
                          {pres.price > 0 && cost > 0 && <span className={`text-xs font-medium ${margin >= 70 ? "text-green-600" : "text-red-500"}`}>Margen: {margin.toFixed(1)}%</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={confirmEditPrice} title="Guardar" className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-lg"><Check size={15} /></button>
                            <button onClick={cancelEditPrice} title="Cancelar" className="p-1.5 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg"><X size={15} /></button>
                          </div>
                        ) : (
                          <button onClick={() => startEditPrice(variety.id, pres.id, pres.price)} title="Editar precio" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={15} /></button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openRecipeModal(variety.id, pres, 'recipe', name1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                          <Settings2 size={16} /> Configurar Costos {isCombined ? name1 : ""}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {typeof variety.unitPrice !== 'undefined' && (
            <div className="p-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Precio por Unidad:</span>
                {editingUnitPrice ? (
                  <input
                    autoFocus
                    type="text"
                    inputMode="decimal"
                    value={unitPriceValue}
                    onChange={(e) => { if (isAllowedNumberInput(e.target.value)) setUnitPriceValue(e.target.value); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleConfirmUnitPrice(); if (e.key === "Escape") handleCancelUnitPrice(); }}
                    className="w-24 px-2 py-1 border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                  />
                ) : (
                  <span className="font-bold text-blue-800 text-lg">${(variety.unitPrice || 0).toFixed(2)}</span>
                )}
              </div>
              {editingUnitPrice ? (
                <div className="flex items-center gap-1">
                  <button onClick={handleConfirmUnitPrice} title="Guardar" className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-lg"><Check size={15} /></button>
                  <button onClick={handleCancelUnitPrice} title="Cancelar" className="p-1.5 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg"><X size={15} /></button>
                </div>
              ) : (
                <button onClick={() => { setUnitPriceValue(String(variety.unitPrice || "")); setEditingUnitPrice(true); }} title="Editar precio unitario" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Pencil size={15} />
                </button>
              )}
            </div>
          )}
          {isCombined && (
            <div className="overflow-x-auto border-t border-gray-200">
              <h4 className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-50 border-b border-gray-200">Costos ({name2})</h4>
              <table className="w-full text-left">
                {/* ... (table for recipe2, similar to above) ... */}
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function ProductBuilder({ customInputs = [] }) {
  const [product, setProduct] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const availableInsumos = customInputs.map((i) => ({
    id: i.id,
    name: i.name,
    costPerUnit: i.isFood ? i.price / 1000 : i.price,
    unitMeasure: i.isFood ? "g" : "unidad",
  }));

  const [activePresentation, setActivePresentation] = useState(null);
  const [tempRecipe, setTempRecipe] = useState([]);
  const [selectedInsumo, setSelectedInsumo] = useState("");
  const [insumoQuantity, setInsumoQuantity] = useState("");
  const [editingPrice, setEditingPrice] = useState(null); // { varId, presId, value }
  const [isAddVarietyOpen, setIsAddVarietyOpen] = useState(false);
  const [newVarName, setNewVarName] = useState("");
  const [newVarPrices, setNewVarPrices] = useState({ docena: "", media: "", plancha: "" });
  const [newVarIngredients, setNewVarIngredients] = useState([{ insumoId: "", quantity: "" }]);

  const updateProduct = (newProduct) => {
    setProduct(newProduct);
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await api.get("/catalog/MIGA");
        setProduct(saved);
        setHasUnsavedChanges(false);
      } catch {
        setProduct(createMigaTemplate(true));
        setHasUnsavedChanges(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "Tienes cambios sin guardar en el catálogo. ¿Seguro que deseas salir?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!hasUnsavedChanges) return;
      const target = e.target.closest("a");
      if (target && target.href && !target.href.includes(window.location.pathname) && target.target !== "_blank") {
        if (!window.confirm("Tienes cambios sin guardar en el catálogo. ¿Seguro que deseas salir y perder los cambios?")) {
          e.preventDefault();
        }
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [hasUnsavedChanges]);

  const handleSaveCatalog = async () => {
    if (product) {
      try {
        await api.post("/catalog/MIGA", product);
        localStorage.setItem("pos_miga_product", JSON.stringify(product));
        window.dispatchEvent(new Event("catalog-updated"));
        setHasUnsavedChanges(false);
        alert("Catálogo guardado correctamente en la base de datos.");
      } catch {
        alert("Error al guardar el catálogo.");
      }
    }
  };

  const handleDeleteVariety = (id) => {
    if (!product || !confirm("¿Estás seguro de que deseas eliminar esta variedad?")) return;
    updateProduct({ ...product, varieties: product.varieties.filter((v) => v.id !== id) });
  };

  const handleResetTemplate = () => {
    if (confirm("¿Estás seguro de que deseas resetear el catálogo a la plantilla por defecto? Esto borrará tus variedades actuales para cargar las nuevas.")) {
      updateProduct(createMigaTemplate(true));
    }
  };

  const calculateRecipeCost = (recipe) =>
    recipe.reduce((total, item) => {
      const insumo = availableInsumos.find((i) => i.id === item.insumoId);
      return total + (insumo ? insumo.costPerUnit * item.quantity : 0);
    }, 0);

  const openRecipeModal = (varId, pres, recipeKey = "recipe", subName = "") => {
    setActivePresentation({ varId, pres, recipeKey, subName });
    setTempRecipe([...(pres[recipeKey] || [])]);
  };

  const addInsumoToRecipe = () => {
    const qty = nonNegative(insumoQuantity);
    if (!selectedInsumo || qty <= 0) return;
    const existingIndex = tempRecipe.findIndex((r) => r.insumoId === selectedInsumo);
    if (existingIndex >= 0) {
      const newRecipe = [...tempRecipe];
      newRecipe[existingIndex].quantity += qty;
      setTempRecipe(newRecipe);
    } else {
      setTempRecipe([...tempRecipe, { insumoId: selectedInsumo, quantity: qty }]);
    }
    setInsumoQuantity("");
  };

  const saveRecipe = () => {
    if (!product || !activePresentation) return;
    const { varId, pres, recipeKey } = activePresentation;
    const updatedVarieties = product.varieties.map((v) => {
      if (v.id !== varId) return v;
      const isDocena = pres.name === "Docena";
      return {
        ...v,
        presentations: v.presentations.map((p) => {
          if (p.id === pres.id) return { ...p, [recipeKey]: tempRecipe };
          if (isDocena) {
            if (p.name === "Media Docena") return { ...p, [recipeKey]: tempRecipe.map((ing) => ({ ...ing, quantity: ing.quantity / 2 })) };
            if (p.name === "Plancha de 3") return { ...p, [recipeKey]: tempRecipe.map((ing) => ({ ...ing, quantity: ing.quantity / 4 })) };
          }
          return p;
        })
      };
    });
    updateProduct({ ...product, varieties: updatedVarieties });
    setActivePresentation(null);
  };

  const updatePresentationField = (varId, presId, field, value) => {
    if (!product) return;
    const safeValue = typeof value === "number" ? nonNegative(value) : value;
    const updatedVarieties = product.varieties.map((v) => {
      if (v.id !== varId) return v;
      return { ...v, presentations: v.presentations.map((p) => (p.id === presId ? { ...p, [field]: safeValue } : p)) };
    });
    updateProduct({ ...product, varieties: updatedVarieties });
  };

  const updateVarietyField = (varId, field, value) => {
    if (!product) return;
    const safeValue = typeof value === "number" ? nonNegative(value) : value;
    const updatedVarieties = product.varieties.map((v) =>
      v.id === varId ? { ...v, [field]: safeValue } : v
    );
    updateProduct({ ...product, varieties: updatedVarieties });
  };

  const startEditPrice = (varId, presId, currentPrice) => {
    setEditingPrice({ varId, presId, value: currentPrice > 0 ? String(currentPrice) : "" });
  };

  const confirmEditPrice = () => {
    if (!editingPrice) return;
    updatePresentationField(editingPrice.varId, editingPrice.presId, "price", nonNegative(editingPrice.value));
    setEditingPrice(null);
  };

  const cancelEditPrice = () => setEditingPrice(null);

  const isEditing = (varId, presId) =>
    editingPrice?.varId === varId && editingPrice?.presId === presId;

  const getRowCost = (insumoId, qtyStr) => {
    const insumo = availableInsumos.find((i) => i.id === insumoId);
    const qty = nonNegative(qtyStr);
    if (!insumo) return 0;
    return insumo.costPerUnit * qty;
  };

  const handleSaveNewVariety = () => {
    if (!product || !newVarName.trim()) { alert("Por favor, ingresa el nombre de la variedad."); return; }
    const recipe = newVarIngredients.filter((ing) => ing.insumoId && nonNegative(ing.quantity) > 0).map((ing) => ({ insumoId: ing.insumoId, quantity: nonNegative(ing.quantity) }));
    const rnd = () => Math.random().toString(36).substr(2, 9);
    const templatePresentations = product.varieties.length > 0
      ? product.varieties[0].presentations.map((p) => {
          let price = 0;
          let scale = 1;
          if (p.name === "Docena") price = nonNegative(newVarPrices.docena);
          else if (p.name === "Media Docena") { price = nonNegative(newVarPrices.media); scale = 0.5; }
          else if (p.name === "Plancha de 3") { price = nonNegative(newVarPrices.plancha); scale = 0.25; }
          const scaledRecipe = recipe.map((r) => ({ ...r, quantity: r.quantity * scale }));
          return { id: rnd(), name: p.name, price, recipe: scaledRecipe, recipe2: []};
        })
      : [
          { id: rnd(), name: "Docena", price: nonNegative(newVarPrices.docena), recipe: [...recipe], recipe2: [] },
          { id: rnd(), name: "Media Docena", price: nonNegative(newVarPrices.media), recipe: recipe.map((r) => ({ ...r, quantity: r.quantity * 0.5 })), recipe2: [] },
          { id: rnd(), name: "Plancha de 3", price: nonNegative(newVarPrices.plancha), recipe: recipe.map((r) => ({ ...r, quantity: r.quantity * 0.25 })), recipe2: [] },
        ];
    updateProduct({ ...product, varieties: [...product.varieties, { id: rnd(), name: newVarName.trim(), presentations: templatePresentations, unitPrice: 0 }] });
    setIsAddVarietyOpen(false);
  };

  return (
    <div className="space-y-6 w-full">
      {product && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Package className="text-blue-600" /> {product.name}</h2>
            <div className="flex items-center gap-3">
              <button onClick={handleResetTemplate} className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200">
                <RotateCcw size={18} /> Restaurar Plantilla
              </button>
              <button onClick={() => { setNewVarName(""); setNewVarPrices({ docena: "", media: "", plancha: "" }); setNewVarIngredients([{ insumoId: "", quantity: "" }]); setIsAddVarietyOpen(true); }} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200">
                <Plus size={18} /> Añadir Variedad
              </button>
              <button onClick={handleSaveCatalog} className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium transition-colors ${hasUnsavedChanges ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}>
                <Save size={18} /> {hasUnsavedChanges ? "Guardar Catálogo *" : "Guardar Catálogo"}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {product.varieties.map((variety) => (
              <VarietyCard
                key={variety.id}
                variety={variety}
                handleDeleteVariety={handleDeleteVariety}
                calculateRecipeCost={calculateRecipeCost}
                isEditing={isEditing}
                editingPrice={editingPrice}
                startEditPrice={startEditPrice}
                confirmEditPrice={confirmEditPrice}
                cancelEditPrice={cancelEditPrice}
                setEditingPrice={setEditingPrice}
                openRecipeModal={openRecipeModal}
                updateVarietyField={updateVarietyField}
              />
            ))}
          </div>
        </div>
      )}

      {activePresentation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Calculator className="text-blue-600" size={20} /> Receta e Insumos {activePresentation?.subName ? `(${activePresentation.subName})` : ""}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Para: {activePresentation?.pres?.name}</p>
              </div>
              <button onClick={() => setActivePresentation(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <label className="block text-sm font-medium text-blue-900 mb-2">Añadir Insumo a esta presentación</label>
                <div className="flex gap-2">
                  <select value={selectedInsumo} onChange={(e) => setSelectedInsumo(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">Seleccionar insumo...</option>
                    {availableInsumos.map((insumo) => <option key={insumo.id} value={insumo.id}>{insumo.name} (${insumo.costPerUnit.toFixed(2)} x {insumo.unitMeasure})</option>)}
                  </select>
                  <div className="w-24">
                    <input type="number" min="0" step="any" placeholder="Cant." value={insumoQuantity} onChange={(e) => { if (isAllowedNumberInput(e.target.value)) setInsumoQuantity(e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <button onClick={addInsumoToRecipe} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus size={20} /></button>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Detalle del Costo</h4>
              {tempRecipe.length === 0 ? (
                <p className="text-gray-500 text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">Aún no has agregado insumos.</p>
              ) : (
                <ul className="space-y-2">
                  {tempRecipe.map((item, idx) => {
                    const insumo = availableInsumos.find((i) => i.id === item.insumoId);
                    if (!insumo) return null;
                    const subtotal = insumo.costPerUnit * item.quantity;
                    return (
                      <li key={idx} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{insumo.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity} {insumo.unitMeasure} a ${insumo.costPerUnit}/{insumo.unitMeasure}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span>
                          <button onClick={() => setTempRecipe(tempRecipe.filter((r) => r.insumoId !== item.insumoId))} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Costo Total Calculado</p>
                <p className="text-2xl font-black text-gray-900">${calculateRecipeCost(tempRecipe).toFixed(2)}</p>
              </div>
              <button onClick={saveRecipe} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700">Confirmar Costos</button>
            </div>
          </div>
        </div>
      )}

      {isAddVarietyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Package className="text-blue-600" size={20} /> Añadir Nueva Variedad</h3>
              <button onClick={() => setIsAddVarietyOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Variedad</label>
                <input type="text" required autoFocus placeholder="Ej. Roquefort, Vegetariano" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newVarName} onChange={(e) => setNewVarName(e.target.value)} />
              </div>
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <h4 className="text-sm font-bold text-blue-900 mb-3">Precios de Venta (Opcional)</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[{ key: "docena", label: "Docena" }, { key: "media", label: "Media Docena" }, { key: "plancha", label: "Plancha de 3" }].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                      <input type="number" min="0" step="0.01" placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500" value={newVarPrices[key]} onChange={(e) => { if (isAllowedNumberInput(e.target.value)) setNewVarPrices({ ...newVarPrices, [key]: e.target.value }); }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-gray-900">Insumos (Receta Base)</label>
                  <button type="button" onClick={() => setNewVarIngredients([...newVarIngredients, { insumoId: "", quantity: "" }])} className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 px-2 py-1 rounded-md">
                    <Plus className="w-3 h-3 mr-1" /> Añadir Insumo
                  </button>
                </div>
                <div className="space-y-2">
                  {newVarIngredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:border-blue-500" value={ing.insumoId} onChange={(e) => { const newIngs = [...newVarIngredients]; newIngs[idx].insumoId = e.target.value; setNewVarIngredients(newIngs); }}>
                          <option value="">Selecciona insumo...</option>
                          {availableInsumos.map((i) => <option key={i.id} value={i.id}>{i.name} (${i.costPerUnit.toFixed(2)}/{i.unitMeasure})</option>)}
                        </select>
                      </div>
                      <div className="w-24">
                        <input type="number" min="0" step="any" placeholder="Cant." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500" value={ing.quantity} onChange={(e) => { if (!isAllowedNumberInput(e.target.value)) return; const newIngs = [...newVarIngredients]; newIngs[idx].quantity = e.target.value; setNewVarIngredients(newIngs); }} />
                      </div>
                      <div className="w-20 h-[34px] mt-1 flex items-center justify-center px-1 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
                        ${getRowCost(ing.insumoId, ing.quantity).toFixed(2)}
                      </div>
                      {newVarIngredients.length > 1 && (
                        <button type="button" onClick={() => setNewVarIngredients(newVarIngredients.filter((_, i) => i !== idx))} className="mt-1 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setIsAddVarietyOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSaveNewVariety} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">Agregar Variedad</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
