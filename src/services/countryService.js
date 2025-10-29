const ExchangeRateService = require('./exchangeRateService');
const Country = require('../models/country');
const ImageService = require('./imageService');

class CountryService {
  static async refreshCountryData() {
    try {
      console.log('Starting country data refresh...');
      
      // Fetch data from external APIs
      const [countries, exchangeRates] = await Promise.all([
        ExchangeRateService.fetchCountries(),
        ExchangeRateService.fetchExchangeRates()
      ]);
      
      console.log(`Fetched ${countries.length} countries and ${Object.keys(exchangeRates).length} exchange rates`);
      
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
      await Country.updateSystemStatus(processedCountries.length);
      
      console.log(`Successfully processed ${processedCountries.length} countries`);
      
      return {
        message: 'Country data refreshed successfully',
        countriesProcessed: processedCountries.length
      };
    } catch (error) {
      console.error('Refresh failed:', error);
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
    let updatedCount = 0;
    let insertedCount = 0;
    
    for (const countryData of countries) {
      const existingCountry = await Country.findByName(countryData.name);
      
      if (existingCountry) {
        await Country.updateByName(countryData.name, countryData);
        updatedCount++;
      } else {
        await Country.create(countryData);
        insertedCount++;
      }
    }
    
    console.log(`Database updated: ${insertedCount} inserted, ${updatedCount} updated`);
  }
  
  static async getAllCountries(filters = {}, sortBy = null) {
    try {
      const countries = await Country.findAll(filters, sortBy);
      return countries;
    } catch (error) {
      throw new Error(`Failed to fetch countries: ${error.message}`);
    }
  }
  
  static async getCountryByName(name) {
    try {
      const country = await Country.findByName(name);
      if (!country) {
        throw new Error('Country not found');
      }
      return country;
    } catch (error) {
      if (error.message === 'Country not found') {
        throw error;
      }
      throw new Error(`Failed to fetch country: ${error.message}`);
    }
  }
  
  static async deleteCountryByName(name) {
    try {
      const deleted = await Country.deleteByName(name);
      if (!deleted) {
        throw new Error('Country not found');
      }
      return { message: 'Country deleted successfully' };
    } catch (error) {
      if (error.message === 'Country not found') {
        throw error;
      }
      throw new Error(`Failed to delete country: ${error.message}`);
    }
  }
  
  static async getSystemStatus() {
    try {
      const status = await Country.getSystemStatus();
      return {
        total_countries: status.total_countries,
        last_refreshed_at: status.last_refreshed_at
      };
    } catch (error) {
      throw new Error(`Failed to get system status: ${error.message}`);
    }
  }
}

module.exports = CountryService;