// =========================================================================
// Global Logger Middleware (Simple JavaScript - JSX Version)
// =========================================================================

// This middleware runs on every incoming request.
// It prints details about the request to our server console.
const logger = (req, res, next) => {
  // Print: Method (GET/POST), URL (/tasks), and current timestamp
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  
  // Calling next() is crucial. It tells Express to move to the next middleware or route.
  // Without next(), the request would freeze and load forever in the browser.
  next();
};

module.exports = logger;
