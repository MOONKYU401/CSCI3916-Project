require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const User = require('./User');
const authJwtController = require('./auth_jwt');

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

// Schemas
const WeatherSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  location: { type: String, required: true },
  weatherType: {
    type: String,
    enum: [
      'Thunderstorm', 'Drizzle', 'Rain', 'Snow', 'Clear', 'Clouds',
      'Mist', 'Smoke', 'Haze', 'Dust', 'Fog', 'Sand', 'Ash',
      'Squall', 'Tornado'
    ],
    required: true
  },
  temperature: { type: Number, required: true },
  description: String,
  humidity: Number,
  windSpeed: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Weather = mongoose.model('Weather', WeatherSchema);

// Main router
const router = express.Router();

router.post('/signup', async (req, res) => {
  const { username, password, name, location } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, msg: 'Please include both username and password.' });
  }

  try {
    const user = new User({ username, password, name, location: location || '' });
    await user.save();
    res.status(201).json({ success: true, msg: 'User created successfully.' });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({ success: false, msg: 'Username already exists.' });
    } else {
      console.error('Signup error:', err);
      res.status(500).json({ success: false, msg: 'Internal server error.' });
    }
  }
});

router.post('/signin', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username }).select('name username password');
    if (!user) {
      return res.status(401).json({ success: false, msg: 'User not found.' });
    }

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (err) return res.status(500).json({ success: false, msg: 'Password comparison failed.' });

      if (isMatch) {
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.SECRET_KEY);
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

// Helper: Get weather by location
const getWeather = async (location) => {
  try {
    const weatherDoc = await Weather.findOne({ location: new RegExp(`^${location}$`, 'i') });
    if (!weatherDoc) throw new Error(`No weather data for ${location}`);
    return {
      location,
      temperature: weatherDoc.temperature,
      condition: weatherDoc.weatherType,
      icon: weatherDoc.icon || ''
    };
  } catch (err) {
    console.error('Weather lookup error:', err.message);
    return { location, temperature: 'N/A', condition: 'Unknown', icon: '' };
  }
};

// GET /weather?username=abc
router.get('/weather', async (req, res) => {
  try {
    let location = req.query.city || 'Denver';
    if (req.query.username) {
      const user = await User.findOne({ username: req.query.username }).select('location');
      if (user && user.location) location = user.location;
    }

    const weather = await getWeather(location);
    res.json({ success: true, weather });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Failed to fetch weather data.' });
  }
});

// POST /weather/create (auth required)
router.post('/weather/create', authJwtController.isAuthenticated, async (req, res) => {
  const { date, location, weatherType, temperature, description, humidity, windSpeed } = req.body;
  if (!date || !location || !weatherType || temperature == null) {
    return res.status(400).json({ success: false, msg: 'Missing required weather fields.' });
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const newWeather = new Weather({
      date, location, weatherType, temperature, description, humidity, windSpeed,
      userId: decoded.id
    });

    await newWeather.save();
    res.status(201).json({ success: true, msg: 'Weather saved.' });
  } catch (err) {
    console.error('Weather save error:', err.message);
    res.status(500).json({ success: false, msg: 'Failed to save weather data.' });
  }
});

// GET /weather/history (auth required)
router.get('/weather/history', authJwtController.isAuthenticated, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const history = await Weather.find({ userId: decoded.id }).sort({ date: -1 });
    res.json({ success: true, history });
  } catch (err) {
    console.error('History fetch error:', err.message);
    res.status(500).json({ success: false, msg: 'Failed to fetch weather history.' });
  }
});

// NEW: mock hourly forecast
router.get('/hourly', async (req, res) => {
  try {
    let location = req.query.city || 'Denver';
    if (req.query.username) {
      const user = await User.findOne({ username: req.query.username }).select('location');
      if (user?.location) location = user.location;
    }

    const now = new Date();
    const hourly = Array.from({ length: 5 }).map((_, i) => {
      const hour = (now.getHours() + i) % 24;
      return {
        time: i === 0 ? 'Now' : `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`,
        temp: Math.floor(Math.random() * 10) + 15,
        icon: '☁️'
      };
    });

    res.json({ success: true, hourly });
  } catch (err) {
    console.error('Hourly error:', err.message);
    res.status(500).json({ success: false, msg: 'Failed to fetch hourly forecast.' });
  }
});

// NEW: mock daily forecast
router.get('/forecast', async (req, res) => {
  try {
    let location = req.query.city || 'Denver';
    if (req.query.username) {
      const user = await User.findOne({ username: req.query.username }).select('location');
      if (user?.location) location = user.location;
    }

    const days = ['Today', 'Thu', 'Fri', 'Sat', 'Sun'];
    const forecast = days.map((day) => ({
      day,
      high: Math.floor(Math.random() * 10) + 20,
      low: Math.floor(Math.random() * 10),
      icon: '☀️'
    }));

    res.json({ success: true, forecast });
  } catch (err) {
    console.error('Forecast error:', err.message);
    res.status(500).json({ success: false, msg: 'Failed to fetch forecast.' });
  }
});

// Mount routes
app.use('/', router);

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});

module.exports = app;
