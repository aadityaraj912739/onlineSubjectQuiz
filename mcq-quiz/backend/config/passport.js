const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            // User exists, return user
            return done(null, user);
        }
        
        // Check if user with same email exists
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            // Update Google profile picture if user hasn't manually uploaded one
            if (!user.profileImagePublicId && profile.photos && profile.photos.length > 0) {
                user.profileImage = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
        }
        
        // Create new user - role will be set later
        const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profileImage: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
            // role will be undefined initially
        });
        
        await newUser.save();
        done(null, newUser);
    } catch (error) {
        done(error, null);
    }
}));

module.exports = passport;
