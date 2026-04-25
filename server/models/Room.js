const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomCode: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  destination: { type: String },
  members: [{ name: String, joinedAt: Date }],
  pinnedActivities: [{
    activity: String,
    hearts: { type: Number, default: 0 },
    discarded: { type: Boolean, default: false },
    pinnedBy: String,
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Room', RoomSchema); 