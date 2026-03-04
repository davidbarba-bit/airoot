import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, SlidersHorizontal, Grid3X3, List, X, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ProjectCard from '../components/projects/ProjectCard';
import { cn } from '../utils/helpers';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'PRODUCTION', label: 'En producción' },
  { value: 'DEVELOPMENT', label: 'En desarrollo' },
  { value: 'PAUSED', label: 'Pausado' },
  { value: 'DEPRECATED', label: 'Deprecado' },
];

const IMPACT_OPTIONS = [
  { value: '', label: 'Todos los impactos' },
  { value: 'COST_REDUCTION', label: 'Reducción de costos' },
  { value: 'REVENUE_INCREASE', label: 'Incremento de ingresos' },
  { value: 'CUSTOMER_EXPERIENCE', label: 'Mejora de experiencia cliente' },
  { value: 'INTERNAL_EFFICIENCY', label: 'Eficiencia interna' },
];

function ProjectListItem({ project }) {
  const statusColors = {
    PRODUCTION: 'bg-emerald-500',
    DEVELOPMENT: 'bg-blue-500',
    PAUSED: 'bg-amber-500',
    DEPRECATED: 'bg-gray-400',
  };
  const statusLabels = {
    PRODUCTION: 'En producción',
    DEVELOPMENT: 'En desarrollo',
    PAUSED: 'Pausado',
    DEPRECATED: 'Deprecado',
  };

  return (
    <Link to={`/proyecto/${project.id}`} className="card flex items-center gap-4 p-4 hover:shadow-md hover:border-gray-200 transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {project.isFeatured && <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
          <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
          <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${statusColors[project.status]}`} />
            {statusLabels[project.status]}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">{project.shortDescription}</p>
      </div>
      <div className="hidden lg:flex items-center gap-2 shrink-0">
        {project.tools?.slice(0, 3).map(({ tool }) => (
          <span key={tool.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
            {tool.name}
          </span>
        ))}
      </div>
      <div className="hidden sm:block shrink-0">
        {project.department && (
          <span className="text-xs text-gray-400 px-2 py-1 bg-gray-50 rounded-lg">
            {project.department.name}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function FeedPage() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [tool, setTool] = useState('');
  const [status, setStatus] = useState('');
  const [impactType, setImpactType] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data),
  });

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => api.get('/tools').then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { search, department, tool, status, impactType, page }],
    queryFn: () => api.get('/projects', {
      params: { search, department, tool, status, impactType, page, limit: 18 },
    }).then(r => r.data),
    keepPreviousData: true,
  });

  const projects = data?.projects || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const hasFilters = search || department || tool || status || impactType;
  const clearFilters = () => {
    setSearch(''); setDepartment(''); setTool('');
    setStatus(''); setImpactType(''); setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-6 sm:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Numaris AI Hub</h1>
        <p className="text-primary-200 text-sm sm:text-base mb-6">
          Descubre todas las iniciativas de inteligencia artificial de Numaris. {total > 0 && `${total} proyectos registrados.`}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/nuevo" className="btn bg-white text-primary-700 hover:bg-primary-50 font-semibold gap-2">
            <Plus className="w-4 h-4" />
            Registrar proyecto
          </Link>
          <Link to="/aria" className="btn bg-white/10 text-white hover:bg-white/20 font-medium border border-white/20 gap-2">
            Pregúntale a ARIA ✨
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar proyectos, herramientas, etiquetas..."
              className="input pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn('btn-secondary gap-2', showFilters && 'border-primary-300 text-primary-700 bg-primary-50')}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {hasFilters && <span className="w-2 h-2 rounded-full bg-primary-600" />}
          </button>
          <div className="hidden sm:flex gap-1 border border-gray-200 rounded-lg p-1 bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-1.5 rounded', viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50')}
            >
              <Grid3X3 className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-1.5 rounded', viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50')}
            >
              <List className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-4 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="label">Departamento</label>
                <select
                  value={department}
                  onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                  className="select"
                >
                  <option value="">Todos</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Herramienta AI</label>
                <select
                  value={tool}
                  onChange={(e) => { setTool(e.target.value); setPage(1); }}
                  className="select"
                >
                  <option value="">Todas</option>
                  {tools.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Estado</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="select"
                >
                  {STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tipo de impacto</label>
                <select
                  value={impactType}
                  onChange={(e) => { setImpactType(e.target.value); setPage(1); }}
                  className="select"
                >
                  {IMPACT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
                <X className="w-3.5 h-3.5" />
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="spinner w-8 h-8" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-2">No se encontraron proyectos</h3>
          <p className="text-gray-400 text-sm mb-4">
            {hasFilters
              ? 'Intenta con otros filtros o términos de búsqueda'
              : '¡Sé el primero en registrar un proyecto de AI!'}
          </p>
          {!hasFilters && (
            <Link to="/nuevo" className="btn-primary gap-2">
              <Plus className="w-4 h-4" />
              Registrar proyecto
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          )}>
            {projects.map(project => (
              viewMode === 'grid'
                ? <ProjectCard key={project.id} project={project} />
                : <ProjectListItem key={project.id} project={project} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-3 py-2 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary px-3 py-2 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
