require('dotenv').config();
const mongoose = require('mongoose');

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
  windSpeed: { type: Number }
});

const Weather = mongoose.model('Weather', WeatherSchema);

const seedData = [
  {
    date: new Date(),
    location: 'denver',
    weatherType: 'Clear',
    temperature: 22,
    description: 'Sunny and warm',
    humidity: 35,
    windSpeed: 4.1
  },
  {
    date: new Date(),
    location: 'new york',
    weatherType: 'Clouds',
    temperature: 18,
    description: 'Overcast skies',
    humidity: 60,
    windSpeed: 5.5
  },
  {
    date: new Date(),
    location: 'los angeles',
    weatherType: 'Clear',
    temperature: 26,
    description: 'Bright sunshine',
    humidity: 20,
    windSpeed: 2.8
  }
];

async function seedWeatherData() {
  try {
    await mongoose.connect(process.env.DB);
    console.log('Connected to MongoDB');

    await Weather.deleteMany({});
    await Weather.insertMany(seedData);

    console.log('✅ Weather data seeded successfully!');
    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

seedWeatherData();