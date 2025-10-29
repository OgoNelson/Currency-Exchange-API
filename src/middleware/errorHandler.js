const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // External API errors
  if (err.message.includes('Failed to fetch') || 
      err.message.includes('timed out') ||
      err.message.includes('returned')) {
    return res.status(503).json({
      error: 'External data source unavailable',
      details: err.message
    });
  }
  
  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      error: 'Duplicate entry',
      details: 'Country with this name already exists'
    });
  }
  
  if (err.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({
      error: 'Database configuration error',
      details: 'Required database tables are missing. Please run the setup script.'
    });
  }
  
  // Connection errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Database connection failed',
      details: 'Unable to connect to the database'
    });
  }
  
  // Validation errors (should be caught by validation middleware, but just in case)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.message
    });
  }
  
  // Custom application errors
  if (err.message === 'Country not found') {
    return res.status(404).json({
      error: 'Country not found'
    });
  }
  
  // Default error
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    details: `Cannot ${req.method} ${req.url}`
  });
};

// Async error wrapper for routes
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};