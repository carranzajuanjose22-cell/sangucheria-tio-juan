const moneyFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formato argentino sin centavos: $1.234.567 */
export function formatMoney(value) {
  const num = Number(value);
  const safe = Number.isNaN(num) ? 0 : num;
  const sign = safe < 0 ? "-" : "";
  return `${sign}$${moneyFormatter.format(Math.abs(safe))}`;
}

/** Gasto / débito: -$1.234 */
export function formatMoneyDebit(value) {
  const num = Math.abs(Number(value) || 0);
  return `-$${moneyFormatter.format(num)}`;
}

export function nonNegative(value, fallback = 0) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.max(0, num);
}

export function parseInputNumber(value) {
  if (value === undefined || value === null) return "";
  // Eliminamos los puntos (separador de miles en AR) para guardar/procesar el string numérico crudo.
  return value.toString().replace(/\./g, "");
}

export function formatInputNumber(value) {
  if (value === "" || value === undefined || value === null) return "";
  const clean = parseInputNumber(value);
  if (isNaN(clean) || clean === "") return value; 
  // Eliminamos cualquier parte decimal al formatear.
  const parts = clean.split(/[.,]/);
  const integerPart = parts[0];
  // Reemplazamos cada 3 ceros con un punto
  return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function isAllowedDecimalInput(value) {
  const clean = parseInputNumber(value);
  return clean === "" || /^\d*$/.test(clean);
}

export function isAllowedNumberInput(value) {
  const clean = parseInputNumber(value);
  if (clean === "" || clean === "-") return clean === "";
  const num = Number(clean);
  // Validamos si es un entero no negativo
  return !Number.isNaN(num) && num >= 0 && /^\d*$/.test(clean);
}

