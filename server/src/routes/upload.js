const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const router = express.Router();
const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/webm',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword', 'application/vnd.ms-excel',
      'text/csv', 'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
});

const uploadToCloudinary = (buffer, filename, mimetype) => {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith('video/') ? 'video' :
      mimetype.startsWith('image/') ? 'image' : 'raw';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'numaris-ai-hub',
        resource_type: resourceType,
        public_id: `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// POST /api/upload/:projectId
router.post('/:projectId', requireAuth, upload.array('files', 10), async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    if (!req.files?.length) return res.status(400).json({ error: 'No se enviaron archivos' });

    const uploaded = [];

    for (const file of req.files) {
      let url = '';
      let type = 'FILE';

      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await uploadToCloudinary(file.buffer, file.originalname, file.mimetype);
        url = result.secure_url;
      } else {
        // Fallback: convert to base64 data URL for development
        url = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }

      if (file.mimetype.startsWith('image/')) type = 'IMAGE';
      else if (file.mimetype.startsWith('video/')) type = 'VIDEO';

      const media = await prisma.projectMedia.create({
        data: {
          projectId: req.params.projectId,
          type,
          url,
          filename: file.originalname,
          fileSize: file.size,
          uploadedBy: req.user.id,
        },
      });

      uploaded.push(media);
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        projectId: req.params.projectId,
        userId: req.user.id,
        action: 'FILE_UPLOADED',
        metadata: { files: uploaded.map(f => f.filename) },
      },
    });

    res.status(201).json(uploaded);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir archivos' });
  }
});

// DELETE /api/upload/:mediaId
router.delete('/:mediaId', requireAuth, async (req, res) => {
  try {
    const media = await prisma.projectMedia.findUnique({ where: { id: req.params.mediaId } });
    if (!media) return res.status(404).json({ error: 'Archivo no encontrado' });

    const project = await prisma.project.findUnique({ where: { id: media.projectId } });
    const canDelete = req.user.id === media.uploadedBy ||
      req.user.id === project?.ownerId ||
      req.user.role === 'ADMIN' || req.user.role === 'OWNER';

    if (!canDelete) return res.status(403).json({ error: 'No tienes permisos para eliminar este archivo' });

    await prisma.projectMedia.delete({ where: { id: req.params.mediaId } });
    res.json({ message: 'Archivo eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
});

module.exports = router;
