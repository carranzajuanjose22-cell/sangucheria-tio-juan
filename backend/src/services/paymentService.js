'use strict';

const { db } = require('../db');
const { paymentMethods } = require('../models/schema');
const { eq } = require('drizzle-orm');

function newId() {
  return crypto.randomUUID();
}

async function getAllPayments() {
  return db.select().from(paymentMethods);
}

async function createPayment(data) {
  const [payment] = await db
    .insert(paymentMethods)
    .values({ ...data, id: newId() })
    .returning();
  return payment;
}

async function updatePayment(id, data) {
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
