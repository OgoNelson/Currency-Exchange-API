const CountryService = require('../services/countryService');
const { asyncHandler } = require('../middleware/errorHandler');

const getSystemStatus = asyncHandler(async (req, res) => {
  const status = await CountryService.getSystemStatus();
  res.status(200).json(status);
});

module.exports = {
  getSystemStatus
};