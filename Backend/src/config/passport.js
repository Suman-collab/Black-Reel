import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import AppError from '../utils/AppError.js';
import { config } from './index.js';

const hasGoogleOAuthConfig = () =>
  Boolean(config.google.clientId) &&
  Boolean(config.google.clientSecret) &&
  Boolean(config.google.callbackUrl);

if (hasGoogleOAuthConfig()) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
        scope: ['profile', 'email'],
        passReqToCallback: true,
      },
      async (_req, _accessToken, _refreshToken, profile, done) => {
        try {
          const primaryEmail = profile?.emails?.[0]?.value || '';
          const avatar = profile?.photos?.[0]?.value || '';

          if (!primaryEmail) {
            return done(new AppError('Google account did not provide an email address.', 400));
          }

          return done(null, {
            googleId: profile.id,
            email: String(primaryEmail).trim().toLowerCase(),
            name: profile.displayName || primaryEmail.split('@')[0] || 'User',
            avatarUrl: avatar || null,
            avatar: avatar || null,
          });
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

export { passport, hasGoogleOAuthConfig };
