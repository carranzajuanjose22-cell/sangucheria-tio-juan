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
