const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const requireAuth = async (req, res, next) => {
  try {
    // Check session first (from OAuth)
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }

    // Check JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'numaris-jwt-secret');
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Usuario no encontrado o desactivado' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'No tienes permisos para esta acción' });
  }
  next();
};

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'numaris-jwt-secret',
    { expiresIn: '7d' }
  );
};

module.exports = { requireAuth, requireRole, generateToken };
