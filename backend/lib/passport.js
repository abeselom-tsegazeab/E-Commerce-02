import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';

// Configure Google OAuth Strategy with scopes
const googleCallbackURL = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/auth/google/callback`;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: googleCallbackURL,
    passReqToCallback: true,
    scope: ['profile', 'email'],
    proxy: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Get user information from Google profile
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email provided by Google'), null);
      }
      
      const name = profile.displayName || email.split('@')[0];
      const profilePicture = profile.photos?.[0]?.value || '';
      
      // Find user by Google ID first
      let user = await User.findOne({ 'authProvider.id': profile.id, 'authProvider.provider': 'google' });
      
      // If not found by Google ID, try to find by email
      if (!user) {
        user = await User.findOne({ email });
        
        // If user exists with this email but no Google auth, update their record
        if (user) {
          user.authProvider = {
            provider: 'google',
            id: profile.id
          };
          user.isEmailVerified = true;
          user.profilePicture = user.profilePicture || profilePicture;
          await user.save();
          console.log('Updated existing user with Google OAuth:', user.email);
        } else {
          // Create new user with Google OAuth info
          user = new User({
            name,
            email,
            profilePicture,
            isEmailVerified: true,
            authProvider: {
              provider: 'google',
              id: profile.id
            }
          });
          
          await user.save();
          console.log('New user created with Google OAuth:', user.email);
        }
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Error in Google OAuth strategy:', error);
      return done(error, null);
    }
  }
));

// Serialize user into the session
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      console.error('User not found during deserialization:', id);
      return done(new Error('User not found'), null);
    }
    console.log('Deserialized user:', user.id);
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

export default passport;
