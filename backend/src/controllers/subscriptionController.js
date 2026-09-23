'use strict';

const service = require('../services/subscriptionService');

async function status(_req, res, next) {
  try { res.json(await service.getStatus()); } catch (error) { next(error); }
}

async function configure(req, res, next) {
  try {
    const day = Number(req.body?.cutoffDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      return res.status(400).json({ error: 'El día de corte debe ser un entero entre 1 y 31.' });
    }
    res.json(await service.setCutoffDay(day));
  } catch (error) { next(error); }
}

async function renew(req, res, next) {
  try {
    const amount = req.body?.amount == null ? null : Number(req.body.amount);
    if (amount != null && (!Number.isFinite(amount) || amount < 0)) {
      return res.status(400).json({ error: 'El importe debe ser un número válido.' });
    }
    res.json(await service.renew({ amount, notes: req.body?.notes || null, userId: req.user.userId }));
  } catch (error) { next(error); }
}

async function block(req, res, next) {
  try { res.json(await service.setBlocked(true)); } catch (error) { next(error); }
}

async function unblock(req, res, next) {
  try { res.json(await service.setBlocked(false)); } catch (error) { next(error); }
}

async function paymentWarning(req, res, next) {
  try { res.json(await service.setPaymentWarning(Boolean(req.body?.active))); } catch (error) { next(error); }
}

async function payments(_req, res, next) {
  try { res.json(await service.getPayments()); } catch (error) { next(error); }
}

module.exports = { status, configure, renew, block, unblock, paymentWarning, payments };
