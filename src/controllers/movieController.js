import { fetchFromTMDB } from '../utils/tmdb.js';

export const getTrendingMovie = async (req, res) => {
  try {
    const data = await fetchFromTMDB('/trending/movie/day');
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ message: 'No trending movies found' });
    }

    // Get a random movie from the results
    const randomIndex = Math.floor(Math.random() * data.results.length);
    const movie = data.results[randomIndex];

    return res.json({ content: movie });
  } catch (error) {
    console.error('Get trending movie error:', error);
    return res.status(500).json({ message: 'Failed to fetch trending movie' });
  }
};

export const getMovieTrailers = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/movie/${id}/videos`);
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ message: 'No trailers found for this movie' });
    }

    // Filter for YouTube trailers only
    const trailers = data.results.filter(
      video => video.site === 'YouTube' && video.type === 'Trailer'
    );

    return res.json({ trailers });
  } catch (error) {
    if (error.message.includes('404')) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    console.error('Get movie trailers error:', error);
    return res.status(500).json({ message: 'Failed to fetch movie trailers' });
  }
};

export const getMovieDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/movie/${id}`, {
      append_to_response: 'credits,reviews'
    });

    return res.json({ content: data });
  } catch (error) {
    if (error.message.includes('404')) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    console.error('Get movie details error:', error);
    return res.status(500).json({ message: 'Failed to fetch movie details' });
  }
};

export const getSimilarMovies = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/movie/${id}/similar`);
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ message: 'No similar movies found' });
    }

    return res.json({ similar: data.results });
  } catch (error) {
    if (error.message.includes('404')) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    console.error('Get similar movies error:', error);
    return res.status(500).json({ message: 'Failed to fetch similar movies' });
  }
};

export const getMoviesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['popular', 'upcoming', 'top_rated', 'now_playing'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category. Valid categories are: ' + validCategories.join(', ') 
      });
    }

    const data = await fetchFromTMDB(`/movie/${category}`);
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ message: 'No movies found for this category' });
    }

    return res.json({ content: data.results });
  } catch (error) {
    console.error('Get movies by category error:', error);
    return res.status(500).json({ message: 'Failed to fetch movies' });
  }
};