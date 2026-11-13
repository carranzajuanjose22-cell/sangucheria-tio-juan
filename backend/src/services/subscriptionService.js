'use strict';

const DAY_MS = 86400000;

function businessDate(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
}

function cutoffDate(year, month, day) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Fin del día en Argentina (UTC-3), independiente de la zona del servidor.
  return new Date(Date.UTC(year, month - 1, Math.min(day, lastDay) + 1, 3) - 1);
}

function endOfDay(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return cutoffDate(year, month, day);
  }
  return new Date(value);
}

function nextCutoff(day, from = new Date()) {
  const { year, month } = businessDate(from);
  const candidate = cutoffDate(year, month, day);
  return candidate <= from ? cutoffDate(year, month + 1, day) : candidate;
}

function subscriptionStatus(config, now = new Date()) {
  const paidThrough = config.paidThrough ? endOfDay(config.paidThrough) : null;
  const invalidDate = paidThrough && !Number.isFinite(paidThrough.getTime());
  const isExpired = Boolean(config.blocked) || !paidThrough || invalidDate || paidThrough <= now;
  const daysRemaining = isExpired ? 0 : Math.max(0, Math.ceil((paidThrough - now) / DAY_MS));
  return {
    cutoffDay: config.cutoffDay == null ? null : Number(config.cutoffDay),
    paidThrough: config.paidThrough || null,
    blocked: Boolean(config.blocked),
    paymentWarning: Boolean(config.paymentWarning),
    isExpired: Boolean(isExpired),
    isWarningPhase: !isExpired && daysRemaining <= 5,
    daysRemaining,
    updatedAt: config.updatedAt || null,
  };
}

function invalid(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function createSubscriptionService(client, clock = () => new Date()) {
  async function getConfig() {
    const result = await client.execute({ sql: 'SELECT * FROM Subscription WHERE id = ?', args: ['main'] });
    return result.rows[0] || {};
  }
  async function getStatus() {
    return subscriptionStatus(await getConfig(), clock());
  }
  async function setCutoffDay(day) {
    if (!Number.isInteger(day) || day < 1 || day > 31) throw invalid('El día de corte debe ser un entero entre 1 y 31.');
    const paidThrough = nextCutoff(day, clock()).toISOString();
    await client.execute({
      sql: `UPDATE Subscription SET cutoffDay = ?, paidThrough = ?, blocked = 0,
            updatedAt = CURRENT_TIMESTAMP WHERE id = 'main'`,
      args: [day, paidThrough],
    });
    return getStatus();
  }
  async function renew({ amount = null, notes = null, userId = null } = {}) {
    if (amount != null && (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0)) throw invalid('El importe debe ser un número válido.');
    const config = await getConfig();
    if (!config.cutoffDay) throw invalid('Primero se debe configurar un día de corte.');
    const paidThrough = nextCutoff(Number(config.cutoffDay), clock()).toISOString();
    await client.batch([
      {
        sql: `UPDATE Subscription SET paidThrough = ?, blocked = 0, paymentWarning = 0,
              updatedAt = CURRENT_TIMESTAMP WHERE id = 'main'`,
        args: [paidThrough],
      },
      {
        sql: `INSERT INTO SubscriptionPayment (id, paidThrough, amount, notes, createdBy) VALUES (?, ?, ?, ?, ?)`,
        args: [crypto.randomUUID(), paidThrough, amount, notes, userId],
      },
    ], 'write');
    return getStatus();
  }
  async function setBlocked(blocked) {
    if (typeof blocked !== 'boolean') throw invalid('El bloqueo debe ser verdadero o falso.');
    await client.execute({
      sql: `UPDATE Subscription SET blocked = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = 'main'`,
      args: [blocked ? 1 : 0],
    });
    return getStatus();
  }
  async function setPaymentWarning(active) {
    if (typeof active !== 'boolean') throw invalid('El aviso de pago debe ser verdadero o falso.');
    await client.execute({
      sql: `UPDATE Subscription SET paymentWarning = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = 'main'`,
      args: [active ? 1 : 0],
    });
    return getStatus();
  }
  async function getPayments() {
    return (await client.execute('SELECT * FROM SubscriptionPayment ORDER BY paidAt DESC LIMIT 100')).rows;
  }
  return { getStatus, setCutoffDay, renew, setBlocked, setPaymentWarning, getPayments };
}

// La conexión productiva se abre solo cuando se usa el servicio; las pruebas inyectan su propia BD.
let production;
const service = () => production ||= createSubscriptionService(require('../db').client);
module.exports = { createSubscriptionService, subscriptionStatus, nextCutoff };
for (const method of ['getStatus', 'setCutoffDay', 'renew', 'setBlocked', 'setPaymentWarning', 'getPayments']) {
  module.exports[method] = (...args) => service()[method](...args);
}
