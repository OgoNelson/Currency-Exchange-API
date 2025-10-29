# Country Currency & Exchange API - Architecture Plan

## Project Overview
A RESTful API that fetches country data from external APIs, stores it in a MySQL database, and provides CRUD operations with additional features like filtering, sorting, and image generation.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Image Generation**: Canvas or Sharp
- **HTTP Client**: Axios
- **Environment Management**: dotenv
- **Validation**: Joi or express-validator
- **Testing**: Jest and Supertest

## Project Structure
```
currency-exchange-api/
├── src/
│   ├── controllers/
│   │   ├── countryController.js
│   │   └── statusController.js
│   ├── services/
│   │   ├── countryService.js
│   │   ├── exchangeRateService.js
│   │   └── imageService.js
│   ├── models/
│   │   └── country.js
│   ├── routes/
│   │   ├── countryRoutes.js
│   │   └── statusRoutes.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── utils/
│   │   ├── database.js
│   │   └── helpers.js
│   └── app.js
├── tests/
│   ├── unit/
│   └── integration/
├── cache/
│   └── summary.png (generated)
├── .env
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Database Schema

### Countries Table
```sql
CREATE TABLE countries (
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
```

### Status Table (for tracking global refresh state)
```sql
CREATE TABLE system_status (
  id INT PRIMARY KEY DEFAULT 1,
  total_countries INT DEFAULT 0,
  last_refreshed_at TIMESTAMP,
  CONSTRAINT single_status CHECK (id = 1)
);
```

## API Endpoints

### 1. POST /countries/refresh
- Fetches data from external APIs
- Updates/inserts country records
- Generates summary image
- Updates system status

### 2. GET /countries
- Returns all countries with optional filtering and sorting
- Query parameters:
  - `region`: Filter by region
  - `currency`: Filter by currency code
  - `sort`: Sort options (gdp_asc, gdp_desc, name_asc, name_desc)

### 3. GET /countries/:name
- Returns a specific country by name (case-insensitive)

### 4. DELETE /countries/:name
- Deletes a country record by name (case-insensitive)

### 5. GET /status
- Returns system status with total countries and last refresh timestamp

### 6. GET /countries/image
- Serves the generated summary image

## External API Integration

### Countries API
- URL: https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies
- Handles pagination if needed
- Extracts first currency code from currencies array

### Exchange Rates API
- URL: https://open.er-api.com/v6/latest/USD
- Maps currency codes to exchange rates
- Handles missing currencies gracefully

## Data Flow

### Refresh Process
1. Fetch countries data from REST Countries API
2. Fetch exchange rates from Exchange Rate API
3. For each country:
   - Extract currency code (first in array)
   - Match with exchange rate
   - Calculate estimated GDP: population × random(1000–2000) ÷ exchange_rate
   - Handle edge cases (missing currencies, exchange rates)
4. Update database (insert new, update existing)
5. Generate summary image with top 5 countries by GDP
6. Update system status

### Image Generation
- Create canvas with summary statistics
- Include total countries count
- Display top 5 countries by estimated GDP
- Add timestamp of last refresh
- Save to cache/summary.png

## Error Handling Strategy

### External API Errors
- Timeout handling
- Retry mechanism (with exponential backoff)
- Graceful degradation (return 503 with descriptive message)

### Validation Errors
- Input validation for all endpoints
- Structured error responses with field-level details
- Consistent error format across all endpoints

### Database Errors
- Connection pooling
- Transaction rollback for failed operations
- Proper error logging

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried fields
- Connection pooling
- Prepared statements

### Caching Strategy
- In-memory caching for frequently accessed data
- Image caching on disk
- Consider Redis for distributed caching if needed

### API Rate Limiting
- Implement rate limiting to prevent abuse
- Consider caching external API responses

## Security Considerations

### Input Validation
- Sanitize all inputs
- SQL injection prevention
- XSS prevention

### Environment Security
- Secure management of API keys and database credentials
- Environment variable validation

## Testing Strategy

### Unit Tests
- Test individual functions and methods
- Mock external API calls
- Test data transformation logic

### Integration Tests
- Test API endpoints
- Test database operations
- Test error scenarios

### Test Coverage
- Aim for >80% code coverage
- Test all error paths
- Test edge cases

## Deployment Considerations

### Environment Configuration
- Development, staging, and production environments
- Environment-specific configuration

### Monitoring
- API performance monitoring
- Error tracking
- Database performance monitoring

### Scaling
- Horizontal scaling considerations
- Load balancing
- Database replication if needed