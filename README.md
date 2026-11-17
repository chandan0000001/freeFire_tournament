# RIT Esports Arena — College Free Fire Tournament Platform

A production-ready, responsive, college-exclusive esports tournament web application for organizing weekly Garena Free Fire competitions.

---

## 🎮 Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Router DOM (v6)
- **Backend**: Node.js, Express (REST API, Helmet, CORS, Joi, Express Rate Limit)
- **Database**: MongoDB (Mongoose ODM with atomic `$inc` slot reservations & unique indexes)
- **Email Delivery**: Brevo (Sendinblue) Transactional API (with local development fallback)
- **Cache & Rate Limiting**: Redis (with automatic in-memory fallback if Redis is unavailable)
- **File Uploads**: Multer with file type & size validation for match screenshot evidence
- **Deployments**: Vercel (Frontend SPA) + Render (Backend Web Service)

---

## ⚡ Core Features & Workflows

1. **Tournaments & Formats**:
   - Squad (4v4) and Solo tournaments with configurable entry fees (₹29 Squad / ₹14 Solo) and prize pools.
   - Dynamic slot capacity meter with atomic reservation preventing race-condition overbooking.
2. **Registration Without OTP**:
   - Collects team names, captain contact, college roll numbers, and player Free Fire UIDs.
   - Generates human-readable reference IDs (`RIT-FF-SQ-XXXXX` / `RIT-FF-SO-XXXXX`).
   - 1-tap WhatsApp click-to-chat button with pre-filled message for sending UPI payment proof.
3. **Manual UPI Payment Verification**:
   - Protected Admin Dashboard to inspect registrations, enter UTR numbers, and approve/reject entries.
   - Approving an entry automatically sends a Brevo confirmation email and marks it eligible for room details.
   - Rejecting an entry automatically releases the slot back to the tournament.
4. **Room ID & Password Distribution via Brevo**:
   - Securely stored credentials (`select: false` — never exposed in public queries or JSON).
   - Admin multi-selects verified participants and dispatches credentials via Brevo email.
   - Real delivery reports tracking message IDs, delivery statuses, and retry buttons for failures.
5. **Spectator Workspace & Score Recording**:
   - Official match observers record placement, kills, and Booyah results.
   - Uploads end-game scoreboard screenshots as supporting evidence.
   - Captains can also upload dispute evidence screenshots.
6. **Configurable Kill + Booyah Scoring Engine**:
   - Formula: `Total Points = (Kills × Kill Point Value) + Booyah Bonus`.
   - Automated tie-breaker hierarchy: `Booyahs > Kills > Placement`.
   - Admin reviews, edits, and officially publishes verified scorecards.
7. **Leaderboards & Hall of Fame**:
   - Real-time Squad and Individual leaderboards.
   - Public Winners Showcase honoring champions and cash prize awards.
   - Strict privacy: never exposes player phone numbers, personal emails, or payment transaction IDs.
8. **Cash Prize Management**:
   - Offline payout tracking for 1st, 2nd, 3rd, and MVP positions with internal transaction references.
9. **Security & Auditability**:
   - Role-Based Access Control (`superadmin`, `admin`, `spectator`).
   - Comprehensive audit trail recording all administrative actions.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
# Install root, server, and client dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Configure Environment Variables
Copy `.env.example` in both `server/` and `client/`:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Ensure `server/.env` contains your `MONGODB_URI`, `JWT_SECRET`, and `BREVO_API_KEY`.

### 3. Seed Database with Initial Admin & Tournaments
```bash
npm run seed
```
This populates:
- **Superadmin**: `admin@ritesports.in` / `Admin@RIT2026!`
- **Spectator**: `spectator@ritesports.in` / `Spectator@RIT2026!`
- Initial Squad and Solo Free Fire tournaments and college settings.

### 4. Run Development Servers
```bash
# Run both Backend (Port 5000) and Frontend (Port 5173) concurrently:
npm run dev
```

- Public Platform: `http://localhost:5173`
- Admin Dashboard: `http://localhost:5173/admin/login`
- Spectator Workspace: `http://localhost:5173/spectator/login`
- Backend API: `http://localhost:5000/api`

### 5. Run Automated Tests
```bash
npm test
```
Executes scoring calculations, tie-breaker evaluation, and slot concurrency atomicity tests.

---

## 🌐 Production Deployment

### Frontend (Vercel)
1. Import repository into Vercel and set Root Directory to `client`.
2. Framework Preset: **Vite**.
3. Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com/api`
4. The included `client/vercel.json` automatically manages client-side SPA routing rewrites.

### Backend (Render)
1. Create a new **Web Service** on Render and set Root Directory to `server`.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
   - `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   - `JWT_SECRET`: `<Secure 64-character secret>`
   - `BREVO_API_KEY`: `<Your Brevo API Key>`
   - `EMAIL_FROM`: `<Your verified Brevo sender email>`
   - `ADMIN_WHATSAPP_NUMBER`: `<WhatsApp Contact>`
   - `WHATSAPP_COMMUNITY_URL`: `<Group Invite Link>`
   - `ADMIN_UPI_ID`: `<College UPI ID>`
