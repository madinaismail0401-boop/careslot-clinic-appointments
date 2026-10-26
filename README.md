# CareSlot — Clinic Appointment Booking System

A full-stack project aligned with the Anantahq Full Stack Developer Intern task. Clinics publish appointment slots; patients book and cancel them. The UI uses React, HTML, CSS and JavaScript; the REST API uses Node.js/Express; SQLite stores the data and enforces one active booking per slot.

## Skills demonstrated
- HTML, CSS, JavaScript and React responsive UI
- Node.js and Express REST endpoints
- SQLite schema, foreign keys, transaction handling and a partial unique index
- Input validation and useful HTTP status codes
- Automated API tests with Vitest and Supertest

## Requirements
- Node.js 20 or newer (npm included)

## Run the API
```bash
cd server
npm install
npm test
npm start
```
API listens on `http://localhost:4000`. SQLite database file `clinic.sqlite` is created in the server directory.

## Run the React UI
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
Open the local URL printed by Vite (usually `http://localhost:5173`). The UI expects the API at `http://localhost:4000/api`. Set `VITE_API_URL` if the API is hosted elsewhere.

## Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health check |
| POST | `/api/slots` | Publish an appointment slot |
| GET | `/api/slots` | List all slots (`?status=available` or `?status=cancelled`) |
| GET | `/api/slots/:id` | Read a slot |
| DELETE | `/api/slots/:id` | Cancel a slot (only when no active booking exists) |
| POST | `/api/bookings` | Book an available slot |
| GET | `/api/bookings/:id` | Read a booking |
| DELETE | `/api/bookings/:id` | Cancel a booking |

### Create a slot
```bash
curl -X POST http://localhost:4000/api/slots \
  -H 'Content-Type: application/json' \
  -d '{"clinic_name":"City Clinic","start_time":"2026-11-01T10:00:00","end_time":"2026-11-01T10:30:00"}'
```

### Book a slot
```bash
curl -X POST http://localhost:4000/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{"slot_id":1,"patient_name":"Ayesha"}'
```

### Cancel a booking
```bash
curl -X DELETE http://localhost:4000/api/bookings/1
```

## Booking safety
- A SQLite partial unique index permits at most one row with `status='booked'` per `slot_id`.
- Booking and cancellation mutations run in transactions. `BEGIN IMMEDIATE` obtains the SQLite write reservation before the availability check, serializing competing writers. The unique index is the final database-level safeguard.
- A cancelled booking remains as history, while the slot can be booked again.
- A slot cannot be cancelled while it has an active booking; cancel the booking first.
- Duplicate booking attempts return HTTP `409 Conflict`.

## Tests
```bash
cd server
npm test
```
Tests cover slot creation/listing, input validation, duplicate booking rejection, rebooking after cancellation, cancelled-slot protection, and missing slots.

## Notes before submission
- This is a task-focused demo, not a production medical system. It intentionally does not store sensitive medical records or implement authentication/authorization.
- Add screenshots of the running UI to the repository if desired. Never commit `.env`, database files, or real patient information.
