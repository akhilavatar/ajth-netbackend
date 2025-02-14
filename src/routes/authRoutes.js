import express from 'express';
import { signup, login, logout, authCheck } from '../controllers/authController.js';
import { authJwt } from '../middleware/authJwt.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/authCheck', authJwt, authCheck);

export default router;