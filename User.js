require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./User'); // Should include location field
const authJwtController = require('./auth_jwt');

const app = express();
const PORT = 10001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

const router = express.Router();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  }
};

// Signup route
router.post('/signup', async (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ success: false, msg: 'Please include both username and password to signup.' });
  }

  try {
    const user = new User({
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
      location: req.body.location || ''
    });

    await user.save();
    res.status(201).json({ success: true, msg: 'Successfully created new user.' });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({ success: false, msg: 'A user with that username already exists.' });
    } else {
      console.error('Signup error:', err);
      res.status(500).json({ success: false, msg: 'Internal server error.' });
    }
  }
});

// Signin route
router.post('/signin', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username }).select('name username password');
    if (!user) {
      return res.status(401).json({ success: false, msg: 'User not found.' });
    }

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (err) return res.status(500).json({ success: false, msg: 'Error comparing password.' });

      if (isMatch) {
        const userToken = { id: user._id, username: user.username };
        const token = jwt.sign(userToken, process.env.SECRET_KEY);
        res.json({ success: true, token: 'JWT ' + token });
      } else {
        res.status(401).json({ success: false, msg: 'Authentication failed.' });
      }
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ success: false, msg: 'Internal server error.' });
  }
});

// Real weather API integration (OpenWeatherMap Pro hourly)
const getHourlyForecast = async (lat, lon) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  try {
    const response = await axios.get(
      `https://pro.openweathermap.org/data/2.5/forecast/hourly`,
      {
        params: {
          lat,
          lon,
          appid: apiKey,
          units: 'metric'
        }
      }
    );

    const data = response.data;

    const hourlyForecast = data.list.map(item => ({
      datetime: item.dt_txt,
      temperature: `${item.main.temp}°C`,
      condition: item.weather[0].description,
      icon: `http://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`
    }));

    return {
      location: data.city.name,
      country: data.city.country,
      forecast: hourlyForecast
    };

  } catch (err) {
    console.error('OpenWeatherMap hourly forecast error:', err.response?.data || err.message);
    throw new Error('Failed to fetch hourly forecast.');
  }
};

// Hourly forecast endpoint (public)
router.get('/forecast/hourly', async (req, res) => {
  try {
    let lat = req.query.lat;
    let lon = req.query.lon;

    // Default to Denver coordinates if not provided
    if (!lat || !lon) {
      lat = 39.7392;
      lon = -104.9903;
    }

    const forecast = await getHourlyForecast(lat, lon);
    res.json({ success: true, forecast });

  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

app.use('/', router);

// Start server after DB connection
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

module.exports = app;
