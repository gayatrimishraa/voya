const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  destination: String,
  days: Number,
  vibe: String,
  activities: [String],
  price: Number,
  coordinates: {
    lat: Number,
    lng: Number,
  },
});

module.exports = mongoose.model('Trip', TripSchema);