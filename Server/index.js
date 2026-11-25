const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { connectMongo, getMongoError } = require('./config/db');
const { requireMongo } = require('./middleware/authMiddleware');
const { initSocket } = require('./sockets/socketManager');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const jobRoutes = require('./routes/jobRoutes');
const skillRoutes = require('./routes/skillRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: [clientUrl, 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Initialize WebSockets
initSocket(server, clientUrl);

const distPath = path.join(__dirname, '../Client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Initial DB connection attempt
connectMongo().catch(err => {
  console.warn("MongoDB initial connection error:", err.message);
});

// Root ping
app.get('/', (req, res) => {
  res.send('SkillBridge AI Server is Running and Database is connected!');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoError = getMongoError();
  res.json({
    ok: true,
    mongoReadyState: mongoose.connection.readyState,
    hasMongoUri: Boolean(process.env.MONGO_URI || process.env.MONGODB_URI),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    hasEmailConfig: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    hasGoogleConfig: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    mongoError: mongoError ? { name: mongoError.name, message: mongoError.message } : null
  });
});

// Enforce active MongoDB connection for all /api endpoints
app.use('/api', requireMongo);

// Mount modular sub-routers
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', bookingRoutes);
app.use('/api', jobRoutes);
app.use('/api', skillRoutes);
app.use('/api', chatRoutes);

// Fallback to client SPA in production
if (fs.existsSync(distPath)) {
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get(/.*/, (req, res) => {
    res.send('SkillBridge AI Server is Running! (Frontend build directory not found)');
  });
}

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server live on port ${PORT} with WebSockets enabled`);
  });
}

module.exports = app;
