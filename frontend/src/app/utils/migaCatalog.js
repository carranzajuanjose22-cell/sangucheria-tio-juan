export function isUnitSaleVariety(name = "") {
  const normalized = name.toLowerCase();
  return normalized.includes("paleta") || normalized.includes("pebete");
}

export function isPebeteVariety(name = "") {
  return name.toLowerCase().includes("pebete");
}

export function isPaletaVariety(name = "") {
  return name.toLowerCase().includes("paleta");
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
  if (isPebeteVariety(variety.name)) {
    return calculateRecipeCost(variety.unitRecipe || []);
  }
  if (isPaletaVariety(variety.name)) {
    return getPaletaUnitCost(variety, calculateRecipeCost);
  }
  return 0;
}

export function normalizeMigaCatalog(product) {
  if (!product?.varieties) return product;

  const hasPebete = product.varieties.some((v) => isPebeteVariety(v.name));
  let varieties = [...product.varieties];

  if (!hasPebete) {
    const template = varieties[0]?.presentations?.map((p) => ({
      id: crypto.randomUUID(),
      name: p.name,
      price: 0,
      recipe: [],
      recipe2: [],
    })) || [
      { id: crypto.randomUUID(), name: "Docena", price: 0, recipe: [], recipe2: [] },
      { id: crypto.randomUUID(), name: "Media Docena", price: 0, recipe: [], recipe2: [] },
      { id: crypto.randomUUID(), name: "Plancha de 3", price: 0, recipe: [], recipe2: [] },
    ];

    varieties.push({
      id: crypto.randomUUID(),
      name: "Pebete",
      presentations: template,
      unitPrice: 0,
      unitRecipe: [],
    });
  }

  varieties = varieties.map((variety) => {
    if (!isUnitSaleVariety(variety.name)) {
      const { unitPrice, unitRecipe, ...rest } = variety;
      return rest;
    }

    return {
      ...variety,
      unitPrice: typeof variety.unitPrice === "number" ? variety.unitPrice : 0,
      unitRecipe: isPebeteVariety(variety.name) ? (variety.unitRecipe || []) : undefined,
    };
  });

  return { ...product, varieties };
}
