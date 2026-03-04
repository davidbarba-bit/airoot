# Numaris AI Hub

> La fuente de la verdad para todas las iniciativas de AI en Numaris

Portal interno de gestión de proyectos de inteligencia artificial para Numaris Fleet Management.

## Stack Tecnológico

- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Auth**: Google OAuth 2.0 (solo @numaris.com)
- **AI Assistant**: OpenAI GPT-4o / Claude API + RAG
- **Storage**: Cloudinary
- **Deploy**: Replit Deployments

## Setup Local

### 1. Variables de entorno

Copia `.env.example` a `.env` y completa las variables:

```bash
cp .env.example server/.env
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Base de datos

```bash
cd server
npx prisma db push
node prisma/seed.js
```

### 4. Desarrollo

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Deploy en Replit

1. Crear proyecto en Replit
2. Configurar los Secrets (variables de entorno)
3. `npm run build` para compilar el frontend
4. El servidor sirve el frontend estático en producción

## Funcionalidades

- ✅ Autenticación Google OAuth (@numaris.com)
- ✅ CRUD completo de proyectos de AI
- ✅ Feed con búsqueda y filtros avanzados
- ✅ Asistente ARIA con RAG y lenguaje natural
- ✅ Comentarios con respuestas anidadas y menciones
- ✅ Reacciones con emojis
- ✅ Notificaciones automáticas a Slack
- ✅ Upload de imágenes, videos y archivos (Cloudinary)
- ✅ Panel de administración con métricas
- ✅ Dashboard de estadísticas con gráficas
- ✅ Roles: Owner, Admin, Contributor
- ✅ 9 proyectos iniciales como semilla
- ✅ Diseño responsive (mobile-friendly)
- ✅ Interfaz en Español (México)

## Proyectos iniciales incluidos

1. Numai - Plataforma LLM + transcripción
2. Sequence - Automatización de eventos de telemetría
3. ASTRID - Pruebas de instalación GPS automatizadas
4. Dispatch - Asignación inteligente de técnicos
5. IRIS - Gestión automatizada de cobranza
6. Sentinel - Monitoreo proactivo de flota
7. MiCuenta Numaris - Portal de autoservicio para clientes
8. Cursos de Ciberseguridad - Plataforma de capacitación
9. NPOS - Numaris People Operating System
