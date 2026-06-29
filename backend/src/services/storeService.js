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

  const closeRecord = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    totalSalesCount: sales.length,
    totalIncome: sales.reduce((acc, sale) => acc + (sale.total || 0), 0),
    totalExpenses: expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0),
    employee: employee || 'Desconocido',
    closedBy: closedBy || employee || 'Desconocido',
    openedBy: registerState.openedBy,
    registerNumber: 'Caja 01',
    sales,
    expenses,
    initialCash: registerState.initialCash,
    openedAt: registerState.openedAt,
  };

  await setValue('pos_registers', [closeRecord, ...registers]);
  await setValue('register_state', null);
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
