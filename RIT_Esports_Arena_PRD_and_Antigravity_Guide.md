# RIT Esports Arena — Product Requirements & Build Guide

**Document type:** Product Requirements Document (PRD) + implementation guide  
**Project:** College-exclusive Free Fire tournament platform  
**Audience:** Antigravity AI coding agent and developer team  
**Initial scope:** One college, weekly Squad and Solo tournaments  
**Status:** Proposed specification

---

## 1. Project overview

Build **RIT Esports Arena**, a college-exclusive esports tournament website for organizing weekly Free Fire competitions.

The platform must let students discover tournaments, join the official WhatsApp community, register as a Squad or Solo player, submit payment details, receive room credentials, compete, and view published match results, rankings, and winners.

Administrators manage the complete operation from a protected admin dashboard. A designated match spectator/observer watches the game and records the match outcome. Captains may also submit result screenshots as supporting evidence. An administrator reviews and verifies results before publishing them.

This is not a betting, wagering, or gambling platform. Entry fees and cash prizes are managed as tournament participation fees and announced prizes. The platform must not accept bets or allow users to wager on match outcomes.

## 2. Confirmed product decisions

These are confirmed requirements. Do not silently replace them with a different workflow.

- **Audience:** Students from our college only.
- **Game:** Free Fire.
- **Frequency:** Weekly tournaments.
- **Formats:** Squad and Solo.
- **Entry fees:** ₹29 per Squad (entire squad), ₹14 per Solo player. Admin can configure fees for each tournament.
- **Registration:** No email OTP. Collect an email address and use it for notifications, but do not block registration on OTP verification.
- **Communication:** Website + official WhatsApp community + designated admin WhatsApp contact + email.
- **Payment:** Player/captain pays the designated admin/payment account and sends the payment reference/details to the admin WhatsApp contact. Admin manually verifies payment in the dashboard.
- **Room credentials:** Admin enters Room ID and Password, selects eligible approved registrations, and sends credentials to those selected recipients by email. Do not expose room credentials publicly.
- **Scoring:** Kill points + Booyah points. The scoring values must be configurable by admin, not hardcoded.
- **Leaderboards:** Both Individual and Squad leaderboards.
- **Result evidence:** A designated spectator/observer watches the match and records the outcome. Captains can also submit screenshots. Admin verifies results before publication.
- **Rewards:** Cash prizes only. Winners receive the cash prize from the admin outside the website. The website records prize amount, winner, and payout status; it does not need an online payout gateway in the initial version.
- **Public results:** Website publicly shows who won, their squad/player display names, and approved match statistics. Never publicly expose personal email addresses, phone numbers, payment references, or other private information.
- **Technology:** React frontend, Express/Node.js backend, MongoDB database, Redis optional, Render backend deployment, Vercel frontend deployment.

## 3. User roles and permissions

### 3.1 Public visitor
- View homepage, tournament announcements, open/closed tournament status, rules, public leaderboard, results, and winners.
- Open the official WhatsApp community invitation link.
- Cannot view private registrations, payment evidence, room credentials, or admin pages.

### 3.2 Player / Squad Captain
- Submit a Solo registration or create a Squad registration.
- Provide accurate player details and Free Fire UIDs.
- Receive a unique registration reference.
- See payment instructions and send payment details to the official admin WhatsApp contact.
- Receive registration and room-credential emails.
- Submit match-result screenshots if enabled for that tournament.
- View public results and rankings.

### 3.3 Squad member
- Be listed in a Squad registration with their display name and Free Fire UID.
- A full player account is not required for MVP unless the team decides to add one later.

### 3.4 Match spectator / observer
- View assigned tournament/match information.
- Record match placement, kills, Booyah result, and notes.
- Upload or attach match evidence if authorized.
- Submit results for admin review.
- Cannot publish final results or alter payments/room credentials.

### 3.5 Admin
- Full access to tournament, registration, payment, room, match, result, scoring, reward, content, and settings management.
- Verify or reject payments.
- Assign spectators/observers.
- Verify, correct, approve, and publish match results.
- Configure cash prizes and mark payouts as paid.
- Manage public announcements and WhatsApp links.

Use role-based access control on the backend. Hiding a button in React is not authorization.

## 4. Website pages and navigation

Suggested routes:

| Route | Purpose |
|---|---|
| `/` | Homepage, branding, announcements, featured tournament |
| `/tournaments` | All upcoming, active, full, and closed tournaments |
| `/tournaments/:slug` | Tournament details, rules, slots, fees, dates |
| `/join` | Choose Squad or Solo registration |
| `/join/squad/:tournamentId` | Squad registration form |
| `/join/solo/:tournamentId` | Solo registration form |
| `/leaderboard` | Individual and Squad rankings |
| `/results` | Published match results |
| `/winners` | Public winners / Hall of Fame |
| `/players/:id` | Public player profile with approved statistics |
| `/rules` | Eligibility, game, scoring, conduct, dispute and prize rules |
| `/contact` | Admin contact and WhatsApp community link |
| `/admin/login` | Admin login |
| `/admin/*` | Protected admin dashboard |
| `/spectator/*` | Protected spectator workspace |

The homepage should prominently display:
- RIT Esports Arena identity and gaming-themed branding.
- A short explanation that participation is for eligible college students only.
- Upcoming/active tournament cards.
- Entry fee and available slots.
- A clear “Join Tournament” call to action.
- Official WhatsApp community button for announcements.
- Recent winners and latest results.
- Rules and contact links.

Use a distinctive, readable esports visual style. Avoid clutter, excessive animation, low-contrast text, and mobile-hostile layouts. Mobile-first design is essential because many participants will open links from WhatsApp on phones.

## 5. Tournament lifecycle

A tournament has a lifecycle separate from each player's registration status.

Suggested tournament statuses:
- `draft`
- `upcoming`
- `registration_open`
- `registration_closed`
- `full`
- `room_ready`
- `live`
- `result_review`
- `completed`
- `cancelled`

Admin can create multiple tournament records, for example:
- RIT Squad Battle — Week 01
- RIT Solo Battle — Week 01
- RIT Squad Battle — Week 02

Each tournament has:
- Title and unique slug
- Description
- Format: `squad` or `solo`
- Entry fee
- Maximum slots
- Registration start/end
- Match date/time and timezone (`Asia/Kolkata`)
- Rules
- Scoring configuration
- Prize configuration
- Tournament status
- Public/private visibility
- Optional banner image

### Slot handling
- Squad slots count teams, not individual players.
- A Squad registration requires the configured number of players (normally four; allow admin configuration if game mode changes).
- Solo slots count individual registrations.
- Prevent overbooking with an atomic database operation or transaction.
- When capacity is reached, automatically mark the tournament `full` or registration unavailable.
- Admin can manually close or reopen registration, subject to capacity and audit logging.

## 6. Registration workflow

### Squad registration
Collect:
- Tournament
- Squad/team name
- Captain display name
- Captain email
- Captain phone number
- Each squad member's display name
- Each squad member's Free Fire UID
- College eligibility information (use the minimum information needed; admin can manually verify)
- Agreement to rules and privacy notice

### Solo registration
Collect:
- Tournament
- Player display name
- Email
- Phone number
- Free Fire UID
- College eligibility information
- Agreement to rules and privacy notice

No email OTP is required. Validate email format and store it for communication. Consider a confirmation email after registration, but do not make OTP verification a prerequisite.

On successful submission:
1. Validate tournament is open and has capacity.
2. Validate required player/team fields.
3. Create registration with unique human-readable reference, e.g. `RIT-FF-SQ-00125`.
4. Set registration status to `pending_payment`.
5. Show registration reference and payment instructions.
6. Provide a WhatsApp click-to-chat link to the admin number with a prefilled message containing the registration reference, tournament, team/player name, and a placeholder for UTR/reference.
7. Notify admin of the new registration.

Do not put private payment details or room credentials into public URLs.

## 7. Payment workflow

Payment is manual in MVP.

Registration payment statuses:
- `pending`
- `under_review`
- `verified`
- `rejected`
- `refunded`

Player/captain:
1. Sees the configured UPI/payment instructions.
2. Pays the fee outside the website.
3. Sends the UTR/reference and requested evidence to the official admin WhatsApp contact.
4. Includes the unique registration reference in the message.

Admin:
1. Opens the registration in admin dashboard.
2. Checks the payment details received through WhatsApp.
3. Records UTR/reference and optional private evidence.
4. Marks payment verified or rejected, with an internal reason.
5. On verification, registration becomes eligible for room distribution.

Never store UPI PINs, banking passwords, card details, or other payment credentials. Avoid collecting more payment data than necessary.

## 8. Room ID and password distribution

This is a key admin workflow.

Admin selects a tournament and enters:
- Room ID
- Room Password
- Scheduled release time (optional)
- Message template (optional)

Admin then selects one or more eligible, payment-verified registrations and clicks **Send Room Details**.

Backend must:
1. Confirm the admin is authorized.
2. Confirm selected registrations belong to the chosen tournament.
3. Confirm each registration is approved/payment-verified.
4. Send the credentials to the captain/player email on file.
5. Record one delivery attempt per recipient.
6. Update room notification status, e.g. `sent`, `failed`, or `pending`.
7. Show a delivery report to admin and allow retry for failed recipients.

Room credentials must be stored securely and must never be returned by public tournament endpoints. Do not expose credentials in page source, public JSON, logs, analytics, or unprotected database queries. Only authorized admin actions and the intended recipient notification flow may access them.

Email delivery success means the provider accepted the message; it does not prove the recipient opened or read it. Display delivery states accurately.

## 9. Match observation and result submission

A designated spectator/observer watches the actual match and records the outcome. This is not automatic game integration. Do not claim to read live Free Fire game data unless a legitimate supported integration exists.

### Spectator workflow
- Admin assigns an observer to a tournament/match.
- Observer opens the protected spectator workspace.
- Observer records each participant/team's:
  - Placement
  - Total kills
  - Booyah status
  - Match notes
- Observer attaches evidence where possible, such as scoreboard screenshots.
- Observer submits the result as `pending_review`.

### Captain screenshot workflow
- Captain may submit a match-result screenshot using a protected submission form or designated admin communication channel.
- Capture registration reference, tournament/match, uploader, upload time, and file.
- Treat screenshots as supporting evidence, not automatically verified truth.
- Validate file type and size; scan uploads where possible; store files in object storage rather than MongoDB.
- Do not permit arbitrary executable uploads.

### Admin result review
- Compare observer's record and captain-submitted screenshots.
- Resolve discrepancies manually.
- Admin can correct scores with a reason and audit record.
- Admin approves and publishes final results.
- Only published results affect public leaderboards and winner pages.

Result statuses:
- `draft`
- `submitted`
- `pending_review`
- `needs_clarification`
- `verified`
- `published`
- `disputed`
- `void`

## 10. Scoring engine

The scoring system must support **Kill points + Booyah points** and be configurable per tournament.

Do not assume or hardcode a scoring value without admin configuration.

Suggested formula:

`Total Match Points = (Kills × Kill Points) + Booyah Bonus`

Where:
- `kills` is a non-negative integer.
- `killPointValue` is configured for that tournament.
- `booyahBonus` is configured for that tournament.
- Booyah is a boolean or verified first-place result.
- Do not award Booyah points twice for the same match.
- Validate impossible or inconsistent inputs and require admin review.

If placement points are later enabled, support them as an optional configurable component, but the initial required model is kills + Booyah.

For Squad tournaments:
- Store squad-level match result and team kills.
- Also store individual player kill counts if the observer can reliably record them.
- Squad points are calculated from the squad result.
- Individual points are calculated from each player's recorded kills and any individual Booyah policy defined by the tournament rules.
- Make the individual-vs-squad Booyah rule explicit in the admin configuration.

For Solo tournaments:
- Each player has their own kills and Booyah result.
- Calculate individual points directly.

For multiple rounds:
- Sum verified match points across all rounds.
- Show per-match breakdown and cumulative total.
- Define tie-breakers before registration opens, e.g. most Booyahs, then most kills, then best placement. Admin must be able to configure and publish the tie-breaker order.

Every published score should have an auditable calculation breakdown.

## 11. Leaderboards

Provide two distinct leaderboard views:

### Squad leaderboard
- Rank
- Squad name
- Tournament / season
- Matches played
- Total kills
- Booyah count
- Total points
- Win count

### Individual leaderboard
- Rank
- Player display name
- Squad (where applicable)
- Matches played
- Total kills
- Booyah count
- Total points
- MVP / achievement badges if enabled

Support:
- Current tournament leaderboard
- Weekly leaderboard
- Monthly/season leaderboard
- Overall college leaderboard

Only verified/published results contribute to rankings. Clearly label the leaderboard scope and date range. Prevent duplicate result imports from double-counting points.

## 12. Winners, public results and player profiles

The public `/winners` page should show:
- Tournament name and date
- Winning Squad or Solo player
- Runner-up positions if configured
- Approved display names
- Squad name and public Free Fire UID only if the player has consented
- Kills, Booyah count and total points
- Cash prize amount, if published
- Winner image/banner if available

Player public profiles may show:
- Display name
- Public Free Fire UID only with consent
- Squad history
- Published tournament participation
- Kills and Booyah statistics
- Total points
- Wins and achievements

Never show:
- Personal email
- Phone number
- Payment UTR/reference
- Payment screenshot
- Private college identity documents
- Room password
- Internal admin notes

Provide a way for participants to request correction or removal of optional public profile details.

## 13. Cash prize management

Rewards are **cash prizes**. The admin pays winners manually outside the website.

Admin can configure before registration opens:
- Prize for first place
- Prize for second place
- Prize for third place
- Optional MVP prize, if offered
- Total announced prize pool
- Prize terms and eligibility

After results are verified:
- Link prize record to the winning player/squad and tournament.
- Record amount.
- Record payout status: `pending`, `paid`, `on_hold`, `cancelled`.
- Record paid date and internal transaction reference.
- Keep payout information private.
- Public website may show the announced prize and winner, but not private transaction details.

Publish prize terms, tie rules, cancellation/refund policy, and the process for resolving disputes before registration opens. Confirm college approval and applicable game/platform rules before collecting entry fees or distributing prizes.

## 14. Admin dashboard modules

1. **Overview:** active tournaments, registrations, pending payments, confirmed entries, upcoming matches.
2. **Tournament management:** create/edit/publish/close/cancel tournaments.
3. **Slot management:** capacity, availability, waitlist if enabled.
4. **Registration management:** Squad/Solo details, eligibility, statuses.
5. **Payment management:** manual UTR verification and rejection reason.
6. **Room management:** room credentials, selected recipients, send/retry logs.
7. **Spectator management:** assign observers and permissions.
8. **Match management:** create rounds/matches and set schedule.
9. **Result review:** observer submissions, captain evidence, disputes, verification.
10. **Scoring configuration:** kill points, Booyah bonus, optional future placement points, tie-breakers.
11. **Leaderboard management:** calculate, review, publish.
12. **Prize management:** cash prize configuration and payout tracking.
13. **Winners management:** publish winner list and public statistics.
14. **Content/branding:** logo, banners, homepage text, rules, WhatsApp links.
15. **Settings:** admin accounts, roles, email configuration, contact details, audit logs.

## 15. Recommended technology architecture

Continue with the team's existing stack.

### Frontend
- React
- Vite (recommended for a straightforward React SPA)
- React Router
- Tailwind CSS
- A reusable component system
- Deploy on Vercel

### Backend
- Node.js
- Express
- REST API
- Mongoose
- Deploy on Render

### Database
- MongoDB Atlas or another managed MongoDB deployment
- Store users, tournaments, registrations, results, scores, payments metadata, notification logs and prize records.
- Use indexes and transactions/atomic operations for slot allocation and critical status changes.

### Redis (optional)
Use Redis only where it provides a clear benefit:
- Rate limiting
- Short-lived caching for public tournament/leaderboard data
- Background job queues for email notifications
- Temporary one-time action tokens if needed

Redis is not the source of truth. MongoDB remains authoritative. The application must still work if Redis is not configured, unless a feature explicitly depends on it. Do not store permanent tournament results or payment records only in Redis.

### Email
- Brevo transactional email API (or another provider selected by the team).
- Keep API keys in Render environment variables.
- Use templates for registration confirmation, payment status, room details and result announcements.
- Never commit API keys to Git.

### File storage
- Use Cloudinary or Cloudflare R2 for banners and evidence screenshots.
- Do not store uploaded image binaries directly in MongoDB.
- Use signed/private access for evidence that should only be seen by admins.

### Deployment
- Frontend: Vercel.
- Backend: Render.
- Database: MongoDB managed deployment.
- Redis: managed Redis provider, optional.

## 16. Environment variables

Example names only; do not place real secrets in source control.

### Backend `.env`
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend.vercel.app
MONGODB_URI=
REDIS_URL=
JWT_SECRET=
BREVO_API_KEY=
EMAIL_FROM=
ADMIN_BOOTSTRAP_EMAIL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Use a strong, unique JWT secret. Validate required environment variables at startup. Never use a hardcoded fallback secret. Configure CORS to allow only the deployed frontend and explicitly approved development origins. Set secure cookie/session options appropriately if cookie-based authentication is used.

### Frontend `.env`
```env
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

Only public configuration belongs in the frontend. Never put MongoDB URI, Redis URL, JWT secret, email API key, or cloud storage secret in Vite environment variables. Vite variables are exposed to the browser.

## 17. Suggested MongoDB collections

A practical initial model:

- `admins`
- `players`
- `squads`
- `tournaments`
- `registrations`
- `payments`
- `matches`
- `spectatorAssignments`
- `resultSubmissions`
- `matchResults`
- `roomDistributions`
- `leaderboardSnapshots` (optional; derived from verified results)
- `prizes`
- `notifications`
- `auditLogs`
- `siteSettings`

Use references and indexes thoughtfully. Add unique indexes for registration references and appropriate constraints to prevent duplicate player/team registrations in the same tournament.

## 18. API outline

Example REST endpoints; refine during implementation.

### Public
- `GET /api/tournaments`
- `GET /api/tournaments/:slug`
- `POST /api/registrations/squad`
- `POST /api/registrations/solo`
- `GET /api/leaderboards`
- `GET /api/results`
- `GET /api/winners`
- `GET /api/players/:id`

### Admin (authenticated + role checked)
- `POST /api/admin/tournaments`
- `PATCH /api/admin/tournaments/:id`
- `PATCH /api/admin/tournaments/:id/status`
- `GET /api/admin/registrations`
- `PATCH /api/admin/registrations/:id/payment`
- `POST /api/admin/rooms`
- `POST /api/admin/rooms/:id/send`
- `POST /api/admin/matches`
- `PATCH /api/admin/results/:id/review`
- `POST /api/admin/results/:id/publish`
- `POST /api/admin/scoring-config`
- `POST /api/admin/prizes`
- `PATCH /api/admin/prizes/:id/payout`
- `POST /api/admin/spectators/assign`

### Spectator (authenticated + assigned role)
- `GET /api/spectator/assignments`
- `POST /api/spectator/matches/:id/results`
- `POST /api/spectator/matches/:id/evidence`

All admin/spectator routes require server-side authorization. Validate input on the backend, not only in React.

## 19. Security, privacy and reliability requirements

- Role-based access control for admin and spectator.
- Secure password hashing for admin accounts.
- Rate limiting for login, registration and sensitive endpoints.
- Strict CORS allowlist.
- Server-side validation and sanitization.
- Secure file upload validation, file size limits and safe storage.
- Never expose room credentials or payment evidence through public endpoints.
- Never expose secrets in frontend code or Git.
- Audit logs for payment decisions, room distribution, score edits, result publication and prize status changes.
- Prevent duplicate submissions and double-counted scores.
- Use atomic slot reservation to avoid oversubscription.
- Back up MongoDB regularly.
- Use pagination for registrations and results.
- Provide clear error states and retry handling for email delivery.
- Do not claim an email was delivered merely because a button was clicked.
- Collect only necessary student information and obtain consent for public player profiles.
- Keep private contact and payment information private.

## 20. Reference websites for design and product inspiration

Use these as **inspiration for specific patterns**, not as sites to copy. The product is college-specific and should retain its own RIT identity.

1. **Battlefy** — https://battlefy.com/  
   Inspiration: tournament discovery, registration flow, brackets and event pages.

2. **Toornament** — https://www.toornament.com/  
   Inspiration: tournament administration, participants, match results and competition structures.

3. **Challengermode** — https://www.challengermode.com/  
   Inspiration: esports competition presentation, player experience and competitive identity.

4. **FACEIT** — https://www.faceit.com/  
   Inspiration: player profiles, match history, rankings and competitive community features.

5. **Garena Free Fire Esports** — https://www.ffesports.com/  
   Inspiration: Free Fire esports branding, event presentation and results communication. Check current availability/redirects in the target region before relying on any particular page.

Do not reproduce their logos, assets, text, or exact layouts. Create original RIT Esports Arena branding.

## 21. MVP acceptance criteria

The first release is complete only when all of the following work:

- Public can view tournaments and join the WhatsApp community.
- Admin can create Squad and Solo tournaments with fees, dates, slots and registration status.
- Player can submit a Squad or Solo registration without OTP.
- System creates a unique registration reference.
- Admin can find a registration and verify/reject its payment.
- Admin can enter room credentials and select only eligible recipients.
- Selected recipients receive the correct email; each attempt is logged.
- Spectator can submit match results and evidence.
- Captain can submit screenshots as supporting evidence.
- Admin can review, correct, verify and publish results.
- Kill + Booyah scoring is calculated correctly using the tournament's configured values.
- Both Squad and Individual leaderboards work.
- Public winners page shows approved winner names and statistics.
- Admin can record cash prize payout status.
- Private information and room credentials are never exposed publicly.
- Website works on mobile and desktop.

## 22. Build order

Implement in this order:

1. Project setup, shared UI, routing and responsive design.
2. MongoDB models and Express API foundation.
3. Admin authentication and role-based permissions.
4. Public homepage, tournament listing and tournament detail pages.
5. Squad/Solo registration and slot handling.
6. Admin registration and manual payment verification.
7. Room credential entry, recipient selection and email delivery.
8. Spectator workspace and screenshot evidence submission.
9. Admin result review and publication.
10. Configurable Kill + Booyah scoring.
11. Individual and Squad leaderboards.
12. Winners, player profiles and cash prize tracking.
13. Audit logs, security review, testing and deployment.

---

# 23. Instructions to the Antigravity coding agent

You are the lead full-stack engineer. Build the application from this specification.

Before writing substantial code:
1. Inspect the existing repository and preserve working code where practical.
2. Identify the current React, Express, MongoDB and deployment setup.
3. Produce a concise implementation plan and proposed folder structure.
4. Identify missing secrets/configuration without inventing values.
5. Implement in milestones and keep the application runnable after each milestone.

Engineering rules:
- Use React + Vite for the frontend, Express + Node.js for the backend, and MongoDB for persistent data.
- Keep frontend and backend cleanly separated.
- Use reusable components, services, controllers, routes, models and middleware.
- Keep business logic (slot handling, scoring, payment state transitions and permissions) on the backend.
- Use environment variables for all secrets and deployment-specific URLs.
- Redis is optional and must not be required for basic functionality.
- Add loading, empty, success and error states.
- Add input validation and clear user-facing messages.
- Do not use fake success responses for email sending, payment verification or result publication.
- Do not invent a Free Fire API or claim automatic match observation. The spectator records results manually and uploads evidence.
- Do not add OTP verification.
- Do not add online cash payouts in the MVP.
- Do not expose private player information or room credentials publicly.
- Do not create non-functional buttons or placeholder workflows disguised as completed features.
- Include database indexes, seed/demo data clearly marked as demo, and setup instructions.
- Add tests for slot capacity, registration status transitions, scoring calculations, authorization and result publication.
- Provide `.env.example` files containing placeholders only.
- Document local development, deployment on Render/Vercel, MongoDB configuration and optional Redis configuration.

At the end of each milestone, report:
- What was implemented
- Files changed
- How to run/test it
- What remains
- Any required environment variables

**Priority:** Correct workflows, secure access control, reliable results and mobile usability come before decorative animations.
