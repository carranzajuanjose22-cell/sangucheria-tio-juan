/** Lunes 00:00 → domingo 23:59 del calendario actual. */
export function getWeekRange(now = new Date()) {
  const start = new Date(now);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/** Día 1 00:00 → último día del mes 23:59. */
export function getMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getTodayRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getRangeBounds(rangeId, now = new Date()) {
  if (rangeId === "today") return getTodayRange(now);
  if (rangeId === "week") return getWeekRange(now);
  if (rangeId === "month") return getMonthRange(now);
  return null;
}

export function isDateInRange(dateInput, rangeId, now = new Date()) {
  if (rangeId === "all") return true;

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return false;

  const bounds = getRangeBounds(rangeId, now);
  if (!bounds) return true;

  return date >= bounds.start && date <= bounds.end;
}

export function clipIntervalHours(startInput, endInput, rangeId, now = new Date()) {
  const startMs = new Date(startInput).getTime();
  const endMs = new Date(endInput).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return 0;

  const bounds = getRangeBounds(rangeId, now);
  if (!bounds) return (endMs - startMs) / 3600000;

  const clippedStart = Math.max(startMs, bounds.start.getTime());
  const clippedEnd = Math.min(endMs, bounds.end.getTime());
  if (clippedEnd <= clippedStart) return 0;

  return (clippedEnd - clippedStart) / 3600000;
}

export function intervalOverlapsRange(startInput, endInput, rangeId, now = new Date()) {
  if (rangeId === "all") return true;

  const startMs = new Date(startInput).getTime();
  const endMs = new Date(endInput).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return false;

  const bounds = getRangeBounds(rangeId, now);
  if (!bounds) return true;

  return startMs <= bounds.end.getTime() && endMs >= bounds.start.getTime();
}
