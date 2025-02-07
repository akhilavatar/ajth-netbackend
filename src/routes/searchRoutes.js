import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  searchMovies,
  searchTVShows,
  searchPeople,
  getSearchHistory,
  deleteSearchHistoryItem
} from '../controllers/searchController.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Search endpoints
router.get('/movie/:query', searchMovies);
router.get('/tv/:query', searchTVShows);
router.get('/person/:query', searchPeople);

// Search history management endpoints
router.get('/history', getSearchHistory);
router.delete('/history/:id', deleteSearchHistoryItem);

export default router;