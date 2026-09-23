'use strict';

const { sqliteTable, text, real, integer } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');

const users = sqliteTable('User', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password'),
  role: text('role').notNull().default('Usuario'),
  status: text('status').notNull().default('Activo'),
  creadoEn: text('creadoEn').notNull().default(sql`CURRENT_TIMESTAMP`),
});

const inputItems = sqliteTable('InputItem', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isFood: integer('isFood', { mode: 'boolean' }).notNull().default(true),
  price: real('price').notNull(),
  creadoEn: text('creadoEn').notNull().default(sql`CURRENT_TIMESTAMP`),
  actualizado: text('actualizado').notNull().default(sql`CURRENT_TIMESTAMP`),
});

const services = sqliteTable('Service', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  cost: real('cost').notNull(),
  creadoEn: text('creadoEn').notNull().default(sql`CURRENT_TIMESTAMP`),
});

const paymentMethods = sqliteTable('PaymentMethod', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  surcharge: real('surcharge').notNull().default(0),
  creadoEn: text('creadoEn').notNull().default(sql`CURRENT_TIMESTAMP`),
});

const catalog = sqliteTable('Catalog', {
  id: text('id').primaryKey(),
  type: text('type').notNull().unique(),
  descripcion: text('descripcion'),
  data: text('data').notNull(),
  creadoEn: text('creadoEn').notNull().default(sql`CURRENT_TIMESTAMP`),
  actualizado: text('actualizado').notNull().default(sql`CURRENT_TIMESTAMP`),
});

const cloud_store = sqliteTable('cloud_store', {
  key: text('key').primaryKey(),
  value: text('value'),
});

const subscription = sqliteTable('Subscription', {
  id: text('id').primaryKey(),
  cutoffDay: integer('cutoffDay'),
  paidThrough: text('paidThrough'),
  blocked: integer('blocked', { mode: 'boolean' }).notNull().default(false),
  paymentWarning: integer('paymentWarning', { mode: 'boolean' }).notNull().default(false),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`),
});

const subscriptionPayments = sqliteTable('SubscriptionPayment', {
  id: text('id').primaryKey(),
  paidAt: text('paidAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  paidThrough: text('paidThrough').notNull(),
  amount: real('amount'),
  notes: text('notes'),
  createdBy: text('createdBy').references(() => users.id),
});

module.exports = { users, inputItems, services, paymentMethods, catalog, cloud_store, subscription, subscriptionPayments };
