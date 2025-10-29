# Implementation Guide

## Package Dependencies

### Required npm packages
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "axios": "^1.5.0",
    "dotenv": "^16.3.1",
    "joi": "^17.9.2",
    "canvas": "^2.11.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0"
  },
  "devDependencies": {
    "jest": "^29.6.2",
    "supertest": "^6.3.3",
    "nodemon": "^3.0.1"
  }
}
```

## Environment Variables (.env)
```
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=currency_exchange

# External APIs
COUNTRIES_API_URL=https://restcountries.com/v2/all
EXCHANGE_API_URL=https://open.er-api.com/v6/latest/USD

# Image Configuration
IMAGE_PATH=./cache
IMAGE_NAME=summary.png
```

## Database Setup SQL Script
```sql
-- Create database
CREATE DATABASE IF NOT EXISTS currency_exchange;

-- Use the database
USE currency_exchange;

-- Create countries table
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
);

-- Create system_status table
CREATE TABLE IF NOT EXISTS system_status (
  id INT PRIMARY KEY DEFAULT 1,
  total_countries INT DEFAULT 0,
  last_refreshed_at TIMESTAMP NULL,
  CONSTRAINT single_status CHECK (id = 1)
);

-- Insert initial status record
INSERT IGNORE INTO system_status (id, total_countries, last_refreshed_at) 
VALUES (1, 0, NULL);
```

## Core Implementation Examples

### Database Connection (src/utils/database.js)
```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

### Country Model (src/models/country.js)
```javascript
const pool = require('../utils/database');

class Country {
  static async findAll(filters = {}, sortBy = null) {
    let query = 'SELECT * FROM countries WHERE 1=1';
    const params = [];
    
    if (filters.region) {
      query += ' AND region = ?';
      params.push(filters.region);
    }
    
    if (filters.currency) {
      query += ' AND currency_code = ?';
      params.push(filters.currency);
    }
    
    if (sortBy) {
      switch (sortBy) {
        case 'gdp_asc':
          query += ' ORDER BY estimated_gdp ASC';
          break;
        case 'gdp_desc':
          query += ' ORDER BY estimated_gdp DESC';
          break;
        case 'name_asc':
          query += ' ORDER BY name ASC';
          break;
        case 'name_desc':
          query += ' ORDER BY name DESC';
          break;
      }
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }
  
  static async findByName(name) {
    const [rows] = await pool.execute(
      'SELECT * FROM countries WHERE LOWER(name) = LOWER(?)',
      [name]
    );
    return rows[0];
  }
  
  static async create(countryData) {
    const {
      name, capital, region, population, currency_code,
      exchange_rate, estimated_gdp, flag_url
    } = countryData;
    
    const [result] = await pool.execute(
      `INSERT INTO countries 
       (name, capital, region, population, currency_code, 
        exchange_rate, estimated_gdp, flag_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, capital, region, population, currency_code,
       exchange_rate, estimated_gdp, flag_url]
    );
    
    return result.insertId;
  }
  
  static async updateByName(name, countryData) {
    const {
      capital, region, population, currency_code,
      exchange_rate, estimated_gdp, flag_url
    } = countryData;
    
    const [result] = await pool.execute(
      `UPDATE countries SET 
       capital = ?, region = ?, population = ?, 
       currency_code = ?, exchange_rate = ?, 
       estimated_gdp = ?, flag_url = ? 
       WHERE LOWER(name) = LOWER(?)`,
      [capital, region, population, currency_code,
       exchange_rate, estimated_gdp, flag_url, name]
    );
    
    return result.affectedRows > 0;
  }
  
  static async deleteByName(name) {
    const [result] = await pool.execute(
      'DELETE FROM countries WHERE LOWER(name) = LOWER(?)',
      [name]
    );
    return result.affectedRows > 0;
  }
  
  static async getTopCountriesByGDP(limit = 5) {
    const [rows] = await pool.execute(
      'SELECT * FROM countries ORDER BY estimated_gdp DESC LIMIT ?',
      [limit]
    );
    return rows;
  }
  
  static async count() {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM countries');
    return rows[0].count;
  }
}

module.exports = Country;
```

### External API Service (src/services/exchangeRateService.js)
```javascript
const axios = require('axios');

class ExchangeRateService {
  static async fetchExchangeRates() {
    try {
      const response = await axios.get(process.env.EXCHANGE_API_URL);
      return response.data.rates;
    } catch (error) {
      throw new Error(`Failed to fetch exchange rates: ${error.message}`);
    }
  }
  
  static async fetchCountries() {
    try {
      const response = await axios.get(
        `${process.env.COUNTRIES_API_URL}?fields=name,capital,region,population,flag,currencies`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch countries: ${error.message}`);
    }
  }
}

module.exports = ExchangeRateService;
```

### Country Service (src/services/countryService.js)
```javascript
const ExchangeRateService = require('./exchangeRateService');
const Country = require('../models/country');
const ImageService = require('./imageService');

class CountryService {
  static async refreshCountryData() {
    try {
      // Fetch data from external APIs
      const [countries, exchangeRates] = await Promise.all([
        ExchangeRateService.fetchCountries(),
        ExchangeRateService.fetchExchangeRates()
      ]);
      
      const processedCountries = [];
      
      for (const country of countries) {
        const processedCountry = await this.processCountryData(country, exchangeRates);
        processedCountries.push(processedCountry);
      }
      
      // Update database
      await this.updateDatabase(processedCountries);
      
      // Generate summary image
      await ImageService.generateSummaryImage();
      
      // Update system status
      await this.updateSystemStatus(processedCountries.length);
      
      return {
        message: 'Country data refreshed successfully',
        countriesProcessed: processedCountries.length
      };
    } catch (error) {
      throw new Error(`Refresh failed: ${error.message}`);
    }
  }
  
  static async processCountryData(country, exchangeRates) {
    // Extract currency code (first currency in array)
    let currencyCode = null;
    if (country.currencies && country.currencies.length > 0) {
      currencyCode = country.currencies[0].code;
    }
    
    let exchangeRate = null;
    let estimatedGdp = null;
    
    if (currencyCode && exchangeRates[currencyCode]) {
      exchangeRate = exchangeRates[currencyCode];
      // Calculate estimated GDP: population × random(1000–2000) ÷ exchange_rate
      const randomMultiplier = Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;
      estimatedGdp = (country.population * randomMultiplier) / exchangeRate;
    } else if (!currencyCode) {
      // No currency, set GDP to 0
      estimatedGdp = 0;
    }
    
    return {
      name: country.name,
      capital: country.capital || null,
      region: country.region || null,
      population: country.population,
      currency_code: currencyCode,
      exchange_rate: exchangeRate,
      estimated_gdp: estimatedGdp,
      flag_url: country.flag || null
    };
  }
  
  static async updateDatabase(countries) {
    for (const countryData of countries) {
      const existingCountry = await Country.findByName(countryData.name);
      
      if (existingCountry) {
        await Country.updateByName(countryData.name, countryData);
      } else {
        await Country.create(countryData);
      }
    }
  }
  
  static async updateSystemStatus(totalCountries) {
    const pool = require('../utils/database');
    await pool.execute(
      'UPDATE system_status SET total_countries = ?, last_refreshed_at = NOW() WHERE id = 1',
      [totalCountries]
    );
  }
}

module.exports = CountryService;
```

### Validation Schema (src/middleware/validation.js)
```javascript
const Joi = require('joi');

const countryNameSchema = Joi.string().required().min(1).max(255);

const validateCountryName = (req, res, next) => {
  const { error } = countryNameSchema.validate(req.params.name);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: {
        name: error.details[0].message
      }
    });
  }
  
  next();
};

const validateQueryFilters = (req, res, next) => {
  const schema = Joi.object({
    region: Joi.string().optional(),
    currency: Joi.string().optional(),
    sort: Joi.string().optional().valid(
      'gdp_asc', 'gdp_desc', 'name_asc', 'name_desc'
    )
  });
  
  const { error } = schema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.reduce((acc, detail) => {
        acc[detail.path[0]] = detail.message;
        return acc;
      }, {})
    });
  }
  
  next();
};

module.exports = {
  validateCountryName,
  validateQueryFilters
};
```

### Error Handler (src/middleware/errorHandler.js)
```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // External API errors
  if (err.message.includes('Failed to fetch')) {
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
  
  // Default error
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;
```

## Testing Examples

### Unit Test Example (tests/unit/countryService.test.js)
```javascript
const CountryService = require('../../src/services/countryService');
const ExchangeRateService = require('../../src/services/exchangeRateService');

jest.mock('../../src/services/exchangeRateService');

describe('CountryService', () => {
  describe('processCountryData', () => {
    test('should process country with valid currency', async () => {
      const country = {
        name: 'Nigeria',
        capital: 'Abuja',
        region: 'Africa',
        population: 206139589,
        flag: 'https://flagcdn.com/ng.svg',
        currencies: [{ code: 'NGN' }]
      };
      
      const exchangeRates = { NGN: 1600.23 };
      
      const result = await CountryService.processCountryData(country, exchangeRates);
      
      expect(result.currency_code).toBe('NGN');
      expect(result.exchange_rate).toBe(1600.23);
      expect(result.estimated_gdp).toBeGreaterThan(0);
    });
    
    test('should handle country without currency', async () => {
      const country = {
        name: 'Test Country',
        population: 1000000,
        currencies: []
      };
      
      const exchangeRates = {};
      
      const result = await CountryService.processCountryData(country, exchangeRates);
      
      expect(result.currency_code).toBeNull();
      expect(result.exchange_rate).toBeNull();
      expect(result.estimated_gdp).toBe(0);
    });
  });
});
```

### Integration Test Example (tests/integration/countries.test.js)
```javascript
const request = require('supertest');
const app = require('../../src/app');

describe('Countries API', () => {
  describe('GET /countries', () => {
    test('should return list of countries', async () => {
      const response = await request(app)
        .get('/countries')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('should filter by region', async () => {
      const response = await request(app)
        .get('/countries?region=Africa')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0].region).toBe('Africa');
      }
    });
  });
  
  describe('GET /countries/:name', () => {
    test('should return specific country', async () => {
      // First, ensure we have a country in the database
      // This would require setup/teardown in a test environment
      
      const response = await request(app)
        .get('/countries/Nigeria')
        .expect(200);
      
      expect(response.body.name).toBe('Nigeria');
    });
    
    test('should return 404 for non-existent country', async () => {
      const response = await request(app)
        .get('/countries/NonExistentCountry')
        .expect(404);
      
      expect(response.body.error).toBe('Country not found');
    });
  });
});
```

## Deployment Considerations

### Dockerfile Example
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p cache

EXPOSE 3000

CMD ["node", "server.js"]
```

### PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'currency-exchange-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};