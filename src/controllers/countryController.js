const CountryService = require("../services/countryService");
const ImageService = require("../services/imageService");
const { asyncHandler } = require("../middleware/errorHandler");

const refreshCountries = asyncHandler(async (req, res) => {
  const result = await CountryService.refreshCountryData();
  res.status(200).json(result);
});

const getAllCountries = asyncHandler(async (req, res) => {
  const { region, currency, sort } = req.query;

  const filters = {};
  if (region) filters.region = region;
  if (currency) filters.currency = currency;

  const countries = await CountryService.getAllCountries(filters, sort);
  res.status(200).json(countries);
});

const getCountryByName = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const country = await CountryService.getCountryByName(name);
  res.status(200).json(country);
});

const deleteCountryByName = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const result = await CountryService.deleteCountryByName(name);
  res.status(200).json(result);
});

const getSummaryImage = asyncHandler(async (req, res) => {
  const imagePath = await ImageService.imageExists();

  if (!imagePath) {
    return res.status(404).json({
      error: "Summary image not found",
    });
  }

  try {
    // Set appropriate headers
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

    // Send the image file
    const fs = require("fs");
    const readStream = fs.createReadStream(imagePath);
    readStream.pipe(res);
  } catch (error) {
    // If there's an error reading the file, return 404
    res.status(404).json({
      error: "Summary image not found",
    });
  }
});

module.exports = {
  refreshCountries,
  getAllCountries,
  getCountryByName,
  deleteCountryByName,
  getSummaryImage,
};
