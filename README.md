# Rahul Esports Odisha — Official Competitive Free Fire Arena

[![Live Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel&logoColor=white)](https://rittournament.vercel.app)
[![Firebase Project](https://img.shields.io/badge/Firebase-Rahul--Esports--odisha-FFCA28?logo=firebase&logoColor=black)](https://console.firebase.google.com/project/Rahul-Esports-odisha)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Cache & Rate Limit](https://img.shields.io/badge/Cache-Redis%20Cloud-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Email Delivery](https://img.shields.io/badge/Email-Brevo%20API-0092FF?logo=sendinblue&logoColor=white)](https://www.brevo.com/)

A modern, high-performance, mobile-responsive competitive Free Fire esports platform for **Rahul Esports Odisha**. Features custom room management, an integrated in-app **Coin & Wallet system**, instant 1-click tournament registration with coins, automated Brevo room credential dispatch, observer score verification, real-time Redis-cached leaderboards, and an admin withdrawal approval dashboard with UPI UTR disbursement logging.

---

## Live Deployments & Architectures

- **Frontend Application**: [https://rittournament.vercel.app](https://rittournament.vercel.app) (Hosted on Vercel)
- **Firebase Project**: `Rahul-Esports-odisha` (Spark Plan / Blaze Plan)
- **Backend API**: Node.js Express API (Deployable on Render, Vercel Serverless `/api`, or Firebase Functions)
- **API Health Check**: `/api/health`
- **Sitemap**: [https://rittournament.vercel.app/sitemap.xml](https://rittournament.vercel.app/sitemap.xml)
- **Robots.txt**: [https://rittournament.vercel.app/robots.txt](https://rittournament.vercel.app/robots.txt)

---

## Coin & Wallet Ecosystem (1 Coin = ₹1 INR)

```
  ┌────────────────┐         ┌────────────────────┐         ┌────────────────────┐
  │ Deposit Money  │ ──────► │ Buy Wallet Coins   │ ──────► │ Join Tournaments   │
  │ (Scan Admin QR)│         │ (Approved by Admin)│         │ (Instant 0ms Slot) │
  └────────────────┘         └────────────────────┘         └─────────┬──────────┘
                                                                      │ Play & Win
                                                                      ▼
  ┌────────────────┐         ┌────────────────────┐         ┌────────────────────┐
  │ UPI Bank Payout│ ◄────── │ Admin Approves &   │ ◄────── │ Winnings Credited  │
  │ (Recorded UTR) │         │ Audits Request     │         │ To Wallet Account  │
  └────────────────┘         └────────────────────┘         └────────────────────┘
```

1. **Coin Economy**:
   - **1 Coin = ₹1 INR**.
   - Dual-balance architecture: **Deposit Coins** (used for tournament entry fees) and **Winning Coins** (earned from tournament placements, eligible for bank withdrawal).
2. **Instant Tournament Registration**:
   - Players can bypass manual UPI verification by paying directly with Wallet Coins for instant slot confirmation.
3. **Automated Prize Distribution**:
   - Match results published by observers automatically credit cash prizes as Winning Coins to tournament champions.
4. **Controlled Withdrawals**:
   - Players submit withdrawal requests with their UPI ID and phone number.
   - Admin reviews the withdrawal queue, disburses via UPI, logs the banking UTR, and marks the request as APPROVED (or REJECTS with an instant refund to the player's wallet).

---

## Tech Stack & Architecture

### Frontend (Client)
- **Framework**: React 18, Vite 6, Tailwind CSS
- **Code Splitting**: Route-level `React.lazy()` + `<Suspense>` with branded loading fallback (Initial bundle **<95 kB** gzipped)
- **State & Storage**: Local passbook storage, real-time wallet lookup, modal verification
- **SEO & Performance**: Dynamic OpenGraph tags, Apple touch icon, Favicon set, `robots.txt`, and `sitemap.xml`
- **Analytics**: `@vercel/analytics` integrated for real-time telemetry

### Backend (Server)
- **Runtime**: Node.js (ESM), Express.js
- **Database**: MongoDB Atlas with Mongoose models (`Wallet`, `WalletTransaction`, `WithdrawalRequest`, `DepositRequest`, `Tournament`, `Registration`, `Match`, `Result`)
- **Security**: Helmet, CORS, Joi payload validation, MongoDB atomic `$inc` with `$expr` concurrency guards
- **Caching & Rate Limiting**: Redis Cloud (`ioredis`) with automatic in-memory fallback
- **Email Service**: Brevo (Sendinblue) Transactional API for automated room credentials

---

## Key API Endpoints

### Wallet & Coins

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/wallet/:email` | Get wallet balance and transaction ledger | Public |
| `POST` | `/api/wallet/lookup` | Quick lookup of wallet by email | Public |
| `POST` | `/api/wallet/deposit` | Submit manual UPI deposit request with UTR | Public |
| `POST` | `/api/wallet/withdraw` | Submit withdrawal request for winning coins | Public |
| `POST` | `/api/tournaments/:id/join-with-coins` | Instant tournament slot entry using coins | Public |
| `GET` | `/api/admin/withdrawals` | Admin view of all pending/completed withdrawals | Admin |
| `PATCH` | `/api/admin/withdrawals/:id/approve` | Approve withdrawal with payout UTR | Admin |
| `PATCH` | `/api/admin/withdrawals/:id/reject` | Reject withdrawal and refund coins | Admin |
| `GET` | `/api/admin/deposits` | Admin view of coin purchase deposit requests | Admin |
| `PATCH` | `/api/admin/deposits/:id/approve` | Approve coin deposit and credit wallet | Admin |
| `PATCH` | `/api/admin/deposits/:id/reject` | Reject coin deposit request | Admin |
| `POST` | `/api/admin/wallets/manual-adjust` | Admin tool to credit/debit coins manually | Admin |

### Tournaments & Matches

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | Service health, MongoDB & Redis status | Public |
| `GET` | `/api/tournaments` | List public tournaments (Redis cached 30s) | Public |
| `GET` | `/api/tournaments/:slug` | Tournament details & rulebook | Public |
| `POST` | `/api/registrations/squad` | Register 4v4 squad + reserve slot via UPI | Public |
| `POST` | `/api/registrations/solo` | Register solo player + reserve slot via UPI | Public |
| `GET` | `/api/registrations/status/:ref`| Track verification & room details | Public |
| `GET` | `/api/leaderboards` | Standing tables & fragger stats | Public |
| `POST` | `/api/auth/login` | Admin JWT authentication | Public |
| `POST` | `/api/admin/rooms/distribute` | Send Room ID & Pass via Brevo | Admin |
| `POST` | `/api/admin/matches/:id/results`| Publish match results (auto-credits prize coins) | Admin |

---

## Local Development & Setup

### 1. Installation
```bash
# Clone the repository
git clone git@github.com:chandan0000001/freeFire_tournament.git
cd freeFire_tournament

# Install dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Environment Variables
Create `.env` in `server/` and `client/`:

**`server/.env`**:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173,https://rittournament.vercel.app
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/rahul_esports?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
REDIS_URL=redis://default:<password>@<host>:<port>
BREVO_API_KEY=your_brevo_api_key_here
EMAIL_FROM=admin@rahulesports.in
EMAIL_FROM_NAME=Rahul Esports Odisha
ADMIN_WHATSAPP_NUMBER=91XXXXXXXXXX
WHATSAPP_COMMUNITY_URL=https://chat.whatsapp.com/your_community_link
ADMIN_UPI_ID=your_upi_id@bank
ADMIN_UPI_NAME=Rahul Esports Admin
ADMIN_BOOTSTRAP_EMAIL=admin@rahulesports.in
ADMIN_BOOTSTRAP_PASSWORD=your_secure_password
```

**`client/.env`**:
```env
VITE_API_BASE_URL=https://freefire-tournament-hlu5.onrender.com/api
```

### 3. Start Development
```bash
# Run backend and frontend concurrently
npm run dev
```

- Frontend: `http://localhost:5173`
- Wallet: `http://localhost:5173/wallet`
- Admin Dashboard: `http://localhost:5173/admin/login`
- Withdrawal Management: `http://localhost:5173/admin/withdrawals`
- Backend API: `http://localhost:5000/api`

---

## Firebase Setup Guide

For the Firebase project `Rahul-Esports-odisha`:
1. **Web App Configuration**:
   - Go to Firebase Console -> Project Overview -> Click the **`</>` (Web)** icon.
   - Register App Name: `Rahul Esports Web`.
   - Copy the `firebaseConfig` object and populate `client/src/config/firebase.js` or `.env` variables (`VITE_FIREBASE_API_KEY`, etc.).
2. **Spark vs. Blaze Plan**:
   - The project is on the **Spark plan** (Free).
   - Under the Spark plan, deploy the frontend on **Vercel** and the backend on **Render/Vercel Serverless**, while using Firebase for Authentication, Firestore database, and Cloud Storage.
   - If deploying backend via Firebase Cloud Functions (`firebase deploy --only functions`), Google Cloud requires upgrading to the pay-as-you-go **Blaze plan** (which includes 2,000,000 free invocations/month).

---

## License & Fair Play
Rahul Esports Odisha is an esports platform for competitive Free Fire players. All registered participants must comply with our Fair Play and Anti-Cheat Guidelines. Free Fire is a trademark of Garena International.
