// =========================================================================
// Global Error Handling Middleware (Simple JavaScript - JSX Version)
// =========================================================================

// In Express, error handling middleware MUST have exactly 4 arguments: (err, req, res, next).
// This is how Express knows it is an error handling middleware.
const errorHandler = (err, req, res, next) => {
  // 1. Log the error details in the server terminal for debugging
  console.error(err.stack);
  
  // 2. Send a simple 500 status code (Internal Server Error) to the client.
  // We send a generic message instead of the full error stack trace
  // to protect server security and keep the output user-friendly.
  res.status(500).json({ error: 'Something went wrong' });
};

module.exports = errorHandler;
