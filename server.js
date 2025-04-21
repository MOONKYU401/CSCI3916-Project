require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('./User'); // Make sure this has the location field
const authJwtController = require('./auth_jwt'); // Included for later use
const app = express();

const PORT = 10000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

const router = express.Router();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log(' Connected to MongoDB');
  } catch (err) {
    console.error(' Could not connect to MongoDB:', err.message);
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
      location: req.body.location || '' // allow optional location on signup
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

// Mock weather service
const getWeather = async (location) => {
  // Replace with real API call later
  return {
    location,
    temperature: '15°C',
    condition: 'Partly Cloudy'
  };
};

// Public weather route
router.get('/weather', async (req, res) => {
  try {
    let location = 'Denver'; // default

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

app.use('/', router);

// Start server after DB connection
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
  });
});

module.exports = app;
