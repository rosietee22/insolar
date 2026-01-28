# Weather Icons

Add your SVG icons to this folder with these exact filenames:

## Required Icons (12 total)

| Filename | Used For | Suggested Icon |
|----------|----------|----------------|
| `clear-day.svg` | Sunny, clear skies (daytime) | Sun |
| `clear-night.svg` | Clear skies (nighttime) | Moon |
| `partly-cloudy-day.svg` | 30-80% clouds (daytime) | Sun with cloud |
| `partly-cloudy-night.svg` | 30-80% clouds (nighttime) | Moon with cloud |
| `cloudy.svg` | Overcast, >80% clouds | Cloud |
| `drizzle.svg` | Light rain chance (10-30%) | Cloud with small drops |
| `rain.svg` | Moderate rain (30-60%) | Cloud with rain |
| `rain-heavy.svg` | Heavy rain (>60%) | Cloud with heavy rain |
| `snow.svg` | Snow conditions | Snowflake or cloud with snow |
| `thunderstorm.svg` | Storms | Cloud with lightning |
| `fog.svg` | Foggy/misty | Fog/mist icon |
| `wind.svg` | Windy conditions | Wind lines |

## Icon Specs
- **Size**: Any size, will be scaled via CSS
- **Color**: Use `currentColor` for fills/strokes so they adapt to theme
- **Format**: SVG only

## Example SVG with currentColor
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="5"/>
  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42"/>
</svg>
```
