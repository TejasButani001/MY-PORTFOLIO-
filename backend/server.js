// =========================================================================
// Express Server Entry Point
// Practical 7  – Auth & Middleware Pipeline
// Practical 9  – In-Memory Caching (node-cache)
// Practical 10 – Async EventEmitter-based background processing
// =========================================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Connect to MongoDB using Mongoose (Practical 11: Containerized DNS resolution)
// Uses Docker service name 'mongodb' when inside compose network or fallback
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/taskdb';
mongoose.connect(MONGO_URI)
  .then(() => console.log(`MongoDB connected successfully to: ${MONGO_URI}`))
  .catch((err) => console.error('MongoDB connection error:', err));

// Support requiring `.jsx` files on backend Node environment
require.extensions['.jsx'] = require.extensions['.js'];

// Import middleware and router modules
const logger = require('./middleware/logger.jsx');
const validateContent = require('./middleware/validateContenty.jsx');
const errorHandler = require('./middleware/errorhandler.jsx');
const authRoutes = require('./router/authRouter');
const taskRoutes = require('./router/taskrouter.jsx');

// ── Practical 9: import shared cache (for the /cache-stats debug endpoint)
const cache = require('./cache/taskCache');

// ── Practical 10: Register event listeners BEFORE routes start handling
//    requests. This guarantees listeners exist when the first emit happens.
const { getEventLogs, clearEventLogs } = require('./events/listeners');
const taskEvents = require('./events/taskEvents');

// 1. CORS middleware
app.use(cors());

// 2. Built-in JSON body parser
app.use(express.json());

// 3. Global Request Logger middleware
app.use(logger);

// 4. Content-Type Header Validation middleware (for POST & PUT)
app.use(validateContent);

// 5. Authentication API Routes (Public: /auth/register, /auth/login; Protected: /auth/me)
app.use('/auth', authRoutes);

// 6. Task REST API Routes (Protected by JWT Auth Middleware)
app.use('/tasks', taskRoutes);

// 7. Test Error Route
app.get('/trigger-error', (req, res, next) => {
  const err = new Error('Test error for global error handler');
  next(err);
});

// ── Practical 9 (Supplementary): Cache stats debug endpoint ──────────────
// GET /cache-stats → returns hit count, miss count, and currently cached keys.
// No auth required so it's easy to test in Postman.
app.get('/cache-stats', (req, res) => {
  const stats = cache.getStats();
  res.json({
    message: 'Cache statistics (Practical 9 – Supplementary)',
    hits: stats.hits,
    misses: stats.misses,
    hitRatio: stats.hits + stats.misses === 0
      ? '0%'
      : `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%`,
    cachedKeys: stats.keys,
    ttlSeconds: 60,
  });
});

// ── Practical 10: Event Log & Test Endpoints ──────────────────────────────
// GET /events/log → returns recent event emissions with exact timestamps
// demonstrating that the API responded before the 2-second background notification completed.
app.get('/events/log', (req, res) => {
  const logs = getEventLogs();
  res.json({
    message: 'Practical 10: Asynchronous Processing with Event-Driven Architecture',
    totalEvents: logs.length,
    events: logs
  });
});

// DELETE /events/log → clears event log history
app.delete('/events/log', (req, res) => {
  clearEventLogs();
  res.json({ message: 'Event logs cleared successfully' });
});

// POST /events/test-error → Supplementary Problem 2: triggers error listener
app.post('/events/test-error', (req, res) => {
  const errorMessage = req.body?.message || 'Deliberate test error for Practical 10 error listener';
  console.log(`\n[API] Emitting deliberate error event for testing: "${errorMessage}"`);

  // Emit directly or emit task-created with invalid data to trigger catch block
  taskEvents.emit('error', new Error(errorMessage));

  res.status(200).json({
    message: 'Deliberate error event emitted and caught by error listener',
    simulatedError: errorMessage,
    timestamp: new Date().toISOString()
  });
});

// 8. Route Not Found (404) handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 9. Global Error Handler middleware
app.use(errorHandler);

// Start the Express server on port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
