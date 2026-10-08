# UoS Sustainable Travel Hub

A responsive, installable web app that helps **University of Sunderland students and staff** travel sustainably around Sunderland and the wider North East of England.

It plans green journeys with live times and turn-by-turn voice directions, shows the 700/701 university buses moving live, lists today's official bus and Metro fares, and tracks the CO₂ each person saves. An admin area lets the app team answer messages and keep fares, zones and map locations up to date.

🌐 **Live app:** https://uos-sustainable-travel.vercel.app/
🔌 **Backend API:** https://sustainable-travel-api.onrender.com (the backend repository is private — [contact the developer](mailto:simonkelvin2011@gmail.com) to discuss access)

---

## Features

### Journey planner (home page)

- **Start and destination search** with live place suggestions as you type, weighted towards Sunderland.
- **Starts from your current location** by default; you can change it to any address, a saved place or a campus.
- **Compares six ways to travel** — walk, cycle, Metro, bus, train and car share — showing for each:
  - minutes from when you pressed Search (including waiting), arrival time and distance
  - CO₂ saved compared with driving alone, and calories burned for walking and cycling
  - the fare where available, plus **Greenest** and **Fastest** badges
- **Interactive Google map** with the route drawn in colour, and optional transit, cycle-lane and traffic layers.
- **Your location as an arrow with a direction beam** that turns as you turn (phone compass, or GPS direction while moving), plus a **My location** button.
- **Live turn-by-turn navigation**: GPS tracking, spoken directions (British English), turns announced ahead, automatic re-routing when you go off route, and the screen kept awake.
- **Leave-by alerts** for bus, Metro and train trips ("Leave in 5 min to catch the 700"), with a 5-minute reminder and an **Add to calendar** option.
- **Saved places and trips**: save Home and Work for one-tap trips such as "Home → City Campus", and star any journey.

### CO₂ tracker

- "You've saved X kg CO₂ this term", a daily streak, this week's total, calories and a "trees equivalent".
- A **Team UoS** counter of CO₂ saved by everyone this term.
- Personal stats are stored on the user's device only; the server receives anonymous totals.

### Live map

- **Live 700/701 bus positions** from Jim Hughes Coaches, refreshed every 15 seconds, with direction of travel (other operators' routes with the same numbers are filtered out).
- **Cycle parking** at City Campus, St Peter's Campus and the London Campus.
- Campuses, Metro, rail and bus stations, with show/hide buttons and a Sunderland/London switch.

### Ticketing and prices

- **Fares update automatically every day at 05:15 UK time** from official sources:
  - **Bus:** Jim Hughes Coaches (shown first — it runs the 700/701), Go North East and Stagecoach North East, from the Bus Open Data Service.
  - **Metro:** singles, day tickets, Pop Pay As You Go caps, season tickets, **Student Metro Season Tickets** and under-22 fares, from Travel North East (Nexus).
- Filters for Adult, Student, Young person, Child, Family and Group tickets.
- Each operator shows when its fares were last checked and last changed by the operator.
- Rail guidance with links to buy, and a "Spotted a wrong price? Tell us" link.

### Travel zones

- The four Metro and Northumberland Line zones (A–D), with areas and stations taken from the official Nexus fare zone map, including stations on zone boundaries.
- Current Metro fares by number of zones, with Pop Pay As You Go caps.

### Help, privacy and accessibility

- **Contact us** form with topics (including "Wrong travel information"), spam protection, and messages delivered to the admin inbox.
- **Privacy policy** in plain English, and an **accessibility statement** following the Public Sector Bodies Accessibility Regulations 2018.
- Tested against **WCAG 2.2 AA**: colour contrast (the UoS orange is used in a deeper shade where it's text or behind white text), keyboard use with a skip link and visible focus, and 400% zoom.

### Also included

- **Sustainability tips** page.
- **Installable app (PWA)**: add to home screen, with offline access to saved trips, campus info and fares.
- **Dark mode**: automatic, light or dark, using the UoS orange and navy palette.
- Clear messages when location is blocked or switched off (with steps for iPhone, Android and desktop), when offline, and when a service is busy.

---

## Technology stack

- **React 19**, **Vite 7**, **React Router 7**
- **Google Maps Platform** via `@vis.gl/react-google-maps` (home-page map)
- **Leaflet** and **React-Leaflet** with **OpenStreetMap** tiles (live map page and admin location editor)
- **vite-plugin-pwa** (Workbox) for the installable, offline-capable app
- **qrcode** for the admin two-factor set-up screen
- Browser APIs: Geolocation, Device Orientation (compass), Web Speech, Screen Wake Lock, Notifications
- **ESLint**

---

## Project structure

```text
sustainable-travel-frontend/
├── public/
│   ├── icons/                 # PWA icons
│   ├── images/
│   ├── robots.txt             # keeps /admin out of search engines
│   └── theme-init.js          # applies light/dark theme before first paint
├── src/
│   ├── components/
│   │   ├── planner/           # journey planner, map, location arrow, route options, navigation, leave-by alerts
│   │   ├── ErrorBoundary.jsx
│   │   ├── ImpactCard.jsx     # CO₂ tracker
│   │   ├── InstallBanner.jsx
│   │   ├── LocationNotice.jsx
│   │   ├── OfflineBanner.jsx
│   │   ├── ThemeToggle.jsx
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── TipModal/
│   ├── data/travelData.js     # Metro zone pricing table and sustainability tips
│   ├── hooks/                 # theme, saved places, CO₂ impact, live location, compass heading, turn-by-turn, ...
│   ├── lib/
│   │   ├── api.js             # public backend API client (timeouts, friendly errors)
│   │   ├── adminApi.js        # admin API client (tab-only session, auto sign-out)
│   │   ├── colour.js          # readable text colour on coloured badges
│   │   ├── geo.js             # campuses, distances, location error help
│   │   ├── navigation.js      # route decoding and off-route detection
│   │   ├── reminders.js       # leave-by reminders and calendar files
│   │   ├── speech.js          # voice directions
│   │   └── ...
│   ├── pages/
│   │   ├── Home, Ticketing, Zones, TravelMap, Sustainability
│   │   ├── Contact, Privacy, Accessibility
│   │   └── admin/             # admin area (loaded separately): sign-in, dashboard, messages,
│   │                          #   content editing, admins and invites, activity log, account
│   ├── styles/
│   │   ├── dark.css
│   │   └── a11y.css           # colour-contrast fixes
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css              # brand colour tokens (light and dark)
├── .env.example
├── vercel.json                # SPA routing and security headers
└── vite.config.js             # Vite + PWA configuration
```

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19 or later (required by Vite 7), npm and Git
- The backend running locally or a deployed backend URL

### Install

```bash
git clone https://github.com/simon200ok/sustainable-travel-frontend.git
cd sustainable-travel-frontend
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill it in:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_MAPS_BROWSER_KEY=
VITE_GOOGLE_MAP_ID=
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Backend API address, without a trailing slash |
| `VITE_GOOGLE_MAPS_BROWSER_KEY` | For the home-page map | Google **browser** key: Maps JavaScript API only, restricted to your site's web address (use a separate key restricted to `localhost:5173` for development) |
| `VITE_GOOGLE_MAP_ID` | For the home-page map | Map ID from Google Cloud → Google Maps Platform → Map Management |

> Everything starting with `VITE_` is built into the public JavaScript. All other keys are secret and belong only in the backend's environment.

Without the Google variables, the planner still works and shows a "map will appear here" panel.

### Run

```bash
npm run dev
```

Open http://localhost:5173.

---

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build in `dist/`, including the service worker and manifest |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

---

## Application routes

| Route | Description |
| --- | --- |
| `/` | Journey planner, live navigation and CO₂ tracker |
| `/ticketing` | Today's bus and Metro fares, and rail guidance |
| `/zones` | Travel zones A–D and Metro zone pricing |
| `/map` | Live 700/701 buses, cycle parking and transport links |
| `/sustainability` | Sustainable travel information and tips |
| `/contact` | Contact us form (messages go to the admin inbox) |
| `/privacy` | Privacy policy |
| `/accessibility` | Accessibility statement |
| `/admin` | Admin area (sign-in with two-factor required; linked from the footer) |
| `/admin/invite` | Accept an invite to become an admin |

---

## Backend API used

| Endpoint | Used for |
| --- | --- |
| `GET /journey/autocomplete` | Place suggestions |
| `GET /journey/place/:placeId` | Coordinates of a chosen place |
| `POST /journey/plan` | Walk, cycle, Metro, bus, train and car-share options |
| `GET /live/buses` | Live 700/701 bus positions |
| `GET /fares` | Bus and Metro fares, synced daily |
| `POST /impact/journeys`, `GET /impact/summary` | Anonymous Team UoS CO₂ counter |
| `POST /contact` | Contact us messages |
| `GET /content/meta` | Editable page notes (e.g. the Metro fares note) |
| `GET /locations`, `/zones`, `/operators`, `/tickets` | Campuses, cycle parking, stations, zones and backup Metro fares |
| `/admin/...` | Admin sign-in, messages, content editing, admins and invites, activity log |

All Google Places and Routes calls go through the backend, so the server key is never exposed to the browser.

---

## Admin area

`/admin` is for the app's admin team. It's loaded as a separate bundle, so ordinary visitors never download its code.

- **Sign-in:** email, password and a 6-digit code from an authenticator app. On first sign-in, the admin scans a QR code to set up two-factor.
- **Dashboard:** new messages, Team UoS CO₂ by travel mode, fares sync status and next scheduled run, Google usage against the daily cap, live-bus feed status, and email-alert status with a test button.
- **Messages:** search and filter, reply by email, resolve, mark as spam, internal notes, delete, and erase everything from one sender for data-protection requests.
- **Content:** edit zone descriptions, colours and stations; add, move (click the map) or remove map locations such as cycle parking; edit page notes; and maintain backup Metro fares and other tickets that aren't published online. Bus and Metro fares update automatically — **Sync now** is for special occasions only.
- **Admins:** invite admins (single-use link that expires after 72 hours), disable, enable, unlock, reset two-factor or delete other admins. The app always keeps at least one admin who can sign in.
- **Activity log:** every sign-in, failed attempt and change, kept for 12 months.
- **Email alerts:** new messages and security events (invites, new admins, lockouts, deletions) can be emailed to the app owner.
- **Sessions:** kept for the browser tab only, end after 30 minutes or 15 minutes of inactivity, and "Sign out" ends the session on every device.

---

## Security and privacy

- Strict **Content Security Policy** and security headers (HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`) set in `vercel.json`.
- Location and motion sensors are only allowed for this site; camera, microphone, payment and USB access are blocked.
- The Google browser key is restricted to the Maps JavaScript API and to the site's web address.
- Saved places, saved trips and personal CO₂ stats stay on the user's device; no account is needed.
- Contact messages are deleted automatically after 12 months (spam after 30 days).
- Admin pages are never cached or indexed, and messages are always displayed as plain text.
- Google Maps content is not cached offline, in line with Google's terms.

The backend adds rate limiting, input validation, two-factor admin sign-in with lockout, a daily Google spending cap and its own security headers. The backend repository is private — [contact the developer](mailto:simonkelvin2011@gmail.com) to discuss access.

---

## Deployment

The frontend is deployed on **Vercel** and the backend on **Render**, with a **Neon** PostgreSQL database.

In Vercel → Settings → Environment Variables, add `VITE_API_BASE_URL`, `VITE_GOOGLE_MAPS_BROWSER_KEY` and `VITE_GOOGLE_MAP_ID` as **Config** variables (they are public by design). After changing them, redeploy without the build cache so Vite includes the new values.

If the backend address changes, also update `connect-src` in the Content Security Policy in `vercel.json`.

---

## Future improvements

- Sign in with the university Microsoft account (for students' saved data and for admins).
- Department and halls leaderboards.
- Weather-aware suggestions (e.g. "a good day to cycle").
- Step-free and accessibility-focused routes, and screen-reader testing with NVDA and VoiceOver.
- Push notifications for leave-by alerts when the app is closed.
- Uptime monitoring and error reporting.

---

## Authors

**Simon Ugochukwu Awaogu**
**Mustapha**

GitHub: [@simon200ok](https://github.com/simon200ok)

---

## Acknowledgements

- Map tiles and cycle-parking data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- Live bus locations and bus fares from the [Bus Open Data Service](https://www.bus-data.dft.gov.uk/), licensed under the Open Government Licence v3.0.
- Metro fares from [Travel North East](https://travelnortheast.uk/tickets/buy-tickets/) (Nexus); travel zones from the Nexus Metro and local rail fare zone map.
- Journey planning, place search and the home-page map by Google Maps Platform.

This project was developed as a Sustainable Travel App for the University of Sunderland.
