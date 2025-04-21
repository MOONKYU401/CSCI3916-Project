const express = require('express');
const axios = require('axios');
const router = express.Router();
const Search = require('../models/Search');

const API_KEY = process.env.WEATHER_API_KEY;

// @route GET /api/weather/:city
router.get('/:city', async (req, res) => {
  const { city } = req.params;

  try {
    // 1. Fetch weather data from OpenWeatherMap
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );

    // 2. Save search to MongoDB
    await Search.create({ city });

    // 3. Return weather data
    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'City not found or API error' });
  }
});

module.exports = router;
