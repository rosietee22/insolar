# Insolar Colour System

Abstract museum-poster palette: 5 pigments + white glow. 2 hues + glow per screen maximum.

---

## Palette

| Name | Hex | Role |
|------|-----|------|
| Electric Cobalt | `#0410F1` | Primary blue |
| Acid Chartreuse | `#C2F970` | Accent green |
| Ink Black | `#141115` | Dark base |
| Stone Grey | `#7D7C7A` | Muted base |
| Burnt Sienna | `#A33B20` | Warm accent |
| Pearl White | `#F0EDEA` | Glow / highlight text |

---

## Weather Mapping

| Condition | Base Gradient | Text | Glow |
|-----------|-------------|------|------|
| Clear Day | Cobalt → Ink | Pearl | White bright |
| Clear Night | Ink → Dark Cobalt `#0A0D3A` | Pearl | None |
| Overcast | Stone → Ink | Pearl | White faint |
| Rain | Ink → Cobalt | Pearl | White diffuse |
| Storm/Heat | Sienna → Ink | Pearl | White sharp |
| Snow | Pearl → Stone | Ink | White bright |
| Fog | Stone → Pearl | Ink | White diffuse |

---

## Glow Levels

All glows are white-based (pearl `#F0EDEA`):

| Level | Opacity | Use |
|-------|---------|-----|
| Bright | 0.5 | Clear day, snow |
| Sharp | 0.6 | Storm/heat |
| Diffuse | 0.3 | Rain, fog |
| Faint | 0.2 | Overcast |
| None | 0 | Night |

---

## Design Rules

1. **2 hues + glow maximum** per screen
2. **No seasonal rotation** — palette is year-round
3. **No condition overlay layer** — single gradient is enough
4. **Glow is always white** — no yellow/orange/purple glow
5. **Icons remain monochrome** (inverted on dark, normal on light)
6. **Grain texture** retained for print quality feel

---

## On-Page Colour Picker

Users can edit palette colours live via the palette icon in the footer:

- Tap swatch → native colour input opens
- Changes apply immediately via `applyTheme()`
- Overrides saved to `localStorage` key `insolar_palette_overrides`
- "Reset" button clears overrides, returns to weather-derived colours
- Overrides persist across sessions

---

## Example Screens

### Clear Day
```
Background: linear-gradient(180deg, #0410F1 0%, #141115 100%)
Glow: radial-gradient(circle, rgba(240,237,234,0.5) 0%, transparent 70%)
Text: #F0EDEA
Secondary: rgba(194,249,112,0.7)
```

### Rain
```
Background: linear-gradient(180deg, #141115 0%, #0410F1 100%)
Glow: radial-gradient(circle, rgba(240,237,234,0.3) 0%, transparent 70%)
Text: #F0EDEA
Secondary: rgba(240,237,234,0.55)
```

### Overcast
```
Background: linear-gradient(180deg, #7D7C7A 0%, #141115 100%)
Glow: radial-gradient(circle, rgba(240,237,234,0.2) 0%, transparent 70%)
Text: #F0EDEA
Secondary: rgba(240,237,234,0.55)
```

### Clear Night
```
Background: linear-gradient(180deg, #141115 0%, #0A0D3A 100%)
Glow: none
Text: #F0EDEA
Secondary: rgba(240,237,234,0.5)
```
