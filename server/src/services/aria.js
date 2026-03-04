const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Use OpenAI or Anthropic based on available API keys
const getAIClient = () => {
  if (process.env.OPENAI_API_KEY) {
    return { type: 'openai', client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return { type: 'anthropic', client: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) };
  }
  return null;
};

const generateEmbedding = async (text) => {
  const ai = getAIClient();
  if (!ai) return null;

  if (ai.type === 'openai') {
    const response = await ai.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }
  // For Anthropic, use a simple TF-IDF-like approach as fallback
  return null;
};

const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const updateProjectEmbedding = async (projectId) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        department: true,
        tools: { include: { tool: true } },
        tags: true,
      },
    });

    if (!project) return;

    const textToEmbed = [
      project.title,
      project.shortDescription,
      project.description,
      project.department?.name,
      project.tools.map(pt => pt.tool.name).join(' '),
      project.tags.map(t => t.tag).join(' '),
      project.impactDescription,
    ].filter(Boolean).join(' ');

    const embedding = await generateEmbedding(textToEmbed);
    if (!embedding) return;

    await prisma.projectEmbedding.upsert({
      where: { projectId },
      update: { embedding, updatedAt: new Date() },
      create: { projectId, embedding },
    });
  } catch (error) {
    console.error('Error updating embedding:', error.message);
  }
};

const findRelevantProjects = async (query, limit = 5) => {
  // First try semantic search if embeddings exist
  const queryEmbedding = await generateEmbedding(query);

  if (queryEmbedding) {
    const embeddings = await prisma.projectEmbedding.findMany({
      include: {
        project: {
          include: {
            department: true,
            tools: { include: { tool: true } },
            tags: true,
            owner: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    const scored = embeddings.map(e => ({
      project: e.project,
      score: cosineSimilarity(queryEmbedding, e.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).filter(s => s.score > 0.3).map(s => s.project);
  }

  // Fallback: full-text search
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const projects = await prisma.project.findMany({
    where: {
      OR: words.flatMap(word => [
        { title: { contains: word, mode: 'insensitive' } },
        { shortDescription: { contains: word, mode: 'insensitive' } },
        { description: { contains: word, mode: 'insensitive' } },
        { tags: { some: { tag: { contains: word, mode: 'insensitive' } } } },
        { department: { name: { contains: word, mode: 'insensitive' } } },
      ]),
    },
    include: {
      department: true,
      tools: { include: { tool: true } },
      tags: true,
      owner: { select: { id: true, name: true, avatarUrl: true } },
    },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  });

  return projects;
};

const chat = async (userId, message, conversationHistory = []) => {
  const ai = getAIClient();

  // Find relevant projects
  const relevantProjects = await findRelevantProjects(message);

  const projectsContext = relevantProjects.length > 0
    ? `Proyectos relevantes encontrados en la base de datos:\n\n${relevantProjects.map((p, i) => `
${i + 1}. **${p.title}** (${p.department?.name || 'Sin departamento'})
   - Descripción: ${p.shortDescription}
   - Estado: ${p.status}
   - Herramientas: ${p.tools.map(pt => pt.tool.name).join(', ')}
   - Responsable: ${p.owner.name}
   - ID para enlace: ${p.id}
   ${p.impactDescription ? `- Impacto: ${p.impactDescription}` : ''}
`).join('\n')}`
    : 'No se encontraron proyectos exactamente relacionados con la consulta en la base de datos actual.';

  const systemPrompt = `Eres ARIA (AI Repository Intelligent Assistant), el asistente inteligente del portal Numaris AI Hub de la empresa Numaris (Fleet Management & Tracking).

Tu misión es ayudar a los empleados de Numaris a descubrir proyectos de inteligencia artificial e iniciativas de automatización que ya existen en la empresa, para evitar la duplicación de esfuerzos y fomentar la colaboración.

Responde siempre en español (México), con un tono profesional pero accesible. Los usuarios pueden tener poco conocimiento técnico sobre AI.

Cuando menciones proyectos, incluye un enlace en formato: [Nombre del proyecto](/proyecto/ID)

${projectsContext}

Instrucciones:
- Si encontraste proyectos relevantes, preséntelos de forma clara y amigable
- Si no hay proyectos exactamente relacionados, sugiere que el usuario registre su iniciativa
- Puedes ayudar con preguntas sobre las herramientas de AI disponibles en la empresa
- Si el usuario quiere registrar un nuevo proyecto, dirígelo a /nuevo
- Sé conciso pero informativo`;

  const messages = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  try {
    if (!ai) {
      // Mock response when no AI key is configured
      const projectsList = relevantProjects.length > 0
        ? `Encontré ${relevantProjects.length} proyecto(s) que podrían ser relevantes:\n\n${relevantProjects.map(p => `• [${p.title}](/proyecto/${p.id}) - ${p.shortDescription}`).join('\n')}`
        : 'No encontré proyectos directamente relacionados con tu consulta. Te invito a registrar tu iniciativa en el portal.';

      return {
        response: `Hola, soy ARIA 👋. ${projectsList}\n\n¿Puedo ayudarte con algo más?`,
        projects: relevantProjects,
      };
    }

    let response;

    if (ai.type === 'openai') {
      const completion = await ai.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });
      response = completion.choices[0].message.content;
    } else if (ai.type === 'anthropic') {
      const completion = await ai.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      });
      response = completion.content[0].text;
    }

    return { response, projects: relevantProjects };
  } catch (error) {
    console.error('ARIA error:', error.message);
    const projectsList = relevantProjects.length > 0
      ? `\n\nEncontré estos proyectos que podrían ser relevantes:\n${relevantProjects.map(p => `• [${p.title}](/proyecto/${p.id}) - ${p.shortDescription}`).join('\n')}`
      : '';
    return {
      response: `Lo siento, tuve un problema técnico. ${projectsList}\n\nPuedes buscar proyectos directamente en el feed.`,
      projects: relevantProjects,
    };
  }
};

module.exports = { chat, updateProjectEmbedding, findRelevantProjects };
