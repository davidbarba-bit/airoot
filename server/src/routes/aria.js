const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { chat } = require('../services/aria');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/aria/chat
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    // Get or create conversation
    let conversation;
    let history = [];

    if (conversationId) {
      conversation = await prisma.ariaConversation.findFirst({
        where: { id: conversationId, userId: req.user.id },
      });
      if (conversation) {
        history = conversation.messages;
      }
    }

    const { response, projects } = await chat(req.user.id, message, history);

    // Save conversation
    const updatedMessages = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: response },
    ];

    if (conversation) {
      await prisma.ariaConversation.update({
        where: { id: conversation.id },
        data: { messages: updatedMessages },
      });
    } else {
      conversation = await prisma.ariaConversation.create({
        data: {
          userId: req.user.id,
          messages: updatedMessages,
        },
      });
    }

    res.json({
      response,
      projects: projects.map(p => ({
        id: p.id,
        title: p.title,
        shortDescription: p.shortDescription,
        status: p.status,
        department: p.department,
        tools: p.tools?.map(pt => pt.tool),
        owner: p.owner,
      })),
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar tu consulta' });
  }
});

// GET /api/aria/conversations
router.get('/conversations', requireAuth, async (req, res) => {
  const conversations = await prisma.ariaConversation.findMany({
    where: { userId: req.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });
  res.json(conversations);
});

// DELETE /api/aria/conversations/:id
router.delete('/conversations/:id', requireAuth, async (req, res) => {
  try {
    await prisma.ariaConversation.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    res.json({ message: 'Conversación eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar conversación' });
  }
});

module.exports = router;
