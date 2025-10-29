// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'currency_exchange_test';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Increase timeout for integration tests
jest.setTimeout(30000);

// Setup and teardown hooks
beforeAll(async () => {
  // Skip database setup if MySQL is not available
  try {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    await connection.execute('CREATE DATABASE IF NOT EXISTS currency_exchange_test');
    await connection.execute('USE currency_exchange_test');
    
    // Create tables if they don't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS countries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        capital VARCHAR(255),
        region VARCHAR(255),
        population BIGINT NOT NULL,
        currency_code VARCHAR(10),
        exchange_rate DECIMAL(10, 4),
        estimated_gdp DECIMAL(20, 2),
        flag_url VARCHAR(500),
        last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_region (region),
        INDEX idx_currency_code (currency_code),
        INDEX idx_name (name)
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_status (
        id INT PRIMARY KEY DEFAULT 1,
        total_countries INT DEFAULT 0,
        last_refreshed_at TIMESTAMP NULL,
        CONSTRAINT single_status CHECK (id = 1)
      )
    `);
    
    await connection.execute(`
      INSERT IGNORE INTO system_status (id, total_countries, last_refreshed_at)
      VALUES (1, 0, NULL)
    `);
    
    console.log('Test database setup completed');
    await connection.end();
  } catch (error) {
    console.warn('Database setup skipped - MySQL not available:', error.message);
    // Mock the database module for testing
    jest.mock('../src/utils/database', () => ({
      execute: jest.fn().mockResolvedValue([[]]),
      query: jest.fn().mockResolvedValue([[]]),
      end: jest.fn().mockResolvedValue()
    }));
  }
});

afterAll(async () => {
  // Clean up database connections
  try {
    const pool = require('../src/utils/database');
    if (pool && pool.end) {
      await pool.end();
    }
  } catch (error) {
    // Ignore cleanup errors
  }
  
  // Wait a bit for connections to close
  await new Promise(resolve => setTimeout(resolve, 100));
});