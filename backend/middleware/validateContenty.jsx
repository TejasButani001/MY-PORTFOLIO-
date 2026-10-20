// =========================================================================
// Content-Type Validation Middleware (Simple JavaScript - JSX Version)
// =========================================================================

// This middleware checks if POST and PUT requests send valid JSON payloads.
const validateContent = (req, res, next) => {
  // We only validate requests that send data (POST and PUT)
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.headers['content-type'];
    
    // Check if the Content-Type header is missing, or if it does not contain 'application/json'
    if (!contentType || !contentType.includes('application/json')) {
      // Send a 400 Bad Request error immediately and stop the request from proceeding
      return res.status(400).json({ error: 'Content-Type must be application/json' });
    }
  }
  
  // If the validation passes or it's a GET/DELETE request, continue to the route
  next();
};

module.exports = validateContent;
