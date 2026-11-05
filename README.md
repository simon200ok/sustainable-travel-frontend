# UoS Sustainable Travel Hub

A responsive, installable web app that helps **University of Sunderland students, staff, visitors and the public** travel sustainably. It's built around Sunderland and the North East of England, and journey planning, stop-by-stop trip tracking and live buses work across Great Britain.

It plans green journeys with live times and turn-by-turn voice directions, tells you which stop you're at during a bus, Metro or train trip, shows buses and trains moving live, lists today's official bus and Metro fares, and tracks the CO₂ each person saves. An admin area lets the app team answer messages and keep fares, zones and map locations up to date.

The app is run by the **University of Sunderland Developer Society**. It is an independent project, not an official University of Sunderland service.

🌐 **Live app:** https://uos-sustainable-travel.vercel.app/
🔌 **Backend:** a separate, private repository. To discuss access, use the app's [Contact us](https://uos-sustainable-travel.vercel.app/contact) page.

---

## Features

### Journey planner (home page)

- **Start and destination search** with live place suggestions as you type: **Near me** (favours places within about 50 km) or **Anywhere in the UK**.
- **Starts from your current location** by default; you can change it to any address, a saved place or a campus.
- **Leave now, Depart at or Arrive by** a chosen time.
- **Compares six ways to travel** - walk, cycle, Metro, bus, train and car share - showing for each:
  - minutes from when you pressed Search (including waiting), arrival time and distance
  - CO₂ saved compared with driving alone, and calories burned for walking and cycling
  - the fare where available, plus **Greenest** and **Fastest** badges
  - the best route for that option, counting walking, waiting, changes and fare, not just the first one Google suggests
- **Train platforms** from National Rail's live departure boards (for trains, and Metro on the Sunderland line), or "check the departure screens" when none is known yet.
- **Interactive Google map** with the route drawn in colour, optional transit, cycle-lane, traffic and **live bus** layers.
- **Your location as an arrow with a direction beam** that turns as you turn (phone compass, or GPS direction while moving), plus a **My location** button.
- **Leave-by alerts** for bus, Metro and train trips ("Leave in 5 min to catch the 700"), with a 5-minute reminder and an **Add to calendar** option.
- **Saved places and trips**: save Home and Work for one-tap trips such as "Home → City Campus", and star any journey.

### During a trip

- **Live turn-by-turn navigation**: GPS tracking, spoken directions (British English), turns announced ahead, automatic re-routing when you go off route, and the screen kept awake.
- **Now at / Next stop** on a bus, Metro or train, with the full list of stops, how many are left, and the time to the next one. Stops come from NaPTAN (every stop in Great Britain).
- **"Get ready to get off" alert** about 3 minutes before your stop, based on your distance along the route, with the timetable as a fallback when GPS is poor. No alerts while you're still waiting to board.
- **Joining a trip that's already underway** picks up from where you are. If the stop list for a route isn't complete, the app says so instead of announcing the wrong stop.
- **While walking**: the nearest bus stop and station, with live distances.
- **The bus you're riding** is highlighted on the map when live data is available.
- The trip keeps going whichever page you open, and resumes after a refresh or if the phone closes the app.

### CO₂ tracker

- "You've saved X kg CO₂ this term", a daily streak, this week's total, calories and a "trees equivalent".
- A **Team UoS** counter of CO₂ saved by everyone this term.
- Personal stats are stored on the user's device only; the server receives anonymous totals.

### Live map

- **Live 700/701 bus positions** from Jim Hughes Coaches, refreshed every 15 seconds, with direction of travel (other operators' routes with the same numbers are filtered out).
- **All buses in view**: every live bus on the map, from any operator in England.
- **Find a bus**: search by route number (e.g. 20 or X1) near you or the middle of the map, then **track** one bus as it moves. **Share** sends a link that opens the map following the same bus.
- **Trains & Metro**: estimated positions of trains (and Metro on the Sunderland line) from live departure boards, drawn with a dashed outline because they aren't GPS positions.
- **Cycle parking** at City Campus, St Peter's Campus and the London Campus.
- Campuses, Metro, rail and bus stations, with show/hide buttons, a Sunderland/London switch and **My location**.

### Ticketing and prices

- **Fares update automatically every day at 05:15 UK time** from official sources:
  - **Bus:** Jim Hughes Coaches (shown first - it runs the 700/701), Go North East and Stagecoach North East, from the Bus Open Data Service.
  - **Metro:** singles, day tickets, Pop Pay As You Go caps, season tickets, **Student Metro Season Tickets** and under-22 fares, from Travel North East (Nexus).
- Filters for Adult, Student, Young person, Child, Family and Group tickets.
- Each operator shows when its fares were last checked and last changed by the operator.
- Rail guidance with links to buy, and a "Spotted a wrong price? Tell us" link.

### Travel zones

- The four Metro and Northumberland Line zones (A–D), with areas and stations taken from the official Nexus fare zone map, including stations on zone boundaries.
- Current Metro fares by number of zones, with Pop Pay As You Go caps.

### Privacy choices

- On the first visit, the app asks before loading anything optional: **maps** (Google and OpenStreetMap) and **anonymous visitor counting**. Saying nothing counts as no, and browsers sending Global Privacy Control are never counted.
- A map you haven't allowed shows a **Show maps** button instead; choices can be changed at any time on the Privacy page.
- Visitor counting uses no cookies, IDs or IP addresses: the device sends yes/no flags ("first visit today?") and the server keeps running totals.

### Help, privacy and accessibility

- **Contact us** form with topics (including "Wrong travel information"), spam protection, and messages delivered to the admin inbox.
- **Privacy policy** and **Terms of use** in plain English, and an **accessibility statement** following the Public Sector Bodies Accessibility Regulations 2018.
- Tested against **WCAG 2.2 AA**: colour contrast (the UoS orange is used in a deeper shade where it's text or behind white text), keyboard use with a skip link and visible focus, and 400% zoom.

### Also included

- **Sustainability tips** page.
- **Installable app (PWA)**: add to home screen, with offline access to saved trips, campus info and fares.
- **App updates**: a new version is picked up when the app opens; if one arrives while it's in use, "A new version is ready. Refresh" appears, but never during a trip.
- **Dark mode**: automatic, light or dark, using the UoS orange and navy palette.
- Clear messages when location is blocked or switched off (with steps for iPhone, Android and desktop), when offline, and when a service is busy.

---

## Technology stack

- **React 19**, **Vite 7**, **React Router 7**
- **Google Maps Platform** via `@vis.gl/react-google-maps` (home-page map)
- **Leaflet** and **React-Leaflet** with **OpenStreetMap** tiles (live map page and admin location editor)
- **vite-plugin-pwa** (Workbox) for the installable, offline-capable app
- **qrcode** for the admin two-factor set-up screen
- The **Inter** font, served from the app itself (no font requests to Google)
- Browser APIs: Geolocation, Device Orientation (compass), Web Speech, Screen Wake Lock, Notifications, Web Share
- **ESLint**

---

## Project structure

```text
sustainable-travel-frontend/
├── public/
│   ├── brand/                 # logo (light and dark)
│   ├── fonts/                 # Inter, self-hosted
│   ├── icons/                 # PWA icons
│   ├── images/
│   ├── robots.txt             # keeps /admin out of search engines
│   └── theme-init.js          # applies light/dark theme before first paint
├── src/
│   ├── components/
│   │   ├── planner/           # journey planner, when picker, map, route options, journey details,
│   │   │                      #   platforms, navigation, stops during a trip, leave-by alerts
│   │   ├── BusFinder.jsx      # find, track and share a live bus (Live Map)
│   │   ├── MapGate.jsx        # shows a map only once maps are allowed
│   │   ├── PrivacyBanner.jsx  # first-visit privacy question
│   │   ├── PrivacyChoices.jsx # tick boxes, also used on the Privacy page
│   │   ├── UpdateBanner.jsx   # "A new version is ready"
│   │   ├── ImpactCard.jsx     # CO₂ tracker
│   │   ├── ErrorBoundary.jsx, InstallBanner.jsx, LocationNotice.jsx, OfflineBanner.jsx
│   │   ├── Navbar.jsx, Footer.jsx, ThemeToggle.jsx
│   │   └── TipModal/
│   ├── context/JourneyContext.jsx  # the trip being navigated (kept across pages and refreshes)
│   ├── data/travelData.js     # Metro zone pricing table and sustainability tips
│   ├── hooks/                 # live location, compass, turn-by-turn, stops during a trip, nearby stops,
│   │                          #   live buses and trains in an area, tracked bus, saved places, CO₂, theme, ...
│   ├── lib/
│   │   ├── api.js             # public backend API client (timeouts, friendly errors)
│   │   ├── adminApi.js        # admin API client (tab-only session, auto sign-out)
│   │   ├── appUpdate.js       # picking up new versions safely
│   │   ├── consent.js         # privacy choices (kept on the device)
│   │   ├── usage.js           # anonymous visitor counting (only with consent)
│   │   ├── geo.js             # campuses, distances, location error help
│   │   ├── navigation.js      # route decoding, distance along a route, off-route detection, stop labels
│   │   ├── reminders.js       # leave-by reminders and calendar files
│   │   ├── speech.js          # voice directions
│   │   └── ...                # colour, format, mappers, storage, contact topics
│   ├── pages/
│   │   ├── Home, Ticketing, Zones, TravelMap, Sustainability
│   │   ├── Contact, Privacy, Terms, Accessibility
│   │   └── admin/             # admin area (loaded separately): sign-in, dashboard and visitors, messages,
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
| `/map` | Live buses, trains and Metro, Find a bus, cycle parking and transport links. A shared link such as `/map?route=20&op=GNEL&bus=5370&at=54.906,-1.385` opens the map following that bus |
| `/sustainability` | Sustainable travel information and tips |
| `/contact` | Contact us form (messages go to the admin inbox) |
| `/privacy` | Privacy policy and privacy choices |
| `/terms` | Terms of use |
| `/accessibility` | Accessibility statement |
| `/admin` | Admin area for the app team |

Any other address shows a "page not found" page.

---

## Backend

All data comes from the app's own backend, set with `VITE_API_BASE_URL`. The endpoints are documented in the private backend repository. All Google Places and Routes calls go through the backend, so the server key is never exposed to the browser.

---

## Admin area

`/admin` is for the app's admin team. It's loaded as a separate bundle, so ordinary visitors never download its code. Sign-in needs a password and two-factor authentication.

- **Dashboard:** new messages, Team UoS CO₂ by travel mode, fares sync status, service status and visitor numbers.
- **Messages:** reply to, resolve and manage Contact us messages, including data-protection requests.
- **Content:** edit zones, map locations such as cycle parking, page notes and backup fares. Bus and Metro fares update automatically.
- **Admins and activity log:** invite and manage admins, and review a log of sign-ins and changes.

---

## Security and privacy

- Strict **Content Security Policy** and security headers (HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`) set in `vercel.json`.
- Location and motion sensors are only allowed for this site; camera, microphone, payment and USB access are blocked.
- The Google browser key is restricted to the Maps JavaScript API and to the site's web address.
- Maps and visitor counting load only after the visitor allows them.
- Saved places, saved trips, privacy choices and personal CO₂ stats stay on the user's device; no account is needed.
- Contact messages are deleted automatically after 12 months (spam after 30 days).
- Admin pages are never cached or indexed, and messages are always displayed as plain text.
- Google Maps content is not cached offline, in line with Google's terms.

The backend adds rate limiting, input validation, two-factor admin sign-in, a daily Google spending cap and its own security headers.

To report a security problem, please use the [Contact us](https://uos-sustainable-travel.vercel.app/contact) page rather than opening a public issue.

---

## Deployment

The frontend is deployed on **Vercel** and the backend on **Render**, with a **Neon** PostgreSQL database.

In Vercel → Settings → Environment Variables, add `VITE_API_BASE_URL`, `VITE_GOOGLE_MAPS_BROWSER_KEY` and `VITE_GOOGLE_MAP_ID` as **Config** variables (they are public by design). After changing them, redeploy without the build cache so Vite includes the new values.

If the backend address changes, also update `connect-src` in the Content Security Policy in `vercel.json`. If the site moves to a new web address, add it to the backend's `ALLOWED_ORIGINS` and to the Google browser key's allowed websites.

---

## Future improvements

- Sign in with the university Microsoft account (for students' saved data and for admins).
- A permanent web address on the University's own domain.
- Department and halls leaderboards.
- Weather-aware suggestions (e.g. "a good day to cycle").
- Arrival-time estimates for a tracked bus, and "find a train".
- Step-free and accessibility-focused routes, and screen-reader testing with NVDA and VoiceOver.
- Push notifications for leave-by alerts when the app is closed.
- Uptime monitoring and error reporting.

---

## Authors

- **Simon Ugochukwu Awaogu**
- **Adams Mustapha**

GitHub: [@simon200ok](https://github.com/simon200ok)

---

## Acknowledgements

- Map tiles and cycle-parking data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- Live bus locations and bus fares from the [Bus Open Data Service](https://www.bus-data.dft.gov.uk/), licensed under the Open Government Licence v3.0.
- Bus stops and stations from [NaPTAN](https://www.gov.uk/government/publications/national-public-transport-access-node-schema) (Department for Transport), licensed under the Open Government Licence v3.0.
- Train platforms and estimated train positions: Powered by [National Rail Enquiries](https://www.nationalrail.co.uk/).
- Metro fares from [Travel North East](https://travelnortheast.uk/tickets/buy-tickets/) (Nexus); travel zones from the Nexus Metro and local rail fare zone map.
- Journey planning, place search and the home-page map by Google Maps Platform.

Developed by the University of Sunderland Developer Society as a sustainable travel app for the University of Sunderland community. It is an independent project, not an official University of Sunderland service.
