require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./User');
const authJwtController = require('./auth_jwt');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());
app.use(passport.initialize());

mongoose.connect(process.env.DB)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("MongoDB error:", err));

const ForecastSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  location: String,
  userId: mongoose.Schema.Types.ObjectId,
  current: Object,
  forecast: Array
});

const Forecast = mongoose.model('Forecast', ForecastSchema);

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, password, name, location } = req.body;
    const user = new User({ username, password, name, location });
    await user.save();
    res.status(201).json({ success: true, msg: 'User created.' });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Signup error.', error: err.message });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username }).select('+password');
    if (!user) return res.status(401).json({ success: false, msg: 'User not found' });

    user.comparePassword(req.body.password, async (err, isMatch) => {
      if (err || !isMatch) return res.status(401).json({ success: false, msg: 'Invalid credentials' });

      const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
      const city = req.body.location || user.location || 'Denver';

      const [current, forecast] = await Promise.all([
        axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`),
        axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`)
      ]);

      await Forecast.create({
        userId: user._id,
        location: city,
        current: current.data,
        forecast: forecast.data.list.slice(0, 8) // Next 24 hours = 8 x 3-hr blocks
      });

      res.json({ success: true, token: 'JWT ' + token, weather: { current: current.data, forecast: forecast.data.list.slice(0, 8) } });
    });
  } catch (err) {
    console.error("Axios Weather Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, msg: 'Weather fetch failed.' });
  }
});

router.get('/weather/current', async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ msg: 'City required' });

  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`);
    res.json({ success: true, current: response.data });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Failed to fetch current weather' });
  }
});

router.get('/weather/forecast', async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ msg: 'City required' });

  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`);
    res.json({ success: true, forecast: response.data.list.slice(0, 8) }); // 24 hrs
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Failed to fetch forecast' });
  }
});

router.get('/weather/history', authJwtController.isAuthenticated, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.SECRET_KEY);

  const logs = await Forecast.find({ userId: decoded.id }).sort({ date: -1 });
  res.json({ success: true, history: logs });
});

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is live' });
});

app.use('/', router);
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
