'use strict';

const { db } = require('../db');
const { paymentMethods } = require('../models/schema');
const { eq } = require('drizzle-orm');
const { assertNonNegative } = require('../utils/numbers');

function newId() {
  return crypto.randomUUID();
}

async function getAllPayments() {
  return db.select().from(paymentMethods);
}

async function createPayment(data) {
  assertNonNegative(data.surcharge, 'El recargo');
  const [payment] = await db
    .insert(paymentMethods)
    .values({ ...data, id: newId() })
    .returning();
  return payment;
}

async function updatePayment(id, data) {
  if (data.surcharge !== undefined) assertNonNegative(data.surcharge, 'El recargo');
  const [payment] = await db
    .update(paymentMethods)
    .set(data)
    .where(eq(paymentMethods.id, id))
    .returning();
  return payment;
}

async function deletePayment(id) {
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
}

module.exports = { getAllPayments, createPayment, updatePayment, deletePayment };
