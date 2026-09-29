const express = require('express');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount all API routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
