const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All admin routes require ADMIN or OWNER role
router.use(requireAuth, requireRole('ADMIN', 'OWNER'));

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalProjects,
      projectsByStatus,
      projectsByDepartment,
      projectsByTool,
      topContributors,
      recentActivity,
      projectsPerMonth,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.groupBy({ by: ['status'], _count: true }),
      prisma.project.groupBy({
        by: ['departmentId'],
        _count: true,
        orderBy: { _count: { departmentId: 'desc' } },
        take: 10,
      }),
      prisma.projectTool.groupBy({
        by: ['toolId'],
        _count: true,
        orderBy: { _count: { toolId: 'desc' } },
        take: 10,
      }),
      prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true, name: true, avatarUrl: true,
          _count: { select: { ownedProjects: true } },
        },
        orderBy: { ownedProjects: { _count: 'desc' } },
        take: 5,
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          project: { select: { id: true, title: true } },
        },
      }),
      // Projects per month (last 6 months)
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "created_at") as month,
          COUNT(*) as count
        FROM projects
        WHERE "created_at" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "created_at")
        ORDER BY month ASC
      `,
    ]);

    // Enrich department and tool stats
    const departments = await prisma.department.findMany();
    const tools = await prisma.tool.findMany();
    const deptMap = Object.fromEntries(departments.map(d => [d.id, d]));
    const toolMap = Object.fromEntries(tools.map(t => [t.id, t]));

    const enrichedProjectsByDept = projectsByDepartment.map(p => ({
      department: deptMap[p.departmentId],
      count: p._count,
    }));

    const enrichedProjectsByTool = projectsByTool.map(p => ({
      tool: toolMap[p.toolId],
      count: p._count,
    }));

    const projectsWithImpact = await prisma.project.findMany({
      where: { impactQuantification: { not: null } },
      select: { id: true, title: true, impactType: true, impactQuantification: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      totalProjects,
      projectsByStatus,
      projectsByDepartment: enrichedProjectsByDept,
      projectsByTool: enrichedProjectsByTool,
      topContributors,
      recentActivity,
      projectsPerMonth,
      projectsWithImpact,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    include: { _count: { select: { ownedProjects: true, comments: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    // Only OWNER can change roles to ADMIN or OWNER
    if (['ADMIN', 'OWNER'].includes(req.body.role) && req.user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Solo el Owner puede asignar roles de Admin u Owner' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        role: req.body.role,
        isActive: req.body.isActive,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar usuario' });
  }
});

// GET/PUT /api/admin/settings
router.get('/settings', async (req, res) => {
  const settings = await prisma.appSettings.findMany();
  const result = Object.fromEntries(settings.map(s => [s.key, s.value]));
  res.json(result);
});

router.put('/settings', async (req, res) => {
  try {
    const updates = Object.entries(req.body);
    await Promise.all(updates.map(([key, value]) =>
      prisma.appSettings.upsert({
        where: { key },
        update: { value, updatedAt: new Date() },
        create: { key, value, updatedAt: new Date() },
      })
    ));
    res.json({ message: 'Configuración actualizada' });
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar configuración' });
  }
});

module.exports = router;
