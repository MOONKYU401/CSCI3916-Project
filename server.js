require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./User');
const authJwtController = require('./auth_jwt');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

const router = express.Router();

// ✅ MongoDB Connection
mongoose.connect(process.env.DB)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ✅ Weather Schema
const WeatherSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  location: { type: String, required: true },
  coordinates: {
    lat: Number,
    lon: Number
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  current: {
    dt: Number,
    temp: Number,
    feels_like: Number,
    humidity: Number,
    pressure: Number,
    wind_speed: Number,
    visibility: Number,
    clouds: Number,
    weather: [{
      main: String,
      description: String,
      icon: String
    }]
  },
  hourly: [{
    dt: Number,
    temp: Number,
    feels_like: Number,
    humidity: Number,
    pressure: Number,
    wind_speed: Number,
    clouds: Number,
    visibility: Number,
    weather: [{
      main: String,
      description: String,
      icon: String
    }]
  }],
  daily: [{
    dt: Number,
    temp: {
      day: Number,
      min: Number,
      max: Number,
      night: Number,
      eve: Number,
      morn: Number
    },
    humidity: Number,
    pressure: Number,
    wind_speed: Number,
    clouds: Number,
    weather: [{
      main: String,
      description: String,
      icon: String
    }]
  }]
});

const Weather = mongoose.model('Weather', WeatherSchema);

//
// 🔐 POST /signup
//
router.post('/signup', async (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ success: false, msg: 'Username and password are required.' });
  }

  try {
    const user = new User({
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
      location: req.body.location || 'Denver'
    });

    await user.save();
    res.status(201).json({ success: true, msg: 'User created.' });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({ success: false, msg: 'Username already exists.' });
    } else {
      res.status(500).json({ success: false, msg: 'Server error.' });
    }
  }
});

//
// 🔐 POST /signin
//
router.post('/signin', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username }).select('+password location');
    if (!user) return res.status(401).json({ success: false, msg: 'User not found.' });

    user.comparePassword(req.body.password, async (err, isMatch) => {
      if (err || !isMatch) return res.status(401).json({ success: false, msg: 'Authentication failed.' });

      const userToken = { id: user._id, username: user.username };
      const token = jwt.sign(userToken, process.env.SECRET_KEY);

      const city = req.body.location || user.location || 'Denver';

      try {
        const geo = await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${process.env.WEATHER_API_KEY}`);

        if (!geo.data || geo.data.length === 0) {
          return res.status(404).json({ success: false, msg: `City '${city}' not found.` });
        }

        const { lat, lon, name, country, state } = geo.data[0];

        const response = await axios.get(
          `https://api.openweathermap.org/data/1.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${process.env.WEATHER_API_KEY}`
        );

        await Weather.create({
          location: `${name}, ${state || ''}, ${country}`,
          coordinates: { lat, lon },
          userId: user._id,
          current: response.data.current,
          hourly: response.data.hourly.slice(0, 24),
          daily: response.data.daily.slice(0, 7)
        });

        res.json({
          success: true,
          token: 'JWT ' + token,
          weather: response.data
        });
      } catch (err) {
        console.error('🌩️ Axios Weather Error:', err.response?.data || err.message);
        res.status(500).json({ success: false, msg: 'Error fetching weather.' });
      }
    });
  } catch (err) {
    console.error('❌ Signin Error:', err.message);
    res.status(500).json({ success: false, msg: 'Internal server error.' });
  }
});

//
// 🌤️ GET /weather/full
//
router.get('/weather/full', async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ success: false, msg: 'City is required.' });

  try {
    const geoRes = await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${process.env.WEATHER_API_KEY}`);
    const geo = geoRes.data[0];

    if (!geo) return res.status(404).json({ success: false, msg: `City '${city}' not found.` });

    const { lat, lon, name, country, state } = geo;

    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/1.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${process.env.WEATHER_API_KEY}`
    );
    const weatherData = weatherRes.data;

    await Weather.create({
      location: `${name}, ${state || ''}, ${country}`,
      coordinates: { lat, lon },
      current: weatherData.current,
      hourly: weatherData.hourly.slice(0, 24),
      daily: weatherData.daily.slice(0, 7)
    });

    res.json({
      success: true,
      location: { name, state, country, lat, lon },
      current: weatherData.current,
      hourly: weatherData.hourly.slice(0, 24),
      daily: weatherData.daily.slice(0, 7)
    });
  } catch (err) {
    console.error('🌩️ Full Forecast Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, msg: 'Weather API error.' });
  }
});

//
// 🕓 GET /weather/history (JWT Protected)
//
router.get('/weather/history', authJwtController.isAuthenticated, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const history = await Weather.find({ userId: decoded.id }).sort({ date: -1 });
    res.json({ success: true, history });
  } catch (err) {
    console.error('❌ History Fetch Error:', err.message);
    res.status(500).json({ success: false, msg: 'Failed to retrieve history.' });
  }
});

//
// 🧪 GET /health
//
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Weather API is healthy 🌤️' });
});

app.use('/', router);

app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));