const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { notifyNewComment } = require('../services/slack');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/comments
router.post('/', requireAuth, async (req, res) => {
  try {
    const { projectId, content, parentId } = req.body;
    if (!projectId || !content?.trim()) {
      return res.status(400).json({ error: 'projectId y content son requeridos' });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const comment = await prisma.comment.create({
      data: {
        projectId,
        authorId: req.user.id,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        reactions: true,
        replies: {
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        projectId,
        userId: req.user.id,
        action: 'COMMENT_ADDED',
        metadata: { commentId: comment.id, preview: content.substring(0, 100) },
      },
    });

    // Notify Slack (only for top-level comments, not replies)
    if (!parentId) {
      notifyNewComment(project, req.user, comment).catch(console.error);
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear comentario' });
  }
});

// PUT /api/comments/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comentario no encontrado' });

    const canEdit = req.user.id === comment.authorId ||
      req.user.role === 'ADMIN' || req.user.role === 'OWNER';
    if (!canEdit) return res.status(403).json({ error: 'No puedes editar este comentario' });

    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: { content: req.body.content.trim() },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        reactions: true,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar comentario' });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comentario no encontrado' });

    const canDelete = req.user.id === comment.authorId ||
      req.user.role === 'ADMIN' || req.user.role === 'OWNER';
    if (!canDelete) return res.status(403).json({ error: 'No puedes eliminar este comentario' });

    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Comentario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
});

module.exports = router;
