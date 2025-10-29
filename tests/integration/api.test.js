const request = require('supertest');
const app = require('../../src/app');

describe('Countries API', () => {
  describe('GET /', () => {
    test('should return API documentation', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.body.message).toBe('Country Currency & Exchange API');
      expect(response.body.endpoints).toBeDefined();
    });
  });
  
  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });
  
  describe('GET /countries', () => {
    test('should return empty array when no countries exist', async () => {
      const response = await request(app)
        .get('/countries')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('should handle query parameters', async () => {
      const response = await request(app)
        .get('/countries?region=Africa&sort=gdp_desc')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('should reject invalid sort parameter', async () => {
      const response = await request(app)
        .get('/countries?sort=invalid')
        .expect(400);
      
      expect(response.body.error).toBe('Validation failed');
    });
  });
  
  describe('GET /countries/:name', () => {
    test('should return 404 for non-existent country', async () => {
      const response = await request(app)
        .get('/countries/NonExistentCountry')
        .expect(404);
      
      expect(response.body.error).toBe('Country not found');
    });
    
    test('should reject empty country name', async () => {
      const response = await request(app)
        .get('/countries/')
        .expect(404);
    });
  });
  
  describe('DELETE /countries/:name', () => {
    test('should return 404 for non-existent country', async () => {
      const response = await request(app)
        .delete('/countries/NonExistentCountry')
        .expect(404);
      
      expect(response.body.error).toBe('Country not found');
    });
  });
  
  describe('GET /countries/image', () => {
    test('should return 404 when no image exists', async () => {
      const response = await request(app)
        .get('/countries/image')
        .expect(404);
      
      expect(response.body.error).toBe('Summary image not found');
    });
  });
  
  describe('GET /status', () => {
    test('should return system status', async () => {
      const response = await request(app)
        .get('/status')
        .expect(200);
      
      expect(response.body.total_countries).toBeDefined();
      expect(response.body.last_refreshed_at).toBeDefined();
    });
  });
  
  describe('POST /countries/refresh', () => {
    test('should handle refresh request', async () => {
      // This test might fail if external APIs are not available
      // In a real test environment, you would mock the external API calls
      try {
        const response = await request(app)
          .post('/countries/refresh')
          .expect(200);
        
        expect(response.body.message).toBe('Country data refreshed successfully');
        expect(response.body.countriesProcessed).toBeDefined();
      } catch (error) {
        // If external APIs fail, we expect a 503 error
        if (error.response && error.response.status === 503) {
          expect(error.response.body.error).toBe('External data source unavailable');
        } else {
          throw error;
        }
      }
    });
  });
  
  describe('Invalid routes', () => {
    test('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/invalid-route')
        .expect(404);
      
      expect(response.body.error).toBe('Route not found');
    });
  });
});