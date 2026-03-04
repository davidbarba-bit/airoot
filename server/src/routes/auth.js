const express = require('express');
const passport = require('passport');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Google OAuth initiate
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${CLIENT_URL}/login?error=domain_restricted`,
  }),
  (req, res) => {
    const token = generateToken(req.user.id);
    res.redirect(`${CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// Get current user
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'numaris-jwt-secret');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }).then(user => {
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(user);
    });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Sesión cerrada exitosamente' });
  });
});

module.exports = router;
