const moneyFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formato argentino: $1.234.567,89 */
export function formatMoney(value) {
  const num = Number(value);
  const safe = Number.isNaN(num) ? 0 : num;
  const sign = safe < 0 ? "-" : "";
  return `${sign}$${moneyFormatter.format(Math.abs(safe))}`;
}

/** Gasto / débito: -$1.234,56 */
export function formatMoneyDebit(value) {
  const num = Math.abs(Number(value) || 0);
  return `-$${moneyFormatter.format(num)}`;
}

export function nonNegative(value, fallback = 0) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.max(0, num);
}

export function isAllowedDecimalInput(value) {
  return value === "" || /^\d*\.?\d*$/.test(value);
}

export function isAllowedNumberInput(value) {
  if (value === "" || value === "-") return value === "";
  const num = Number(value);
  return !Number.isNaN(num) && num >= 0;
}
