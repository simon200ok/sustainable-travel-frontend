# UoS Sustainable Travel Hub

A responsive, installable web app that helps **University of Sunderland students and staff** travel sustainably around Sunderland and the wider North East of England.

It plans green journeys with live times and turn-by-turn voice directions, shows the 700/701 university buses moving live, lists today's official bus fares, and tracks the CO₂ each person saves.

🌐 **Live app:** https://uos-sustainable-travel.vercel.app/
🔌 **Backend API:** https://sustainable-travel-api.onrender.com ([sustainable-travel-backend](https://github.com/simon200ok/sustainable-travel-backend))

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
- **Live turn-by-turn navigation**: GPS tracking, spoken directions (British English), turns announced ahead, automatic re-routing when you go off route, and the screen kept awake.
- **Leave-by alerts** for bus, Metro and train trips ("Leave in 5 min to catch the 700"), with a 5-minute reminder and an **Add to calendar** option.
- **Saved places and trips**: save Home and Work for one-tap trips such as "Home → City Campus", and star any journey.

### CO₂ tracker

- "You've saved X kg CO₂ this term", a daily streak, this week's total, calories and a "trees equivalent".
- A **Team UoS** counter of CO₂ saved by everyone this term.
- Personal stats are stored on the user's device only; the server receives anonymous totals.

### Live map

- **Live 700/701 bus positions**, refreshed every 15 seconds, with direction of travel.
- **Cycle parking** at City Campus, St Peter's Campus and the London Campus.
- Campuses, Metro, rail and bus stations, with show/hide buttons and a Sunderland/London switch.

### Ticketing and prices

- **Bus fares synced daily** from the operators' official data on the Bus Open Data Service (Go North East, Stagecoach North East, Jim Hughes Coaches).
- Filters for Adult, Young person, Child, Family and Group tickets.
- Nexus Metro fares (in effect from 1 April 2026) and rail guidance, with links to buy.

### Also included

- **Travel Zones** and **Sustainability tips** pages.
- **Installable app (PWA)**: add to home screen, with offline access to saved trips, campus info and fares.
- **Dark mode**: automatic, light or dark, using the UoS orange and navy palette.
- Clear messages when location is blocked or switched off (with steps for iPhone, Android and desktop), when offline, and when a service is busy.

---

## Technology stack

- **React 19**, **Vite 7**, **React Router 7**
- **Google Maps Platform** via `@vis.gl/react-google-maps` (home-page map)
- **Leaflet** and **React-Leaflet** with **OpenStreetMap** tiles (live map page)
- **vite-plugin-pwa** (Workbox) for the installable, offline-capable app
- Browser APIs: Geolocation, Web Speech, Screen Wake Lock, Notifications
- **ESLint**

---

## Project structure

```text
sustainable-travel-frontend/
├── public/
│   ├── icons/                 # PWA icons
│   ├── images/
│   └── theme-init.js          # applies light/dark theme before first paint
├── src/
│   ├── components/
│   │   ├── planner/           # journey planner, map, route options, navigation, leave-by alerts
│   │   ├── ErrorBoundary.jsx
│   │   ├── ImpactCard.jsx     # CO₂ tracker
│   │   ├── InstallBanner.jsx
│   │   ├── LocationNotice.jsx
│   │   ├── OfflineBanner.jsx
│   │   ├── ThemeToggle.jsx
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── TipModal/
│   ├── data/travelData.js     # static zone pricing and sustainability tips
│   ├── hooks/                 # theme, saved places, CO₂ impact, live location, turn-by-turn, ...
│   ├── lib/
│   │   ├── api.js             # backend API client (timeouts, friendly errors)
│   │   ├── geo.js             # campuses, distances, location error help
│   │   ├── navigation.js      # route decoding and off-route detection
│   │   ├── reminders.js       # leave-by reminders and calendar files
│   │   ├── speech.js          # voice directions
│   │   └── ...
│   ├── pages/                 # Home, Ticketing, Zones, TravelMap, Sustainability
│   ├── styles/dark.css
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
- The [backend](https://github.com/simon200ok/sustainable-travel-backend) running locally or a deployed backend URL

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
| `VITE_GOOGLE_MAPS_BROWSER_KEY` | For the home-page map | Google **browser** key: Maps JavaScript API only, restricted to your site's web address |
| `VITE_GOOGLE_MAP_ID` | For the home-page map | Map ID from Google Cloud → Google Maps Platform → Map Management |

> Everything starting with `VITE_` is built into the public JavaScript. Any other keys are secret keys and below only in the backend's environment!

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
| `/ticketing` | Today's operator bus fares, Metro fares and rail guidance |
| `/zones` | Travel zones and zone pricing |
| `/map` | Live 700/701 buses, cycle parking and transport links |
| `/sustainability` | Sustainable travel information and tips |

---

## Backend API used

| Endpoint | Used for |
| --- | --- |
| `GET /journey/autocomplete` | Place suggestions |
| `GET /journey/place/:placeId` | Coordinates of a chosen place |
| `POST /journey/plan` | Walk, cycle, Metro, bus, train and car-share options |
| `GET /live/buses` | Live 700/701 bus positions |
| `GET /fares` | Operator bus fares synced daily from BODS |
| `POST /impact/journeys`, `GET /impact/summary` | Anonymous Team UoS CO₂ counter |
| `GET /locations`, `/zones`, `/operators`, `/tickets` | Campuses, cycle parking, stations, zones and Metro fares |

All Google Places and Routes calls go through the backend, so the server key is never exposed to the browser.

---

## Security and privacy

- Strict **Content Security Policy** and security headers (HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`) set in `vercel.json`.
- Location is only allowed for this site; camera, microphone, payment and USB access are blocked.
- The Google browser key is restricted to the Maps JavaScript API and to the site's web address.
- Saved places, saved trips and personal CO₂ stats stay on the user's device; no account is needed.
- Google Maps content is not cached offline, in line with Google's terms.

The backend adds rate limiting, input validation, a daily Google spending cap and its own security headers — see the [backend link set as private (contact developer to discuss viewing possibility)](simonkelvin2011@gmail.com).

---

## Deployment

The frontend is deployed on **Vercel** and the backend on **Render**, with a **Neon** PostgreSQL database.

In Vercel → Settings → Environment Variables, add `VITE_API_BASE_URL`, `VITE_GOOGLE_MAPS_BROWSER_KEY` and `VITE_GOOGLE_MAP_ID` as **Config** variables (they are public by design). After changing them, redeploy without the build cache so Vite includes the new values.

If the backend address changes, also update `connect-src` in the Content Security Policy in `vercel.json`.

---

## Future improvements

- Sign in with the university Microsoft account to sync CO₂ stats and saved places across devices.
- Department and halls leaderboards.
- Weather-aware suggestions (e.g. "a good day to cycle").
- Step-free and accessibility-focused routes.
- Push notifications for leave-by alerts when the app is closed.

---

## Authors

**Simon Ugochukwu Awaogu**
**Mustapha**

GitHub: [@simon200ok](https://github.com/simon200ok)

---

## Acknowledgements

- Map tiles and cycle-parking data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- Live bus locations and bus fares from the [Bus Open Data Service](https://www.bus-data.dft.gov.uk/), licensed under the Open Government Licence v3.0.
- Journey planning, place search and the home-page map by Google Maps Platform.

This project was developed as a Sustainable Travel App for the University of Sunderland.
