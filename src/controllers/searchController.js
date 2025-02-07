import { fetchFromTMDB } from '../utils/tmdb.js';
import { SearchHistory } from '../models/SearchHistory.js';

const saveSearchHistory = async (userId, result, searchType) => {
  try {
    const searchData = {
      userId,
      tmdbId: result.id,
      title: result.title || result.name,
      image: result[searchType === 'person' ? 'profile_path' : 'poster_path'],
      searchType
    };

    // Using findOneAndUpdate with upsert to prevent duplicates
    await SearchHistory.findOneAndUpdate(
      { 
        userId: searchData.userId, 
        tmdbId: searchData.tmdbId,
        searchType: searchData.searchType
      },
      searchData,
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Save search history error:', error);
  }
};

export const searchMovies = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const data = await fetchFromTMDB('/search/movie', { query });
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ message: 'No movies found' });
    }

    // Save first result to search history
    if (data.results[0].poster_path) {
      await saveSearchHistory(req.user.id, data.results[0], 'movie');
    }

    return res.json({ content: data.results });
  } catch (error) {
    console.error('Search movies error:', error);
    return res.status(500).json({ message: 'Failed to search movies' });
  }
};

export const searchTVShows = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const data = await fetchFromTMDB('/search/tv', { query });
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ message: 'No TV shows found' });
    }

    // Save first result to search history
    if (data.results[0].poster_path) {
      await saveSearchHistory(req.user.id, data.results[0], 'tv');
    }

    return res.json({ content: data.results });
  } catch (error) {
    console.error('Search TV shows error:', error);
    return res.status(500).json({ message: 'Failed to search TV shows' });
  }
};

export const searchPeople = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const data = await fetchFromTMDB('/search/person', { query });
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ message: 'No people found' });
    }

    // Save first result to search history
    if (data.results[0].profile_path) {
      await saveSearchHistory(req.user.id, data.results[0], 'person');
    }

    return res.json({ content: data.results });
  } catch (error) {
    console.error('Search people error:', error);
    return res.status(500).json({ message: 'Failed to search people' });
  }
};

export const getSearchHistory = async (req, res) => {
  try {
    const history = await SearchHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 searches

    return res.json({ content: history });
  } catch (error) {
    console.error('Get search history error:', error);
    return res.status(500).json({ message: 'Failed to fetch search history' });
  }
};

export const deleteSearchHistoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const historyItem = await SearchHistory.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!historyItem) {
      return res.status(404).json({ message: 'Search history item not found' });
    }

    await historyItem.deleteOne();
    return res.json({ message: 'Search history item deleted successfully' });
  } catch (error) {
    console.error('Delete search history item error:', error);
    return res.status(500).json({ message: 'Failed to delete search history item' });
  }
};