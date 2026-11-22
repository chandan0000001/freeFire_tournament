# Rahul Esports · Odisha Free Fire Tournament Arena

A high-performance competitive Free Fire tournament platform built for Odisha's esports community. The platform features public tournament browsing, squad and solo registrations with UPI QR payments, match time sessions, real-time leaderboards with Free Fire player UIDs and IGNs, Brevo transactional emails, Redis revision-based caching with live client data synchronization, and a role-based admin workspace.

Frontend is built with React, Vite, and Tailwind CSS. Backend is powered by Node.js, Express, and MongoDB Mongoose.

---

## Architectural Highlights

### 1. Odisha + Free Fire Identity & Responsive Media Pipeline
- Sambalpuri-inspired geometric borders, lac red, vermilion, brass, and Konark wheel motifs.
- Distinct Free Fire battle artwork curated per format and tournament:
  - Squad battle hero: `odisha-squad.webp`.
  - Solo competition: `chilika-solo.webp`.
  - Account and auth: `arena-account.webp`.
- `ResponsiveImage` component leverages asynchronous image decoding, priority fetching, and browser-native responsive srcset selection for low-bandwidth mobile devices.

### 2. High-Performance Redis Caching & Invalidation
- **Revision-Based Cache Namespace**: Fast cache invalidation via atomic `cache.bumpRevision()`. Mutation of tournaments, registrations, match results, or site settings immediately obsoletes stale cache without costly wildcard scans.
- **Coalesced Fetching (`remember`)**: Concurrent requests for identical resources share a single execution promise, preventing cache stampedes.
- **Sliding & Fixed Window Rate Limiting**: Distributed rate limiters protecting authentication, registration, and password reset endpoints.
- **Client Live Data Sync (`useLiveRefresh`)**: The frontend monitors server data revisions and automatically synchronizes tournaments, registrations, and leaderboard updates on window focus and periodic intervals without full page reloads.

### 3. Unified Authentication & Security Guardrails
- **Single Auth Path**: All users (players and administrators) authenticate exclusively through `/login` and `/register`. Dedicated `/admin/login` paths redirect seamlessly to `/login`.
- **Streamlined Signup**: Essential player fields only: Full Name, Email, WhatsApp Mobile Number, and Password.
- **Protected User Portals**: Tournament registration (`/join/squad/*`, `/join/solo/*`) and personal registration tracking (`/status`, `/my-registrations`) require authentication.
- **Multi-Origin Password Reset**: Token-based password reset resolution safely parses single and comma-separated `CLIENT_URL` configurations, ensuring password reset links resolve to valid origins.

### 4. Tournament Registration & Match Coordination
- **Squad Roster & Team Leader Designation**: 4 player positions with interactive team leader highlighter marker/tick selection. Supports 3-player squads with automatic N/A assignment for the fourth position.
- **Session Slots**: Daily time session selections:
  - Morning Session: 10:00 AM – 12:30 PM (5 Matches)
  - Afternoon Session: 2:00 PM – 4:30 PM (4 to 5 Matches)
  - Evening Session: 6:00 PM – 8:30 PM (4 to 5 Matches)
- **Direct UPI Checkout & UTR Verification**: Scannable dynamic QR code generated with tournament entry fee, copyable organizer UPI ID, and 12-digit UTR transaction input.
- **Admin WhatsApp Coordination**: Post-registration screen provides pre-formatted WhatsApp link with registration reference ID, team details, and UTR for match schedule confirmation.
- **Room Credential Dispatch**: Secure Custom Room ID and Password distribution via Brevo transactional email and Team Leader WhatsApp notification 15–20 minutes before kick-off.

### 5. Competitive Leaderboard & Standings
- Real-time tournament leaderboard tracking Squads and Individual Players.
- Tracks Booyahs, kills, placement points, In-Game Names (IGN), and verified Free Fire UIDs with 1-click copy capability.
- Admin result review interface supports manual or automated entry of player UIDs, kills, and ranks.
- Idempotent prize allocation preventing duplicate cash rewards upon result re-publication.

---

## Getting Started

### Prerequisites
- Node.js 20 or newer
- npm 10 or newer
- MongoDB instance (MongoDB Atlas or local replica set)
- Redis instance (Redis Cloud or local redis-server)

### Installation

Clone the repository and install root and package dependencies:

```bash
git clone https://github.com/chandan0000001/rahul-esports-arena.git
cd rahul-esports-arena

npm ci
npm --prefix client ci
npm --prefix server ci
```

### Environment Configuration

Configure client and server environment files:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

#### Frontend (`client/.env`)
```env
VITE_API_BASE_URL=/api
VITE_DEV_API_TARGET=http://localhost:5000
VITE_SITE_NAME="Rahul Esports"
VITE_SITE_REGION="Odisha"
VITE_SITE_REGION_NATIVE="ଓଡ଼ିଶା"
VITE_SITE_TAGLINE="Free Fire Competitive Arena"
VITE_COMMUNITY_URL="https://chat.whatsapp.com/..."
VITE_CONTACT_EMAIL="contact@rahulesports.in"
VITE_ADMIN_UPI_ID="srikantap571-1@okaxis"
VITE_ADMIN_UPI_NAME="Rahul Esports"
VITE_ADMIN_WHATSAPP_NUMBER="918114603994"
VITE_QR_CODE_API_URL="https://api.qrserver.com/v1/create-qr-code/"
```

#### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DEFAULT_CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/rahul_esports
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
REDIS_URL=redis://default:<password>@<host>:<port>
REDIS_KEY_PREFIX=rahul-arena:
BREVO_API_KEY=xkeysib-...
EMAIL_FROM=contact@rahulesports.in
EMAIL_FROM_NAME="Rahul Esports Arena"
ADMIN_WHATSAPP_NUMBER=918114603994
ADMIN_UPI_ID=srikantap571-1@okaxis
ADMIN_UPI_NAME="Rahul Esports"
QR_CODE_API_URL=https://api.qrserver.com/v1/create-qr-code/
ADMIN_BOOTSTRAP_EMAIL=admin@rahulesports.in
ADMIN_BOOTSTRAP_PASSWORD=Admin@RIT2026!
```

### Running Locally

Start both client and server concurrently:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

---

## Admin Workspace

Access the admin dashboard by signing in at `/login` with an administrator account:
- Default Superadmin: `admin@rahulesports.in` / `Admin@RIT2026!`

Admin capabilities include:
- Tournament lifecycle management (Draft, Registration Open, Room Ready, Live, Completed).
- Registration verification, UTR confirmation, and slot capacity tracking.
- Room credential distribution with automated Brevo email delivery.
- Match results entry with Free Fire UID and IGN scoring.
- Idempotent prize allocation and payout history.
- Real-time audit logs and site settings configuration.

---

## Verification & Testing

Execute backend test suites:

```bash
# Unit & integration tests
npm test

# Comprehensive end-to-end system test suite (MongoDB + Redis lifecycle)
node server/scripts/test-system.mjs
```

Verify client production build:

```bash
npm --prefix client run build
```

---

## Deployment

### Frontend (Vercel / Netlify / Static CDN)
Deploy the `client/` folder. Build command:
```bash
npm run build
```
Output directory: `dist`. Ensure single-page application (SPA) rewrite rules direct all unmatched paths to `/index.html`.

### Backend (Render / Railway / VPS)
Deploy the `server/` directory as a Node.js web service. Start command:
```bash
npm start
```
Ensure all required environment variables (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `REDIS_URL`, `ADMIN_UPI_ID`) are configured in the hosting provider dashboard.
