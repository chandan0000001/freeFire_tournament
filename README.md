# RIT Esports Arena — Official College Free Fire League

[![Live Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel&logoColor=white)](https://rittournament.vercel.app)
[![Live API](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)](https://freefire-tournament-hlu5.onrender.com)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Cache & Rate Limit](https://img.shields.io/badge/Cache-Redis%20Cloud-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Email Delivery](https://img.shields.io/badge/Email-Brevo%20API-0092FF?logo=sendinblue&logoColor=white)](https://www.brevo.com/)

A modern, mobile-responsive, production-ready competitive Free Fire esports platform built exclusively for students of **Roland Institute of Technology (RIT), Berhampur, Odisha**. Features custom room management, OTP-free squad/solo registrations, automated Brevo room credential dispatch, observer score verification, real-time Redis-cached leaderboards, and instant UPI payouts.

---

## Live Production Deployments

- **Frontend Application**: [https://rittournament.vercel.app](https://rittournament.vercel.app)
- **Backend API**: [https://freefire-tournament-hlu5.onrender.com](https://freefire-tournament-hlu5.onrender.com)
- **API Health Check**: `https://freefire-tournament-hlu5.onrender.com/api/health`
- **Sitemap**: `https://rittournament.vercel.app/sitemap.xml`
- **Robots.txt**: `https://rittournament.vercel.app/robots.txt`

---

## Tech Stack & Architecture

### Frontend (Client)
- **Framework**: React 18, Vite 6, Tailwind CSS
- **Code Splitting**: Route-level `React.lazy()` + `<Suspense>` with custom branded loading fallback (Initial bundle **<85 kB** gzipped)
- **UI & Icons**: Lucide React, Rajdhani & Inter esports typography
- **SEO & Social**: Dynamic page metadata hook (`usePageMeta.js`), OpenGraph tags, Apple touch icon, Favicon set, `robots.txt`, and `sitemap.xml`
- **Analytics**: `@vercel/analytics` integrated for real-time performance tracking
- **Mobile Optimizations**: Tap highlight removal (`-webkit-tap-highlight-color: transparent`), above-the-fold CTA buttons on 360×800 screens, streamlined 2-column mobile footer

### Backend (Server)
- **Runtime**: Node.js (ESM), Express.js
- **Security**: Helmet, CORS, Joi payload validation, MongoDB atomic `$inc` with `$expr` concurrency guards
- **Caching & Rate Limiting**: Redis Cloud (`ioredis`) with automatic in-memory fallback:
  - High-speed read-through caching for `/api/tournaments` (30s), `/api/tournaments/:slug` (60s), `/api/settings/public` (300s), `/api/leaderboards` (120s), and `/api/winners` (120s) (~1-3ms response time)
  - Non-blocking selective cache invalidation (`delPattern('tournaments:*')`, `del('settings:public')`, `del('winners:halloffame')`)
  - Distributed IP rate limiters using `rate-limit-redis`
  - 1-Year immutable CDN edge caching on Vercel for all static WebP artwork
- **Email Service**: Brevo (Sendinblue) Transactional API for automated room credentials and payment approvals
- **File Uploads**: Multer with MIME-type and 5MB size validation for dispute/scoreboard screenshots

---

## Core Platform Workflows

```
   [ Student Registration ]               [ Admin Verification ]            [ Match Day Execution ]
 ┌───────────────────────────┐         ┌───────────────────────────┐     ┌───────────────────────────┐
 │ • Select Squad or Solo    │         │ • Inspect UTR & Proof     │     │ • Match Observer records  │
 │ • Free Fire UIDs + Rolls  │ ──────► │ • 1-Click UPI Verify      │ ──► │   Placement + Kill points │
 │ • Pre-filled WhatsApp CTA │         │ • Auto-generate Room Code │     │ • Booyah bonus calculated │
 │ • Instant Slot Reserved   │         │ • Brevo Email Dispatch    │     │ • Redis Leaderboard live  │
 └───────────────────────────┘         └───────────────────────────┘     └───────────────────────────┘
```

1. **OTP-Free Student Registration**:
   - Students register with Captain details, College Roll Number, and Free Fire UIDs.
   - Generates human-readable reference IDs: `RIT-FF-SQ-XXXXX` (Squad) or `RIT-FF-SO-XXXXX` (Solo).
   - Generates dynamic scannable UPI QR codes and a 1-tap WhatsApp click-to-chat button with pre-filled payment details.
2. **Atomic Slot Reservation**:
   - Concurrency-safe slot holds prevent race condition overbooking when registrations open.
   - Registrations instantly bust the Redis tournament cache so live slot counts update across devices.
3. **Brevo Room Dispatch**:
   - Custom Room ID and Password are encrypted and protected (`select: false` in queries).
   - Admin dispatches credentials via Brevo to verified participants with live delivery status tracking.
4. **Spectator Workspace & Score Engine**:
   - Official observers input placements, kills, and upload scoreboard evidence.
   - Configurable formula: `Points = (Kills × KillValue) + BooyahBonus`.
   - Automated tie-breaker: `Booyahs > Kills > Placement`.

---

## Curated 16:9 Tournament Banners

All tournament banners are optimized to standard **16:9 widescreen WebP** (quality 82, 1280x720, saving 95% bandwidth):
- `/images/ff-banner-squad.webp`: Official Squad Battle (16:9)
- `/images/ff-banner-solo.webp`: Solo Firestorm Champion (16:9)
- `/images/ff-banner-rampage.webp`: Rampage Battleground (16:9)
- `/images/ff-banner-hayato.webp`: Championship Hayato (16:9, fully framed)
- `/images/ff-banner-kelly.webp`: Solo Gunslinger Kelly (16:9)
- `/images/ff-banner-chrono.webp`: Chrono Time Turner (16:9)
- `/images/ff-banner-paradox.webp`: Cyber Paradox Clash (16:9)
- `/images/ff-banner-battle.webp`: High Octane Combat (16:9)
- `/images/ff-banner-flame.webp`: Booyah Flame Champion (16:9)
- `/images/ff-banner-naruto.webp`: Naruto Shippuden x Free Fire (16:9)
- `/images/ff-banner-squidgame.webp`: Squid Game x Free Fire (16:9)
- `/images/ff-banner-evo8.webp`: 8th Anniversary Evo Gun (16:9)
- `/images/ff-banner-cyberbiker.webp`: Cyber Biker Combat (16:9)
- `/images/ff-banner-heat.webp`: Heatwave Combat Arena (16:9)
- `/images/ff-banner-rampage-2.webp`: Rampage Battleground II (16:9)
- `/images/ff-banner-rampage-finale.webp`: Rampage Finale Championship (16:9)
- `/images/ff-banner-intense.webp`: Intense Battle Royale (16:9)
- `/images/ff-banner-together.webp`: Squad Together Battle (16:9)
- `/images/ff-banner-assemble.webp`: Free Fire Assemble 4v4 (16:9)
- `/images/ff-banner-max-vc.webp`: Free Fire MAX Ultra Combat (16:9)
- `/images/ff-banner-max-fk.webp`: Free Fire MAX Special Ops (16:9)
- `/images/ff-banner-max-0x.webp`: Free Fire MAX Cyber Clash (16:9)
- `/images/ff-banner-team-2023.webp`: Championship Team 4v4 (16:9)
- `/images/ff-banner-game-mc.webp`: Cyber Storm Battleground (16:9)
- `/images/ff-banner-game-4y.webp`: High Voltage 4K Battle (16:9)
- `/images/ff-banner-cw-2024.webp`: New Dawn Combat 2024 (16:9)
- `/images/ff-banner-ne-2024.webp`: Neon Striker 2024 (16:9)
- `/images/ff-banner-game-7x.webp`: Apex Champions 4K (16:9)
- `/images/ff-banner-2025.webp`: Free Fire Horizon 2025 (16:9)
- `/images/arena-stage.webp`: Grand Arena Stage (16:9)

---

## Local Development & Setup

### 1. Prerequisites
- Node.js 18+ (Tested on Node 20 & 24)
- MongoDB Atlas database or local MongoDB instance
- Redis Cloud instance (Optional, falls back to in-memory cache)
- Brevo API Key (Optional in dev, falls back to local console logger)

### 2. Installation
```bash
# Clone the repository
git clone git@github.com:chandan0000001/freeFire_tournament.git
cd freeFire_tournament

# Install server and client dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Environment Variables
Create `.env` in both `server/` and `client/`:

**`server/.env`**:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173,https://rittournament.vercel.app
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/rit_esports?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
REDIS_URL=redis://default:<password>@<host>:<port>
BREVO_API_KEY=your_brevo_api_key_here
EMAIL_FROM=your_verified_sender@domain.com
EMAIL_FROM_NAME=RIT Esports Arena
ADMIN_WHATSAPP_NUMBER=91XXXXXXXXXX
WHATSAPP_COMMUNITY_URL=https://chat.whatsapp.com/your_community_link
ADMIN_UPI_ID=your_upi_id@bank
ADMIN_UPI_NAME=Your Payee Name
ADMIN_BOOTSTRAP_EMAIL=admin@ritesports.in
ADMIN_BOOTSTRAP_PASSWORD=your_secure_password
```

**`client/.env`**:
```env
VITE_API_BASE_URL=https://freefire-tournament-hlu5.onrender.com/api
```

### 4. Seed Initial Data
```bash
npm run seed
```
Initializes the database with:
- **Superadmin** and **Match Spectator** staff accounts (credentials configured via `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` in your `.env`)
- Sample Squad & Solo Free Fire custom room tournaments and campus site settings

### 5. Start Servers
```bash
# Run backend and frontend concurrently
npm run dev
```
- Frontend: `http://localhost:5173`
- Admin Portal: `http://localhost:5173/admin/login`
- Backend API: `http://localhost:5000/api`

### 6. Run Unit & Concurrency Tests
```bash
npm test
```

---

## Key API Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | Service health, MongoDB & Redis status | Public |
| `GET` | `/api/tournaments` | List public tournaments (Redis cached 30s) | Public |
| `GET` | `/api/tournaments/:slug` | Tournament details & rulebook | Public |
| `POST` | `/api/registrations/squad` | Register 4v4 squad + reserve slot | Public |
| `POST` | `/api/registrations/solo` | Register solo player + reserve slot | Public |
| `GET` | `/api/registrations/status/:ref`| Track verification & room details | Public |
| `GET` | `/api/leaderboards` | Campus standings & top fraggers | Public |
| `POST` | `/api/auth/login` | Admin JWT authentication | Public |
| `POST` | `/api/admin/rooms/distribute` | Send Room ID & Pass via Brevo | Admin |
| `POST` | `/api/admin/matches/:id/results`| Submit and verify match scorecard | Admin |

---

## Campus Policy & Fair Play
This is a non-commercial student initiative for Roland Institute of Technology. All players must comply with the [RIT Esports Fair Play Policy](https://rittournament.vercel.app/privacy). Free Fire is a trademark of Garena International.
