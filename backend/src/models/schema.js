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

const attendanceShifts = sqliteTable('AttendanceShift', {
  id: text('id').primaryKey(), employeeId: text('employee_id').notNull(),
  employeeName: text('employee_name').notNull(), startedAt: integer('started_at').notNull(),
  endedAt: integer('ended_at'), durationMinutes: integer('duration_minutes'),
  version: integer('version').notNull().default(1), reviewed: integer('reviewed').notNull().default(0),
  createdAt: integer('created_at').notNull(),
});
const attendanceAudit = sqliteTable('AttendanceAudit', {
  id: text('id').primaryKey(), shiftId: text('shift_id').notNull(),
  actorId: text('actor_id').notNull(), actorName: text('actor_name').notNull(),
  changedAt: integer('changed_at').notNull(), reason: text('reason').notNull(),
  beforeJson: text('before_json').notNull(), afterJson: text('after_json').notNull(),
});
const attendanceLegacy = sqliteTable('AttendanceLegacy', {
  id: text('id').primaryKey(), capturedAt: text('captured_at').notNull(),
  registersJson: text('registers_json').notNull(), openStateJson: text('open_state_json'),
});
const attendanceRequests = sqliteTable('AttendanceRequest', {
  actorId: text('actor_id').notNull(), requestId: text('request_id').notNull(),
  fingerprint: text('fingerprint').notNull(), responseJson: text('response_json').notNull(),
});

module.exports = { users, inputItems, services, paymentMethods, catalog, cloud_store, subscription, subscriptionPayments,
  attendanceShifts, attendanceAudit, attendanceLegacy, attendanceRequests };
