# Rahul Esports · Odisha Free Fire Arena

React/Vite frontend and Express/MongoDB API for solo and squad tournaments. Players register with direct UPI payment details; organizers verify entries, distribute room credentials, publish results and record offline prize payouts. The wallet/coin subsystem has been removed.

## Local setup

Requires Node.js 20+, npm, and MongoDB Atlas or a MongoDB replica set. Transactional admin operations do not support standalone MongoDB. Redis is recommended; the API has a bounded, process-local memory fallback.

```bash
git clone git@github.com:chandan0000001/freeFire_tournament.git
cd freeFire_tournament
npm ci
npm --prefix client ci
npm --prefix server ci
cp client/.env.example client/.env
cp server/.env.example server/.env
# Configure both environment files before starting.
npm run dev
```

Frontend: `http://localhost:5173`. API: `http://localhost:5000/api`.

Set `VITE_API_BASE_URL=/api` and `VITE_DEV_API_TARGET=http://localhost:5000` for the development proxy. A separately hosted frontend needs its backend URL in `VITE_API_BASE_URL`.

## Configuration

Use the package `.env.example` files as the configuration reference. Never place passwords, JWT secrets, database credentials or Redis credentials in frontend variables: every `VITE_*` value is public.

Backend requirements:

- `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL` (comma-separated allowed frontend origins).
- `REDIS_URL` and a deployment-specific `REDIS_KEY_PREFIX`. All instances of one deployment must share the prefix; separate deployments must use different prefixes.
- `TRUST_PROXY_HOPS` matching the deployment topology; use `0` locally and the correct trusted hop count behind a proxy.
- Organizer UPI, WhatsApp, identity and contact values come from server environment defaults and editable site settings.
- `BREVO_API_KEY` and a verified `EMAIL_FROM` for real email delivery. Development/tests can use mock delivery; production without a configured provider reports failure.

Players and administrators sign in at `/login`. Configure `ADMIN_BOOTSTRAP_EMAIL` and a private `ADMIN_BOOTSTRAP_PASSWORD` before using `npm run seed`. The seed also creates demonstration data and updates settings: inspect it before running it against an existing database. It does not reset existing account passwords. There is no documented default production password.

## Artwork and responsive layout

The approved squad hero, Chilika artwork, account artwork and Rahul portrait are preserved. New Konark squad artwork replaces legacy game banners, and a centred champion portrait fits the registration panel. On phones, the registration image and caption occupy separate rows.

Public asset configuration:

| Variable | Bundled asset |
| --- | --- |
| `VITE_HERO_IMAGE` | `/images/odisha-squad.webp` |
| `VITE_TOURNAMENT_IMAGE` | `/images/konark-squad.webp` |
| `VITE_SOLO_IMAGE` | `/images/chilika-solo.webp` |
| `VITE_ACCOUNT_IMAGE` | `/images/arena-account.webp` |
| `VITE_CHAMPION_IMAGE` | `/images/odisha-champion.webp` |
| `VITE_ORGANIZER_IMAGE` | `/images/rahul.webp` |

`ResponsiveImage` uses `imageManifest.json` to serve 480px, 768px or full-width WebP files, reserve intrinsic dimensions, and lazy-load secondary artwork. Visible hero/auth images receive loading priority. Custom URLs remain supported without inventing nonexistent size variants. Add manifest entries when adding new resized artwork. Rebuild the client after changing frontend environment variables.

## Redis and client synchronization

Public tournament, standings, result, winner and settings routes use one response-cache layer. Identical concurrent misses share a loader within each Node process; query parameters are sorted for stable cache keys. Cache entries expire after 30 seconds unless the route specifies otherwise.

Successful data mutations change a shared Redis revision **after** database transactions commit. Requests retain their original revision, so an older in-flight response cannot populate the newly active cache. Authentication requests do not invalidate public data. Revision values are unique across Redis restarts; recovery discards fallback data. Normal mutations do not scan keys or flush a shared Redis database.

Authentication and API limits use Redis fixed-window counters with atomic increment/expiry. Password-reset tokens have a TTL and are also checked against MongoDB. Authentication checks current database account state, including token revocation; cached profiles never authorize users.

During an outage, caching and rate limits fall back to bounded memory. This fallback is local to each process, so distributed rate-limit guarantees require a working Redis connection. Monitor **Admin → Settings → Data cache** or authenticated `GET /api/admin/cache/status`. Counters describe the current API process and never reveal connection credentials.

Clients check `/api/sync` while visible, on focus, and at `VITE_SYNC_INTERVAL_MS` (default 30 seconds, minimum 10 seconds). Successful changes notify other open tabs immediately. Other browsers update on their next revision check. This is polling, not a WebSocket or a guaranteed instant push service.

## Admin and payment behavior

- Drafts stay private; the admin tournament list includes them.
- Registration dates, capacity and format are enforced by the API and client availability controls.
- Pending requests do not reserve slots. Payment verification reserves capacity transactionally.
- A payment UTR cannot fund multiple approved registrations.
- Public registration lookup excludes private contact/payment details; personal entries require ownership.
- Result entries are validated before publication. Repeated publication does not allocate duplicate prize records. Published scores cannot be overwritten through the editor.
- Room emails use Brevo. WhatsApp links open a manually composed message; there is no automated WhatsApp provider or scheduled 15-minute dispatch.
- Prize payout status records an organizer's offline transfer; it does not initiate a bank transfer.
- Current score calculation is kill points plus the Booyah bonus. It does not add the legacy placement-points map.

## Verification

```bash
npm test
npm --prefix client test
npm run build
node server/scripts/test-system.mjs
```

The system runner needs `mongod` and `redis-server` on PATH. It creates an isolated local MongoDB replica set and Redis service, generates temporary accounts, uses mock email and removes its test directory afterward. It does not load production `.env` data. Default ports are 27028 and 6388; override `TEST_MONGO_PORT` and `TEST_REDIS_PORT` if occupied. The older database integration test only runs when `TEST_MONGODB_URI` is explicitly supplied.

Optional browser checks require Playwright Core and Chrome:

```bash
TEST_BROWSER=1 PLAYWRIGHT_MODULE=/absolute/path/to/playwright-core \
CHROME_PATH=/absolute/path/to/chrome node server/scripts/test-system.mjs
```

Checks include role boundaries, duplicate submissions, concurrent approvals, capacity, room delivery, results, prize operations, settings propagation, password-reset revocation, Redis expiry/recovery, stale-response isolation, browser controls and responsive layouts. External UPI transfers and real email delivery are not simulated as successful bank/provider transactions.

## Deployment

Build `client/` with `npm run build`, serve `client/dist`, and retain the SPA fallback. Deploy `server/` separately with `npm start`; `render.yaml` describes its environment configuration. Supply production environment values in the hosting dashboard and keep MongoDB transaction support enabled. A Git push does not configure hosting secrets or prove that a deployment is healthy.
