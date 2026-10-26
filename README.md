# CareSlot — Clinic Appointment Booking System

A full-stack clinic appointment booking application built as a portfolio project aligned with the Anantahq Full Stack Developer Intern task.

Clinics can publish appointment slots, and patients can book or cancel appointments. The frontend uses React, HTML, CSS, and JavaScript. The backend uses Node.js and Express, with SQLite for data storage.

## Features

- Publish clinic appointment slots
- View appointment slots and their statuses
- Book and cancel appointments
- Validate appointment details and time ranges
- Prevent multiple active bookings for the same slot
- Allow a slot to be booked again after cancellation
- Protect slots with active bookings from cancellation
- Automated API tests

## Skills Demonstrated

- HTML, CSS, JavaScript, and React
- Responsive user interface development
- Node.js and Express REST APIs
- SQLite, foreign keys, transactions, and partial unique indexes
- Input validation and HTTP status codes
- API testing with Vitest and Supertest

## Requirements

- Node.js 20 or newer
- npm

## Getting Started

### 1. Run the API

Open a terminal in the project root:

```bash
cd server
npm install
npm test
npm start
```

The API runs at `http://localhost:4000`.

The SQLite database file is created in the server directory when the application initializes.

### 2. Run the React UI

Open a second terminal in the project root:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

The frontend expects the API at `http://localhost:4000/api` by default. Set `VITE_API_URL` if the API is hosted elsewhere.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health check |
| POST | `/api/slots` | Publish an appointment slot |
| GET | `/api/slots` | List slots; supports status filtering |
| GET | `/api/slots/:id` | Read a slot |
| DELETE | `/api/slots/:id` | Cancel a slot if no active booking exists |
| POST | `/api/bookings` | Book an available slot |
| GET | `/api/bookings` | List bookings |
| GET | `/api/bookings/:id` | Read a booking |
| DELETE | `/api/bookings/:id` | Cancel a booking |

## Example API Requests

### Create a Slot

```bash
curl -X POST http://localhost:4000/api/slots \
  -H "Content-Type: application/json" \
  -d '{"clinic_name":"City Clinic","start_time":"2026-11-01T10:00:00","end_time":"2026-11-01T10:30:00"}'
```

### Book a Slot

```bash
curl -X POST http://localhost:4000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"slot_id":1,"patient_name":"Ayesha"}'
```

### Cancel a Booking

```bash
curl -X DELETE http://localhost:4000/api/bookings/1
```

These examples assume the API is running locally and that the slot ID exists when creating a booking.

## Booking Safety

- A SQLite partial unique index allows at most one booking with `status='booked'` per slot.
- Booking and cancellation operations use database transactions.
- `BEGIN IMMEDIATE` obtains a SQLite write reservation before the availability check, helping serialize competing writers.
- Cancelled bookings remain in the database as history, and their slots can be booked again.
- A slot cannot be cancelled while it has an active booking.
- Duplicate booking attempts return HTTP `409 Conflict`.

## Tests

Run the automated API tests:

```bash
cd server
npm test
```

Tests cover slot creation and listing, input validation, duplicate booking prevention, rebooking after cancellation, cancelled-slot protection, and missing slots.

## Project Limitations

This is a task-focused portfolio demo, not a production medical system. It does not store sensitive medical records or implement authentication and authorization.

Never commit `.env` files, credentials, private database files, or real patient information.
