const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

connectDB();

const WeatherSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  weatherType: {
    type: String,
    enum: [
      'Thunderstorm', 'Drizzle', 'Rain', 'Snow', 'Clear', 'Clouds',
      'Mist', 'Smoke', 'Haze', 'Dust', 'Fog', 'Sand', 'Ash',
      'Squall', 'Tornado'
    ],
    required: true,
  },
  temperature: {
    type: Number, // In Celsius
    required: true,
  },
  description: {
    type: String, // e.g., "light rain", "few clouds"
  },
  humidity: {
    type: Number, // Percentage (0–100)
  },
  windSpeed: {
    type: Number, // In m/s
  },
});

module.exports = mongoose.model('Weather', WeatherSchema);