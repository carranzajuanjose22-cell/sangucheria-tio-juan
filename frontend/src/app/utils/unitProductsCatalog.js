export function normalizeUnitProductsCatalog(data) {
  if (!data) {
    return { name: "Otros Productos", products: [] };
  }

  return {
    name: data.name || "Otros Productos",
    products: (data.products || []).map((product) => ({
      id: product.id || crypto.randomUUID(),
      name: product.name || "",
      price: typeof product.price === "number" ? product.price : 0,
      wholesalePrice: typeof product.wholesalePrice === "number" ? product.wholesalePrice : 0,
    })),
  };
}

export function getUnitProductPrice(product, tier = "retail") {
  if (!product) return 0;
  if (tier === "wholesale") {
    return typeof product.wholesalePrice === "number" ? product.wholesalePrice : 0;
  }
  return product.price || 0;
}
