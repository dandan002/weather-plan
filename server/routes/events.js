const express = require('express');
const router = express.Router();
const eventService = require('../services/events');
const { getWeatherForLocation } = require('../services/weather');
const { geocodeAddress } = require('../services/geocode');

// POST /api/events - create a new event
router.post('/', async (req, res) => {
  try {
    const { title, description, locationQuery, locationName, latitude, longitude, eventStart, eventEnd } = req.body;

    if (!title || !eventStart) {
      return res.status(400).json({ error: 'title and eventStart are required' });
    }

    let lat = latitude;
    let lon = longitude;
    let resolvedLocationName = locationName;

    // Geocode if coordinates not provided
    if (lat == null || lon == null) {
      if (!locationQuery && !locationName) {
        return res.status(400).json({ error: 'location is required' });
      }
      const geo = await geocodeAddress(locationQuery || locationName);
      if (!geo) {
        return res.status(422).json({ error: 'Could not geocode location. Please try a more specific address.' });
      }
      lat = geo.latitude;
      lon = geo.longitude;
      resolvedLocationName = resolvedLocationName || geo.matchedAddress;
    }

    // Fetch weather
    let weatherSnapshot = null;
    let weatherFetchedAt = null;
    let timezone = null;
    try {
      const weather = await getWeatherForLocation(lat, lon);
      weatherSnapshot = weather;
      weatherFetchedAt = weather.fetchedAt;
      timezone = weather.timezone;
    } catch (err) {
      console.warn('Weather fetch failed during event creation:', err.message);
    }

    const result = eventService.createEvent({
      title,
      description,
      locationName: resolvedLocationName || locationName || locationQuery,
      latitude: lat,
      longitude: lon,
      eventStart,
      eventEnd,
      timezone,
      weatherSnapshot,
      weatherFetchedAt
    });

    res.status(201).json({
      id: result.id,
      editToken: result.editToken,
      event: result.event
    });
  } catch (err) {
    console.error('POST /api/events error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// GET /api/events/:id
router.get('/:id', (req, res) => {
  try {
    const event = eventService.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found or has expired' });
    }
    res.json(event);
  } catch (err) {
    console.error('GET /api/events/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// PUT /api/events/:id
router.put('/:id', async (req, res) => {
  try {
    const { editToken, ...data } = req.body;
    const tokenFromHeader = req.headers['x-edit-token'];
    const token = editToken || tokenFromHeader;

    if (!token) {
      return res.status(401).json({ error: 'Edit token required' });
    }

    const existing = eventService.getEventByIdWithToken(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (existing.edit_token !== token) {
      return res.status(403).json({ error: 'Invalid edit token' });
    }

    // Re-geocode if location changed
    let lat = data.latitude;
    let lon = data.longitude;
    let resolvedLocationName = data.locationName;

    if (data.locationQuery && (lat == null || lon == null)) {
      const geo = await geocodeAddress(data.locationQuery);
      if (geo) {
        lat = geo.latitude;
        lon = geo.longitude;
        resolvedLocationName = resolvedLocationName || geo.matchedAddress;
      }
    }

    // Re-fetch weather if location or time changed
    let weatherSnapshot = data.weatherSnapshot;
    let weatherFetchedAt = data.weatherFetchedAt;
    let timezone = data.timezone;

    if ((lat && lon) && (lat !== existing.latitude || lon !== existing.longitude || data.eventStart !== existing.event_start)) {
      try {
        const weather = await getWeatherForLocation(lat || existing.latitude, lon || existing.longitude);
        weatherSnapshot = weather;
        weatherFetchedAt = weather.fetchedAt;
        timezone = weather.timezone;
      } catch (err) {
        console.warn('Weather refresh failed during update:', err.message);
      }
    }

    const updated = eventService.updateEvent(req.params.id, {
      ...data,
      latitude: lat,
      longitude: lon,
      locationName: resolvedLocationName,
      weatherSnapshot,
      weatherFetchedAt,
      timezone
    });

    res.json(updated);
  } catch (err) {
    console.error('PUT /api/events/:id error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', (req, res) => {
  try {
    const { editToken } = req.body;
    const tokenFromHeader = req.headers['x-edit-token'];
    const token = editToken || tokenFromHeader;

    if (!token) {
      return res.status(401).json({ error: 'Edit token required' });
    }

    const existing = eventService.getEventByIdWithToken(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (existing.edit_token !== token) {
      return res.status(403).json({ error: 'Invalid edit token' });
    }

    eventService.deleteEvent(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/events/:id error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
