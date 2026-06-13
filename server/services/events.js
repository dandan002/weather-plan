const crypto = require('crypto');
const db = require('../db/db');

function generateId(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

function generateToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function getExpiresAt() {
  const days = parseInt(process.env.EVENT_RETENTION_DAYS || '90', 10);
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function createEvent(data) {
  const id = generateId();
  const editToken = generateToken();
  const expiresAt = getExpiresAt();

  const stmt = db.prepare(`
    INSERT INTO events (id, edit_token, title, description, location_name, latitude, longitude,
      event_start, event_end, timezone, weather_snapshot, weather_fetched_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    editToken,
    data.title,
    data.description || null,
    data.locationName,
    data.latitude,
    data.longitude,
    data.eventStart,
    data.eventEnd || null,
    data.timezone || null,
    data.weatherSnapshot ? JSON.stringify(data.weatherSnapshot) : null,
    data.weatherFetchedAt || null,
    expiresAt
  );

  return { id, editToken, event: getEventById(id) };
}

function getEventById(id) {
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!row) return null;
  return formatEvent(row);
}

function getEventByIdWithToken(id) {
  return db.prepare('SELECT * FROM events WHERE id = ?').get(id);
}

function updateEvent(id, data) {
  const fields = [];
  const values = [];

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.locationName !== undefined) { fields.push('location_name = ?'); values.push(data.locationName); }
  if (data.latitude !== undefined) { fields.push('latitude = ?'); values.push(data.latitude); }
  if (data.longitude !== undefined) { fields.push('longitude = ?'); values.push(data.longitude); }
  if (data.eventStart !== undefined) { fields.push('event_start = ?'); values.push(data.eventStart); }
  if (data.eventEnd !== undefined) { fields.push('event_end = ?'); values.push(data.eventEnd); }
  if (data.timezone !== undefined) { fields.push('timezone = ?'); values.push(data.timezone); }
  if (data.weatherSnapshot !== undefined) {
    fields.push('weather_snapshot = ?');
    values.push(data.weatherSnapshot ? JSON.stringify(data.weatherSnapshot) : null);
  }
  if (data.weatherFetchedAt !== undefined) { fields.push('weather_fetched_at = ?'); values.push(data.weatherFetchedAt); }

  if (fields.length === 0) return getEventById(id);

  values.push(id);
  db.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getEventById(id);
}

function deleteEvent(id) {
  db.prepare('DELETE FROM events WHERE id = ?').run(id);
}

function formatEvent(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    locationName: row.location_name,
    latitude: row.latitude,
    longitude: row.longitude,
    eventStart: row.event_start,
    eventEnd: row.event_end,
    timezone: row.timezone,
    weatherSnapshot: row.weather_snapshot ? JSON.parse(row.weather_snapshot) : null,
    weatherFetchedAt: row.weather_fetched_at,
    createdAt: row.created_at,
    expiresAt: row.expires_at
  };
}

function cleanupExpired() {
  const result = db.prepare("DELETE FROM events WHERE expires_at < datetime('now')").run();
  return result.changes;
}

module.exports = { createEvent, getEventById, getEventByIdWithToken, updateEvent, deleteEvent, cleanupExpired };
