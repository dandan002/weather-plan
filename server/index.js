require('dotenv').config({ path: '.env' });
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Initialize DB first
require('./db/db');

const eventsRouter = require('./routes/events');
const weatherRouter = require('./routes/weather');
const geocodeRouter = require('./routes/geocode');
const { startCleanupJob } = require('./jobs/cleanup');

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

// Middleware
app.use(compression());
app.use(express.json());
app.use(cors({
  origin: isDev ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : false,
  credentials: true
}));

// Rate limiting for event creation
const createEventLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { error: 'Too many events created. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Routes
app.use('/api/events', createEventLimiter, eventsRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/geocode', geocodeRouter);

// Serve static build in production
if (!isDev) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start cleanup cron
startCleanupJob();

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
  console.log(`[server] Environment: ${isDev ? 'development' : 'production'}`);
});
