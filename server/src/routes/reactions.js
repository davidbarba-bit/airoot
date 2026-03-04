const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { notifyHighEngagement } = require('../services/slack');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/reactions/toggle
router.post('/toggle', requireAuth, async (req, res) => {
  try {
    const { targetType, targetId, emoji } = req.body;
    if (!targetType || !targetId || !emoji) {
      return res.status(400).json({ error: 'targetType, targetId y emoji son requeridos' });
    }

    // Check if reaction exists
    const existing = await prisma.reaction.findUnique({
      where: {
        targetType_targetId_userId_emoji: {
          targetType,
          targetId,
          userId: req.user.id,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return res.json({ added: false, emoji });
    }

    const reaction = await prisma.reaction.create({
      data: {
        targetType,
        targetId,
        userId: req.user.id,
        emoji,
      },
    });

    // Check for high engagement milestone on projects
    if (targetType === 'PROJECT') {
      const count = await prisma.reaction.count({ where: { targetType: 'PROJECT', targetId } });
      if (count === 5) {
        const project = await prisma.project.findUnique({ where: { id: targetId } });
        if (project) notifyHighEngagement(project).catch(console.error);
      }
    }

    res.status(201).json({ added: true, emoji, reaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar reacción' });
  }
});

// GET /api/reactions/:targetType/:targetId
router.get('/:targetType/:targetId', requireAuth, async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const reactions = await prisma.reaction.findMany({
      where: { targetType, targetId },
      include: { user: { select: { id: true, name: true } } },
    });

    // Group by emoji
    const grouped = reactions.reduce((acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, users: [], userReacted: false };
      acc[r.emoji].count++;
      acc[r.emoji].users.push(r.user.name);
      if (r.userId === req.user.id) acc[r.emoji].userReacted = true;
      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reacciones' });
  }
});

module.exports = router;
