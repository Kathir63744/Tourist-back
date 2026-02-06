const mongoose = require('mongoose');

const resortSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  priceDisplay: {
    type: String
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  reviews: {
    type: Number,
    default: 0
  },
  image: {
    type: String
  },
  amenities: [String],
  tags: [String],
  distance: String,
  weather: String,
  season: String,
  special: String,
  rooms: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resort', resortSchema);