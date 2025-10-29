const CountryService = require('../../src/services/countryService');
const ExchangeRateService = require('../../src/services/exchangeRateService');

// Mock the dependencies
jest.mock('../../src/services/exchangeRateService');
jest.mock('../../src/models/country');
jest.mock('../../src/services/imageService');

describe('CountryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      
      // Access the private method through the class
      const result = await CountryService.processCountryData(country, exchangeRates);
      
      expect(result.currency_code).toBe('NGN');
      expect(result.exchange_rate).toBe(1600.23);
      expect(result.estimated_gdp).toBeGreaterThan(0);
      expect(result.name).toBe('Nigeria');
      expect(result.capital).toBe('Abuja');
      expect(result.region).toBe('Africa');
      expect(result.population).toBe(206139589);
      expect(result.flag_url).toBe('https://flagcdn.com/ng.svg');
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
    
    test('should handle country with currency not in exchange rates', async () => {
      const country = {
        name: 'Test Country',
        population: 1000000,
        currencies: [{ code: 'XYZ' }]
      };
      
      const exchangeRates = { USD: 1.0 };
      
      const result = await CountryService.processCountryData(country, exchangeRates);
      
      expect(result.currency_code).toBe('XYZ');
      expect(result.exchange_rate).toBeNull();
      expect(result.estimated_gdp).toBeNull();
    });
  });
});