// Central error handler. Every controller error funnels through here.
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    status = 422;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
  }

  // Malformed ObjectId
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  }

  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with that ${field} already exists`;
  }

  // Multer file size / upload errors
  if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (maximum 20 MB)' : err.message;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[error] ${req.method} ${req.originalUrl} -> ${status}: ${message}`);
    if (status === 500) console.error(err.stack);
  }

  res.status(status).json({ message });
};

const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

module.exports = { errorHandler, notFound };
