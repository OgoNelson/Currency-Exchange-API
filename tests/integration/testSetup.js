// Integration test setup
const mysql = require('mysql2/promise');

// Mock database module for integration tests
jest.mock('../../src/utils/database', () => {
  const mockPool = {
    execute: jest.fn(),
    query: jest.fn(),
    end: jest.fn().mockResolvedValue()
  };
  
  return mockPool;
});

// Mock Country model methods
const mockCountryModel = {
  findAll: jest.fn().mockResolvedValue([]),
  findByName: jest.fn().mockResolvedValue(null),
  deleteByName: jest.fn().mockResolvedValue(false),
  getSystemStatus: jest.fn().mockResolvedValue({
    total_countries: 0,
    last_refreshed_at: null
  }),
  create: jest.fn().mockResolvedValue(1),
  updateByName: jest.fn().mockResolvedValue(true),
  updateSystemStatus: jest.fn().mockResolvedValue()
};

jest.mock('../../src/models/country', () => mockCountryModel);

// Mock ImageService
jest.mock('../../src/services/imageService', () => {
  return {
    imageExists: jest.fn().mockResolvedValue(null),
    generateSummaryImage: jest.fn().mockResolvedValue('/cache/summary.png')
  };
});

// Mock ExchangeRateService
jest.mock('../../src/services/exchangeRateService', () => {
  return {
    fetchCountries: jest.fn().mockResolvedValue([]),
    fetchExchangeRates: jest.fn().mockResolvedValue({})
  };
});

// Export mock for test manipulation
module.exports = { mockCountryModel };