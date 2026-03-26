import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export default function configurePassport() {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Google OAuth Strategy — only configure if credentials are set
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth not configured (GOOGLE_CLIENT_ID/SECRET missing). Google login will be disabled.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract email and name from profile
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || 'User';
          const googleId = profile.id;

          if (!email) {
            return done(new Error('No email found in Google profile'), null);
          }

          // Check if user already exists
          let user = await User.findOne({ email: email.toLowerCase() });

          if (user) {
            // Update googleId if not set
            if (!user.googleId) {
              user.googleId = googleId;
              await user.save();
            }
            return done(null, user);
          }

          // Create new user with OAuth
          user = await User.create({
            name: name.trim(),
            email: email.toLowerCase(),
            googleId: googleId,
            passwordHash: 'oauth_user', // Placeholder for OAuth users
            isAdmin: false,
            gstNo: '',
            companyName: '',
            address: '',
            contactDetails: ''
          });

          return done(null, user);
        } catch (err) {
          console.error('Google OAuth error:', err);
          return done(err, null);
        }
      }
    )
  );
}
