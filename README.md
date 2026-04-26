# Sunbird

A bird activity forecast that reads the weather, light and season to tell you what's about, where, and when. Built with vanilla JavaScript and Express, powered by the eBird API and Google Weather.

**Live:** https://sunbird.today

## Features

- **Bird-first hero** — Species count and activity headline as the default view, with a segmented toggle to switch to weather
- **Bird activity strip** — 24-hour gradient showing dawn/dusk peaks, scored hourly by time of day, season, temperature, rain, wind, and cloud cover
- **Notable species** — "What to look for" section with photos from the Macaulay Library (Cornell Lab), tappable for full-size images
- **Sightings list** — All recent observations within 3–10 km, sorted by most recent, with observation times
- **Daylight & UV strip** — Sunrise/sunset tracker with UV index and contextual labels (night mode shows "Until sunrise")
- **12-hour hourly forecast** — Scrollable strip with weather icons, temperatures, and rain probability
- **3-day forecast** — Collapsible accordion with conditions summary
- **9 weather themes** — Adaptive gradients, text colours, glow, bloom, and atmospheric veil per condition
- **Editorial headlines** — Observational bird-activity sentences ("Dawn chorus underway.", "Midday lull.") and weather sentences for the weather view
- **Location options** — GPS, IP-based approximate location, and city search
- **Offline support** — Service worker caching with auto-update detection
- **Installable PWA** — Standalone app with Open Graph and Twitter card meta
- **SEO** — Structured data, sitemap, robots.txt, OG image

## Tech Stack

**Frontend:**
- Vanilla JavaScript (ES6 modules), no build step
- Custom SVG weather icons (clear, cloudy, rain, drizzle, partly cloudy day/night, clear night)
- Service Worker with content-hash versioning (auto-invalidates on deploy)
- PWA manifest for installability
- DM Sans + IBM Plex Mono typefaces, 8pt spacing grid

**Backend:**
- Express.js (Node.js 18+)
- Google Weather API (WeatherNext AI)
- eBird API v2 (Cornell Lab of Ornithology)
- Macaulay Library image proxy with 30-day cache
- OpenStreetMap Nominatim for reverse geocoding
- IP-based approximate location (ip-api.com)
- In-memory caching (5 min forecast, 6 hr bird data, 30 day bird images)
- HTTP-only session cookie authentication
- Helmet, CORS, compression, rate limiting

## Project Structure

```
sunbird/
├── frontend/              # PWA client
│   ├── index.html
│   ├── colour-lab.html    # Theme preview tool
│   ├── manifest.json
│   ├── service-worker.js
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── css/styles.css
│   ├── js/
│   │   ├── main.js        # App init, location flow, bird loading
│   │   ├── api.js         # API client
│   │   ├── location.js    # GPS, approximate & city search
│   │   ├── ui.js          # UI rendering, hero mode toggle, bird sections
│   │   ├── theme.js       # Palette, gradients, weather themes & headlines
│   │   ├── birds.js       # Bird data & client-side activity model
│   │   └── colour-picker.js # Live palette editor
│   └── icons/             # SVG icons, OG image, PWA icons
├── backend/               # Express API
│   ├── server.js          # Server setup, middleware, static serving
│   ├── routes/
│   │   ├── forecast.js    # Weather forecast endpoint
│   │   ├── birds.js       # Bird observations & activity endpoint
│   │   ├── bird-image.js  # Macaulay Library image proxy
│   │   └── location.js    # IP-based approximate location
│   ├── providers/
│   │   ├── base.js        # Provider interface
│   │   ├── google-weather.js  # Google Weather API
│   │   ├── ebird.js       # eBird API client (with time-of-day scoring)
│   │   └── mock.js        # Dev/testing fallback
│   ├── bird-activity.js   # Activity scoring model
│   ├── cache.js
│   ├── auth.js
│   └── schema.js
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

## Authentication

The app uses HTTP-only session cookies set automatically when the page loads. No tokens are needed in frontend JavaScript. The backend auth middleware checks the session cookie first and falls back to a Bearer token header for direct API use and development.

For local development, the API token is hardcoded in `frontend/js/api.js` as `DEFAULT_TOKEN`. Update this with your `.env` `API_SECRET` value, or store it in localStorage with key `weather_api_token`.

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

Bird activity is the primary feature, powered by the eBird API. When `EBIRD_API_KEY` is configured, the app opens in bird mode by default showing a species count hero, activity strip, notable species with photos, and a full sightings list. A segmented toggle switches to the weather view.

**How it works:**
- Recent bird observations are fetched from eBird (last 5 days, 3–10 km adaptive radius)
- Species are deduplicated and scored by time-of-day relevance to the user's current hour
- A weather-based activity model scores each hour (0–100) based on time of day, season, temperature, rain, wind, and cloud cover
- Notable species show top-rated photos from the Macaulay Library (proxied and cached for 30 days)

**Caching strategy:**
- Backend: 6-hour cache for eBird observations, 30-day cache for bird image asset IDs
- Frontend: 3-hour localStorage cache
- Activity scores recalculate instantly client-side using current weather

**Without an eBird API key**, the bird toggle is disabled and the app defaults to weather mode.

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

### `GET /api/birds?lat=X&lon=Y&hour=H&temp_c=X&rain=X&wind=X&cloud=X`

Returns bird observations and activity predictions. Returns 503 if `EBIRD_API_KEY` is not configured.

**Headers:**
```
Authorization: Bearer <your_api_secret>
```

**Query Parameters:**
- `lat`: Latitude (-90 to 90)
- `lon`: Longitude (-180 to 180)
- `hour`: Current hour at location, 0–23 (optional, for time-of-day relevance scoring)
- `temp_c`: Current temperature in Celsius (optional, for activity model)
- `rain`: Rain probability 0–100 (optional)
- `wind`: Wind speed in m/s (optional)
- `cloud`: Cloud cover 0–100 (optional)

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
  "observation_radius_km": 5,
  "activity": {
    "curve": [ { "hour": 0, "score": 25, "label": "Roosting" }, ... ],
    "current": { "score": 75, "label": "Morning foraging", "level": "high" },
    "dawn_peak": { "hour": 6, "score": 90 },
    "dusk_peak": { "hour": 17, "score": 80 }
  }
}
```

### `GET /api/bird-image/:speciesCode?size=320|1200`

Proxies bird photos from the Macaulay Library. Returns the top-rated photo for a given eBird species code. Images are cached for 30 days.

### `GET /api/location/approximate`

Returns approximate location based on IP address (no authentication required). Falls back to London for private IPs in development.

## Testing

**API:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/forecast?lat=51.51&lon=-0.13"
```

**PWA Install (Chrome DevTools):**
1. Open DevTools > Application > Manifest
2. Check for errors
3. Application > Service Workers > check registration
4. Try "Add to Home Screen"

**Offline Mode:**
1. Load app with network
2. DevTools > Network > Offline
3. Reload > should show cached forecast + warning banner

## Design Philosophy

Sunbird follows a museum-poster aesthetic — documentary, scientific, restrained:

- **Bird-first** — Species count and activity as the default hero, weather one tap away
- **Single-page layout** — Everything on one scrollable page with a segmented toggle, not separate views
- **Museum-poster palette** — 7-pigment colour system (sky, ice, dusk, stone, clay, pearl, ink) with chalk cobalt accent and max 2 hues + glow per screen
- **9 weather themes** — Each condition maps to a unique gradient, text colour, glow, bloom, veil, and bird strip palette
- **Light Window** — Daylight/night strip with UV index, sunrise/sunset times
- **Editorial headlines** — Observational notes ("Dawn chorus underway.", "Midday lull.", "Clear night. Listen for owls.")
- **Typography-first** — 128px hero number, DM Sans + IBM Plex Mono, restrained type scale
- **Graceful degradation** — Bird toggle disabled without API key, offline mode shows cached data

See [CLAUDE.md](CLAUDE.md) for the full design system specification.

## License

ISC
