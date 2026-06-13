const express = require('express');
const router = express.Router();
const { getWeatherForLocation } = require('../services/weather');

// GET /api/weather?lat=&lon=&eventStart=
router.get('/', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon are required' });
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({ error: 'lat and lon must be valid numbers' });
    }

    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return res.status(400).json({ error: 'Coordinates out of range' });
    }

    const weather = await getWeatherForLocation(latNum, lonNum);
    res.json(weather);
  } catch (err) {
    console.error('GET /api/weather error:', err);
    if (err.message && err.message.includes('NWS error')) {
      return res.status(502).json({ error: 'Weather service unavailable. NWS only covers US locations.' });
    }
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

module.exports = router;
