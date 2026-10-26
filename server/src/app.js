import express from 'express';
import cors from 'cors';
import { createDatabase } from './db.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;
function validDate(value) {
  return typeof value === 'string' && ISO_DATE.test(value) && Number.isFinite(Date.parse(value));
}
function httpError(status, message) { const e = new Error(message); e.status = status; return e; }

export function createApp({ db = createDatabase(':memory:') } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/slots', (req, res, next) => {
    try {
      const { clinic_name, start_time, end_time } = req.body ?? {};
      if (typeof clinic_name !== 'string' || !clinic_name.trim()) throw httpError(400, 'clinic_name is required.');
      if (!validDate(start_time) || !validDate(end_time)) throw httpError(400, 'start_time and end_time must be valid ISO local date-times, e.g. 2026-11-01T10:00:00.');
      if (Date.parse(end_time) <= Date.parse(start_time)) throw httpError(400, 'end_time must be later than start_time.');
      const result = db.prepare('INSERT INTO slots (clinic_name,start_time,end_time) VALUES (?,?,?)').run(clinic_name.trim(), start_time, end_time);
      res.status(201).json(db.prepare('SELECT * FROM slots WHERE id=?').get(result.lastInsertRowid));
    } catch (e) { next(e); }
  });

  app.get('/api/slots', (req, res, next) => {
    try {
      const status = req.query.status;
      if (status && !['available','cancelled'].includes(status)) throw httpError(400, 'status must be available or cancelled.');
      const rows = status
        ? db.prepare('SELECT s.*, CASE WHEN EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id=s.id AND b.status=\'booked\') THEN 1 ELSE 0 END AS is_booked FROM slots s WHERE s.status=? ORDER BY s.start_time').all(status)
        : db.prepare('SELECT s.*, CASE WHEN EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id=s.id AND b.status=\'booked\') THEN 1 ELSE 0 END AS is_booked FROM slots s ORDER BY s.start_time').all();
      res.json(rows);
    } catch (e) { next(e); }
  });

  app.get('/api/slots/:id', (req, res, next) => {
    try {
      const slot = db.prepare('SELECT * FROM slots WHERE id=?').get(Number(req.params.id));
      if (!slot) throw httpError(404, 'Appointment slot not found.');
      res.json(slot);
    } catch (e) { next(e); }
  });

  app.delete('/api/slots/:id', (req, res, next) => {
    try {
      const cancel = db.transaction((id) => {
        const slot = db.prepare('SELECT * FROM slots WHERE id=?').get(id);
        if (!slot) throw httpError(404, 'Appointment slot not found.');
        if (db.prepare("SELECT 1 FROM bookings WHERE slot_id=? AND status='booked'").get(id)) throw httpError(409, 'Cancel the active booking before cancelling this slot.');
        db.prepare("UPDATE slots SET status='cancelled' WHERE id=?").run(id);
        return db.prepare('SELECT * FROM slots WHERE id=?').get(id);
      });
      res.json(cancel(Number(req.params.id)));
    } catch (e) { next(e); }
  });

  app.post('/api/bookings', (req, res, next) => {
    try {
      const { slot_id, patient_name } = req.body ?? {};
      if (!Number.isSafeInteger(slot_id) || slot_id < 1) throw httpError(400, 'slot_id must be a positive integer.');
      if (typeof patient_name !== 'string' || !patient_name.trim()) throw httpError(400, 'patient_name is required.');
      // better-sqlite3 transactions are synchronous; BEGIN IMMEDIATE serializes competing writes.
      const book = db.transaction((slotId, name) => {
        const slot = db.prepare('SELECT * FROM slots WHERE id=?').get(slotId);
        if (!slot) throw httpError(404, 'Appointment slot not found.');
        if (slot.status !== 'available') throw httpError(409, 'This appointment slot has been cancelled.');
        if (db.prepare("SELECT 1 FROM bookings WHERE slot_id=? AND status='booked'").get(slotId)) throw httpError(409, 'This appointment slot is already booked.');
        const result = db.prepare('INSERT INTO bookings (slot_id,patient_name) VALUES (?,?)').run(slotId, name.trim());
        return db.prepare('SELECT * FROM bookings WHERE id=?').get(result.lastInsertRowid);
      });
      res.status(201).json(book.immediate(Number(slot_id), patient_name));
    } catch (e) {
      if (String(e.message).includes('one_active_booking_per_slot') || String(e.message).includes('UNIQUE constraint failed: bookings.slot_id')) return res.status(409).json({ error: 'This appointment slot is already booked.' });
      next(e);
    }
  });
  app.get('/api/bookings', (req, res, next) => {
  try {
    const rows = db.prepare(`
      SELECT b.*, s.clinic_name, s.start_time, s.end_time
      FROM bookings b
      JOIN slots s ON s.id = b.slot_id
      ORDER BY b.created_at DESC, b.id DESC
    `).all();

    res.json(rows);
  } catch (e) {
    next(e);
  }
});
  app.get('/api/bookings/:id', (req, res, next) => {
    try {
      const booking = db.prepare('SELECT b.*, s.clinic_name, s.start_time, s.end_time FROM bookings b JOIN slots s ON s.id=b.slot_id WHERE b.id=?').get(Number(req.params.id));
      if (!booking) throw httpError(404, 'Booking not found.');
      res.json(booking);
    } catch (e) { next(e); }
  });

  app.delete('/api/bookings/:id', (req, res, next) => {
    try {
      const cancel = db.transaction((id) => {
        const booking = db.prepare('SELECT * FROM bookings WHERE id=?').get(id);
        if (!booking) throw httpError(404, 'Booking not found.');
        if (booking.status === 'cancelled') throw httpError(409, 'This booking is already cancelled.');
        db.prepare("UPDATE bookings SET status='cancelled' WHERE id=?").run(id);
        return db.prepare('SELECT * FROM bookings WHERE id=?').get(id);
      });
      res.json(cancel(Number(req.params.id)));
    } catch (e) { next(e); }
  });

  app.use((err, _req, res, _next) => {
    if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ error: 'Request body must be valid JSON.' });
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error.' });
  });
  return app;
}
