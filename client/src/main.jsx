
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Plus,
  RefreshCw,
  Stethoscope,
  Trash2,
  Users,
} from 'lucide-react';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const fmt = (value) =>
  new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

function App() {
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [clinic, setClinic] = useState('Willow Family Clinic');
  const [start, setStart] = useState('2026-11-01T10:00');
  const [end, setEnd] = useState('2026-11-01T10:30');

  const [patient, setPatient] = useState('');
  const [selected, setSelected] = useState('');
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  async function api(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  }

  async function refresh() {
    try {
      const [slotData, bookingData] = await Promise.all([
        api('/slots'),
        api('/bookings'),
      ]);

      setSlots(slotData);
      setBookings(bookingData);
    } catch (e) {
      setNotice({
        type: 'error',
        text: `${e.message} — make sure the API server is running.`,
      });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const available = slots.filter(
    (slot) => slot.status === 'available' && !slot.is_booked
  );

  async function createSlot(e) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);

    try {
      await api('/slots', {
        method: 'POST',
        body: JSON.stringify({
          clinic_name: clinic,
          start_time: start.length === 16 ? `${start}:00` : start,
          end_time: end.length === 16 ? `${end}:00` : end,
        }),
      });

      setNotice({
        type: 'success',
        text: 'Appointment slot published.',
      });

      await refresh();
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function book(e) {
    e.preventDefault();

    if (!selected) {
      setNotice({
        type: 'error',
        text: 'Choose an available appointment first.',
      });
      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      const booking = await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          slot_id: Number(selected),
          patient_name: patient,
        }),
      });

      setBookings((old) => [booking, ...old]);
      setPatient('');
      setSelected('');

      setNotice({
        type: 'success',
        text: `Booking confirmed. Your booking ID is #${booking.id}.`,
      });

      await refresh();
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function cancelBooking(id) {
    try {
      await api(`/bookings/${id}`, { method: 'DELETE' });

      setBookings((old) =>
        old.map((booking) =>
          booking.id === id
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      );

      setNotice({
        type: 'success',
        text: `Booking #${id} cancelled.`,
      });

      await refresh();
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    }
  }

  async function cancelSlot(id) {
    try {
      await api(`/slots/${id}`, { method: 'DELETE' });

      setNotice({
        type: 'success',
        text: 'Slot cancelled.',
      });

      await refresh();
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    }
  }

  function scrollToSection(e, sectionId) {
    e.preventDefault();

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  const activeBookings = bookings.filter(
    (booking) => booking.status === 'booked'
  ).length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#top"
          onClick={(e) => scrollToSection(e, 'top')}
        >
          <span className="brand-mark">
            <HeartPulse size={21} />
          </span>
          <span>
            care<span className="brand-accent">slot</span>
          </span>
        </a>

        <nav>
          <a
            className="nav-active"
            href="#appointments"
            onClick={(e) => scrollToSection(e, 'appointments')}
          >
            Appointments
          </a>

          <a
            href="#publish"
            onClick={(e) => scrollToSection(e, 'publish')}
          >
            Clinic dashboard
          </a>
        </nav>

        <div className="profile">
          <span className="avatar">CS</span>
          <span>
            <b>Care team</b>
            <small>Clinic portal</small>
          </span>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div>
            <div className="eyebrow">
              <span className="live-dot" />
              APPOINTMENT MANAGEMENT
            </div>

            <h1>
              Better care starts
              <br />
              with <span>the right time.</span>
            </h1>

            <p>
              Publish clinic availability and help patients book the care they
              need, without the scheduling chaos.
            </p>

            <a
              className="primary-link"
              href="#appointments"
              onClick={(e) => scrollToSection(e, 'appointments')}
            >
              Explore appointments <span>↗</span>
            </a>
          </div>

          <div className="hero-art">
            <div className="orb orb-one" />
            <div className="orb orb-two" />

            <div className="calendar-illustration">
              <div className="cal-top">
                <HeartPulse size={19} />
                <span>CLINIC SCHEDULE</span>
                <span className="cal-dots">•••</span>
              </div>

              <div className="cal-date">
                <b>November</b>
                <span>2026</span>
              </div>

              <div className="cal-grid">
                {[
                  'M', 'T', 'W', 'T', 'F', 'S', 'S',
                  '26', '27', '28', '29', '30', '31', '1',
                  '2', '3', '4', '5', '6', '7', '8',
                  '9', '10', '11', '12', '13', '14', '15',
                ].map((day, index) => (
                  <span
                    key={index}
                    className={day === '1' ? 'selected-day' : ''}
                  >
                    {day}
                  </span>
                ))}
              </div>

              <div className="cal-confirm">
                <CheckCircle2 size={17} />
                <span>
                  <b>Appointment ready</b>
                  <small>10:00 AM · General care</small>
                </span>
              </div>
            </div>

            <div className="float-card">
              <span className="float-icon">
                <Stethoscope size={18} />
              </span>
              <span>
                <b>Care made simple</b>
                <small>One slot at a time</small>
              </span>
            </div>
          </div>
        </section>

        {notice && (
          <div className={`notice ${notice.type}`} role="status">
            {notice.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <Activity size={18} />
            )}

            <span>{notice.text}</span>

            <button
              onClick={() => setNotice(null)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        <section className="stats">
          <div className="stat-card">
            <span className="stat-icon purple">
              <CalendarDays />
            </span>
            <span>
              <small>Published slots</small>
              <b>
                {slots.filter((slot) => slot.status === 'available').length}
              </b>
            </span>
            <span className="stat-foot">Across all clinics</span>
          </div>

          <div className="stat-card">
            <span className="stat-icon green">
              <CheckCircle2 />
            </span>
            <span>
              <small>Available now</small>
              <b>{available.length}</b>
            </span>
            <span className="stat-foot">Ready to be booked</span>
          </div>

          <div className="stat-card">
            <span className="stat-icon peach">
              <Users />
            </span>
            <span>
              <small>My bookings</small>
              <b>{activeBookings}</b>
            </span>
            <span className="stat-foot">Confirmed appointments</span>
          </div>
        </section>

        <section className="workspace" id="appointments">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR CARE, ORGANIZED</span>
              <h2>
                Appointment <span>workspace</span>
              </h2>
              <p>
                Browse open slots or publish availability for your clinic.
              </p>
            </div>

            <button className="ghost-button" onClick={refresh}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          <div className="content-grid">
            <div className="panel slots-panel">
              <div className="panel-heading">
                <div>
                  <h3>Available appointments</h3>
                  <p>Choose a time that works for you.</p>
                </div>
                <span className="count-pill">{available.length} open</span>
              </div>

              <div className="slot-list">
                {slots.length === 0 ? (
                  <div className="empty">
                    <CalendarDays size={27} />
                    <b>No slots published yet</b>
                    <span>
                      Publish the first clinic slot using the form.
                    </span>
                  </div>
                ) : (
                  slots.map((slot) => (
                    <article
                      className={`slot-card ${
                        slot.status !== 'available' || slot.is_booked
                          ? 'muted'
                          : ''
                      }`}
                      key={slot.id}
                    >
                      <div className="slot-date">
                        <b>
                          {new Date(slot.start_time).toLocaleDateString([], {
                            day: '2-digit',
                          })}
                        </b>
                        <span>
                          {new Date(slot.start_time).toLocaleDateString([], {
                            month: 'short',
                          })}
                        </span>
                      </div>

                      <div className="slot-info">
                        <b>{slot.clinic_name}</b>
                        <span>
                          <Clock3 size={14} />
                          {fmt(slot.start_time)} –{' '}
                          {new Date(slot.end_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <small>Appointment slot #{slot.id}</small>
                      </div>

                      <div className="slot-actions">
                        {slot.status !== 'available' ? (
                          <span className="status cancelled">Cancelled</span>
                        ) : slot.is_booked ? (
                          <span className="status booked">Booked</span>
                        ) : (
                          <button
                            className={`select-button ${
                              selected === String(slot.id) ? 'chosen' : ''
                            }`}
                            onClick={() => setSelected(String(slot.id))}
                          >
                            {selected === String(slot.id)
                              ? 'Selected'
                              : 'Select slot'}
                          </button>
                        )}

                        {slot.status === 'available' && !slot.is_booked && (
                          <button
                            className="icon-button"
                            title="Cancel slot"
                            aria-label={`Cancel slot ${slot.id}`}
                            onClick={() => cancelSlot(slot.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>

              <div className="panel-footer">
                <span>
                  <span className="key-dot available-dot" /> Available
                </span>
                <span>
                  <span className="key-dot booked-dot" /> Booked
                </span>
                <span>
                  <span className="key-dot cancelled-dot" /> Cancelled
                </span>
              </div>
            </div>

            <aside className="side-column">
              <div className="panel booking-panel">
                <div className="form-icon">
                  <CalendarDays size={20} />
                </div>

                <h3>Book an appointment</h3>
                <p>Confirm your details to reserve a time.</p>

                <form onSubmit={book}>
                  <label htmlFor="patient">Patient name</label>
                  <input
                    id="patient"
                    value={patient}
                    onChange={(e) => setPatient(e.target.value)}
                    placeholder="Enter full name"
                    required
                    maxLength={100}
                  />

                  <label htmlFor="selected-slot">
                    Selected appointment
                  </label>
                  <select
                    id="selected-slot"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    required
                  >
                    <option value="">Choose a time slot</option>
                    {available.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.clinic_name} · {fmt(slot.start_time)}
                      </option>
                    ))}
                  </select>

                  <button
                    className="submit-button"
                    disabled={busy || !available.length}
                  >
                    {busy ? 'Please wait…' : 'Confirm booking'} <span>→</span>
                  </button>
                </form>

                <div className="secure-note">
                  <CheckCircle2 size={14} />
                  Your appointment is confirmed by the server.
                </div>
              </div>

              <div className="panel publish-panel" id="publish">
                <div className="panel-heading compact">
                  <div>
                    <h3>
                      <Plus size={17} /> Publish a slot
                    </h3>
                    <p>Clinic team access</p>
                  </div>
                </div>

                <form onSubmit={createSlot}>
                  <label htmlFor="clinic">Clinic name</label>
                  <input
                    id="clinic"
                    value={clinic}
                    onChange={(e) => setClinic(e.target.value)}
                    required
                    maxLength={100}
                  />

                  <label htmlFor="start">Start date &amp; time</label>
                  <input
                    id="start"
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    required
                  />

                  <label htmlFor="end">End date &amp; time</label>
                  <input
                    id="end"
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    required
                  />

                  <button className="submit-button dark" disabled={busy}>
                    {busy ? 'Publishing…' : 'Publish availability'}{' '}
                    <span>→</span>
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </section>

        <footer>
          <a
            className="brand footer-brand"
            href="#top"
            onClick={(e) => scrollToSection(e, 'top')}
          >
            <span className="brand-mark">
              <HeartPulse size={18} />
            </span>
            <span>
              care<span className="brand-accent">slot</span>
            </span>
          </a>

          <span>Thoughtful scheduling for better care.</span>

          <span className="footer-status">
            <span className="live-dot" /> Booking system UI
          </span>
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
