import { fetchFromTMDB } from '../utils/tmdb.js';

export const getTrendingTv = async (req, res) => {
  try {
    const data = await fetchFromTMDB('/trending/tv/day', { language: 'en-US' });
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ message: 'No trending TV shows found' });
    }

    // Get a random TV show from the results
    const randomIndex = Math.floor(Math.random() * data.results.length);
    const tvShow = data.results[randomIndex];

    return res.json({ content: tvShow });
  } catch (error) {
    console.error('Get trending TV show error:', error);
    return res.status(500).json({ message: 'Failed to fetch trending TV show' });
  }
};

export const getTvTrailers = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/tv/${id}/videos`, { language: 'en-US' });
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ message: 'No trailers found for this TV show' });
    }

    // Filter for YouTube trailers only
    const trailers = data.results.filter(
      video => video.site === 'YouTube' && video.type === 'Trailer'
    );

    return res.json({ trailers });
  } catch (error) {
    if (error.message.includes('404')) {
      return res.status(404).json({ message: 'TV show not found' });
    }
    console.error('Get TV show trailers error:', error);
    return res.status(500).json({ message: 'Failed to fetch TV show trailers' });
  }
};

export const getTvDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/tv/${id}`, {
      language: 'en-US',
      append_to_response: 'credits,reviews'
    });

    return res.json({ content: data });
  } catch (error) {
    if (error.message.includes('404')) {
      return res.status(404).json({ message: 'TV show not found' });
    }
    console.error('Get TV show details error:', error);
    return res.status(500).json({ message: 'Failed to fetch TV show details' });
  }
};

export const getSimilarTvs = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/tv/${id}/similar`, { language: 'en-US' });
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ message: 'No similar TV shows found' });
    }

    return res.json({ similar: data.results });
  } catch (error) {
    if (error.message.includes('404')) {
      return res.status(404).json({ message: 'TV show not found' });
    }
    console.error('Get similar TV shows error:', error);
    return res.status(500).json({ message: 'Failed to fetch similar TV shows' });
  }
};

export const getTvsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['airing_today', 'on_the_air', 'popular', 'top_rated'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category. Valid categories are: ' + validCategories.join(', ') 
      });
    }

    const data = await fetchFromTMDB(`/tv/${category}`, { language: 'en-US' });
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ message: 'No TV shows found for this category' });
    }

    return res.json({ content: data.results });
  } catch (error) {
    console.error('Get TV shows by category error:', error);
    return res.status(500).json({ message: 'Failed to fetch TV shows' });
  }
};