const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Extract Authorization header from incoming client request
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '401 Unauthorized', message: 'Access denied. No JWT token provided in Authorization header.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify token signature and expiry using JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_jwt_key_practical7_2026');
    
    // 3. Attach decoded user payload to request object
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '401 Unauthorized', message: 'Token has expired. Please log in again.' });
    }
    return res.status(401).json({ error: '401 Unauthorized', message: 'Invalid or tampered JWT token.' });
  }
};

module.exports = authMiddleware;
