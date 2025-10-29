# Country Currency & Exchange API

A RESTful API that fetches country data from external APIs, stores it in a MySQL database, and provides CRUD operations with additional features like filtering, sorting, and image generation.

## Features

- 🌍 Fetch country data from REST Countries API
- 💱 Get exchange rates from Exchange Rate API
- 📊 Calculate estimated GDP based on population and exchange rates
- 🗄️ Store and cache data in MySQL database
- 🔍 Filter and sort countries by various criteria
- 📈 Generate summary images with top countries by GDP
- 🚀 RESTful API with comprehensive error handling
- 🧪 Full test coverage with unit and integration tests

## API Endpoints

### Countries
- `GET /countries` - Get all countries with optional filtering and sorting
- `GET /countries/:name` - Get a specific country by name
- `POST /countries/refresh` - Refresh country data from external APIs
- `DELETE /countries/:name` - Delete a country by name
- `GET /countries/image` - Get summary image

### Status
- `GET /status` - Get system status

### Health
- `GET /health` - Health check endpoint
- `GET /` - API documentation

## Query Parameters

### Filtering
- `region` - Filter by region (e.g., `?region=Africa`)
- `currency` - Filter by currency code (e.g., `?currency=NGN`)

### Sorting
- `sort` - Sort options:
  - `gdp_asc` - Sort by estimated GDP (ascending)
  - `gdp_desc` - Sort by estimated GDP (descending)
  - `name_asc` - Sort by name (ascending)
  - `name_desc` - Sort by name (descending)

Example: `GET /countries?region=Africa&sort=gdp_desc`

## Sample Responses

### GET /countries?region=Africa
```json
[
  {
    "id": 1,
    "name": "Nigeria",
    "capital": "Abuja",
    "region": "Africa",
    "population": 206139589,
    "currency_code": "NGN",
    "exchange_rate": 1600.23,
    "estimated_gdp": 25767448125.2,
    "flag_url": "https://flagcdn.com/ng.svg",
    "last_refreshed_at": "2025-10-29T12:00:00Z"
  }
]
```

### GET /status
```json
{
  "total_countries": 250,
  "last_refreshed_at": "2025-10-29T12:00:00Z"
}
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd currency-exchange-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
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

4. **Set up database**
   ```bash
   mysql -u root -p < database/setup.sql
   ```

5. **Start server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

The API will be available at `http://localhost:3000`

## Usage

### Initial Data Load
After starting the server, refresh data from external APIs:

```bash
curl -X POST http://localhost:3000/countries/refresh
```

### Get Countries
```bash
# Get all countries
curl http://localhost:3000/countries

# Filter by region
curl http://localhost:3000/countries?region=Africa

# Sort by GDP
curl http://localhost:3000/countries?sort=gdp_desc

# Get specific country
curl http://localhost:3000/countries/Nigeria
```

### Get System Status
```bash
curl http://localhost:3000/status
```

### Get Summary Image
```bash
curl -o summary.png http://localhost:3000/countries/image
```

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- Test setup: `tests/setup.js`

## Project Structure

```
currency-exchange-api/
├── src/
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── app.js              # Express app configuration
├── tests/                  # Test files
├── database/               # Database setup scripts
├── cache/                  # Generated images
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore file
├── package.json            # Node.js dependencies
├── server.js               # Server entry point
└── README.md               # This file
```

## API Error Handling

The API returns consistent error responses:

### Validation Errors (400)
```json
{
  "error": "Validation failed",
  "details": {
    "field_name": "error message"
  }
}
```

### Not Found (404)
```json
{
  "error": "Country not found"
}
```

### External API Errors (503)
```json
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from [API name]"
}
```

### Internal Server Error (500)
```json
{
  "error": "Internal server error"
}
```

## Data Flow

1. **Refresh Process**:
   - Fetch countries data from REST Countries API
   - Fetch exchange rates from Exchange Rate API
   - Process and merge data (calculate estimated GDP)
   - Store/update in database
   - Generate summary image
   - Update system status

2. **GDP Calculation**:
   ```
   estimated_gdp = population × random(1000–2000) ÷ exchange_rate
   ```

## External APIs

### REST Countries API
- URL: `https://restcountries.com/v2/all`
- Fields: `name,capital,region,population,flag,currencies`

### Exchange Rate API
- URL: `https://open.er-api.com/v6/latest/USD`
- Provides exchange rates relative to USD

## Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- `NODE_ENV=production`
- Database credentials
- API URLs
- Image path configuration

### Database
- Run setup script on your production database
- Ensure proper database permissions
- Consider connection pooling for high traffic

### Security
- Use HTTPS in production
- Implement rate limiting
- Secure database credentials
- Regularly update dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
- Create an issue in the repository
- Check the API documentation at `/` endpoint
- Review test files for usage examples
