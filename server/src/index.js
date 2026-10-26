import { createApp } from './app.js';
import { createDatabase } from './db.js';
const port = Number(process.env.PORT || 4000);
const db = createDatabase(process.env.DB_FILE || './clinic.sqlite');
createApp({ db }).listen(port, () => console.log(`Clinic Booking API running at http://localhost:${port}`));
