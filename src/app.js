require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const countryRoutes = require('./routes/countryRoutes');
const statusRoutes = require('./routes/statusRoutes');

const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// API routes
app.use('/countries', countryRoutes);
app.use('/status', statusRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Country Currency & Exchange API',
    version: '1.0.0',
    endpoints: {
      countries: {
        'GET /countries': 'Get all countries with optional filtering',
        'GET /countries/:name': 'Get a specific country by name',
        'POST /countries/refresh': 'Refresh country data from external APIs',
        'DELETE /countries/:name': 'Delete a country by name',
        'GET /countries/image': 'Get summary image'
      },
      status: {
        'GET /status': 'Get system status'
      },
      health: {
        'GET /health': 'Health check endpoint'
      }
    }
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;