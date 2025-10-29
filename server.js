const app = require('./src/app');
const port = process.env.PORT || 3000;

// Start the server
const server = app.listen(port, () => {
  console.log(`🚀 Currency Exchange API running on port ${port}`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = server;