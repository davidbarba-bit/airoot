const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', requireAuth, async (req, res) => {
  const tools = await prisma.tool.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(tools);
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const tool = await prisma.tool.create({
      data: {
        name: req.body.name,
        category: req.body.category,
        iconUrl: req.body.iconUrl,
      },
    });
    res.status(201).json(tool);
  } catch (error) {
    res.status(400).json({ error: 'La herramienta ya existe o hubo un error' });
  }
});

router.put('/:id', requireAuth, requireRole('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const tool = await prisma.tool.update({
      where: { id: req.params.id },
      data: { name: req.body.name, category: req.body.category, iconUrl: req.body.iconUrl },
    });
    res.json(tool);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar herramienta' });
  }
});

router.delete('/:id', requireAuth, requireRole('ADMIN', 'OWNER'), async (req, res) => {
  try {
    await prisma.tool.delete({ where: { id: req.params.id } });
    res.json({ message: 'Herramienta eliminada' });
  } catch (error) {
    res.status(400).json({ error: 'No se puede eliminar una herramienta en uso' });
  }
});

module.exports = router;
