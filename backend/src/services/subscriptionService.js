'use strict';

const DAY_MS = 86400000;

function validateDeadline(value) {
  if (value === null) return null;
  if (typeof value === 'string' && /^(?:[1-9]|[12]\d|3[01])$/.test(value)) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(value) && Number.isFinite(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  const error = new Error('El vencimiento debe ser un día entre 1 y 31, una fecha ISO UTC o null.');
  error.status = 400;
  throw error;
}

// El calendario del negocio y el reloj del servidor son iguales para todos los equipos.
function subscriptionStatus(settings, now = new Date()) {
  const deadline = validateDeadline(settings.deadline ?? null);
  let isExpired = false;
  let isWarningPhase = false;
  let daysRemaining = 0;

  if (deadline && deadline.length <= 2) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: 'numeric', day: 'numeric',
    }).formatToParts(now);
    const calendar = Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
    const daysInMonth = new Date(Date.UTC(calendar.year, calendar.month, 0)).getUTCDate();
    const difference = Math.min(Number(deadline), daysInMonth) - calendar.day;
    daysRemaining = Math.max(0, difference);
    isExpired = difference < 0;
    isWarningPhase = !isExpired && difference <= 5;
  } else if (deadline) {
    const difference = Date.parse(deadline) - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(difference / DAY_MS));
    isExpired = difference <= 0;
    isWarningPhase = !isExpired && difference <= 5 * DAY_MS;
  }

  return { deadline, paymentWarning: settings.paymentWarning === true, isExpired, isWarningPhase, daysRemaining };
}

function createSubscriptionService(client, clock = () => new Date()) {
  async function getStatus() {
    const { rows } = await client.execute({
      sql: 'SELECT key, value FROM cloud_store WHERE key IN (?, ?)',
      args: ['subscription_deadline', 'payment_warning'],
    });
    const values = Object.fromEntries(rows.map(({ key, value }) => [key, value]));
    return subscriptionStatus({
      deadline: values.subscription_deadline ?? null,
      paymentWarning: values.payment_warning === 'true',
    }, clock());
  }

  async function update(patch) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch) ||
        Object.keys(patch).length === 0 || Object.keys(patch).some((key) => !['deadline', 'paymentWarning'].includes(key))) {
      const error = new Error('Configuración de suscripción inválida.');
      error.status = 400;
      throw error;
    }
    const updates = [];
    if (Object.hasOwn(patch, 'deadline')) updates.push(['subscription_deadline', validateDeadline(patch.deadline)]);
    if (Object.hasOwn(patch, 'paymentWarning')) {
      if (typeof patch.paymentWarning !== 'boolean') {
        const error = new Error('El aviso de pago debe ser verdadero o falso.');
        error.status = 400;
        throw error;
      }
      updates.push(['payment_warning', String(patch.paymentWarning)]);
    }
    await client.batch(updates.map((args) => ({
      sql: 'INSERT INTO cloud_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      args,
    })), 'write');
    return getStatus();
  }

  return { getStatus, update };
}

module.exports = { createSubscriptionService, subscriptionStatus };
