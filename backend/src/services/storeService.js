'use strict';

const { db } = require('../db');
const { cloud_store } = require('../models/schema');
const { eq } = require('drizzle-orm');

const ALLOWED_KEYS = new Set([
  'register_state',
  'pos_sales',
  'pos_expenses',
  'pos_pending_orders',
  'pos_registers',
  'pos_purchases',
]);

function assertAllowedKey(key) {
  if (!ALLOWED_KEYS.has(key)) {
    const error = new Error(`Clave de almacenamiento no permitida: ${key}`);
    error.status = 400;
    throw error;
  }
}

async function getValue(key) {
  assertAllowedKey(key);
  const result = await db.select().from(cloud_store).where(eq(cloud_store.key, key));
  if (result.length === 0 || result[0].value == null) {
    return null;
  }
  try {
    return JSON.parse(result[0].value);
  } catch {
    const error = new Error(`Datos corruptos para la clave "${key}"`);
    error.status = 500;
    throw error;
  }
}

async function setValue(key, data) {
  assertAllowedKey(key);
  const value = JSON.stringify(data);
  const existing = await db.select().from(cloud_store).where(eq(cloud_store.key, key));
  if (existing.length > 0) {
    await db.update(cloud_store).set({ value }).where(eq(cloud_store.key, key));
  } else {
    await db.insert(cloud_store).values({ key, value });
  }
}

async function appendToArray(key, item, idField = 'id') {
  assertAllowedKey(key);
  const current = (await getValue(key)) || [];
  if (!Array.isArray(current)) {
    const error = new Error(`La clave "${key}" no contiene un array`);
    error.status = 400;
    throw error;
  }
  if (item?.[idField] && current.some((entry) => entry[idField] === item[idField])) {
    return { items: current, duplicate: true };
  }
  const items = [...current, item];
  await setValue(key, items);
  return { items, duplicate: false };
}

function isCashPaymentMethod(method) {
  const normalized = String(method || '').toLowerCase().trim();
  return normalized === 'efectivo' || normalized === 'seña' || normalized === 'sena';
}

function getCashFromSales(sales) {
  return (sales || []).reduce((sum, sale) => {
    if (sale.payments?.length > 0) {
      return sum + sale.payments.reduce(
        (paymentSum, payment) => (
          isCashPaymentMethod(payment.method)
            ? paymentSum + (Number(payment.amount) || 0)
            : paymentSum
        ),
        0
      );
    }

    const legacyMethod = String(sale.paymentMethod || '').toLowerCase();
    if (legacyMethod.includes('efectivo') && !legacyMethod.includes('débito') && !legacyMethod.includes('debito')) {
      return sum + (Number(sale.total) || 0);
    }
    if (isCashPaymentMethod(sale.paymentMethod)) {
      return sum + (Number(sale.total) || 0);
    }

    return sum;
  }, 0);
}

function calculateRegisterCashSummary(initialCash, sales, expenses) {
  const initial = Number(initialCash) || 0;
  const cashSales = getCashFromSales(sales);
  const totalExpenses = (expenses || []).reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const totalIncome = (sales || []).reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

  return {
    initialCash: initial,
    cashSales,
    totalExpenses,
    totalIncome,
    totalSalesCount: (sales || []).length,
    expectedCash: initial + cashSales - totalExpenses,
  };
}

function getShiftDurationHours(openedAt, closedAt) {
  if (!openedAt || !closedAt) return 0;
  const start = new Date(openedAt).getTime();
  const end = new Date(closedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return (end - start) / 3600000;
}

async function closeRegister({ employee, closedBy }) {
  const registerState = await getValue('register_state');
  if (!registerState?.isOpen) {
    const error = new Error('No hay caja abierta');
    error.status = 400;
    throw error;
  }

  const pendingOrders = (await getValue('pos_pending_orders')) || [];
  if (pendingOrders.length > 0) {
    const error = new Error(
      `Hay ${pendingOrders.length} pedido(s) en preparación sin resolver.`
    );
    error.status = 400;
    throw error;
  }

  const sales = (await getValue('pos_sales')) || [];
  const expenses = (await getValue('pos_expenses')) || [];
  const registers = (await getValue('pos_registers')) || [];
  const cashSummary = calculateRegisterCashSummary(registerState.initialCash, sales, expenses);
  const closedAt = new Date().toISOString();
  const opener = registerState.openedBy || null;
  const closer = closedBy || employee || 'Desconocido';
  const samePersonShift = Boolean(opener && closer && opener === closer);
  const shiftHours = samePersonShift
    ? getShiftDurationHours(registerState.openedAt, closedAt)
    : 0;
  const shiftWorker = samePersonShift ? closer : null;

  const closeRecord = {
    id: crypto.randomUUID(),
    date: closedAt,
    totalSalesCount: cashSummary.totalSalesCount,
    totalIncome: cashSummary.totalIncome,
    totalExpenses: cashSummary.totalExpenses,
    cashSales: cashSummary.cashSales,
    expectedCash: cashSummary.expectedCash,
    employee: employee || 'Desconocido',
    closedBy: closer,
    openedBy: registerState.openedBy,
    registerNumber: 'Caja 01',
    sales,
    expenses,
    initialCash: registerState.initialCash,
    openedAt: registerState.openedAt,
    shiftHours,
    shiftWorker,
  };

  await setValue('pos_registers', [closeRecord, ...registers]);
  await setValue('register_state', {
    isOpen: false,
    lastClosure: {
      registerId: closeRecord.id,
      closedAt: closeRecord.date,
      openedAt: registerState.openedAt,
      openedBy: registerState.openedBy,
      closedBy: closeRecord.closedBy,
      employee: closeRecord.employee,
      ...cashSummary,
    },
  });
  await setValue('pos_sales', []);
  await setValue('pos_expenses', []);
  await setValue('pos_pending_orders', []);

  return closeRecord;
}

module.exports = {
  ALLOWED_KEYS,
  getValue,
  setValue,
  appendToArray,
  closeRegister,
};
