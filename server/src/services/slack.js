const { IncomingWebhook } = require('@slack/webhook');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getWebhookUrl = async () => {
  const setting = await prisma.appSettings.findUnique({
    where: { key: 'slack_webhook_url' },
  });
  return setting?.value || process.env.SLACK_WEBHOOK_URL;
};

const sendSlackNotification = async (message) => {
  try {
    const webhookUrl = await getWebhookUrl();
    if (!webhookUrl) return;

    const webhook = new IncomingWebhook(webhookUrl);
    await webhook.send(message);
  } catch (error) {
    console.error('Error sending Slack notification:', error.message);
  }
};

const notifyNewProject = async (project, owner) => {
  const statusLabels = {
    DEVELOPMENT: '🔵 En desarrollo',
    PRODUCTION: '🟢 En producción',
    PAUSED: '🟡 Pausado',
    DEPRECATED: '⚫ Deprecado',
  };

  await sendSlackNotification({
    text: `🚀 *Nuevo proyecto registrado en Numaris AI Hub*`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🚀 Nuevo proyecto en AI Hub' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Proyecto:*\n${project.title}` },
          { type: 'mrkdwn', text: `*Estado:*\n${statusLabels[project.status]}` },
          { type: 'mrkdwn', text: `*Responsable:*\n${owner.name}` },
          { type: 'mrkdwn', text: `*Departamento:*\n${project.department?.name || 'N/A'}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Descripción:*\n${project.shortDescription}` },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Ver proyecto →' },
            url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/proyecto/${project.id}`,
            style: 'primary',
          },
        ],
      },
    ],
  });
};

const notifyProjectStatusChange = async (project, owner, oldStatus, newStatus) => {
  const statusLabels = {
    DEVELOPMENT: '🔵 En desarrollo',
    PRODUCTION: '🟢 En producción',
    PAUSED: '🟡 Pausado',
    DEPRECATED: '⚫ Deprecado',
  };

  if (newStatus === 'PRODUCTION') {
    await sendSlackNotification({
      text: `🎉 *¡Proyecto en producción!* ${project.title}`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🎉 ¡Proyecto lanzado a producción!' },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Proyecto:*\n${project.title}` },
            { type: 'mrkdwn', text: `*Antes:*\n${statusLabels[oldStatus]}` },
            { type: 'mrkdwn', text: `*Ahora:*\n${statusLabels[newStatus]}` },
            { type: 'mrkdwn', text: `*Responsable:*\n${owner.name}` },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Ver proyecto →' },
              url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/proyecto/${project.id}`,
              style: 'primary',
            },
          ],
        },
      ],
    });
  }
};

const notifyNewComment = async (project, commenter, comment) => {
  await sendSlackNotification({
    text: `💬 *Nuevo comentario en "${project.title}"*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `💬 *${commenter.name}* comentó en *${project.title}*:\n>${comment.content.substring(0, 200)}${comment.content.length > 200 ? '...' : ''}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Ver comentario →' },
            url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/proyecto/${project.id}`,
          },
        ],
      },
    ],
  });
};

const notifyHighEngagement = async (project) => {
  await sendSlackNotification({
    text: `🔥 *¡"${project.title}" está siendo muy popular!*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🔥 El proyecto *${project.title}* ha recibido 5+ reacciones. ¡Está generando mucho interés en el equipo!`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Ver proyecto →' },
            url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/proyecto/${project.id}`,
            style: 'primary',
          },
        ],
      },
    ],
  });
};

module.exports = {
  sendSlackNotification,
  notifyNewProject,
  notifyProjectStatusChange,
  notifyNewComment,
  notifyHighEngagement,
};
