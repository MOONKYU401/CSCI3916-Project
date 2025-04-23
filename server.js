require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('./User');
const authJwtController = require('./auth_jwt');
const weatherRoutes = require('./routes/weather');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

const router = express.Router();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  }
};

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

const getWeather = async (location) => {
  const lowerLoc = location.toLowerCase();

  try {
    const weatherDoc = await Weather.findOne({ location: new RegExp(`^${location}$`, 'i') });
    if (!weatherDoc) throw new Error(`No weather data for ${location}`);

    return {
      location: location,
      temperature: weatherDoc.temperature,
      condition: weatherDoc.weatherType,
      icon: weatherDoc.icon
    };
  } catch (err) {
    console.error('DB Weather lookup error:', err.message);
    return {
      location: location,
      temperature: 'N/A',
      condition: 'Unknown',
      icon: ''
    };
  }
};

router.get('/weather', async (req, res) => {
  try {
    let location = 'Denver';
    if (req.query.username) {
      const user = await User.findOne({ username: req.query.username }).select('location');
      if (user && user.location) {
        location = user.location;
      }
    }
    const weather = await getWeather(location);
    res.json({ success: true, weather });
  } catch (err) {
    console.error('Weather error:', err);
    res.status(500).json({ success: false, msg: 'Failed to fetch weather data.' });
  }
});

router.post('/weather/create', authJwtController.isAuthenticated, async (req, res) => {
  const {
    date,
    location,
    weatherType,
    temperature,
    description,
    humidity,
    windSpeed
  } = req.body;

  if (!date || !location || !weatherType || temperature == null) {
    return res.status(400).json({
      success: false,
      msg: 'Required fields: date, location, weatherType, temperature'
    });
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const newWeather = new Weather({
      date,
      location,
      weatherType,
      temperature,
      description,
      humidity,
      windSpeed,
      userId: decoded.id
    });

    await newWeather.save();
    res.status(201).json({ success: true, msg: 'Weather data saved successfully.' });
  } catch (err) {
    console.error('Weather insert error:', err.message);
    res.status(500).json({ success: false, msg: 'Failed to save weather data.' });
  }
});

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

app.use('/api/weather', weatherRoutes);
app.use('/', router);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

module.exports = app;