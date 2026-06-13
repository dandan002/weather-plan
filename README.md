# WeatherPlan

A minimal weather-aware event planner. Create shareable event pages with live NWS weather forecasts. No login required.

## Features

- Create event pages with title, description, location, and date/time
- Auto-geocodes US addresses via Census Bureau + Nominatim fallback
- Fetches weather from NOAA/NWS (US locations only)
- Hourly forecast strip for events within 48 hours; daily view for future events
- Public shareable link + secret edit token
- Export event card as PNG
- Events auto-expire after 90 days

## Quick Start

```bash
# Install dependencies
npm install

# Copy env file and customize
cp .env.example .env

# Run both server and client in dev mode
npm run dev
```

Then open http://localhost:5173

## Tech Stack

- **Frontend**: React 18 + Vite, CSS Modules, lucide-react
- **Backend**: Node.js + Express
- **Database**: SQLite via better-sqlite3
- **Weather**: NOAA National Weather Service API (free, no key needed)
- **Geocoding**: US Census Bureau + Nominatim (free, no key needed)
- **Image export**: html-to-image

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both server and Vite dev server |
| `npm run dev:server` | Server only (port 3001) |
| `npm run dev:client` | Vite client only (port 5173) |
| `npm run build` | Build frontend for production |
| `npm start` | Start server in production mode |

## Notes

- NWS weather API only covers US locations
- Edit tokens are stored in sessionStorage and never sent to the server after creation
- Events expire after `EVENT_RETENTION_DAYS` (default 90 days)
