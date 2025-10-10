import express from 'express';
import passport from 'passport';
import {
  socialAuthCallback,
  handleSocialAuthSuccess,
  handleSocialAuthFailure
} from '../controllers/socialAuth.controller.js';

const router = express.Router();

// Google OAuth routes with required scopes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  accessType: 'offline',
  prompt: 'select_account',
  session: false
}));

router.get('/google/callback', 
  passport.authenticate('google', {
    failureRedirect: '/auth/failure',
    session: false
  }),
  socialAuthCallback
);

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', {
  scope: ['user:email'],
  session: false
}));

router.get('/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/auth/failure',
    session: false
  }),
  socialAuthCallback
);

// Facebook OAuth routes
router.get('/facebook', passport.authenticate('facebook', {
  scope: ['email', 'public_profile'],
  session: false
}));

router.get('/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/auth/failure',
    session: false
  }),
  socialAuthCallback
);

// Success and failure routes
router.get('/success', handleSocialAuthSuccess);
router.get('/failure', handleSocialAuthFailure);

export default router;
