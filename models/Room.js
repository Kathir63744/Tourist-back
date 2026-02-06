const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  resortId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['deluxe', 'premium', 'suite', 'villa'],
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  maxCapacity: {
    adults: {
      type: Number,
      required: true,
      default: 2
    },
    children: {
      type: Number,
      default: 2
    }
  },
  extraAdultCharge: {
    type: Number,
    default: 800
  },
  extraChildCharge: {
    type: Number,
    default: 500
  },
  amenities: [String],
  totalRooms: {
    type: Number,
    required: true
  },
  availableRooms: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Room', roomSchema);