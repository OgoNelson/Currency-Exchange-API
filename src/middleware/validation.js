const Joi = require('joi');

const countryNameSchema = Joi.string().required().min(1).max(255);

const validateCountryName = (req, res, next) => {
  // Check if name parameter exists and is not empty
  if (!req.params.name || req.params.name.trim() === '') {
    return res.status(404).json({
      error: 'Route not found'
    });
  }
  
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

const validateCountryCreation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().min(1).max(255),
    capital: Joi.string().optional().max(255),
    region: Joi.string().optional().max(255),
    population: Joi.number().required().integer().min(0),
    currency_code: Joi.string().optional().max(10),
    exchange_rate: Joi.number().optional().min(0),
    estimated_gdp: Joi.number().optional().min(0),
    flag_url: Joi.string().optional().uri().max(500)
  });
  
  const { error } = schema.validate(req.body);
  
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
  validateQueryFilters,
  validateCountryCreation
};