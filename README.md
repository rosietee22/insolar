# Weather PWA

A GPS-based weather Progressive Web App (PWA) that shows the forecast for the next 24 hours. Built with vanilla JavaScript and Express, featuring a beautiful "Liquid Glass" design.

## Features

- 📍 GPS-based location detection with privacy (coordinates rounded to 2 decimals)
- 🌦️ 24-hour hourly weather forecast
- 📊 Temperature and rain probability charts
- 💾 Offline support with service worker caching
- 📱 Installable as a PWA on mobile devices
- 🔄 Manual refresh with "last updated" timestamp
- 🏙️ City search fallback if GPS is denied
- 🎨 Minimalist "Liquid Glass" design (translucent cards, generous spacing)

## Tech Stack

**Frontend:**
- Vanilla JavaScript (ES6 modules)
- Chart.js for data visualization
- Service Worker for offline functionality
- PWA manifest for installability

**Backend:**
- Express.js (Node.js)
- Mock weather provider (Phase 1)
- Swappable provider architecture (ready for Phase 2: NVIDIA Earth-2)
- In-memory caching (30 min TTL)
- Bearer token authentication

## Project Structure

```
weather-pwa/
├── frontend/           # PWA client
│   ├── index.html
│   ├── manifest.json
│   ├── service-worker.js
│   ├── css/styles.css
│   ├── js/
│   │   ├── main.js
│   │   ├── api.js
│   │   ├── location.js
│   │   ├── ui.js
│   │   └── charts.js
│   └── icons/
├── backend/            # Express API
│   ├── server.js
│   ├── routes/forecast.js
│   ├── providers/
│   │   ├── base.js
│   │   ├── mock.js
│   │   └── earth2.js (Phase 2)
│   ├── cache.js
│   ├── auth.js
│   └── schema.js
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
   Then generate a random API secret:
   ```bash
   openssl rand -hex 32
   ```
   Add it to `.env` as `API_SECRET=<your_token>`

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

## Deployment (Render)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/weather-pwa.git
   git push -u origin main
   ```

2. **Create Render Web Service:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - New → Web Service
   - Connect your GitHub repo
   - Settings:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Environment Variables:**
       - `API_SECRET`: (generate with `openssl rand -hex 32`)
       - `NODE_ENV`: `production`

3. **Deploy:**
   - Render will auto-deploy on push to `main`
   - Your app will be at: `https://your-app.onrender.com`

## API Endpoints

### `GET /api/forecast?lat=X&lon=Y`

Returns 24-hour weather forecast.

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
    "lat": 51.51,
    "lon": -0.13,
    "rounded_to": 2,
    "source": "gps"
  },
  "generated_at": "2026-01-27T12:00:00Z",
  "timezone": "Europe/London",
  "current": { ... },
  "next_hour": { ... },
  "hourly": [ ... ]
}
```

## Phase 2: NVIDIA Earth-2 Integration

To swap the mock provider for NVIDIA Earth-2:

1. Create `backend/providers/earth2.js` implementing the `WeatherProvider` interface
2. Update `backend/routes/forecast.js` to use `Earth2Provider` instead of `MockProvider`
3. Add `EARTH2_API_KEY` to `.env`

The frontend requires **zero changes** thanks to the provider abstraction.

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

## License

ISC

## Author

Built with ☁️ by [Your Name]
