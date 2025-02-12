import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation.js';

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '24h';
const COOKIE_OPTIONS = {
  httpOnly: true,
  // secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

// Random avatar selection
const getRandomAvatar = () => {
  const avatars = ['/netflix/avatar1.png', '/netflix/avatar2.png', '/netflix/avatar3.png'];
  return avatars[Math.floor(Math.random() * avatars.length)];
};

export const signup = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Input validation
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({ 
        message: 'Username must be 3-20 characters and can only contain letters, numbers, underscores, and hyphens' 
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters and contain uppercase, lowercase, and numbers' 
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      image: getRandomAvatar()
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Set cookie and send response
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        image: user.image
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Set cookie and send response
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        image: user.image
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const authCheck = async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        image: user.image
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth check error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};