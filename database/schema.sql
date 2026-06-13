CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  edit_token TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  event_start TEXT NOT NULL,
  event_end TEXT,
  timezone TEXT,
  weather_snapshot TEXT,
  weather_fetched_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
