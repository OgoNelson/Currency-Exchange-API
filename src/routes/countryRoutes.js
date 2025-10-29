const express = require('express');
const router = express.Router();
const {
  refreshCountries,
  getAllCountries,
  getCountryByName,
  deleteCountryByName,
  getSummaryImage
} = require('../controllers/countryController');
const { validateCountryName, validateQueryFilters } = require('../middleware/validation');

// POST /countries/refresh - Refresh country data from external APIs
router.post('/refresh', refreshCountries);

// GET /countries - Get all countries with optional filtering and sorting
router.get('/', validateQueryFilters, getAllCountries);

// GET /countries/image - Get summary image 
router.get('/image', getSummaryImage);

// GET /countries/:name - Get a specific country by name
router.get('/:name', validateCountryName, getCountryByName);

// DELETE /countries/:name - Delete a country by name
router.delete('/:name', validateCountryName, deleteCountryByName);

module.exports = router;