'use strict';

const { client } = require('../db');

function endOfDay(date) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function nextCutoff(cutoffDay, from = new Date()) {
  const candidate = new Date(from.getFullYear(), from.getMonth(), 1, 23, 59, 59, 999);
  candidate.setDate(Math.min(cutoffDay, new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate()));
  if (candidate <= from) {
    candidate.setMonth(candidate.getMonth() + 1, 1);
    candidate.setDate(Math.min(cutoffDay, new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate()));
  }
  return candidate;
}

async function getConfig() {
  const result = await client.execute({
    sql: 'SELECT * FROM Subscription WHERE id = ?',
    args: ['main'],
  });
  return result.rows[0] || {};
}

function toStatus(config) {
  const now = new Date();
  const paidThrough = config.paidThrough ? endOfDay(config.paidThrough) : null;
  const invalidDate = paidThrough && Number.isNaN(paidThrough.getTime());
  const isExpired = Boolean(config.blocked) || !paidThrough || invalidDate || paidThrough <= now;
  const daysRemaining = isExpired ? 0 : Math.max(0, Math.ceil((paidThrough - now) / 86400000));
  return {
    cutoffDay: config.cutoffDay == null ? null : Number(config.cutoffDay),
    paidThrough: config.paidThrough || null,
    blocked: Boolean(config.blocked),
    paymentWarning: Boolean(config.paymentWarning),
    isExpired,
    isWarningPhase: !isExpired && daysRemaining <= 5,
    daysRemaining,
    updatedAt: config.updatedAt || null,
  };
}

async function getStatus() {
  return toStatus(await getConfig());
}

async function setCutoffDay(day) {
  const paidThrough = nextCutoff(day).toISOString();
  await client.execute({
    sql: `UPDATE Subscription SET cutoffDay = ?, paidThrough = ?, blocked = 0,
          updatedAt = CURRENT_TIMESTAMP WHERE id = 'main'`,
    args: [day, paidThrough],
  });
  return getStatus();
}

async function renew({ amount = null, notes = null, userId = null } = {}) {
  const config = await getConfig();
  if (!config.cutoffDay) throw new Error('Primero se debe configurar un día de corte.');
  const paidThrough = nextCutoff(Number(config.cutoffDay)).toISOString();
  await client.batch([
    {
      sql: `UPDATE Subscription SET paidThrough = ?, blocked = 0, paymentWarning = 0,
            updatedAt = CURRENT_TIMESTAMP WHERE id = 'main'`,
      args: [paidThrough],
    },
    {
      sql: `INSERT INTO SubscriptionPayment
            (id, paidThrough, amount, notes, createdBy) VALUES (?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), paidThrough, amount, notes, userId],
    },
  ], 'write');
  return getStatus();
}

async function setBlocked(blocked) {
  await client.execute({
    sql: `UPDATE Subscription SET blocked = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = 'main'`,
    args: [blocked ? 1 : 0],
  });
  return getStatus();
}

async function setPaymentWarning(active) {
  await client.execute({
    sql: `UPDATE Subscription SET paymentWarning = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = 'main'`,
    args: [active ? 1 : 0],
  });
  return getStatus();
}

async function getPayments() {
  const result = await client.execute('SELECT * FROM SubscriptionPayment ORDER BY paidAt DESC LIMIT 100');
  return result.rows;
}

module.exports = { getStatus, setCutoffDay, renew, setBlocked, setPaymentWarning, getPayments };
