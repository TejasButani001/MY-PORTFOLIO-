// =========================================================================
// Authentication Router Definitions (Practical 7)
// =========================================================================

const express = require('express');
const router = express.Router();
const authController = require('../controlers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public Auth Endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected Auth Endpoint (Supplementary problem: /me)
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
