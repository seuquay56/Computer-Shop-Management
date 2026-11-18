function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error.';

  if (error.code === '23505') {
    statusCode = 409;
    message = 'A record with the same unique value already exists.';
  } else if (error.code === '23503') {
    statusCode = 400;
    message = 'The request references a record that does not exist.';
  } else if (error.code === '23514' || error.code === '22P02') {
    statusCode = 400;
    message = 'The supplied data is not valid.';
  }

  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : message,
  });
}

module.exports = { errorHandler };
