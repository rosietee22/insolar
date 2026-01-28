# Weather PWA - Project Brief

**Single source of truth for project scope and architecture**

---

## 1. Overview

- Personal weather PWA for Google Pixel
- GPS-based location with privacy rounding (coordinates rounded to 2 decimals)
- City search fallback if GPS denied or unavailable
- Mobile-first design: "Now + Next hour" cards at top
- 15-hour temperature bar chart with values
- 24-hour hourly list below
- Small, glanceable charts (temperature bars, rain probability + amount)
- Manual refresh with "Last updated" timestamp
- Bright cobalt (#0066FF) + white background aesthetic

---

## 2. MVP Scope

**Data:**
- Hourly forecast for next 24 hours only
- No daily/weekly forecast in MVP

**Weather Fields:**
- Temperature (°C)
- Rain probability (%)
- Rain amount (mm)
- Cloud cover (%)
- Wind speed + direction
- UV index

**User Interactions:**
- Manual refresh button (primary action)
- "Update location" button to re-request GPS
- Show "Last updated" timestamp
- Optional: auto-refresh on app open if cached data >60 min old

**Offline Behavior:**
- Show last-known cached forecast
- Display warning banner with cache timestamp
- Service worker caches API responses + static assets

---

## 3. Platform Choice

**Phase 1: PWA**
- Installable on Pixel (add to home screen)
- Works offline via service worker
- HTTPS required for GPS
- No app store distribution

**Future (Optional):**
- Native Android app
- Consider if PWA limitations encountered

---

## 4. Budget + Hosting

**Budget:**
- ~$2/month target
- Single user (personal use only)

**Hosting:**
- Render Web Service hosts Express backend
- Free tier: acceptable (cold starts ~30s)
- $7/mo tier: always-on (optional upgrade)
- Render Static Site: optional (can serve frontend from same backend)

**Backend:**
- Thin HTTP API (Express.js)
- In-memory caching (30 min TTL per rounded location)
- Simple Bearer token auth (hardcoded for single user)
- CORS configured for PWA
- JSON schema versioned

---

## 5. Architecture (High Level)

**Flow:**
```
Pixel PWA → Render API → Weather Data Source
```

**Phase 1: Mock/Standard Provider**
- Mock JSON data OR free weather API (e.g., Open-Meteo)
- Validates UX and API contract
- No cost

**Phase 2: NVIDIA Earth-2**
- Swap provider when GPU access available
- Frontend unchanged (provider abstraction)
- Backend adapter implements same interface
- Requires external GPU machine/cloud GPU (not on Render)

**Data Provider Interface:**
- Abstract base class in backend
- `getForecast(lat, lon)` → returns JSON matching schema v1
- Swappable without frontend changes

**API Contract:**
- `GET /api/forecast?lat=X&lon=Y`
- Returns: `schema_version`, `location`, `generated_at`, `timezone`, `current`, `next_hour`, `hourly[]`
- Cached server-side (30 min) and client-side (service worker)

---

## 6. Privacy

**Location Handling:**
- Round GPS coordinates to 2 decimals (~1km precision)
- Cache location until user taps "Update location"
- Never send raw GPS coordinates to backend
- Display rounded coords or city name in UI

**No Tracking:**
- No analytics in MVP
- No user accounts
- No data sharing

---

## 7. Security

**Authentication:**
- Simple Bearer token (single user)
- Token hardcoded in frontend for dev/personal use
- Stored in localStorage or .env
- No user login system needed

**HTTPS:**
- Required for GPS API
- Render provides free SSL (Let's Encrypt)

**API Rate Limits:**
- Server-side caching prevents abuse
- Single user = low risk

---

## 8. Non-Goals for MVP

**Not in scope:**
- Push notifications
- Background sync
- Home screen widgets
- App store distribution (Play Store)
- User accounts or multi-user support
- 7-day or long-term forecast
- Historical weather data
- Weather alerts/warnings
- Share forecast feature
- NVIDIA Earth-2 integration (Phase 2)

---

## 9. Open Questions

**Resolved:**
- ✅ Units: Celsius for temperature
- ✅ Design: Bright cobalt + white (no muted tones/cream)
- ✅ Refresh: Manual button + optional auto-refresh if stale
- ✅ Charts: Temperature bars (15 hours) with labels above

**Open:**
- Wind units: m/s vs mph? (Currently: m/s in mock data)
- Android-specific features for later phases?
- Custom domain or use Render subdomain?
- Earth-2 integration timeline/requirements?

---

## Current Status

**Phase 1: Complete**
- ✅ Express backend with mock provider
- ✅ PWA frontend with GPS + city search
- ✅ Temperature bar chart (15 hours, values above bars)
- ✅ Rain probability + amount chart
- ✅ 24-hour hourly list
- ✅ Service worker (offline support)
- ✅ PWA manifest + icons
- ✅ Bright cobalt theme + white background
- ✅ Location display with icon

**Next Steps:**
- Git repository setup
- GitHub push (backup + deployment pipeline)
- Render deployment (when ready)
- Test on actual Pixel device

---

## Key Principles

- **Simple over complex**: Single user, no over-engineering
- **Fast over fancy**: Mock data validates UX before Earth-2
- **Offline-first**: Cache everything, work without network
- **Privacy by default**: Round coordinates, no tracking
- **Swappable backend**: Earth-2 integration requires zero frontend changes
