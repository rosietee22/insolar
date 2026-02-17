# Sunbird — Design System

This is a weather + bird-forecast PWA at https://sunbird.today. All design and code decisions should follow this document.

## Aesthetic

Documentary. Scientific. Editorial. Field-guide / atlas-like. Restrained and modern.

**Not:** cute, bubbly, skeuomorphic, app-template, marketing-tone.

**Visual references:** printed catalogues, museum labels, editorial websites, Swiss-influenced layouts, weather charts, birding notebooks.

## Design Rules

1. **Two fonts only** — DM Sans for UI/headlines, IBM Plex Mono for data/temperatures/times
2. **Left-aligned layout** — everything reads left-to-right like a printed page, not centred
3. **Uppercase spaced micro-labels** (10px, weight 500, letter-spacing 0.04–0.08em) for all secondary/meta text: location, conditions, freshness, section titles
4. **Monospace for numbers** — temperature, times, rain %, forecast temps use `var(--font-data)`
5. **Border dividers** between items (forecast days, moments, bird species), not gaps
6. **2 hues + glow maximum** per screen
7. **Paper grain texture** at opacity 0.038 (already exists in `body::after`)
8. **Accent stays `#2F5EEA`** (chalk cobalt) — on light backgrounds; pearl on dark
9. **Headline = description** (lighter weight, secondary colour) — **Temperature = hero data** (bold, accent, mono)
10. **No emojis, no enthusiasm** — headlines are observational notes: "Wet start to the day.", "Quiet for birds right now."
11. **Mineral / dusty tones only** — no saturated primaries, no playful pastels

## Colour System

### Palette (defined in `frontend/js/theme.js`)

| Token | Hex | Role |
|-------|-----|------|
| sky | `#F8F6F0` | Warm bone — light base |
| ice | `#E8E4DA` | Warm grey — cool gradient |
| dusk | `#363950` | Deep slate — dark state |
| stone | `#9B9994` | Darker stone — fog/overcast |
| clay | `#8B6F63` | Deep earth — warm accent |
| pearl | `#F0EDEA` | Pearl white — glow/highlight |
| ink | `#2B2E3A` | Warm graphite — dark text |

### Glow Presets

| Name | Color | Glow | Used by |
|------|-------|------|---------|
| sunlight | `#FFFDF7` | `rgba(255,253,247,0.55)` | Clear day, snow |
| diffused | `#FFFDF7` | `rgba(255,253,247,0.25)` | Partly cloudy |
| halo | `#E8E6F0` | `rgba(232,230,240,0.50)` | Clear night |
| fog | `#F0EDEA` | `rgba(240,237,234,0.45)` | Overcast, rain, fog |
| ember | `#F0DCC8` | `rgba(240,220,200,0.40)` | Storm |

### Light Strip Presets

| Name | Edge | Mid | Used by |
|------|------|-----|---------|
| sunlight | `#C4B899` | `#F5E8B0` | Clear day, partly cloudy, snow, fog |
| night | `#2A2D52` | `#5D5A7A` | Clear night |
| overcast | `#7A7670` | `#A8A090` | Overcast |
| rain | `#5A5750` | `#7A7468` | Rain, storm |

### Weather Themes

| Condition | from | to | Text | Secondary | Glow | Strip |
|-----------|------|----|------|-----------|------|-------|
| Clear Day | `#FDF9F0` | `#EDE6D6` | ink | `rgba(43,46,58,0.42)` | sunlight | sunlight |
| Partly Cloudy | `#F3F4F1` | `#DDD9CF` | ink | `rgba(43,46,58,0.55)` | diffused | sunlight |
| Partly Cloudy Night | `#363A52` | `#2A2D44` | `#DAD8E0` | `rgba(218,216,224,0.50)` | diffused | night |
| Clear Night | `#2E3148` | `#222538` | `#DAD8E0` | `rgba(218,216,224,0.45)` | halo | night |
| Overcast | `#DDDBD6` | `#B8B5AF` | ink | `rgba(43,46,58,0.48)` | fog | overcast |
| Rain | `#74767E` | `#787880` | pearl | `rgba(240,237,234,0.45)` | fog | rain |
| Storm | `#A99890` | `#6A5E6E` | pearl | `rgba(240,237,234,0.48)` | ember | rain |
| Snow | `#F6F8FA` | `#DCD9D4` | ink | `rgba(43,46,58,0.42)` | sunlight | sunlight |
| Fog | `#C8C5C0` | pearl | ink | `rgba(43,46,58,0.40)` | fog | sunlight |

### Bloom & Veil (per-theme atmosphere)

| Condition | Bloom (hero glow) | Veil (atmospheric overlay) |
|-----------|-------------------|----------------------------|
| Clear Day | `radial-gradient(circle at 35% 28%, rgba(255,236,200,0.55), transparent 60%)` — warm directional sun | none |
| Partly Cloudy | default (from glow) | `radial-gradient(circle at 40% 30%, rgba(255,255,255,0.15), transparent 60%)` — mist veil |
| Partly Cloudy Night | `radial-gradient(circle at 35% 30%, rgba(200,200,220,0.10), transparent 55%)` — faint atmospheric depth | `radial-gradient(circle at 40% 30%, rgba(200,200,220,0.06), transparent 60%)` — faint cloud veil |
| Clear Night | `radial-gradient(circle at 40% 30%, rgba(232,230,240,0.12), transparent 55%)` — subtle halo depth | none |
| Rain | `radial-gradient(circle at 30% 35%, rgba(240,237,234,0.14), transparent 55%)` — subtle pearl warmth | none |
| All others | default `radial-gradient(circle, <glow> 0%, transparent 70%)` | none |

## CSS Variables

```css
:root {
  --font-body: 'DM Sans', system-ui, -apple-system, sans-serif;
  --font-data: 'IBM Plex Mono', 'SF Mono', 'Consolas', monospace;
  --gradient-from: #FDF9F0;
  --gradient-to: #EDE6D6;
  --solar-color: #FFFDF7;
  --solar-glow: rgba(255,253,247,0.55);
  --hero-bloom: radial-gradient(circle at 35% 28%, rgba(255,236,200,0.55), transparent 60%);
  --veil: none;
  --text-primary: #2B2E3A;
  --text-secondary: rgba(43,46,58,0.42);
  --text-muted: rgba(43,46,58,0.32);
  --rain-color: #8898B8;
  --light-strip-edge: #C4B899;
  --light-strip-mid: #F5E8B0;
  --accent-color: #2F5EEA;
  --accent-filter: brightness(0) saturate(100%) invert(32%) sepia(60%) saturate(1800%) hue-rotate(215deg) brightness(92%) contrast(90%);
  --bird-dormant: #2A2D52;
  --bird-active: #A8B4FF;
  --bird-glow: rgba(168,180,255,0.50);
  --glass-bg: rgba(0, 0, 0, 0.05);
  --glass-border: rgba(0, 0, 0, 0.08);
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  --space-6: 48px;
  --text-xs: 11px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 20px;
  --text-xl: 22px;
  --text-hero: 128px;
}
```

## Font Import (index.html)

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## Typography Assignments

| Element | Font | Size | Weight | Style |
|---------|------|------|--------|-------|
| Hero temp | `--font-data` | `--text-hero` (128px) | 700 | `letter-spacing: -0.06em` |
| Hero headline | `--font-body` | `--text-xl` (22px) | 400 | Secondary colour, description text |
| Hero meta | `--font-body` | 10px | 500 | Uppercase, `letter-spacing: 0.08em` |
| Location | `--font-body` | 10px | 500 | Uppercase, `letter-spacing: 0.08em` |
| Section titles | `--font-body` | 10px | 500 | Uppercase, `letter-spacing: 0.1em` |
| Hourly temps | `--font-data` | 17px | 700 | — |
| Hourly times | `--font-body` | 10px | 500 | Uppercase |
| Hourly rain % | `--font-data` | 10px | 600 | Rain colour |
| Forecast day name | `--font-body` | `--text-sm` | 600 | — |
| Forecast condition | `--font-body` | 10px | 500 | Uppercase |
| Forecast temps | `--font-data` | `--text-base` | 700 | — |
| Light/bird times | `--font-data` | 11px | 400 | — |
| Freshness footer | `--font-body` | 10px | 500 | Uppercase |
| Moment time | `--font-data` | 10px | 600 | Uppercase |
| Moment text | `--font-body` | `--text-base` | 600 | — |
| Moment detail | `--font-body` | 10px | 500 | Uppercase |

## Icons

### Bird (filled, for toggle/mask) — `/icons/bird.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16" fill="currentColor">
  <path d="M1 14 C5 7, 11 5, 15 9 C17 6, 21 5, 23 6.5 C21 8, 18 10, 15 12.5 C11 11, 6 12, 1 14Z"/>
</svg>
```

### Favicon — `/icons/favicon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#2F5EEA"/>
  <circle cx="18" cy="22" r="6" fill="none" stroke="#F0EDEA" stroke-width="4"/>
  <path d="M6 46 C14 34, 24 30, 32 36 C36 32, 44 30, 50 32 C46 35, 40 38, 32 42 C24 40, 14 42, 6 46Z" fill="#F0EDEA"/>
</svg>
```

## Key Layout Principles

- Hero section: `align-items: flex-start; text-align: left`
- Bird hero: same left-alignment as weather hero
- Hero bloom: directional `--hero-bloom` gradient behind temp (warm for Clear Day, diffused for others)
- Atmospheric veil: `--veil` overlay on `body::before` (mist for Partly Cloudy, none for others)
- Forecast days: `border-top: 1px solid var(--glass-border)` dividers, no gap
- Moments: existing border-top dividers are correct
- Bird species list: existing border treatment is correct

## Architecture

- **Single source of truth**: All theme data lives in `frontend/js/theme.js` — palette, glow presets, strip presets, weather themes
- **CSS variables bridge**: `applyTheme()` sets CSS custom properties on `document.documentElement`, so CSS never needs hardcoded theme colours
- **Theme Lab**: `frontend/colour-lab.html` imports directly from `theme.js` — no duplicated data
- **9 themes**: clearDay, partlyCloudy, partlyCloudyNight, clearNight, overcast, rain, storm, snow, fog
