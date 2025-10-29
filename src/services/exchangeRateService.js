const axios = require('axios');

class ExchangeRateService {
  static async fetchExchangeRates() {
    try {
      const response = await axios.get(process.env.EXCHANGE_API_URL, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'User-Agent': 'Currency-Exchange-API/1.0'
        }
      });
      
      if (response.data && response.data.rates) {
        return response.data.rates;
      } else {
        throw new Error('Invalid response format from exchange rate API');
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Exchange rate API request timed out');
      } else if (error.response) {
        throw new Error(`Exchange rate API returned ${error.response.status}: ${error.response.statusText}`);
      } else {
        throw new Error(`Failed to fetch exchange rates: ${error.message}`);
      }
    }
  }
  
  static async fetchCountries() {
    try {
      const response = await axios.get(
        `${process.env.COUNTRIES_API_URL}?fields=name,capital,region,population,flag,currencies`,
        {
          timeout: 15000, // 15 seconds timeout
          headers: {
            'User-Agent': 'Currency-Exchange-API/1.0'
          }
        }
      );
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else {
        throw new Error('Invalid response format from countries API');
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Countries API request timed out');
      } else if (error.response) {
        throw new Error(`Countries API returned ${error.response.status}: ${error.response.statusText}`);
      } else {
        throw new Error(`Failed to fetch countries: ${error.message}`);
      }
    }
  }
}

module.exports = ExchangeRateService;