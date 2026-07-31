# FeedX

**Surplus food, redistributed in minutes.**

FeedX connects restaurants  , hotels , resorts that have surplus food to verified needy organizations who needs it — a "Swiggy for food donation." This repo is a working MVP: a Node.js/Express + MongoDB backend and a React + Tailwind frontend, both fully wired and ready to run.

```
FeedX/
├── backend/     Node.js + Express + MongoDB API
├── frontend/    React + Vite + Tailwind app
└── README.md    You are here
```

You can run FeedX two ways:
- **Locally** on your own machine (fastest for development) — see [Section 4](#4-run-it-locally)
- **In production**, backend on Render + frontend on Vercel + database on Atlas — see [Section 5](#5-deploy-to-production-vercel--render)


 **vercel link**:-https://feedxupdated-2.vercel.app/
---

## 1. What's actually built

This isn't just scaffolding — every piece below is implemented end-to-end.

**Backend**
- JWT authentication with three roles: `donor`, `receiver`, `admin`
- Donor → auto-creates a `Restaurant/hotel/resort` profile; Receiver → auto-creates an `Ngo/other needy organization ` profile
- Full food listing CRUD, with photo upload, nearby search (Haversine distance), and filters
- Complete request workflow: NGO/needy organization requests → donor accepts/rejects → pickup confirmed with a
  generated confirmation code → stats update automatically. Competing requests auto-reject once
  one is accepted.
- Admin verification queue for restaurants/resort/hotel and NGOs/needy organization, dashboard stats, live donation feed
- Real-time notifications via Socket.IO (new food nearby, new request, accepted/rejected, pickup confirmed)
- Centralized error handling, role-based route guards, file upload validation

**Frontend**
- Landing page, login/register (role-aware form), public food browser, food detail + request flow
- Donor dashboard (listings, incoming requests, accept/reject, analytics)
- Receiver dashboard (nearby food, my requests, confirm pickup with code, cancel)
- Admin dashboard (verification queue, platform stats)
- A custom design system (not the generic "cream + terracotta" templated look) — see [Design](#6-design-system) below

**Not built (intentionally, see [Roadmap](#8-roadmap))**: push notifications to mobile, smart
donor↔NGO matching, QR code *scanning* (the confirmation code exists and works, but there's no
camera scanner UI), delivery-partner flow, multilingual UI, offline support.

> **Note on admin verification:** the codebase ships with an admin-verification gate that blocks
> unverified donors from listing food and unverified NGOs/needy organizations from requesting it (`backend/controllers/foodController.js`
> and `backend/controllers/requestController.js`). Some deployments of this repo have had that gate
> removed for faster testing/demoing. If your running instance lets any signed-up account list or
> request food immediately, that's why — search those two files for `restaurant.verified` /
> `ngo.verified` if you need to re-enable it before going live with real users.

---

## 2. Prerequisites

Install these once, in order:

| Tool | Check with | Get it from |
|---|---|---|
| Node.js (v18+) | `node -v` | https://nodejs.org |
| npm (comes with Node) | `npm -v` | — |
| Git | `git --version` | https://git-scm.com |
| MongoDB Atlas account (free tier) | — | https://www.mongodb.com/cloud/atlas/register |
| Code editor (VS Code or Cursor) | — | https://code.visualstudio.com or https://cursor.com |
| Postman (optional, for testing the API directly) | — | https://www.postman.com/downloads |
| GitHub account (only needed for the Vercel/Render path) | — | https://github.com |
| Render account, free tier (only needed for the Vercel/Render path) | — | https://render.com |
| Vercel account, free tier (only needed for the Vercel/Render path) | — | https://vercel.com |

You do **not** need to install MongoDB locally — Atlas gives you a free cloud database, which is
simpler and works the same whether you're running locally or in production.

---

## 3. Get a MongoDB connection string (5 minutes)

This step is required for **both** deployment paths below.

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free **M0 cluster** (any provider/region is fine).
3. Under **Database Access**, create a database user with a username and password (save these).
4. Under **Network Access**, click **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`).
   This is required either way — locally your IP can change, and Render's IPs are dynamic, so
   `0.0.0.0/0` is the simplest option. Tighten it later for a hardened production setup.
5. Click **Connect** on your cluster → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with the values from step 3, and add a database name
   before the `?`, e.g. `.../feedx?retryWrites=true...`. If your password contains special
   characters (`@ # % : /` etc.), URL-encode them or the connection will silently fail auth.

---

## 4. Run it locally

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:
```
MONGO_URI=<the connection string from step 3>
JWT_SECRET=<any long random string>
```

Then start it:
```bash
npm run dev
```

You should see:
```
MongoDB connected: cluster0.xxxxx.mongodb.net
Server running on port 5000
```

Visit http://localhost:5000 — you should see `FeedX Backend Running 🚀`.

### Optional: load demo data

This creates a verified demo admin, donor, and NGO account, plus one sample food listing, so you
can test the app immediately without registering and manually verifying accounts.

```bash
npm run seed
```

Demo accounts created:
| Role | Email | Password |
|---|---|---|
| Admin | admin@feedx.org | admin123 |
| Donor | donor@demo.com | demo1234 |
| Receiver | ngo@demo.com | demo1234 |

### Start the frontend

Open a **second terminal** (keep the backend running in the first one):

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173. The Vite dev server proxies `/api` and `/uploads` requests to the
backend on port 5000 automatically (see `frontend/vite.config.js`), so you don't need to configure
CORS or a base URL manually.

**That's it — both servers running locally means the full app works end to end.**

---

## 5. Deploy to production (Vercel + Render)

This path puts the frontend on Vercel, the backend on Render, and the database on Atlas (from
[Section 3](#3-get-a-mongodb-connection-string-5-minutes)). It's the recommended setup because the
backend is a long-running Express process with Socket.IO (persistent WebSocket connections) and
local-disk file uploads — both of which need an always-on server rather than short-lived serverless
functions, which is what Render provides and Vercel doesn't for this kind of app.

### 5.1 Push the repo to GitHub

Both Render and Vercel deploy from a Git repo, so push `FeedX/` (with `backend/` and `frontend/` as
top-level folders) to a GitHub repository first.

### 5.2 Deploy the backend to Render

1. On https://render.com: **New → Web Service**, connect your GitHub repo.
2. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free or Starter
3. Add these environment variables:
   ```
   PORT=5000
   NODE_ENV=production
   MONGO_URI=<your Atlas connection string>
   JWT_SECRET=<a long random string>
   JWT_EXPIRES_IN=7d
   CLIENT_URL=<your Vercel URL — you'll get this in step 5.3, update it after>
   GEMINI_API_KEY=<optional, if used>
   ```
4. Deploy. Render gives you a URL like `https://your-app.onrender.com`. Visit it — you should see
   `FeedX API is running`. If instead you get a 502, see [Troubleshooting](#9-troubleshooting).

### 5.3 Deploy the frontend to Vercel

1. On https://vercel.com: **Add New → Project**, import the same repo.
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add this environment variable so the chat/notifications socket connects to your real backend
   instead of `localhost:5000`:
   ```
   VITE_SOCKET_URL=https://your-app.onrender.com
   ```
4. Add a `frontend/vercel.json` (root of the `frontend` folder, next to `package.json` — **not**
   inside `src/`, Vercel only reads it from the project root) with these rewrites:
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://your-app.onrender.com/api/:path*" },
       { "source": "/uploads/:path*", "destination": "https://your-app.onrender.com/uploads/:path*" },
       { "source": "/((?!api/|uploads/).*)", "destination": "/index.html" }
     ]
   }
   ```
   The first two rules forward API calls and uploaded images to Render, so `frontend/src/api/client.js`
   can keep using its relative `/api` base URL unchanged. The third rule is a single-page-app
   fallback: without it, reloading any inner route (e.g. `/donor/add-food`) 404s, because Vercel
   looks for a real file at that path instead of letting React Router handle it.
5. Deploy. You'll get a URL like `https://your-app.vercel.app`.

### 5.4 Close the loop

Go back to Render → your backend's environment variables → set `CLIENT_URL` to your real Vercel
URL from step 5.3 (this drives the CORS allow-list in `server.js`). Save; Render redeploys
automatically.

### 5.5 Test it

Open your Vercel URL, register a donor and an NGO account (or run `npm run seed` against your Atlas
cluster locally first for pre-verified demo accounts), and confirm:
- Registration and login work
- Food listings can be created and browsed
- Requesting, accepting, and completing pickup works end to end
- Chat and real-time updates fire between two open sessions

---

## 6. Design system

The frontend uses a deliberate visual identity rather than default styling:

- **Palette**: deep canopy green (`#123A2E`) as the primary color, warm mango (`#F2A93B`) as the
  accent, signal coral (`#E85C4A`) for urgency/expiry states, soft paper (`#F5F6F1`) background.
- **Type**: Space Grotesk for display/headings, Inter for body text, IBM Plex Mono for timestamps
  and data (confirmation codes, distances, countdowns) — reinforcing the logistics/tracking feel.
- **Signature element — the Freshness Ring**: a circular countdown gauge (`FreshnessRing.jsx`) that
  shows how much of a food listing's safe window remains, shifting from mango to coral as it
  depletes. It appears in the hero, on every food card, and on the food detail page.

All tokens live in `frontend/tailwind.config.js` and `frontend/src/index.css` if you want to
restyle.

---

## 7. Environment variables reference

| Variable | Where | Required | Notes |
|---|---|---|---|
| `MONGO_URI` | backend | Yes | From Atlas, Section 3 |
| `JWT_SECRET` | backend | Yes | Any long random string |
| `JWT_EXPIRES_IN` | backend | No | Defaults to a sane value if unset |
| `PORT` | backend | No (local) / recommended (Render) | Backend listens here |
| `CLIENT_URL` | backend | Yes in production | Must exactly match your frontend's URL, or CORS blocks every request |
| `NODE_ENV` | backend | Recommended | Set to `production` on Render |
| `VITE_SOCKET_URL` | frontend | Yes in production | Your Render backend URL, used by `frontend/src/socket.js` |
| `GEMINI_API_KEY` | backend | Only if that feature is used | — |

---

## 8. Roadmap

### Phase 1 — Done in this repo
- [x] Auth (donor / receiver / admin roles)
- [x] Food listing CRUD + nearby search
- [x] Request → accept/reject → pickup confirmation workflow
- [x] Admin verification dashboard
- [x] Real-time notifications (Socket.IO)
- [x] Donor / receiver / admin frontend dashboards
- [x] Custom design system
- [x] Production deployment path (Vercel + Render + Atlas)

### Phase 2 — Recommended next
- [ ] Map view (Google Maps / Leaflet) instead of list-only distance sorting
- [ ] Push notifications via Firebase Cloud Messaging for a future mobile app
- [ ] QR code *scanning* (camera) — the confirmation code backend already supports this; you just
      need a scanner UI, e.g. the `react-qr-reader` package
- [ ] Restaurant/NGO document upload UI (backend field `documents` already exists on both models)
- [ ] Ratings and feedback after each completed pickup
- [ ] Persistent unread badges for chat, and a proper notification bell/inbox in the frontend
      (currently a lightweight toast covers new chat messages while the app is open — see
      `frontend/src/context/AuthContext.jsx`)

### Phase 3 — Differentiators (hackathon-winning features)
- [ ] Smart donor↔NGO matching: given a donor's typical donation, rank the most likely NGOs to want
      it by distance, past pickup frequency, and remaining capacity — pure rule-based scoring, no
      external model needed
- [ ] Food freshness score already exists (`Food.freshnessScore()` on the backend, `FreshnessRing`
      on the frontend) — extend it with a simple time-decay/temperature heuristic per food category
- [ ] Guided onboarding wizard (step-by-step form + FAQ) for new restaurants/NGOs
- [ ] Emergency mode: prioritize disaster-relief organizations platform-wide
- [ ] Multilingual interface
- [ ] Offline support with background sync

### Phase 4 — Production hardening
- [ ] Rate limiting and request throttling on the API
- [ ] Image optimization / CDN (move uploads to Cloudinary or S3 instead of local disk — Render's
      free-tier disk isn't guaranteed to persist across redeploys)
- [ ] Automated tests (Jest for backend, React Testing Library for frontend)
- [ ] CI/CD pipeline
- [ ] Re-enable and harden the admin verification gate before onboarding real, unvetted users

---

## 9. API reference

Base URL (local): `http://localhost:5000/api`
Base URL (production): `https://your-app.onrender.com/api`, or just `/api` from the frontend if
using the Vercel rewrite setup in Section 5.3.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register as donor or receiver |
| POST | `/auth/login` | Public | Log in, returns JWT |
| GET | `/auth/me` | Private | Current user + role profile |
| GET | `/food` | Public | List/search food (`?search=&foodType=&status=&longitude=&latitude=&maxDistanceKm=`) |
| GET | `/food/:id` | Public | Single listing + freshness score |
| POST | `/food` | Donor | Create listing (multipart form, field `photo`) |
| PUT | `/food/:id` | Donor (owner) | Update listing |
| DELETE | `/food/:id` | Donor (owner) | Delete listing |
| GET | `/food/my/listings` | Donor | Your own listings |
| POST | `/requests` | Receiver | Request a food listing (`{ foodId, remarks }`) |
| GET | `/requests` | Private | Your requests (as donor or receiver) |
| PUT | `/requests/:id/accept` | Donor | Accept a request, generates confirmation code |
| PUT | `/requests/:id/reject` | Donor | Reject a request |
| PUT | `/requests/:id/complete` | Receiver | Confirm pickup (`{ code }`) |
| PUT | `/requests/:id/cancel` | Either party | Cancel a pending/accepted request |
| GET | `/requests/:id/messages` | Donor or receiver on that request | Chat history |
| POST | `/requests/:id/messages` | Donor or receiver on that request | Send a chat message |
| GET | `/admin/dashboard` | Admin | Platform-wide stats |
| GET | `/admin/restaurants` | Admin | List restaurants (`?verified=true/false`) |
| GET | `/admin/ngos` | Admin | List NGOs (`?verified=true/false`) |
| PUT | `/admin/restaurants/:id/verify` | Admin | Approve a restaurant |
| PUT | `/admin/ngos/:id/verify` | Admin | Approve an NGO |
| DELETE | `/admin/users/:id` | Admin | Deactivate a user |
| GET | `/admin/live-donations` | Admin | Currently active pickups |
| PUT | `/users/profile` | Private | Update your own profile |
| GET | `/users/analytics` | Private | Your donation/pickup stats |
| GET | `/notifications` | Private | Your notifications |
| PUT | `/notifications/:id/read` | Private | Mark one as read |
| PUT | `/notifications/read-all` | Private | Mark all as read |

Test any of these in Postman — send `Authorization: Bearer <token>` for private routes, where
`<token>` comes from the `/auth/login` response.

---

## 10. Troubleshooting

**`MongoServerError: bad auth`** — your `MONGO_URI` username/password is wrong, or you didn't
URL-encode special characters in the password. Regenerate the connection string from Atlas.

**Backend runs but frontend requests fail with CORS errors** — make sure `CLIENT_URL` (backend env
var) exactly matches the URL the frontend is actually running on: `http://localhost:5173` locally,
or your exact Vercel domain in production (no trailing slash).

**502 Bad Gateway on Render** — almost always means the Node process crashed before it could start
listening. Check Render's Logs tab for a `MongoDB connection error` line right after boot — the most
common cause is `MONGO_URI` being unset, mistyped, or Atlas Network Access not yet whitelisting
`0.0.0.0/0`.

**404 when reloading a page in production (Vercel)** — this is a single-page-app routing issue:
Vercel looks for a real file at routes like `/donor/add-food` and finds none. Fix it with the
catch-all rewrite in `frontend/vercel.json` shown in Section 5.3.

**`vercel.json` rewrites don't seem to do anything** — the file must live at the root of whatever
folder you set as Vercel's "Root Directory" (typically `frontend/`), not inside `src/` or any
subfolder. Vercel only reads it from the project root.

**Mongoose "... is not a valid enum value for path `type`" when creating a notification** — a
`Notification` document is being created with a `type` value that isn't listed in the `enum` array
in `backend/models/Notification.js`. Add the missing value to that enum, or change the calling code
to use one of the existing values.

**"Your account is pending verification" and you can't list/request food** — expected behavior if
the admin-verification gate is still active in `foodController.js` / `requestController.js`; log in
as the admin account and verify the restaurant/NGO from the admin dashboard, or run `npm run seed`
for pre-verified demo accounts. (See the note at the end of [Section 1](#1-whats-actually-built) if
your deployment has this gate removed instead.)

**Port already in use** — change `PORT` in `backend/.env`, or stop whatever else is using port
5000/5173.

---

## 11. Explaining this project to judges

If asked *"why this tech stack?"*:
- **Express** — lightweight, fast to build REST APIs with, minimal boilerplate for a hackathon timeline.
- **MongoDB** — flexible schema fits evolving requirements (verification documents, optional
  fields) better than a rigid SQL schema for an MVP built under time pressure.
- **React + Vite** — fast dev server with hot reload, huge ecosystem, easy to explain and extend live.
- **Socket.IO** — real-time notifications without building a polling system, which matters for the
  "restaurant lists food → NGO gets notified instantly" flow that's core to the pitch.
- **JWT** — stateless auth, no server-side session storage needed, scales simply.
- **Render + Vercel + Atlas** — free-tier, zero-DevOps production hosting that matches this stack's
  needs exactly: a long-running Node server for Socket.IO and file uploads, and a fast static host
  for the React build.

If asked *"what makes this different from other food-donation apps?"* — point to the Freshness
Ring / freshness score, the automatic competing-request rejection, and the roadmap's smart
matching and freshness-heuristic ideas.
