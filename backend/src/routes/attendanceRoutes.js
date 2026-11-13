'use strict';

const express = require('express');
const { createAttendanceService } = require('../services/attendanceService');
const { ensureAttendanceTables } = require('../models/attendanceSchema');

function createAttendanceRouter(service, authenticate, ready = async () => {}) {
  const router = express.Router();
  router.use(authenticate);
  router.use(async (_req, _res, next) => { try { await ready(); next(); } catch (error) { next(error); } });
  const run = handler => async (req, res) => {
    try { res.json(await handler(req)); }
    catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'No se pudo completar la operación de jornada. Reintentá.' }); }
  };
  router.get('/me', run(req => service.me(req.user)));
  router.post('/start', run(req => service.start(req.user, req.body?.requestId)));
  router.post('/:id/finish', run(req => service.finish(req.user, req.params.id, req.body?.requestId)));
  router.get('/admin', run(req => service.admin(req.user, req.query)));
  router.get('/legacy', run(req => service.legacy(req.user)));
  router.get('/:id/audit', run(req => service.audit(req.user, req.params.id)));
  router.put('/:id', run(req => service.correct(req.user, req.params.id, req.body || {})));
  return router;
}

function createProductionRouter() {
  const { authMiddleware } = require('../middleware/auth');
  const { client } = require('../db');
  let initialization;
  const ready = () => initialization ||= ensureAttendanceTables(client).catch(error => { initialization = null; throw error; });
  return createAttendanceRouter(createAttendanceService(client), authMiddleware, ready);
}

module.exports = { createAttendanceRouter, createProductionRouter };
