const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

export const fetchFromTMDB = async (endpoint, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      ...params
    });

    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('TMDB fetch error:', error);
    throw error;
  }
};