'use strict';

// Additive migration: existing cash records are never rewritten or removed.
const attendanceStatements = [
  `CREATE TABLE IF NOT EXISTS AttendanceShift (
    id TEXT PRIMARY KEY, employee_id TEXT NOT NULL, employee_name TEXT NOT NULL,
    started_at INTEGER NOT NULL, ended_at INTEGER,
    duration_minutes INTEGER, version INTEGER NOT NULL DEFAULT 1,
    reviewed INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL,
    CHECK (ended_at IS NULL OR ended_at >= started_at),
    CHECK ((ended_at IS NULL AND duration_minutes IS NULL) OR
      (ended_at IS NOT NULL AND duration_minutes IS NOT NULL AND duration_minutes = CAST((ended_at-started_at)/60000 AS INTEGER)))
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS attendance_one_active ON AttendanceShift(employee_id) WHERE ended_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS attendance_employee_time ON AttendanceShift(employee_id, started_at)`,
  ...['INSERT', 'UPDATE'].map(operation => `CREATE TRIGGER IF NOT EXISTS attendance_no_overlap_${operation.toLowerCase()}
    BEFORE ${operation} ON AttendanceShift BEGIN
      SELECT RAISE(ABORT, 'attendance_overlap') WHERE EXISTS (
        SELECT 1 FROM AttendanceShift s WHERE s.employee_id = NEW.employee_id AND s.id != NEW.id
        AND NEW.started_at < COALESCE(s.ended_at, 9223372036854775807)
        AND COALESCE(NEW.ended_at, 9223372036854775807) > s.started_at
      );
    END`),
  `CREATE TABLE IF NOT EXISTS AttendanceAudit (
    id TEXT PRIMARY KEY, shift_id TEXT NOT NULL, actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL, changed_at INTEGER NOT NULL, reason TEXT NOT NULL,
    before_json TEXT NOT NULL, after_json TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS attendance_audit_shift ON AttendanceAudit(shift_id, changed_at)`,
  `CREATE TABLE IF NOT EXISTS AttendanceRequest (
    actor_id TEXT NOT NULL, request_id TEXT NOT NULL, fingerprint TEXT NOT NULL,
    response_json TEXT NOT NULL, PRIMARY KEY(actor_id, request_id)
  )`,
  `CREATE TABLE IF NOT EXISTS AttendanceLegacy (
    id TEXT PRIMARY KEY, captured_at TEXT NOT NULL, registers_json TEXT NOT NULL, open_state_json TEXT
  )`,
  `INSERT OR IGNORE INTO AttendanceLegacy(id, captured_at, registers_json, open_state_json)
    VALUES ('cash_v1', strftime('%Y-%m-%dT%H:%M:%fZ','now'),
      COALESCE((SELECT value FROM cloud_store WHERE key='pos_registers'), '[]'),
      (SELECT value FROM cloud_store WHERE key='register_state'))`,
];

async function ensureAttendanceTables(client) {
  await client.batch(attendanceStatements, 'write');
}

module.exports = { attendanceStatements, ensureAttendanceTables };
