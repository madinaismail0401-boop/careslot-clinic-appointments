import Database from 'better-sqlite3';

export function createDatabase(filename = process.env.DB_FILE || './clinic.sqlite') {
  const db = new Database(filename);
  // WAL improves reader/writer coexistence. SQLite still serializes writes.
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clinic_name TEXT NOT NULL CHECK(length(trim(clinic_name)) > 0),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','cancelled')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK(end_time > start_time)
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_id INTEGER NOT NULL REFERENCES slots(id),
      patient_name TEXT NOT NULL CHECK(length(trim(patient_name)) > 0),
      status TEXT NOT NULL DEFAULT 'booked' CHECK(status IN ('booked','cancelled')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_booking_per_slot
      ON bookings(slot_id) WHERE status = 'booked';
  `);
  return db;
}
