import { useState, useEffect } from "react";
import { Package, Plus, Settings2, Save, X, Calculator, Trash2 } from "lucide-react";
import { api } from "./api";

// ==========================================
// 1. ESQUEMA DE DATOS (Tipos e Interfaces)
// ==========================================

export type UnitMeasure = "g" | "unidad" | "ml";

export type Insumo = {
  id: string;
  name: string;
  costPerUnit: number;
  unitMeasure: UnitMeasure;
};

export type RecipeItem = {
  insumoId: string;
  quantity: number;
};

export type PresentationName = string;

export type Presentation = {
  id: string;
  name: PresentationName;
  price: number;
  stock: number;
  recipe: RecipeItem[];
};

export type Variety = {
  id: string;
  name: string;
  presentations: Presentation[];
};

export type BaseProduct = {
  id: string;
  name: string;
  varieties: Variety[];
};

// ==========================================
// 2. LÓGICA DE PREDETERMINACIÓN (Template)
// ==========================================

const createMigaTemplate = (): BaseProduct => ({
  id: Math.random().toString(36).substr(2, 9),
  name: "Sándwiches de Miga",
  varieties: [
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Paleta",
      presentations: [
        { id: Math.random().toString(36).substr(2, 9), name: "Docena", price: 0, stock: 0, recipe: [] },
        { id: Math.random().toString(36).substr(2, 9), name: "Media Docena", price: 0, stock: 0, recipe: [] },
        { id: Math.random().toString(36).substr(2, 9), name: "Plancha de 3", price: 0, stock: 0, recipe: [] },
      ]
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Jamón o Salame",
      presentations: [
        { id: Math.random().toString(36).substr(2, 9), name: "Docena", price: 0, stock: 0, recipe: [] },
        { id: Math.random().toString(36).substr(2, 9), name: "Media Docena", price: 0, stock: 0, recipe: [] },
        { id: Math.random().toString(36).substr(2, 9), name: "Plancha de 3", price: 0, stock: 0, recipe: [] },
      ]
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Bondiola / Crudo",
      presentations: [
        { id: Math.random().toString(36).substr(2, 9), name: "Docena", price: 0, stock: 0, recipe: [] },
        { id: Math.random().toString(36).substr(2, 9), name: "Media Docena", price: 0, stock: 0, recipe: [] },
        { id: Math.random().toString(36).substr(2, 9), name: "Plancha de 3", price: 0, stock: 0, recipe: [] },
      ]
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Ternera",
      presentations: [
        { id: Math.random().toString(36).substr(2, 9), name: "Docena", price: 0, stock: 0, recipe: [] },
        { id: Math.random().toString(36).substr(2, 9), name: "Media Docena", price: 0, stock: 0, recipe: [] },
        { id: Math.random().toString(36).substr(2, 9), name: "Plancha de 3", price: 0, stock: 0, recipe: [] },
      ]
    }
  ]
});

// ==========================================
// 3. COMPONENTE DE CARGA E INTERFAZ
// ==========================================

export function ProductBuilder({ customInputs = [] }: { customInputs?: any[] }) {
  const [product, setProduct] = useState<BaseProduct | null>(null);
  
  const availableInsumos: Insumo[] = customInputs.map(i => ({
    id: i.id,
    name: i.name,
    // Si es alimenticio (isFood), el precio está en Kg, por lo tanto dividimos por 1000 para el costo por gramo
    costPerUnit: i.isFood ? i.price / 1000 : i.price,
    unitMeasure: i.isFood ? "g" : "unidad"
  }));

  // Estados para el Modal de Insumos (Receta)
  const [activePresentation, setActivePresentation] = useState<{ varId: string; pres: Presentation } | null>(null);
  const [tempRecipe, setTempRecipe] = useState<RecipeItem[]>([]);
  const [selectedInsumo, setSelectedInsumo] = useState("");
  const [insumoQuantity, setInsumoQuantity] = useState("");

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const saved = await api.get("/catalog/MIGA");
        setProduct(saved);
      } catch (error) {
        // Si da error (ej: 404, no existe en la BD), usamos el template por defecto
        setProduct(createMigaTemplate());
      }
    };
    loadCatalog();
  }, []);

  const handleSaveCatalog = async () => {
    if (product) {
      try {
        await api.post("/catalog/MIGA", product);
        alert("Catálogo guardado correctamente en la base de datos.");
      } catch (error) {
        alert("Error al guardar el catálogo.");
      }
    }
  };

  const [isAddVarietyOpen, setIsAddVarietyOpen] = useState(false);
  const [newVarName, setNewVarName] = useState("");
  const [newVarPrices, setNewVarPrices] = useState({ docena: "", media: "", plancha: "" });
  const [newVarIngredients, setNewVarIngredients] = useState<{insumoId: string, quantity: string}[]>([{insumoId: "", quantity: ""}]);

  const openAddVarietyModal = () => {
    setNewVarName("");
    setNewVarPrices({ docena: "", media: "", plancha: "" });
    setNewVarIngredients([{insumoId: "", quantity: ""}]);
    setIsAddVarietyOpen(true);
  };

  const handleSaveNewVariety = () => {
    if (!product) return;
    if (!newVarName.trim()) {
      alert("Por favor, ingresa el nombre de la variedad.");
      return;
    }

    const recipe: RecipeItem[] = newVarIngredients
      .filter(ing => ing.insumoId && parseFloat(ing.quantity) > 0)
      .map(ing => ({ insumoId: ing.insumoId, quantity: parseFloat(ing.quantity) }));

    const templatePresentations = product.varieties.length > 0 
      ? product.varieties[0].presentations.map(p => {
          let price = 0;
          if (p.name === "Docena") price = parseFloat(newVarPrices.docena) || 0;
          else if (p.name === "Media Docena") price = parseFloat(newVarPrices.media) || 0;
          else if (p.name === "Plancha de 3") price = parseFloat(newVarPrices.plancha) || 0;
          
          return {
            id: Math.random().toString(36).substr(2, 9),
            name: p.name,
            price: price,
            stock: 0,
            recipe: [...recipe]
          };
        })
      : [
          { id: Math.random().toString(36).substr(2, 9), name: "Docena", price: parseFloat(newVarPrices.docena) || 0, stock: 0, recipe: [...recipe] },
          { id: Math.random().toString(36).substr(2, 9), name: "Media Docena", price: parseFloat(newVarPrices.media) || 0, stock: 0, recipe: [...recipe] },
          { id: Math.random().toString(36).substr(2, 9), name: "Plancha de 3", price: parseFloat(newVarPrices.plancha) || 0, stock: 0, recipe: [...recipe] }
        ];

    const newVariety: Variety = {
      id: Math.random().toString(36).substr(2, 9),
      name: newVarName.trim(),
      presentations: templatePresentations as Presentation[]
    };

    setProduct({ ...product, varieties: [...product.varieties, newVariety] });
    setIsAddVarietyOpen(false);
  };

  const addVarietyIngredientRow = () => {
    setNewVarIngredients([...newVarIngredients, { insumoId: "", quantity: "" }]);
  };

  const updateVarietyIngredient = (index: number, field: "insumoId" | "quantity", value: string) => {
    const newIngs = [...newVarIngredients];
    newIngs[index][field] = value;
    setNewVarIngredients(newIngs);
  };

  const removeVarietyIngredient = (index: number) => {
    setNewVarIngredients(newVarIngredients.filter((_, i) => i !== index));
  };

  const getRowCost = (insumoId: string, qtyStr: string) => {
    const insumo = availableInsumos.find(i => i.id === insumoId);
    const qty = parseFloat(qtyStr);
    if (!insumo || isNaN(qty)) return 0;
    return insumo.costPerUnit * qty;
  };

  const handleDeleteVariety = (id: string) => {
    if (!product) return;
    if (confirm("¿Estás seguro de que deseas eliminar este producto de la tabla?")) {
      setProduct({ ...product, varieties: product.varieties.filter(v => v.id !== id) });
    }
  };

  const calculateRecipeCost = (recipe: RecipeItem[]) => {
    return recipe.reduce((total, item) => {
      const insumo = availableInsumos.find(i => i.id === item.insumoId);
      return total + (insumo ? insumo.costPerUnit * item.quantity : 0);
    }, 0);
  };

  const openRecipeModal = (varId: string, pres: Presentation) => {
    setActivePresentation({ varId, pres });
    setTempRecipe([...pres.recipe]);
  };

  const addInsumoToRecipe = () => {
    const qty = parseFloat(insumoQuantity);
    if (!selectedInsumo || isNaN(qty) || qty <= 0) return;

    const existingIndex = tempRecipe.findIndex(r => r.insumoId === selectedInsumo);
    if (existingIndex >= 0) {
      const newRecipe = [...tempRecipe];
      newRecipe[existingIndex].quantity += qty;
      setTempRecipe(newRecipe);
    } else {
      setTempRecipe([...tempRecipe, { insumoId: selectedInsumo, quantity: qty }]);
    }
    setInsumoQuantity("");
  };

  const removeInsumo = (insumoId: string) => {
    setTempRecipe(tempRecipe.filter(r => r.insumoId !== insumoId));
  };

  const saveRecipe = () => {
    if (!product || !activePresentation) return;
    
    const updatedVarieties = product.varieties.map(v => {
      if (v.id === activePresentation.varId) {
        return {
          ...v,
          presentations: v.presentations.map(p => 
            p.id === activePresentation.pres.id ? { ...p, recipe: tempRecipe } : p
          )
        };
      }
      return v;
    });

    setProduct({ ...product, varieties: updatedVarieties });
    setActivePresentation(null);
  };

  const updatePresentationField = (varId: string, presId: string, field: "price" | "stock", value: number) => {
    if (!product) return;
    const updatedVarieties = product.varieties.map(v => {
      if (v.id === varId) {
        return {
          ...v,
          presentations: v.presentations.map(p => 
            p.id === presId ? { ...p, [field]: value } : p
          )
        };
      }
      return v;
    });
    setProduct({ ...product, varieties: updatedVarieties });
  };

  return (
    <div className="space-y-6 w-full">
      {product && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-blue-600" />
              {product.name}
            </h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={openAddVarietyModal}
              className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors"
            >
              <Plus size={18} />
              Añadir Variedad
            </button>
            <button 
              onClick={handleSaveCatalog}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Save size={18} />
              Guardar Catálogo
            </button>
          </div>
          </div>

          <div className="p-6 space-y-8">
            {product.varieties.map(variety => (
              <div key={variety.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-blue-50/50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-bold text-blue-900 text-lg">{variety.name}</h3>
                  <button
                    onClick={() => handleDeleteVariety(variety.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar producto"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-600">Presentación</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-600 w-32">Precio ($)</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-600 w-32">Stock</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-600">Costo Calculado</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Insumos (Receta)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {variety.presentations.map(pres => {
                        const cost = calculateRecipeCost(pres.recipe);
                        const margin = pres.price > 0 ? ((pres.price - cost) / pres.price) * 100 : 0;

                        return (
                          <tr key={pres.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{pres.name}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={pres.price || ""}
                                onChange={(e) => updatePresentationField(variety.id, pres.id, "price", parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={pres.stock || ""}
                                onChange={(e) => updatePresentationField(variety.id, pres.id, "stock", parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">${cost.toFixed(2)}</span>
                                {pres.price > 0 && cost > 0 && (
                                  <span className={`text-xs font-medium ${margin >= 40 ? 'text-green-600' : 'text-red-500'}`}>
                                    Margen: {margin.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => openRecipeModal(variety.id, pres)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                              >
                                <Settings2 size={16} />
                                Configurar Costos
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE RECETA / INSUMOS */}
      {activePresentation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Calculator className="text-blue-600" size={20} />
                  Receta e Insumos
                </h3>
                <p className="text-sm text-gray-500 mt-1">Para: {activePresentation.pres.name}</p>
              </div>
              <button onClick={() => setActivePresentation(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Cargar Insumo */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <label className="block text-sm font-medium text-blue-900 mb-2">Añadir Insumo a esta presentación</label>
                <div className="flex gap-2">
                  <select
                    value={selectedInsumo}
                    onChange={(e) => setSelectedInsumo(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">Seleccionar insumo...</option>
                    {availableInsumos.map(insumo => (
                      <option key={insumo.id} value={insumo.id}>
                        {insumo.name} (${insumo.costPerUnit} x {insumo.unitMeasure})
                      </option>
                    ))}
                  </select>
                  
                  <div className="w-24 relative">
                    <input
                      type="number"
                      placeholder="Cant."
                      value={insumoQuantity}
                      onChange={(e) => setInsumoQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <button 
                    onClick={addInsumoToRecipe}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 flex-shrink-0"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Listado de la Receta */}
              <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Detalle del Costo</h4>
              {tempRecipe.length === 0 ? (
                <p className="text-gray-500 text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                  Aún no has agregado insumos a esta presentación.
                </p>
              ) : (
                <ul className="space-y-2">
                  {tempRecipe.map((item, idx) => {
                    const insumo = availableInsumos.find(i => i.id === item.insumoId);
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
                          <button onClick={() => removeInsumo(item.insumoId)} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
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
              <button 
                onClick={saveRecipe}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Confirmar Costos
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL AÑADIR VARIEDAD */}
      {isAddVarietyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Package className="text-blue-600" size={20} />
                Añadir Nueva Variedad
              </h3>
              <button onClick={() => setIsAddVarietyOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Variedad</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej. Roquefort, Vegetariano"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                />
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <h4 className="text-sm font-bold text-blue-900 mb-3">Precios de Venta (Opcional)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Docena</label>
                    <input type="number" placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500" value={newVarPrices.docena} onChange={(e) => setNewVarPrices({...newVarPrices, docena: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Media Docena</label>
                    <input type="number" placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500" value={newVarPrices.media} onChange={(e) => setNewVarPrices({...newVarPrices, media: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Plancha de 3</label>
                    <input type="number" placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500" value={newVarPrices.plancha} onChange={(e) => setNewVarPrices({...newVarPrices, plancha: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-gray-900">Insumos (Receta Base)</label>
                  <button type="button" onClick={addVarietyIngredientRow} className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 px-2 py-1 rounded-md">
                    <Plus className="w-3 h-3 mr-1" /> Añadir Insumo
                  </button>
                </div>
                
                <div className="space-y-2">
                  {newVarIngredients.map((ing, idx) => {
                    const cost = getRowCost(ing.insumoId, ing.quantity);
                    return (
                      <div key={idx} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <select
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:border-blue-500"
                            value={ing.insumoId}
                            onChange={(e) => updateVarietyIngredient(idx, "insumoId", e.target.value)}
                          >
                            <option value="">Selecciona insumo...</option>
                            {availableInsumos.map((i) => (
                              <option key={i.id} value={i.id}>{i.name} (${i.costPerUnit.toFixed(2)}/{i.unitMeasure})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            placeholder="Cant."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                            value={ing.quantity}
                            onChange={(e) => updateVarietyIngredient(idx, "quantity", e.target.value)}
                          />
                        </div>
                        <div className="w-20 flex flex-col justify-center mt-1">
                          <div className="h-[34px] w-full flex items-center justify-center px-1 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
                            ${cost.toFixed(2)}
                          </div>
                        </div>
                        {newVarIngredients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVarietyIngredient(idx)}
                            className="mt-1 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setIsAddVarietyOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveNewVariety} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Agregar Variedad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}