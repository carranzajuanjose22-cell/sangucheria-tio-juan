'use strict';

function assertNonNegative(value, fieldName) {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    throw new Error(`${fieldName} debe ser mayor o igual a 0`);
  }
  return num;
}

function validateCatalogData(data) {
  if (!data?.varieties) return;

  for (const variety of data.varieties) {
    for (const presentation of variety.presentations || []) {
      if (presentation.price !== undefined) {
        assertNonNegative(presentation.price, 'El precio');
      }
      for (const item of presentation.recipe || []) {
        if (item.quantity !== undefined) {
          assertNonNegative(item.quantity, 'La cantidad de insumo');
        }
      }
    }
  }
}

module.exports = { assertNonNegative, validateCatalogData };
