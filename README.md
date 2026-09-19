# UoS Sustainable Travel Hub

A responsive web application designed to help **University of Sunderland students** make informed, affordable, and sustainable travel choices across Sunderland and the wider North East of England.

The Sustainable Travel Hub brings together transport operators, ticket prices, travel zones, nearby transport locations, and sustainable travel guidance in one accessible platform.

🌐 **Live Demo:** https://uos-sustainable-travel.vercel.app/

## Features

### Transport Search and Filtering

Users can explore transport options and filter available tickets by:

- Transport type — Bus, Metro, or Train
- Ticket price
- Ticket duration
- Operator or ticket name

The homepage provides an overview of transport providers and their available ticket options.

### Ticketing and Prices

The Ticketing page allows users to compare fares from transport providers serving Sunderland and the surrounding region, including:

- Go North East
- Nexus / Tyne and Wear Metro
- Northern Trains
- Stagecoach

Ticket information includes the ticket type, price, validity period, and additional notes.

### Travel Zones

The Travel Zones section explains the different transport zones across Tyne and Wear and provides information about:

- Areas covered by each zone
- Metro stations within each zone
- Single fares
- DaySaver fares
- Weekly fares
- Multi-operator travel options

This helps students determine which zone or ticket is suitable for their journey.

### Interactive Transport Map

An interactive map built with **Leaflet** and **React-Leaflet** displays useful transport locations around Sunderland.

Locations include:

- University campuses
- Metro stations
- Railway stations
- Bus stops and interchanges

Each location can provide additional information such as its description and nearby transport connections.

Map data is displayed using **OpenStreetMap** tiles.

### Sustainable Travel Guidance

The Sustainability section encourages students to consider lower-carbon transport options such as:

- Walking
- Cycling
- Metro
- Bus
- Train
- Car sharing

Interactive cards provide additional information about each transport option and its potential environmental benefits.

### Responsive Navigation

The application includes responsive navigation suitable for both desktop and smaller-screen devices, with dedicated routes for:

- Home
- Ticketing
- Zones
- Map
- Sustainability

---

## Technology Stack

The application is built with:

- **React 19**
- **Vite 7**
- **React Router**
- **Leaflet**
- **React-Leaflet**
- **OpenStreetMap**
- **JavaScript**
- **CSS**
- **ESLint**

---

## Project Structure

```text
sustainable-travel-frontend/
│
├── public/
│   └── images/
│
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── TipModal/
│   │
│   ├── data/
│   │   └── travelData.js
│   │
│   ├── hooks/
│   │   └── useAsyncData.js
│   │
│   ├── lib/
│   │   ├── api.js
│   │   └── mappers.js
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Ticketing.jsx
│   │   ├── Zones.jsx
│   │   ├── TravelMap.jsx
│   │   └── Sustainability.jsx
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- npm
- Git

### Clone the Repository

```bash
git clone https://github.com/simon200ok/sustainable-travel-frontend.git
```

Navigate into the project directory:

```bash
cd sustainable-travel-frontend
```

### Install Dependencies

```bash
npm install
```

---

## Environment Variables

Parts of the application retrieve data from a backend REST API.

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Replace the URL with the address of the backend API being used.

The frontend API layer currently supports requests for:

```text
GET /operators
GET /operators/:id
GET /tickets
GET /tickets/operator/:operatorId
GET /zones
GET /locations
GET /locations/nearby
```

> The API base URL must be provided through `VITE_API_BASE_URL` for API-dependent functionality to operate.

---

## Running the Application

Start the development server:

```bash
npm run dev
```

Vite will display the local development URL in the terminal, typically:

```text
http://localhost:5173
```

Open the URL in your browser.

---

## Available Scripts

### Development

```bash
npm run dev
```

Starts the Vite development server with Hot Module Replacement.

### Production Build

```bash
npm run build
```

Creates an optimized production build in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

Runs the production build locally for testing.

### Lint

```bash
npm run lint
```

Runs ESLint across the project.

---

## Application Routes

| Route             | Description                                         |
| ----------------- | --------------------------------------------------- |
| `/`               | Homepage, transport search and operator information |
| `/ticketing`      | Ticket and fare comparison                          |
| `/zones`          | Travel zones and zone pricing                       |
| `/map`            | Interactive transport map                           |
| `/sustainability` | Sustainable travel information and tips             |

---

## Data and API Architecture

The project currently uses a combination of **local travel data** and **backend API data**.

Static transport information is stored in:

```text
src/data/travelData.js
```

Backend communication is handled through:

```text
src/lib/api.js
```

API responses can be transformed into frontend-friendly objects using:

```text
src/lib/mappers.js
```

Reusable asynchronous loading behaviour is provided by:

```text
src/hooks/useAsyncData.js
```

This structure allows the project to progressively move transport information from static frontend data to dynamically retrieved backend data.

---

## Map Implementation

The transport map uses:

- Leaflet
- React-Leaflet
- OpenStreetMap

The map is centred around Sunderland and displays different marker types for campuses and transport locations.

Marker categories include:

```text
🎓 University Campus
🚇 Metro Station
🚂 Railway Station
🚌 Bus Stop / Interchange
```

Selecting a marker displays information about that location and, where available, nearby transport connections.

---

## Purpose

The project aims to provide students with a central source of travel information rather than requiring them to search multiple transport operator websites individually.

Its main objectives are to:

- Make transport information easier to access.
- Help students compare ticket options.
- Explain local transport zones.
- Help students locate transport links around university campuses.
- Encourage sustainable travel choices.
- Promote greater use of public and active transport.

---

## Deployment

The frontend is deployed using **Vercel**.

Production application:

https://uos-sustainable-travel.vercel.app/

To deploy your own version to Vercel, ensure that the backend API URL is configured as an environment variable:

```text
VITE_API_BASE_URL
```

After adding or changing Vite environment variables in Vercel, redeploy the application so the new values are included in the production build.

---

## Future Improvements

Possible future improvements include:

- Fully migrating ticketing and zone data to the backend API.
- Live ticket and fare information.
- Journey planning between locations.
- Real-time public transport information.
- Geolocation and nearby-stop discovery.
- Advanced route filtering.
- Student-specific ticket recommendations.
- Carbon-emission comparisons between journey options.
- Improved accessibility features.
- Automated testing.

---

## Author

**Simon Ugochukwu Awaogu**
**Mustapha**

GitHub: [@simon200ok](https://github.com/simon200ok)

---

## Acknowledgements

Transport and location information within the application relates to services operating around Sunderland and the wider North East of England.

Map tiles are provided by [OpenStreetMap](https://www.openstreetmap.org/).

This project was developed as a Sustainable Travel Hub for the University of Sunderland.
