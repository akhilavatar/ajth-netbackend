import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getTrendingMovie,
  getMovieTrailers,
  getMovieDetails,
  getSimilarMovies,
  getMoviesByCategory
} from '../controllers/movieController.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get trending movies
router.get('/trending', getTrendingMovie);

// Get movie trailers by ID
router.get('/:id/trailers', getMovieTrailers);

// Get movie details by ID
router.get('/:id/details', getMovieDetails);

// Get similar movies by ID
router.get('/:id/similar', getSimilarMovies);

// Get movies by category (popular, upcoming, top_rated, now_playing)
router.get('/:category', getMoviesByCategory);

export default router;