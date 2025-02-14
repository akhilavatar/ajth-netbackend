import jwt from 'jsonwebtoken';

/**
 * Creates a JWT token and sets it as an HTTP-only cookie
 * @param {string} userId - The user ID to encode in the token
 * @param {object} res - Express response object
 * @returns {string} The generated JWT token
 */
export const createTokenAndSetCookie = (userId, res) => {
  // Create the JWT token
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15d' }
  );

  // Set cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days in milliseconds
  };

  // Set the cookie
  res.cookie('token', token, cookieOptions);

  return token;
};