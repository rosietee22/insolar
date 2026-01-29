# Insolar

A GPS-based weather Progressive Web App with a bold editorial design focused on sunlight and UV awareness. Built with vanilla JavaScript and Express, powered by Google Weather API.

**Live:** https://insolar.cloud

## Features

- ☀️ **Light Window** — Signature component showing daylight progression, UV index, and next 6 hours
- 🐦 **Bird Activity** — eBird-powered bird sighting data with weather-based activity predictions
- 📍 GPS-based location with neighbourhood-level accuracy
- 🌡️ Large typographic temperature display (170px hero)
- 📅 3-day forecast with daily highs/lows
- 🎨 Museum-poster colour system with 6-pigment palette and live colour picker
- ✍️ Editorial weather headlines ("Grey skies, warming later")
- 💾 Offline support with service worker caching
- 📱 Installable as a PWA
- 🏙️ City search fallback with approximate location option

## Tech Stack

**Frontend:**
- Vanilla JavaScript (ES6 modules)
- Custom SVG weather icons
- Service Worker for offline functionality
- PWA manifest for installability
- 8pt spacing grid, restrained typography

**Backend:**
- Express.js (Node.js)
- Google Weather API (WeatherNext AI)
- eBird API v2 (Cornell Lab of Ornithology)
- OpenStreetMap Nominatim for reverse geocoding
- In-memory caching (30 min forecast, 6 hr bird data)
- Bearer token authentication

## Project Structure

```
insolar/
├── frontend/              # PWA client
│   ├── index.html
│   ├── manifest.json
│   ├── service-worker.js
│   ├── css/styles.css
│   ├── js/
│   │   ├── main.js        # App initialization
│   │   ├── api.js         # API client
│   │   ├── location.js    # GPS & geocoding
│   │   ├── ui.js          # UI rendering
│   │   ├── theme.js       # Gradients & headlines
│   │   ├── birds.js       # Bird data & activity model
│   │   └── colour-picker.js # Live palette editor
│   └── icons/             # SVG weather & bird icons
├── backend/               # Express API
│   ├── server.js
│   ├── routes/
│   │   ├── forecast.js    # Weather forecast endpoint
│   │   └── birds.js       # Bird activity endpoint
│   ├── providers/
│   │   ├── base.js        # Provider interface
│   │   ├── google-weather.js  # Google Weather API
│   │   ├── ebird.js       # eBird API client
│   │   └── mock.js        # Dev/testing fallback
│   ├── bird-activity.js   # Activity scoring model
│   ├── cache.js
│   ├── auth.js
│   └── schema.js
├── docs/
│   ├── COLOUR-SYSTEM.md   # Colour palette specification
│   └── LIGHT-WINDOW-UX.md # UX specification
├── fly.toml               # Fly.io config
├── Dockerfile
├── package.json
└── .env
```

## Setup (Local Development)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Required environment variables:
   ```
   API_SECRET=<generate with: openssl rand -hex 32>
   GOOGLE_WEATHER_API_KEY=<your Google Weather API key>
   EBIRD_API_KEY=<your eBird API key (optional)>
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```
   Note: GPS requires HTTPS in production (works on localhost for dev)

## API Token

For local development, the API token is hardcoded in [frontend/js/api.js](frontend/js/api.js:12) as `DEFAULT_TOKEN`.

Update this with your own `.env` `API_SECRET` value, or store it in localStorage with key `weather_api_token`.

## Deployment (Fly.io)

The app deploys automatically to Fly.io on push to `main` via GitHub Actions.

**Manual deploy:**
```bash
flyctl deploy --remote-only
```

**Setup (first time):**
1. Install Fly CLI: `brew install flyctl`
2. Login: `flyctl auth login`
3. Set secrets:
   ```bash
   flyctl secrets set API_SECRET=<your_secret>
   flyctl secrets set GOOGLE_WEATHER_API_KEY=<your_key>
   flyctl secrets set EBIRD_API_KEY=<your_key>  # optional
   ```

**GitHub Actions:**
Add `FLY_API_TOKEN` as a repository secret (generate with `flyctl tokens create deploy -x 999999h`)

## Bird Activity

Insolar includes an optional bird activity feature powered by the eBird API. When an `EBIRD_API_KEY` is configured, a bird icon toggle appears in the top-right corner, switching between the weather view and a dedicated birding page.

**How it works:**
- Recent bird observations are fetched from eBird (7-day window, 25km radius)
- A weather-based activity model scores each hour (0-100) based on time of day, season, temperature, rain, wind, and cloud cover
- The bird view shows an activity strip (matching the daylight tracker style), notable species, and a scrollable sightings list

**Caching strategy:**
- Backend: 6-hour cache for eBird data (observations don't change fast)
- Frontend: 3-hour localStorage cache
- Activity scores recalculate instantly client-side using current weather — no API call needed

**Without an eBird API key**, the bird UI is entirely hidden and the weather app works as normal.

To get an eBird API key, register at https://ebird.org/api/keygen

## API Endpoints

### `GET /api/forecast?lat=X&lon=Y`

Returns weather forecast with hourly and daily data.

**Headers:**
```
Authorization: Bearer <your_api_secret>
```

**Query Parameters:**
- `lat`: Latitude (-90 to 90)
- `lon`: Longitude (-180 to 180)

**Response:**
```json
{
  "schema_version": 1,
  "location": {
    "name": "Clapton",
    "lat": 51.55,
    "lon": -0.05,
    "rounded_to": 2,
    "source": "gps"
  },
  "generated_at": "2026-01-29T09:00:00Z",
  "timezone": "Europe/London",
  "current": { ... },
  "next_hour": { ... },
  "hourly": [ ... ],
  "daily": [
    { "name": "Tomorrow", "low": 4, "high": 10, "condition": "Partly cloudy", ... },
    { "name": "Sat", "low": 3, "high": 9, "condition": "Rain likely", ... },
    { "name": "Sun", "low": 5, "high": 11, "condition": "Clear", ... }
  ]
}
```

### `GET /api/birds?lat=X&lon=Y&temp_c=X&rain=X&wind=X&cloud=X`

Returns bird observations and activity predictions. Returns 503 if `EBIRD_API_KEY` is not configured.

**Headers:**
```
Authorization: Bearer <your_api_secret>
```

**Query Parameters:**
- `lat`: Latitude (-90 to 90)
- `lon`: Longitude (-180 to 180)
- `temp_c`: Current temperature in Celsius (optional, for activity model)
- `rain`: Rain probability 0-100 (optional)
- `wind`: Wind speed in m/s (optional)
- `cloud`: Cloud cover 0-100 (optional)

**Response:**
```json
{
  "generated_at": "2026-01-29T16:52:12Z",
  "location": { "lat": 51.51, "lon": -0.13 },
  "notable_species": [
    { "common_name": "Robin", "scientific_name": "Erithacus rubecula", "how_many": 3, "observed_at": "2026-01-29 07:12", "species_code": "eurrob1" }
  ],
  "all_species": [ ... ],
  "total_species_count": 42,
  "observation_radius_km": 25,
  "activity": {
    "curve": [ { "hour": 0, "score": 25, "label": "Roosting" }, ... ],
    "current": { "score": 75, "label": "Morning foraging", "level": "high" },
    "dawn_peak": { "hour": 6, "score": 90 },
    "dusk_peak": { "hour": 17, "score": 80 }
  }
}
```

## Testing

**API:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/forecast?lat=51.51&lon=-0.13"
```

**PWA Install (Chrome DevTools):**
1. Open DevTools → Application → Manifest
2. Check for errors
3. Application → Service Workers → check registration
4. Try "Add to Home Screen"

**Offline Mode:**
1. Load app with network
2. DevTools → Network → Offline
3. Reload → should show cached forecast + warning banner

## Design Philosophy

Insolar follows a bold editorial aesthetic focused on sunlight awareness:

- **Single-screen fit** — No scrolling required for core weather information
- **Museum-poster palette** — 6-pigment colour system (cobalt, chartreuse, ink, stone, sienna, pearl) with max 2 hues + glow per screen
- **Light Window** — Signature component showing daylight strip with UV index
- **Bird Activity** — eBird integration with weather-based activity predictions, matching the daylight tracker style
- **Editorial headlines** — Weather described in narrative style ("Grey skies, warming later")
- **Typography-first** — Large temperature display, restrained type scale
- **Graceful degradation** — Bird features hidden without API key, offline mode shows cached data

See [docs/COLOUR-SYSTEM.md](docs/COLOUR-SYSTEM.md) for the palette specification and [docs/LIGHT-WINDOW-UX.md](docs/LIGHT-WINDOW-UX.md) for the UX specification.

## License

ISC
