import { clipIntervalHours, intervalOverlapsRange, isDateInRange } from "./dateRanges.js";

export function getShiftDurationHours(openedAt, closedAt) {
  if (!openedAt || !closedAt) return 0;
  const start = new Date(openedAt).getTime();
  const end = new Date(closedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return (end - start) / 3600000;
}

export function formatShiftHours(hours) {
  const totalMinutes = Math.round(Math.max(0, hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function getShiftCloser(record) {
  return record?.closedBy || record?.employee || null;
}

/** Turno completo: la misma persona abrió y cerró la caja. */
export function isSamePersonShift(record) {
  const opener = record?.openedBy;
  const closer = getShiftCloser(record);
  if (opener && closer) return opener === closer;
  return !opener && !!closer;
}

/** Cajero con horas: solo quien abrió y cerró el mismo turno. */
export function getRegisterWorker(record) {
  if (!isSamePersonShift(record)) return null;
  if (record?.shiftWorker) return record.shiftWorker;
  return record?.openedBy || getShiftCloser(record) || null;
}

function shouldIncludeOpenShift(registerState, dateRange, now = new Date()) {
  if (!registerState?.isOpen || !registerState.openedAt) return false;
  if (dateRange === "all") return true;

  return intervalOverlapsRange(registerState.openedAt, now.toISOString(), dateRange, now);
}

function getClosedShiftHours(record, dateRange, now = new Date()) {
  const closedAt = record.date || record.closedAt;
  if (!closedAt) return 0;

  if (dateRange !== "all" && !isDateInRange(closedAt, dateRange, now)) {
    return 0;
  }

  if (record.shiftHours != null && !Number.isNaN(Number(record.shiftHours)) && dateRange === "all") {
    return Number(record.shiftHours);
  }

  return clipIntervalHours(record.openedAt, closedAt, dateRange, now);
}

export function buildEmployeeHoursStats(registers = [], registerState = null, dateRange = "all", now = new Date()) {
  const stats = {};

  const addShift = (worker, hours) => {
    if (!worker || worker === "Desconocido" || hours <= 0) return;
    if (!stats[worker]) stats[worker] = { hours: 0, shifts: 0 };
    stats[worker].hours += hours;
    stats[worker].shifts += 1;
  };

  registers.forEach((record) => {
    const worker = getRegisterWorker(record);
    if (!worker) return;

    const hours = getClosedShiftHours(record, dateRange, now);
    addShift(worker, hours);
  });

  if (shouldIncludeOpenShift(registerState, dateRange, now)) {
    const hours = clipIntervalHours(registerState.openedAt, now.toISOString(), dateRange, now);
    addShift(registerState.openedBy || "Desconocido", hours);
  }

  return Object.entries(stats)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.hours - a.hours);
}
