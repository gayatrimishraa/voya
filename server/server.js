const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/rooms', require('./routes/rooms'));

app.get('/', (req, res) => res.send('TravelAI API ✅'));

// Socket.io — Real-time Collaborative Rooms
const Message = require('./models/Message');
const Room = require('./models/Room');
const Trip = require('./models/Trip');

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join a room
  socket.on('join_room', async ({ roomCode, userName }) => {
    socket.join(roomCode);
    socket.to(roomCode).emit('user_joined', {
      text: `${userName} joined the room!`,
      type: 'system',
      sender: 'System',
      timestamp: new Date(),
    });
    console.log(`👤 ${userName} joined room ${roomCode}`);
  });

  // Handle chat messages + basic AI concierge
  socket.on('send_message', async ({ roomCode, sender, text }) => {
    const userMsg = new Message({ roomCode, sender, text, type: 'user' });
    await userMsg.save();
    io.to(roomCode).emit('receive_message', userMsg);

    // Basic AI Concierge — keyword matching (Gemini integration comes next)
    const lower = text.toLowerCase();
    let aiReply = null;

    if (lower.includes('spiritual') || lower.includes('temple') || lower.includes('varanasi')) {
      const trip = await Trip.findOne({ vibe: 'Temple' });
      if (trip) {
        aiReply = `🛕 Based on your interest, I suggest **${trip.destination}**! It's a ${trip.days}-day spiritual journey with activities like ${trip.activities.slice(0, 2).join(' and ')}. Budget: ₹${trip.price}. Want me to build a full itinerary?`;
      }
    } else if (lower.includes('beach') || lower.includes('goa') || lower.includes('relax')) {
      const trip = await Trip.findOne({ vibe: 'Beach' });
      if (trip) {
        aiReply = `🏖️ Perfect choice! **${trip.destination}** is ideal for you — ${trip.days} days of ${trip.activities.slice(0, 2).join(', ')}. Budget: ₹${trip.price}. Shall I plan it out?`;
      }
    } else if (lower.includes('budget') || lower.includes('cheap') || lower.includes('affordable')) {
      const trip = await Trip.find().sort({ price: 1 }).limit(1);
      if (trip[0]) {
        aiReply = `💰 Most budget-friendly option: **${trip[0].destination}** at just ₹${trip[0].price} for ${trip[0].days} days!`;
      }
    } else if (lower.includes('itinerary') || lower.includes('plan') || lower.includes('schedule')) {
      aiReply = `📋 I can build a full day-by-day itinerary! Just tell me your destination, budget, and travel dates.`;
    } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      aiReply = `👋 Hello! I'm your AI Travel Concierge. Tell me what kind of trip you're dreaming of — beach, spiritual, adventure, budget — and I'll find the perfect package for you!`;
    }

    if (aiReply) {
      const aiMsg = new Message({
        roomCode,
        sender: 'AI Concierge',
        text: aiReply,
        type: 'ai',
      });
      await aiMsg.save();
      setTimeout(() => {
        io.to(roomCode).emit('receive_message', aiMsg);
      }, 800);
    }
  });

  // Live voting — heart an activity
  socket.on('heart_activity', ({ roomCode, activityId }) => {
    io.to(roomCode).emit('activity_hearted', { activityId });
  });

  // Pin to trip board
  socket.on('pin_activity', ({ roomCode, activity, pinnedBy }) => {
    io.to(roomCode).emit('activity_pinned', { activity, pinnedBy });
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Connect MongoDB then start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running on http://localhost:${process.env.PORT || 5000}`);
    });
  })
  .catch(err => console.error('❌ MongoDB Error:', err.message));