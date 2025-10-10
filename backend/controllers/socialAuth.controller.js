import User from '../models/user.model.js';
import { generateToken, generateRefreshToken } from '../utils/jwt.utils.js';

/**
 * Social Authentication Callback
 * Handles the OAuth callback from social providers
 */
export const socialAuthCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
    }

    // User data from Passport
    const { _id, email, name, profilePicture } = req.user;
    
    // Check if user exists
    let user = await User.findById(_id);
    
    // If user doesn't exist (shouldn't happen with our current flow)
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=user_not_found`);
    }
    
    // Update user's last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens with proper payload
    const tokenPayload = { id: user._id };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookies
    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Redirect to frontend with tokens in URL (for mobile)
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Social auth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
  }
};

/**
 * Handle successful social authentication
 */
export const handleSocialAuthSuccess = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication successful',
    user: req.user
  });
};

/**
 * Handle failed social authentication
 */
export const handleSocialAuthFailure = (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Authentication failed',
    error: 'Failed to authenticate with social provider'
  });
};

/**
 * Get social authentication providers
 */
export const getAuthProviders = (req, res) => {
  const providers = [
    { id: 'google', name: 'Google', enabled: true },
    { id: 'github', name: 'GitHub', enabled: true },
    { id: 'facebook', name: 'Facebook', enabled: true }
  ].filter(provider => provider.enabled);

  res.status(200).json({
    success: true,
    providers
  });
};
