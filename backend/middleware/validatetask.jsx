// =========================================================================
// Route-Specific Task ID Validation Middleware (Simple JavaScript - JSX Version)
// =========================================================================

const mongoose = require('mongoose');

// This middleware checks if the ":id" parameter in the URL is a valid MongoDB ObjectId.
const validateTaskId = (req, res, next) => {
  const { id } = req.params;
  
  // If the ID is not a valid 24-character hex string for MongoDB, return HTTP 400
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid Task ID format' });
  }
  
  // If the ID format is valid, continue to the route controller
  next();
};

module.exports = validateTaskId;
