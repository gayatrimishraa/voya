const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { v4: uuidv4 } = require('uuid');

// Create a new room
router.post('/create', async (req, res) => {
  try {
    const { name, destination, creatorName } = req.body;
    const roomCode = uuidv4().slice(0, 6).toUpperCase();
    const room = new Room({
      roomCode,
      name,
      destination,
      members: [{ name: creatorName, joinedAt: new Date() }],
    });
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join existing room
router.post('/join', async (req, res) => {
  try {
    const { roomCode, userName } = req.body;
    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const alreadyIn = room.members.find(m => m.name === userName);
    if (!alreadyIn) {
      room.members.push({ name: userName, joinedAt: new Date() });
      await room.save();
    }
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get room details
router.get('/:roomCode', async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pin an activity to the trip board
router.post('/:roomCode/pin', async (req, res) => {
  try {
    const { activity, pinnedBy } = req.body;
    const room = await Room.findOne({ roomCode: req.params.roomCode });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    room.pinnedActivities.push({ activity, pinnedBy });
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Heart an activity
router.post('/:roomCode/heart/:activityId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode });
    const activity = room.pinnedActivities.id(req.params.activityId);
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    activity.hearts += 1;
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;