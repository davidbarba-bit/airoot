const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users/search?q=name
router.get('/search', requireAuth, async (req, res) => {
  const { q } = req.query;
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q || '', mode: 'insensitive' } },
        { email: { contains: q || '', mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, email: true, avatarUrl: true, role: true },
    take: 10,
    orderBy: { name: 'asc' },
  });
  res.json(users);
});

// GET /api/users/:id/projects
router.get('/:id/projects', requireAuth, async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { ownerId: req.params.id },
    include: {
      department: true,
      tools: { include: { tool: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(projects);
});

module.exports = router;
