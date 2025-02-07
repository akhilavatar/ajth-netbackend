import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const authJwt = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies['jwt-netflix'];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required. Please log in.' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by id (excluding password)
      const user = await User.findById(decoded.id)
        .select('-password')
        .lean()
        .exec();

      if (!user) {
        return res.status(404).json({ 
          message: 'User not found. Please log in again.' 
        });
      }

      // Attach user to request object
      req.user = user;
      next();

    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid token. Please log in again.' 
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired. Please log in again.' 
        });
      }

      // Log unexpected errors
      console.error('JWT verification error:', error);
      throw error; // Re-throw for global error handler
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Internal server error during authentication.' 
    });
  }
};