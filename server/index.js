import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from '../src/utils/db.js';
import authRoutes from '../src/routes/authRoutes.js';
import movieRoutes from '../src/routes/movieRoutes.js';
import tvRoutes from '../src/routes/tvRoutes.js';
import searchRoutes from '../src/routes/searchRoutes.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Netflix Clone API is running!' });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/movie', movieRoutes);
app.use('/api/v1/tv', tvRoutes);
app.use('/api/v1/search', searchRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});