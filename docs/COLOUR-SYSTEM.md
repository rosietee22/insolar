# Insolar Colour System

Museum-poster inspired palette with seasonal bases, condition overlays, and solar glow.

## Design Principles

- **Three-layer approach**: Season + Condition + Solar time
- **2–3 pigments per screen maximum**
- **Night = hue-shift, not darken**
- **Grain/noise texture for print quality**
- **Radial glow behind hero temperature**

---

## 1. Seasonal Base Wash

Determines the foundational colour temperature based on hemisphere and date.

### Winter (Dec–Feb)
| Name | Hex | Use |
|------|-----|-----|
| Arctic Cobalt | `#1E3A5F` | Primary base |
| Glacier Blue | `#4A7C9B` | Secondary |
| Pearl | `#E8E4DF` | Highlight/text |

### Spring (Mar–May)
| Name | Hex | Use |
|------|-----|-----|
| Cyan | `#0891B2` | Primary base |
| Chlorophyll | `#4ADE80` | Accent |
| Warm Cream | `#FEF7E8` | Highlight/text |

### Summer (Jun–Aug)
| Name | Hex | Use |
|------|-----|-----|
| Ultramarine | `#1D4ED8` | Primary base |
| Sun Gold | `#FBBF24` | Accent |
| Linen | `#FAF5F0` | Highlight/text |

### Autumn (Sep–Nov)
| Name | Hex | Use |
|------|-----|-----|
| Petrol Blue | `#1E3A4C` | Primary base |
| Rust | `#C2410C` | Accent |
| Smoke | `#9CA3AF` | Highlight/text |

---

## 2. Condition Overlays

Applied as gradient overlays based on current weather.

| Condition | Overlay | Hex Values | Opacity |
|-----------|---------|------------|---------|
| Clear | Cobalt Veil | `#1E40AF` → `#3B82F6` | 30% |
| Overcast | Stone Grey | `#6B7280` → `#9CA3AF` | 50% |
| Rain | Teal Black | `#134E4A` → `#0F172A` | 60% |
| Fog | Milky Taupe | `#D4C4B5` → `#E7E0D8` | 40% |
| Storm | Bruised Purple | `#581C87` → `#1E1B4B` | 70% |
| Snow | Electric Ice | `#E0F2FE` → `#BAE6FD` | 35% |

---

## 3. Solar Glow

Time-based accent that radiates from the hero temperature.

| Period | Name | Hex | Radial Glow |
|--------|------|-----|-------------|
| 05:00–08:00 | Dawn Peach | `#FDBA74` | `rgba(253,186,116,0.4)` |
| 08:00–16:00 | Noon White-Gold | `#FEF3C7` | `rgba(254,243,199,0.5)` |
| 16:00–19:00 | Dusk Amber | `#F97316` | `rgba(249,115,22,0.4)` |
| 19:00–05:00 | Night Ultraviolet | `#7C3AED` | `rgba(124,58,237,0.3)` |

---

## 4. Night Mode (Hue-Shifted)

Night versions shift hue, not just darken.

| Season | Day Primary | Night Shifted |
|--------|-------------|---------------|
| Winter | Arctic Cobalt `#1E3A5F` | Midnight Indigo `#1E1B4B` |
| Spring | Cyan `#0891B2` | Deep Teal `#0D4A4A` |
| Summer | Ultramarine `#1D4ED8` | Navy Violet `#312E81` |
| Autumn | Petrol Blue `#1E3A4C` | Charcoal Plum `#2D1F3D` |

---

## 5. Texture & Effects

### Grain/Noise
```css
.grain-overlay::after {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.03;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}
```

### Radial Hero Glow
```css
.hero-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--solar-glow) 0%, transparent 70%);
  pointer-events: none;
  z-index: -1;
}
```

---

## 6. Example Screens

### Winter Clear Day (Noon)
- **Base**: Arctic Cobalt `#1E3A5F`
- **Overlay**: Cobalt Veil 30%
- **Glow**: Noon White-Gold
- **Text**: Pearl `#E8E4DF`

```
Background: linear-gradient(180deg, #1E3A5F 0%, #4A7C9B 100%)
Overlay: linear-gradient(180deg, rgba(30,64,175,0.3) 0%, rgba(59,130,246,0.3) 100%)
Glow: radial-gradient(circle, rgba(254,243,199,0.5) 0%, transparent 70%)
```

### Summer Rain (Dusk)
- **Base**: Ultramarine `#1D4ED8`
- **Overlay**: Teal Black 60%
- **Glow**: Dusk Amber
- **Text**: Linen `#FAF5F0`

```
Background: linear-gradient(180deg, #1D4ED8 0%, #0F172A 100%)
Overlay: linear-gradient(180deg, rgba(19,78,74,0.6) 0%, rgba(15,23,42,0.6) 100%)
Glow: radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)
```

### Autumn Overcast Night
- **Base**: Charcoal Plum `#2D1F3D` (night-shifted)
- **Overlay**: Stone Grey 50%
- **Glow**: Night Ultraviolet
- **Text**: Smoke `#9CA3AF`

```
Background: linear-gradient(180deg, #2D1F3D 0%, #1E1B4B 100%)
Overlay: linear-gradient(180deg, rgba(107,114,128,0.5) 0%, rgba(156,163,175,0.5) 100%)
Glow: radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)
```

### Spring Fog (Dawn)
- **Base**: Cyan `#0891B2`
- **Overlay**: Milky Taupe 40%
- **Glow**: Dawn Peach
- **Text**: Warm Cream `#FEF7E8`

```
Background: linear-gradient(180deg, #0891B2 0%, #4ADE80 100%)
Overlay: linear-gradient(180deg, rgba(212,196,181,0.4) 0%, rgba(231,224,216,0.4) 100%)
Glow: radial-gradient(circle, rgba(253,186,116,0.4) 0%, transparent 70%)
```

---

## 7. Implementation Notes

1. **Seasonal detection**: Use current date + hemisphere (default Northern)
2. **Condition mapping**: Map API weather codes to overlay types
3. **Solar period**: Calculate from timestamp, not sunrise/sunset (simpler)
4. **CSS custom properties**: Set `--seasonal-*`, `--condition-*`, `--solar-*`
5. **Compositing**: Use `mix-blend-mode: multiply` for overlays
6. **Performance**: Single composite gradient, not stacked elements
