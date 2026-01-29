# Insolar

A GPS-based weather Progressive Web App with a bold editorial design focused on sunlight and UV awareness. Built with vanilla JavaScript and Express, powered by Google Weather API.

**Live:** https://insolar.cloud

## Features

- ☀️ **Light Window** — Signature component showing daylight progression, UV index, and next 6 hours
- 📍 GPS-based location with neighbourhood-level accuracy
- 🌡️ Large typographic temperature display (170px hero)
- 📅 3-day forecast with daily highs/lows
- � Semantic background gradients (sky blue, coral sunset, teal rain, ice frost)
- ✍️ Editorial weather headlines ("Grey skies, warming later")
- 💾 Offline support with service worker caching
- 📱 Installable as a PWA
- 🏙️ City search fallback if GPS is denied

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
- OpenStreetMap Nominatim for reverse geocoding
- In-memory caching (30 min TTL)
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
│   │   └── theme.js       # Gradients & headlines
│   └── icons/             # SVG weather icons
├── backend/               # Express API
│   ├── server.js
│   ├── routes/forecast.js
│   ├── providers/
│   │   ├── base.js        # Provider interface
│   │   ├── google-weather.js  # Google Weather API
│   │   └── mock.js        # Dev/testing fallback
│   ├── cache.js
│   ├── auth.js
│   └── schema.js
├── docs/
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
   ```

**GitHub Actions:**
Add `FLY_API_TOKEN` as a repository secret (generate with `flyctl tokens create deploy -x 999999h`)

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

- **Single-screen fit** — No scrolling required for core information
- **Semantic backgrounds** — Colors reflect weather conditions (sky blue, coral sunset, teal rain)
- **Light Window** — Signature component combining hourly forecast, daylight strip, and UV index
- **Editorial headlines** — Weather described in narrative style, not just labels
- **Typography-first** — Large temperature display, restrained type scale

See [docs/LIGHT-WINDOW-UX.md](docs/LIGHT-WINDOW-UX.md) for the full UX specification.

## License

ISC
