const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', requireAuth, async (req, res) => {
  const depts = await prisma.department.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(depts);
});

router.post('/', requireAuth, requireRole('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const dept = await prisma.department.create({
      data: { name: req.body.name, color: req.body.color || '#3B82F6' },
    });
    res.status(201).json(dept);
  } catch (error) {
    res.status(400).json({ error: 'El departamento ya existe o hubo un error' });
  }
});

router.put('/:id', requireAuth, requireRole('ADMIN', 'OWNER'), async (req, res) => {
  try {
    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data: { name: req.body.name, color: req.body.color },
    });
    res.json(dept);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar departamento' });
  }
});

router.delete('/:id', requireAuth, requireRole('ADMIN', 'OWNER'), async (req, res) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ message: 'Departamento eliminado' });
  } catch (error) {
    res.status(400).json({ error: 'No se puede eliminar un departamento con proyectos asociados' });
  }
});

module.exports = router;
