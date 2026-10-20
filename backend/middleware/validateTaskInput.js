// =========================================================================
// Server-Side Input Validation Middleware (Practical 7)
// =========================================================================

const validateTaskInput = (req, res, next) => {
  const { title } = req.body;

  // Check if title is missing or empty whitespace string
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      error: '400 Bad Request',
      message: 'Server-side validation failed: Task title is required and cannot be empty.'
    });
  }

  next();
};

module.exports = validateTaskInput;
