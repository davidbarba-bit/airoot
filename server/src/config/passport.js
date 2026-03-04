const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;

    // Restrict to @numaris.com domain
    if (!email.endsWith('@numaris.com')) {
      return done(null, false, { message: 'Solo se permiten cuentas @numaris.com' });
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: profile.displayName,
        avatarUrl: profile.photos?.[0]?.value,
        lastLoginAt: new Date(),
      },
      create: {
        email,
        name: profile.displayName,
        avatarUrl: profile.photos?.[0]?.value,
        role: 'CONTRIBUTOR',
        lastLoginAt: new Date(),
      },
    });

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
