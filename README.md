# TH FREEFIRE · Odisha Tournament Arena

A Free Fire community tournament application with public registration, results, standings, a coin wallet, and a protected organizer workspace. React/Vite serves the frontend; Express/Mongoose serves the API. Redis caching and Brevo transactional email are optional integrations that need their own configuration.

## Visual identity

The interface uses deep lac red, vermilion and brass, with Sambalpuri-inspired geometric accents and a Konark wheel identity. The hero is original AI-generated Odisha-inspired artwork, not a documentary photograph. Rahul’s organizer portrait was supplied by the project owner and converted to WebP.

- `client/public/images/odisha-arena.webp`: custom hero and default tournament artwork.
- `client/public/images/rahul.webp`: organizer portrait.
- `client/public/favicon.svg`, `.ico`, `.png`, and `apple-touch-icon.png`: matching wheel icons.
- `client/src/odisha.css`: public and organizer theme.
- `client/src/config/site.js`: environment-driven public identity.

Existing tournaments retain their saved titles and banners. Change them through the organizer editor; changing the site theme does not rewrite database records.

## Run locally

Use Node.js 20 or newer and npm. Install each package’s dependencies:

```bash
npm ci
npm --prefix client ci
npm --prefix server ci
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Fill in the environment variables before starting. Do not replace an existing `.env` when updating an established installation.

```bash
npm run dev
```

The default frontend is `http://localhost:5173`; the API runs on port `5000`. Set `VITE_API_BASE_URL=/api` to use the development proxy. `VITE_DEV_API_TARGET` specifies its backend target. For a separately hosted API, set `VITE_API_BASE_URL` to that backend’s URL, including `/api` or the host alone.

## Configuration

### Frontend

All `VITE_` variables are public and bundled into the frontend. Never put passwords, tokens, database URLs or private API keys in them.

| Variables | Purpose |
| --- | --- |
| `VITE_API_BASE_URL`, `VITE_DEV_API_TARGET` | API endpoint and local proxy target |
| `VITE_SITE_NAME`, `VITE_SITE_REGION`, `VITE_SITE_REGION_NATIVE`, `VITE_SITE_TAGLINE` | Brand and region labels |
| `VITE_HERO_IMAGE`, `VITE_TOURNAMENT_IMAGE` | Public asset paths |
| `VITE_ORGANIZER_NAME`, `VITE_ORGANIZER_IMAGE`, `VITE_ORGANIZER_ROLE` | Organizer section |
| `VITE_COMMUNITY_URL`, `VITE_CONTACT_EMAIL` | Community and contact links; empty values hide the links |
| `VITE_LOCALE`, `VITE_TIME_ZONE` | Tournament card date and currency formatting |

`client/.env.production` contains **public presentation defaults only**, ensuring production builds have a complete identity. Hosting environment variables override these defaults. Rebuild the frontend after changing its environment variables.

### Backend

`server/.env.example` documents the available keys:

- Required service configuration: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `CLIENT_URL`.
- Optional services: `REDIS_URL`, `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`.
- Organizer defaults: `SITE_NAME`, `SITE_REGION`, `SITE_ANNOUNCEMENT`, `CONTACT_EMAIL`, `WHATSAPP_COMMUNITY_URL`, `ADMIN_WHATSAPP_NUMBER`.
- Payment configuration: `ADMIN_UPI_ID`, `ADMIN_UPI_NAME`, and optional UPI metadata.
- Wallet configuration: `WALLET_DEPOSIT_PACKAGES` is a comma-separated list of positive whole-coin packages; `WALLET_MIN_WITHDRAWAL` is a positive whole-coin amount. These are supplied to the client through `/api/settings/public` and validated by the server. Missing configuration disables the corresponding action rather than inventing a payment destination or limit.

Site settings already saved in MongoDB take precedence over model defaults. Use **Site settings** in the admin workspace to update stored community/payment details. Public branding and the organizer portrait come from the frontend environment.

Tournament fees, capacity, schedules, scoring and prizes are database records entered by the organizer, not fabricated frontend records. Display text, styles and protocol constants are code; operational configuration belongs in environment variables or the database.

## Organizer workspace

Sign in at `/admin/login` with an existing active admin or superadmin account. Credentials are never bundled with the frontend or documented here.

The workspace provides:

- Dashboard metrics and shortcuts.
- Tournament creation, editing, status changes and deletion confirmation.
- Registration and payment review.
- Room credentials and email distribution.
- Result recording/review and publication.
- Prize payout records, deposit approval and withdrawal management.
- Site settings and audit logs.

Tournament date inputs use **the organizer browser’s local timezone**. Existing dates round-trip without UTC offset shifts. Registration closing times must be no later than match start. Changing a format preserves explicitly entered prices and capacity.

`npm run seed` is a **demo/bootstrap operation** that connects to the configured database, creates a missing superadmin using `ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD`, updates settings and adds demonstration tournaments. Do not run it casually against an established production database. It does not reset an existing administrator’s password.

## Player flows

Players can browse tournaments, choose solo or squad registration, track their reference at `/status`, and view published results, standings and winners. Wallet deposits and payouts require organizer review; the application does not itself execute bank transfers. One coin currently represents one INR throughout the existing accounting model.

The homepage contains only API tournament records and distinguishes loading, error and empty states. Slot displays retain actual registered counts even after a match is live or completed. Registration controls respect capacity and registration/match dates.

## Build and verification

```bash
npm run build
npm --prefix client test
node --test server/tests/scoring.test.js server/tests/walletConfig.test.js
```

The production frontend is written to `client/dist`. Configure SPA fallback to `index.html` on your host. Deploy the backend separately with its server environment variables and install its dependencies. `render.yaml` includes the new wallet and identity environment keys for Blueprint-managed deployments. For an existing manually configured backend, set `WALLET_DEPOSIT_PACKAGES` and `WALLET_MIN_WITHDRAWAL` before deploying; a Git push alone does not configure a hosting dashboard.

`npm test` also runs the database integration suite using `MONGODB_URI`; it writes temporary records. Use a dedicated test database. `server/tests/e2e_admin_verification.js` performs broader admin mutations and requires explicit test credentials and a controlled test environment; it is not a read-only health check.

Browser checks during the redesign covered real admin login, route navigation, desktop/mobile overflow, password visibility, and opening/cancelling tournament editors. Create/edit/status/delete UI handlers were also checked with intercepted API mutations, including validation errors, disabled save buttons, and date/zero-value payloads. No real tournaments or payouts were changed by those interaction tests. Public layouts were checked at 320, 390, 768, 1024 and 1440 pixels. Payment approvals, real bank transfers, result publication and outgoing email are not implied by these UI checks.

## Known production work

The existing player wallet API identifies players by email rather than authenticated ownership. Add verified player authentication and server-side ownership checks before treating balances and withdrawal requests as private, secure player accounts. The privacy and competition terms should reflect the organizer’s actual operating practices.

This is a community-organized arena, not an official Garena product. Free Fire belongs to its respective owners.
