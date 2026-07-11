import { isUnitSaleVariety } from "./migaCatalog.js";

export function normalizePromotionsCatalog(data) {
  if (!data) {
    return { name: "Promociones", promotions: [] };
  }

  return {
    name: data.name || "Promociones",
    promotions: (data.promotions || []).map((promo) => ({
      id: promo.id || crypto.randomUUID(),
      name: promo.name || "",
      price: typeof promo.price === "number" ? promo.price : 0,
      components: (promo.components || []).map((c) => ({
        sellableId: c.sellableId || "",
        label: c.label || "",
        quantity: typeof c.quantity === "number" ? c.quantity : 1,
      })).filter((c) => c.sellableId),
    })).filter((p) => p.name.trim() && p.components.length >= 2),
  };
}

export function buildSellableItems(migaProduct, otrosProduct) {
  const items = [];

  for (const variety of migaProduct?.varieties || []) {
    for (const pres of variety.presentations || []) {
      items.push({
        id: `miga:${variety.id}:${pres.id}`,
        group: "Miga",
        name: `${pres.name} de ${variety.name}`,
        price: pres.price || 0,
      });
    }

    if (isUnitSaleVariety(variety)) {
      items.push({
        id: `miga-unit:${variety.id}`,
        group: "Miga (unidad)",
        name: `${variety.name} (Unidad)`,
        price: variety.unitPrice || 0,
      });
    }
  }

  for (const product of otrosProduct?.products || []) {
    if (!product.name?.trim()) continue;
    items.push({
      id: `other:${product.id}`,
      group: "Otros productos",
      name: product.name,
      price: product.price || 0,
    });
  }

  return items.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
}

export function getPromotionRegularTotal(promotion, sellableItems) {
  const byId = Object.fromEntries(sellableItems.map((i) => [i.id, i]));
  return promotion.components.reduce((sum, component) => {
    const item = byId[component.sellableId];
    if (!item) return sum;
    return sum + item.price * (component.quantity || 1);
  }, 0);
}

export function getPromotionSummaryLabel(promotion) {
  return promotion.components.map((c) => {
    const qty = c.quantity > 1 ? `${c.quantity}x ` : "";
    return `${qty}${c.label}`;
  }).join(" + ");
}
