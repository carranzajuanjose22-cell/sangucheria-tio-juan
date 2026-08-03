function resolveVariety(input) {
  if (input && typeof input === "object" && "name" in input) return input;
  return { name: String(input || "") };
}

function isUnitSaleVarietyByName(name = "") {
  const normalized = name.toLowerCase();
  return normalized.includes("paleta") || normalized.includes("pebete");
}

export function isUnitSaleVariety(input) {
  const variety = resolveVariety(input);
  if (variety.unitSaleEnabled) return true;
  return isUnitSaleVarietyByName(variety.name);
}

export function isPebeteVariety(name = "") {
  return name.toLowerCase().includes("pebete");
}

export function isPaletaVariety(name = "") {
  return name.toLowerCase().includes("paleta");
}

export function usesUnitRecipe(input) {
  const variety = resolveVariety(input);
  if (variety.unitCostFromRecipe) return true;
  return isPebeteVariety(variety.name);
}

export function getPresentationPrice(presentation, tier = "retail") {
  if (!presentation) return 0;
  if (tier === "wholesale") {
    return typeof presentation.wholesalePrice === "number" ? presentation.wholesalePrice : 0;
  }
  return presentation.price || 0;
}

export function getUnitSalePrice(variety, tier = "retail") {
  if (!variety) return 0;
  if (tier === "wholesale") {
    return typeof variety.unitWholesalePrice === "number" ? variety.unitWholesalePrice : 0;
  }
  return variety.unitPrice || 0;
}

export function getPlanchaPresentation(variety) {
  return variety?.presentations?.find((p) => p.name === "Plancha de 3");
}

export function getPaletaUnitCost(variety, calculateRecipeCost) {
  const plancha = getPlanchaPresentation(variety);
  if (!plancha) return 0;
  return calculateRecipeCost(plancha.recipe || []);
}

export function getUnitManufacturingCost(variety, calculateRecipeCost) {
  if (!variety) return 0;
  if (usesUnitRecipe(variety)) {
    return calculateRecipeCost(variety.unitRecipe || []);
  }
  if (isPaletaVariety(variety.name) || isUnitSaleVariety(variety)) {
    return getPaletaUnitCost(variety, calculateRecipeCost);
  }
  return 0;
}

function normalizePresentation(p) {
  return {
    ...p,
    wholesalePrice: typeof p.wholesalePrice === "number" ? p.wholesalePrice : 0,
    recipe: Array.isArray(p.recipe) ? p.recipe : [],
    recipe2: Array.isArray(p.recipe2) ? p.recipe2 : [],
  };
}

export function normalizeMigaCatalog(product) {
  if (!product?.varieties) return product;

  const hasPebete = product.varieties.some((v) => isPebeteVariety(v.name) || v.unitCostFromRecipe);
  let varieties = [...product.varieties];

  if (!hasPebete) {
    const template = varieties[0]?.presentations?.map((p) => ({
      id: crypto.randomUUID(),
      name: p.name,
      price: 0,
      wholesalePrice: 0,
      recipe: [],
      recipe2: [],
    })) || [
      { id: crypto.randomUUID(), name: "Docena", price: 0, wholesalePrice: 0, recipe: [], recipe2: [] },
      { id: crypto.randomUUID(), name: "Media Docena", price: 0, wholesalePrice: 0, recipe: [], recipe2: [] },
      { id: crypto.randomUUID(), name: "Plancha de 3", price: 0, wholesalePrice: 0, recipe: [], recipe2: [] },
    ];

    varieties.push({
      id: crypto.randomUUID(),
      name: "Pebete",
      presentations: template,
      unitSaleEnabled: true,
      unitCostFromRecipe: true,
      unitPrice: 0,
      unitWholesalePrice: 0,
      unitRecipe: [],
    });
  }

  varieties = varieties.map((variety) => {
    const normalized = {
      ...variety,
      presentations: (variety.presentations || []).map(normalizePresentation),
    };

    if (!isUnitSaleVariety(variety)) {
      const {
        unitPrice,
        unitWholesalePrice,
        unitRecipe,
        unitSaleEnabled,
        unitCostFromRecipe,
        ...rest
      } = normalized;
      return rest;
    }

    const unitCostFromRecipe = usesUnitRecipe(variety);

    return {
      ...normalized,
      unitSaleEnabled: true,
      unitCostFromRecipe,
      unitPrice: typeof variety.unitPrice === "number" ? variety.unitPrice : 0,
      unitWholesalePrice: typeof variety.unitWholesalePrice === "number" ? variety.unitWholesalePrice : 0,
      unitRecipe: unitCostFromRecipe ? (variety.unitRecipe || []) : undefined,
    };
  });

  return { ...product, varieties };
}
