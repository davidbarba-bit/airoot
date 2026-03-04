const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const departments = [
  { name: 'TI', color: '#3B82F6' },
  { name: 'Operaciones', color: '#10B981' },
  { name: 'Cobranza / Finanzas', color: '#F59E0B' },
  { name: 'Monitoreo', color: '#8B5CF6' },
  { name: 'Postventa / Clientes', color: '#EC4899' },
  { name: 'RRHH', color: '#06B6D4' },
  { name: 'Marketing', color: '#EF4444' },
  { name: 'Administración', color: '#84CC16' },
  { name: 'Contabilidad', color: '#F97316' },
  { name: 'Logística', color: '#6366F1' },
];

const tools = [
  { name: 'Claude', category: 'LLM', iconUrl: 'https://anthropic.com/favicon.ico' },
  { name: 'Claude Code', category: 'Development', iconUrl: 'https://anthropic.com/favicon.ico' },
  { name: 'GPT-4', category: 'LLM', iconUrl: 'https://openai.com/favicon.ico' },
  { name: 'GPT-4o', category: 'LLM', iconUrl: 'https://openai.com/favicon.ico' },
  { name: 'Gemini', category: 'LLM', iconUrl: 'https://google.com/favicon.ico' },
  { name: 'Replit', category: 'Platform', iconUrl: 'https://replit.com/favicon.ico' },
  { name: 'Vercel', category: 'Platform', iconUrl: 'https://vercel.com/favicon.ico' },
  { name: 'Railway', category: 'Platform', iconUrl: 'https://railway.app/favicon.ico' },
  { name: 'AWS', category: 'Platform', iconUrl: 'https://aws.amazon.com/favicon.ico' },
  { name: 'Supabase', category: 'Database', iconUrl: 'https://supabase.com/favicon.ico' },
  { name: 'OpenAI API', category: 'LLM', iconUrl: 'https://openai.com/favicon.ico' },
  { name: 'Anthropic API', category: 'LLM', iconUrl: 'https://anthropic.com/favicon.ico' },
  { name: 'Whisper', category: 'AI', iconUrl: '' },
  { name: 'ElevenLabs', category: 'AI', iconUrl: '' },
  { name: 'Twilio', category: 'Communication', iconUrl: '' },
  { name: 'Make (Integromat)', category: 'Automation', iconUrl: '' },
  { name: 'n8n', category: 'Automation', iconUrl: '' },
  { name: 'Zapier', category: 'Automation', iconUrl: '' },
  { name: 'PostgreSQL', category: 'Database', iconUrl: '' },
  { name: 'MongoDB', category: 'Database', iconUrl: '' },
];

const initialProjects = [
  {
    title: 'Numai',
    shortDescription: 'Plataforma para conversar con LLMs, transcribir y generar resúmenes de minutas con grabación de video',
    description: `## Numai - Plataforma Interna de IA Conversacional

Numai es la plataforma central de Numaris para interactuar con modelos de lenguaje de última generación. Permite a los empleados:

- **Conversar con LLMs**: Chat directo con Claude, GPT-4 y otros modelos
- **Transcripción automática**: Convierte grabaciones de reuniones a texto con alta precisión
- **Generación de minutas**: Crea resúmenes estructurados de reuniones automáticamente
- **Grabación de video**: Integra captura de video para sesiones de trabajo

### Beneficios
- Reducción del 70% en tiempo dedicado a elaborar minutas
- Disponible para todos los empleados de Numaris
- Acceso unificado a múltiples modelos de IA`,
    department: 'TI',
    status: 'PRODUCTION',
    tools: ['Claude', 'GPT-4', 'Replit'],
    impactType: 'INTERNAL_EFFICIENCY',
    impactDescription: 'Automatización de transcripción y generación de minutas de reuniones',
    impactQuantification: 'Ahorro del 70% en tiempo de elaboración de minutas',
    tags: ['transcripción', 'minutas', 'LLM', 'reuniones', 'video'],
  },
  {
    title: 'Sequence',
    shortDescription: 'Genera secuencias automáticas de acciones dado un evento de telemetría (botón de pánico, alertas)',
    description: `## Sequence - Automatización de Respuesta a Eventos de Telemetría

Sequence es un sistema que monitorea eventos de telemetría de las unidades en flota y genera automáticamente secuencias de acciones de respuesta.

### Funcionalidades
- **Detección de eventos**: Monitoreo en tiempo real de señales de telemetría
- **Respuesta automática**: Al detectar botón de pánico, genera secuencia de llamadas y notificaciones
- **Gestión de alertas**: Clasificación y priorización automática de alertas
- **Escalamiento inteligente**: Si no hay respuesta, escala automáticamente al supervisor

### Eventos que maneja
- Botón de pánico activado
- Exceso de velocidad crítico
- Desvío de ruta no autorizado
- Pérdida de señal GPS prolongada

### Impacto
Redujo el tiempo de respuesta promedio ante emergencias de 8 minutos a 90 segundos.`,
    department: 'Operaciones',
    status: 'PRODUCTION',
    tools: ['Replit'],
    impactType: 'CUSTOMER_EXPERIENCE',
    impactDescription: 'Respuesta automática a emergencias en flota',
    impactQuantification: 'Reducción del tiempo de respuesta de 8 min a 90 seg',
    tags: ['telemetría', 'alertas', 'emergencias', 'automación', 'flota'],
  },
  {
    title: 'ASTRID',
    shortDescription: 'Red de técnicos realiza pruebas de instalación GPS sin intervención humana',
    description: `## ASTRID - Automated System for Technical Review and Installation Diagnostics

ASTRID automatiza el proceso de verificación y pruebas de instalación de dispositivos GPS, eliminando la necesidad de supervisión humana en tiempo real.

### Proceso Automatizado
1. Técnico instala dispositivo GPS en vehículo
2. ASTRID ejecuta batería de pruebas automáticas
3. Verifica comunicación, señal GPS, voltaje y parámetros de configuración
4. Genera reporte de instalación automáticamente
5. Aprueba o rechaza la instalación según criterios técnicos

### Beneficios
- Estandarización del proceso de instalación
- Eliminación de errores humanos en verificación
- Reducción del tiempo de certificación de instalaciones
- Registro automático de cada instalación`,
    department: 'Operaciones',
    status: 'PRODUCTION',
    tools: ['Replit'],
    impactType: 'INTERNAL_EFFICIENCY',
    impactDescription: 'Automatización de pruebas de instalación GPS',
    impactQuantification: 'Reducción del 85% en tiempo de verificación de instalaciones',
    tags: ['GPS', 'instalación', 'técnicos', 'automatización', 'verificación'],
  },
  {
    title: 'Dispatch',
    shortDescription: 'Clientes programan servicios y el sistema asigna técnicos inteligentemente',
    description: `## Dispatch - Sistema Inteligente de Asignación de Técnicos

Dispatch es un sistema de scheduling y asignación de servicios que optimiza la distribución de trabajo entre técnicos disponibles.

### Funcionalidades Principales
- **Portal de clientes**: Los clientes pueden programar servicios de instalación y mantenimiento
- **Asignación inteligente**: Algoritmo que considera ubicación, especialización, carga de trabajo y disponibilidad
- **Optimización de rutas**: Minimiza tiempos de traslado entre servicios
- **Notificaciones automáticas**: Cliente y técnico reciben confirmación y recordatorios
- **Seguimiento en tiempo real**: Cliente puede ver el estatus de su servicio

### Beneficios
- Reducción del 40% en tiempo de coordinación manual
- Mejora en satisfacción del cliente
- Optimización del uso de la red de técnicos`,
    department: 'Operaciones',
    status: 'PRODUCTION',
    tools: ['Replit'],
    impactType: 'CUSTOMER_EXPERIENCE',
    impactDescription: 'Programación y asignación automática de servicios técnicos',
    impactQuantification: 'Reducción del 40% en tiempo de coordinación, +25% en satisfacción',
    tags: ['scheduling', 'técnicos', 'asignación', 'clientes', 'servicios'],
  },
  {
    title: 'IRIS',
    shortDescription: 'Gestión automatizada de cobranza: recordatorios por mail y llamadas automáticas',
    description: `## IRIS - Intelligent Receivables and Invoice System

IRIS es la plataforma de automatización de cobranza de Numaris. Gestiona de forma inteligente el seguimiento a clientes con facturas pendientes.

### Flujo de Cobranza Automatizada
1. **Identificación**: Detecta automáticamente facturas vencidas o próximas a vencer
2. **Email automatizado**: Envía recordatorios personalizados por correo electrónico
3. **Llamadas automáticas**: Realiza llamadas telefónicas automatizadas con voz sintética
4. **Escalamiento**: Si no hay respuesta, escala a ejecutivos de cuenta
5. **Reportes**: Genera reportes de eficiencia de cobranza

### Integraciones
- Sistema de facturación interno
- Twilio para llamadas automatizadas
- SendGrid para emails
- Dashboard de métricas en tiempo real`,
    department: 'Cobranza / Finanzas',
    status: 'PRODUCTION',
    tools: ['Claude Code', 'Vercel', 'Railway'],
    impactType: 'COST_REDUCTION',
    impactDescription: 'Automatización del proceso de cobranza y reducción de cartera vencida',
    impactQuantification: 'Reducción del 35% en cartera vencida, ahorro de 2 FTEs',
    slackChannel: '#iris-cobranza',
    tags: ['cobranza', 'facturas', 'llamadas', 'recordatorios', 'automatización'],
  },
  {
    title: 'Sentinel',
    shortDescription: 'Seguimiento automatizado de unidades en ruta con llamadas periódicas al operador',
    description: `## Sentinel - Sistema de Monitoreo Proactivo de Flota

Sentinel mantiene vigilancia continua sobre unidades en ruta crítica, haciendo contacto proactivo con operadores para confirmar seguridad y progreso.

### Funcionamiento
- Monitorea unidades en rutas designadas de alto valor
- Programa llamadas automáticas a operadores en puntos de control
- Verifica que la unidad esté en el lugar correcto en el tiempo esperado
- Alerta a central de monitoreo ante cualquier desviación o falta de respuesta
- Genera log completo de cada evento de monitoreo

### Casos de uso
- Traslado de mercancía de alto valor
- Rutas nocturnas de larga distancia
- Unidades en zonas de riesgo identificadas`,
    department: 'Monitoreo',
    status: 'PRODUCTION',
    tools: ['Replit'],
    impactType: 'CUSTOMER_EXPERIENCE',
    impactDescription: 'Monitoreo proactivo de unidades en ruta',
    impactQuantification: 'Reducción del 60% en incidentes no detectados oportunamente',
    tags: ['monitoreo', 'flota', 'rutas', 'seguimiento', 'llamadas'],
  },
  {
    title: 'MiCuenta Numaris',
    shortDescription: 'Portal para clientes: estados de cuenta, facturación, notas de crédito, evidencia fotográfica de instalaciones',
    description: `## MiCuenta Numaris - Portal de Autoservicio para Clientes

MiCuenta Numaris es el portal de cara al cliente que centraliza toda la información de su cuenta y servicios contratados.

### Funcionalidades
- **Estado de cuenta**: Visualización de saldo, facturas pendientes y pagadas
- **Facturación**: Descarga de facturas en PDF y XML
- **Notas de crédito**: Consulta y aplicación de notas de crédito
- **Evidencia fotográfica**: Fotos de las instalaciones realizadas en sus unidades
- **Solicitud de servicios**: Programar mantenimiento o nuevas instalaciones
- **Historial de pagos**: Registro completo de transacciones

### Impacto
Reducción significativa en llamadas al call center para consultas de estado de cuenta.`,
    department: 'Postventa / Clientes',
    status: 'PRODUCTION',
    tools: ['Replit'],
    impactType: 'CUSTOMER_EXPERIENCE',
    impactDescription: 'Portal de autoservicio que reduce carga al call center',
    impactQuantification: 'Reducción del 45% en llamadas de consulta de estado de cuenta',
    tags: ['clientes', 'portal', 'facturación', 'autoservicio', 'estado de cuenta'],
  },
  {
    title: 'Cursos de Ciberseguridad',
    shortDescription: 'Plataforma de capacitación en ciberseguridad para todo el personal de Numaris',
    description: `## Plataforma de Cursos de Ciberseguridad

Plataforma interna de e-learning enfocada en ciberseguridad corporativa, diseñada para educar a todos los empleados sobre las mejores prácticas y amenazas actuales.

### Contenido
- **Phishing y ingeniería social**: Cómo identificar y reportar intentos de phishing
- **Contraseñas seguras**: Buenas prácticas de gestión de contraseñas
- **Dispositivos móviles**: Seguridad en smartphones corporativos
- **Redes y VPN**: Uso seguro de redes públicas y corporativas
- **Respuesta a incidentes**: Qué hacer si sospechas de un ataque

### Características de la plataforma
- Cursos interactivos con quizzes
- Seguimiento de progreso por empleado
- Certificados de completación
- Dashboard para RRHH con métricas de completación`,
    department: 'RRHH',
    status: 'PRODUCTION',
    tools: ['Replit'],
    impactType: 'INTERNAL_EFFICIENCY',
    impactDescription: 'Capacitación masiva en ciberseguridad para 350 empleados',
    impactQuantification: '85% de empleados capacitados, reducción del 70% en incidentes de phishing',
    tags: ['ciberseguridad', 'capacitación', 'cursos', 'RRHH', 'seguridad'],
  },
  {
    title: 'NPOS',
    shortDescription: 'Numaris People Operating System: onboarding, permisos, préstamos, vacaciones, activos, cursos',
    description: `## NPOS - Numaris People Operating System

NPOS es el sistema central de gestión de recursos humanos de Numaris. Centraliza todos los procesos relacionados con el ciclo de vida del empleado.

### Módulos

#### Onboarding
- Checklist digital de ingreso
- Asignación automática de accesos y equipos
- Cursos de inducción obligatorios

#### Gestión de Solicitudes
- Permisos y ausencias
- Préstamos de empresa
- Anticipos de nómina
- Solicitud de activos (laptop, teléfono, vehículo)

#### Vacaciones
- Solicitud y aprobación digital
- Cálculo automático de días disponibles
- Calendario compartido de ausencias por equipo

#### Historial del Empleado
- Registro completo de accesos
- Historial de préstamos y activos
- Certificados de cursos completados

### Impacto
Eliminación total de formularios en papel para procesos de RRHH.`,
    department: 'RRHH',
    status: 'PRODUCTION',
    tools: ['Replit'],
    impactType: 'INTERNAL_EFFICIENCY',
    impactDescription: 'Digitalización completa de procesos de RRHH',
    impactQuantification: 'Eliminación de 100% de formularios en papel, ahorro de 1.5 FTEs en procesos manuales',
    tags: ['RRHH', 'onboarding', 'vacaciones', 'permisos', 'activos', 'empleados'],
  },
];

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // Create departments
  const deptMap = {};
  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { name: dept.name },
      update: { color: dept.color },
      create: dept,
    });
    deptMap[dept.name] = d.id;
    console.log(`✅ Departamento: ${dept.name}`);
  }

  // Create tools
  const toolMap = {};
  for (const tool of tools) {
    const t = await prisma.tool.upsert({
      where: { name: tool.name },
      update: {},
      create: tool,
    });
    toolMap[tool.name] = t.id;
    console.log(`✅ Herramienta: ${tool.name}`);
  }

  // Create owner user (placeholder - will be updated on first login)
  const owner = await prisma.user.upsert({
    where: { email: 'david.barba@numaris.com' },
    update: {},
    create: {
      email: 'david.barba@numaris.com',
      name: 'David Barba',
      role: 'OWNER',
    },
  });
  console.log(`✅ Owner: ${owner.name}`);

  // Create initial projects
  for (const project of initialProjects) {
    const deptId = deptMap[project.department];
    if (!deptId) {
      console.warn(`⚠️ Departamento no encontrado: ${project.department}`);
      continue;
    }

    const toolIds = project.tools
      .map(name => toolMap[name])
      .filter(Boolean);

    const existing = await prisma.project.findFirst({
      where: { title: project.title },
    });

    if (!existing) {
      const created = await prisma.project.create({
        data: {
          title: project.title,
          shortDescription: project.shortDescription,
          description: project.description,
          departmentId: deptId,
          status: project.status,
          ownerId: owner.id,
          slackChannel: project.slackChannel,
          impactType: project.impactType,
          impactDescription: project.impactDescription,
          impactQuantification: project.impactQuantification,
          isFeatured: ['Numai', 'IRIS', 'NPOS', 'ASTRID'].includes(project.title),
          tools: {
            create: toolIds.map(toolId => ({ toolId })),
          },
          tags: {
            create: project.tags.map(tag => ({ tag })),
          },
        },
      });
      console.log(`✅ Proyecto creado: ${created.title}`);
    } else {
      console.log(`⏭️ Proyecto ya existe: ${project.title}`);
    }
  }

  // Default settings
  await prisma.appSettings.upsert({
    where: { key: 'slack_webhook_url' },
    update: {},
    create: { key: 'slack_webhook_url', value: '', updatedAt: new Date() },
  });

  await prisma.appSettings.upsert({
    where: { key: 'portal_name' },
    update: {},
    create: { key: 'portal_name', value: 'Numaris AI Hub', updatedAt: new Date() },
  });

  console.log('\n🚀 ¡Seed completado exitosamente!');
  console.log(`📊 ${initialProjects.length} proyectos iniciales cargados`);
  console.log(`🏢 ${departments.length} departamentos creados`);
  console.log(`🛠️ ${tools.length} herramientas creadas`);
}

main()
  .catch(e => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
