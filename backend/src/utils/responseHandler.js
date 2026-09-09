const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200, meta = undefined) => {
  const response = {
    success: true,
    message,
    data
  };

  if (meta !== undefined) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

const sendError = (res, message = 'An error occurred', statusCode = 500, errorCode = 'INTERNAL_ERROR', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    errors
  });
};

module.exports = {
  sendSuccess,
  sendError
};
