const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notifyNewProject, notifyProjectStatusChange } = require('../services/slack');
const { updateProjectEmbedding } = require('../services/aria');

const router = express.Router();
const prisma = new PrismaClient();

const projectInclude = {
  department: true,
  owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
  tools: { include: { tool: true } },
  contributors: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
  tags: true,
  media: true,
  _count: { select: { comments: true, reactions: true } },
};

// GET /api/projects - List all projects with filters
router.get('/', requireAuth, async (req, res) => {
  try {
    const {
      search, department, tool, status, impactType,
      featured, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { some: { tag: { contains: search, mode: 'insensitive' } } } },
        { tools: { some: { tool: { name: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    if (department) where.departmentId = department;
    if (status) where.status = status;
    if (impactType) where.impactType = impactType;
    if (featured === 'true') where.isFeatured = true;
    if (tool) where.tools = { some: { toolId: tool } };

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: projectInclude,
        orderBy: [
          { isFeatured: 'desc' },
          { [sortBy]: sortOrder },
        ],
        skip,
        take: Number(limit),
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      projects,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
});

// GET /api/projects/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        ...projectInclude,
        comments: {
          where: { parentId: null },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            reactions: true,
            replies: {
              include: {
                author: { select: { id: true, name: true, avatarUrl: true } },
                reactions: true,
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        reactions: {
          where: { targetType: 'PROJECT' },
          include: { user: { select: { id: true, name: true } } },
        },
        activityLog: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
});

// POST /api/projects
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title, shortDescription, description, departmentId,
      status, slackChannel, repoUrl, deploymentPlatform,
      impactType, impactDescription, impactQuantification,
      tools = [], contributors = [], tags = [],
    } = req.body;

    if (!title || !shortDescription || !description || !departmentId) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const project = await prisma.project.create({
      data: {
        title,
        shortDescription,
        description,
        departmentId,
        status: status || 'DEVELOPMENT',
        ownerId: req.user.id,
        slackChannel,
        repoUrl,
        deploymentPlatform,
        impactType,
        impactDescription,
        impactQuantification,
        tools: {
          create: tools.map(toolId => ({ toolId })),
        },
        contributors: {
          create: contributors.map(userId => ({ userId })),
        },
        tags: {
          create: tags.map(tag => ({ tag: tag.toLowerCase().trim() })),
        },
      },
      include: projectInclude,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        userId: req.user.id,
        action: 'PROJECT_CREATED',
        metadata: { title: project.title },
      },
    });

    // Update embedding async
    updateProjectEmbedding(project.id).catch(console.error);

    // Notify Slack
    const projectWithDept = await prisma.project.findUnique({
      where: { id: project.id },
      include: { department: true },
    });
    notifyNewProject({ ...project, department: projectWithDept.department }, req.user).catch(console.error);

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
});

// PUT /api/projects/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    // Only owner, admins, or owners can edit
    const canEdit = req.user.id === project.ownerId ||
      req.user.role === 'ADMIN' || req.user.role === 'OWNER';
    if (!canEdit) return res.status(403).json({ error: 'No tienes permisos para editar este proyecto' });

    const oldStatus = project.status;

    const {
      title, shortDescription, description, departmentId,
      status, slackChannel, repoUrl, deploymentPlatform,
      impactType, impactDescription, impactQuantification,
      isFeatured, tools, contributors, tags,
    } = req.body;

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (description !== undefined) updateData.description = description;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (status !== undefined) updateData.status = status;
    if (slackChannel !== undefined) updateData.slackChannel = slackChannel;
    if (repoUrl !== undefined) updateData.repoUrl = repoUrl;
    if (deploymentPlatform !== undefined) updateData.deploymentPlatform = deploymentPlatform;
    if (impactType !== undefined) updateData.impactType = impactType;
    if (impactDescription !== undefined) updateData.impactDescription = impactDescription;
    if (impactQuantification !== undefined) updateData.impactQuantification = impactQuantification;

    // Only admins and owners can feature projects
    if (isFeatured !== undefined && (req.user.role === 'ADMIN' || req.user.role === 'OWNER')) {
      updateData.isFeatured = isFeatured;
    }

    const updatedProject = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...updateData,
        ...(tools !== undefined && {
          tools: {
            deleteMany: {},
            create: tools.map(toolId => ({ toolId })),
          },
        }),
        ...(contributors !== undefined && {
          contributors: {
            deleteMany: {},
            create: contributors.map(userId => ({ userId })),
          },
        }),
        ...(tags !== undefined && {
          tags: {
            deleteMany: {},
            create: tags.map(tag => ({ tag: tag.toLowerCase().trim() })),
          },
        }),
      },
      include: projectInclude,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        projectId: updatedProject.id,
        userId: req.user.id,
        action: status && status !== oldStatus ? 'PROJECT_STATUS_CHANGED' : 'PROJECT_UPDATED',
        metadata: { oldStatus, newStatus: status || oldStatus },
      },
    });

    // Notify Slack on status change
    if (status && status !== oldStatus) {
      const projectWithDept = await prisma.project.findUnique({
        where: { id: updatedProject.id },
        include: { department: true },
      });
      notifyProjectStatusChange(
        { ...updatedProject, department: projectWithDept.department },
        req.user,
        oldStatus,
        status
      ).catch(console.error);
    }

    // Update embedding async
    updateProjectEmbedding(updatedProject.id).catch(console.error);

    res.json(updatedProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const canDelete = req.user.id === project.ownerId ||
      req.user.role === 'ADMIN' || req.user.role === 'OWNER';
    if (!canDelete) return res.status(403).json({ error: 'No tienes permisos para eliminar este proyecto' });

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Proyecto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
});

// GET /api/projects/:id/activity
router.get('/:id/activity', requireAuth, async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { projectId: req.params.id },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener actividad' });
  }
});

module.exports = router;
