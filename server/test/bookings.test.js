import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDatabase } from '../src/db.js';

let db, app;
beforeEach(() => { db = createDatabase(':memory:'); app = createApp({ db }); });
afterEach(() => db.close());
async function makeSlot(overrides = {}) {
  return request(app).post('/api/slots').send({ clinic_name: 'City Clinic', start_time: '2026-11-01T10:00:00', end_time: '2026-11-01T10:30:00', ...overrides });
}

describe('clinic appointment rules', () => {
  it('creates and lists appointment slots', async () => {
    const created = await makeSlot();
    expect(created.status).toBe(201);
    const list = await request(app).get('/api/slots');
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].clinic_name).toBe('City Clinic');
  });
  it('validates required fields and time order', async () => {
    expect((await makeSlot({ clinic_name: ' ' })).status).toBe(400);
    expect((await makeSlot({ start_time: '2026-11-01T11:00:00', end_time: '2026-11-01T10:00:00' })).status).toBe(400);
  });
  it('allows only one active booking for a slot', async () => {
    await makeSlot();
    expect((await request(app).post('/api/bookings').send({ slot_id: 1, patient_name: 'Ayesha' })).status).toBe(201);
    const second = await request(app).post('/api/bookings').send({ slot_id: 1, patient_name: 'Sara' });
    expect(second.status).toBe(409);
    expect(second.body.error).toMatch(/already booked/i);
  });
  it('allows rebooking after cancellation', async () => {
    await makeSlot();
    const booking = await request(app).post('/api/bookings').send({ slot_id: 1, patient_name: 'Ayesha' });
    expect((await request(app).delete(`/api/bookings/${booking.body.id}`)).status).toBe(200);
    expect((await request(app).post('/api/bookings').send({ slot_id: 1, patient_name: 'Sara' })).status).toBe(201);
  });
  it('does not allow booking a cancelled slot', async () => {
    await makeSlot();
    expect((await request(app).delete('/api/slots/1')).status).toBe(200);
    expect((await request(app).post('/api/bookings').send({ slot_id: 1, patient_name: 'Ayesha' })).status).toBe(409);
  });
  it('returns helpful validation errors', async () => {
    expect((await request(app).post('/api/bookings').send({ slot_id: 'abc', patient_name: '' })).status).toBe(400);
    expect((await request(app).post('/api/bookings').send({ slot_id: 99, patient_name: 'Ayesha' })).status).toBe(404);
  });
});
