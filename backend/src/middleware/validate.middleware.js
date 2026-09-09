const { ValidationError } = require('../utils/customErrors');

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    // Replace with parsed/sanitized data if schema defines them
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    
    next();
  } catch (error) {
    if (error.errors) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.').replace(/^(body|query|params)\./, ''),
        message: err.message
      }));
      return next(new ValidationError('Input validation failed', formattedErrors));
    }
    next(error);
  }
};

module.exports = validate;
