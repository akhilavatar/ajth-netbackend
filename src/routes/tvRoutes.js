import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getTrendingTv,
  getTvTrailers,
  getTvDetails,
  getSimilarTvs,
  getTvsByCategory
} from '../controllers/tvController.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get trending TV shows
router.get('/trending', getTrendingTv);

// Get TV show trailers by ID
router.get('/:id/trailers', getTvTrailers);

// Get TV show details by ID
router.get('/:id/details', getTvDetails);

// Get similar TV shows by ID
router.get('/:id/similar', getSimilarTvs);

// Get TV shows by category (airing_today, on_the_air, popular, top_rated)
router.get('/:category', getTvsByCategory);

export default router;