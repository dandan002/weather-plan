const express = require('express');
const router = express.Router();
const { geocodeAddress } = require('../services/geocode');

// GET /api/geocode?query=
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 3) {
      return res.status(400).json({ error: 'query must be at least 3 characters' });
    }

    const result = await geocodeAddress(query.trim());

    if (!result) {
      return res.status(404).json({ error: 'No location found for that query' });
    }

    res.json(result);
  } catch (err) {
    console.error('GET /api/geocode error:', err);
    res.status(500).json({ error: 'Geocoding failed' });
  }
});

module.exports = router;
