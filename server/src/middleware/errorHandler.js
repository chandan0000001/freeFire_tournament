export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.name}: ${err.message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'record';
    return res.status(409).json({
      success: false,
      message: `Duplicate ${field}. This action was already submitted.`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
  }

  // Multer file upload error
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid record identifier.' });
  const statusCode = err.status || (res.statusCode !== 200 ? res.statusCode : 500);
  return res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Unable to complete the request. Please try again.' : err.message || 'Internal Server Error',
  });
};
