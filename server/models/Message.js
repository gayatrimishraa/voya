const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  roomCode: { type: String, required: true },
  sender: { type: String, required: true },
  text: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['user', 'ai', 'system'], 
    default: 'user' 
  },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', MessageSchema);