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

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  }
};

// Weather Schema
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
  description: { type: String },
  humidity: { type: Number },
  windSpeed: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Weather = mongoose.model('Weather', WeatherSchema);

// POST /signup
router.post('/signup', async (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ success: false, msg: 'Please include both username and password.' });
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

// POST /signin
router.post('/signin', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username }).select('+password location');
    if (!user) {
      return res.status(401).json({ success: false, msg: 'User not found.' });
    }

    user.comparePassword(req.body.password, async (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(401).json({ success: false, msg: 'Authentication failed.' });
      }

      const userToken = { id: user._id, username: user.username };
      const token = jwt.sign(userToken, process.env.SECRET_KEY);

      const city = req.body.location || user.location || 'Denver';

      try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.WEATHER_API_KEY}`);

        const weather = new Weather({
          date: new Date(),
          location: city,
          weatherType: response.data.weather[0].main,
          temperature: response.data.main.temp,
          description: response.data.weather[0].description,
          humidity: response.data.main.humidity,
          windSpeed: response.data.wind.speed,
          userId: user._id
        });

        await weather.save();

        res.json({
          success: true,
          token: 'JWT ' + token,
          weather: response.data
        });
      } catch (apiErr) {
        res.status(500).json({ success: false, msg: 'Weather API error.' });
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Server error.' });
  }
});

// GET /weather/history
router.get('/weather/history', authJwtController.isAuthenticated, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const history = await Weather.find({ userId: decoded.id }).sort({ date: -1 });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Could not retrieve history.' });
  }
});

// GET /weather/search
router.get('/weather/search', async (req, res) => {
  const { city, state, country } = req.query;
  if (!city || !country) {
    return res.status(400).json({ success: false, msg: 'city and country are required.' });
  }

  let query = `${city}`;
  if (state) query += `,${state}`;
  query += `,${country}`;

  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${process.env.WEATHER_API_KEY}`);
    res.json({ success: true, weather: response.data });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Weather API error.' });
  }
});

// GET /health
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Weather API is healthy 🌤️' });
});

app.use('/', router);

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

module.exports = app;