import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Edit, Trash2, ExternalLink, Hash, MessageSquare,
  Clock, Users, Star, Slack, Activity, ChevronDown, ChevronUp,
  Image, Video, FileText, Download,
} from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/auth';
import { statusConfig, impactConfig, activityLabels, formatDate, formatRelativeDate, cn } from '../utils/helpers';
import CommentSection from '../components/comments/CommentSection';
import ReactionBar from '../components/projects/ReactionBar';
import StatusBadge from '../components/projects/StatusBadge';

function MediaGallery({ media }) {
  const [selected, setSelected] = useState(null);
  const images = media.filter(m => m.type === 'IMAGE');
  const videos = media.filter(m => m.type === 'VIDEO');
  const files = media.filter(m => m.type === 'FILE');

  if (!media.length) return null;

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Image className="w-4 h-4" /> Imágenes ({images.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {images.map(img => (
              <button
                key={img.id}
                onClick={() => setSelected(img)}
                className="aspect-video bg-gray-100 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
              >
                <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Video className="w-4 h-4" /> Videos ({videos.length})
          </h4>
          <div className="space-y-2">
            {videos.map(vid => (
              <video key={vid.id} controls className="w-full rounded-lg">
                <source src={vid.url} />
              </video>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Archivos ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map(file => (
              <a
                key={file.id}
                href={file.url}
                download={file.filename}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700 flex-1 truncate">{file.filename}</span>
                <Download className="w-4 h-4 text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <img src={selected.url} alt={selected.filename} className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

function ActivityTimeline({ logs }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? logs : logs.slice(0, 5);

  return (
    <div className="space-y-3">
      {visible.map((log) => (
        <div key={log.id} className="flex items-start gap-3">
          {log.user?.avatarUrl ? (
            <img src={log.user.avatarUrl} alt={log.user.name} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-gray-500">
                {log.user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{log.user?.name}</span>
              {' '}{activityLabels[log.action] || log.action}
            </p>
            <p className="text-xs text-gray-400">{formatRelativeDate(log.createdAt)}</p>
          </div>
        </div>
      ))}
      {logs.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          {showAll ? <><ChevronUp className="w-3 h-3" /> Ver menos</> : <><ChevronDown className="w-3 h-3" /> Ver todo el historial</>}
        </button>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuthStore();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      navigate('/');
    },
  });

  const featureMutation = useMutation({
    mutationFn: (isFeatured) => api.put(`/projects/${id}`, { isFeatured }),
    onSuccess: () => queryClient.invalidateQueries(['project', id]),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-700">Proyecto no encontrado</h2>
        <Link to="/" className="btn-primary mt-4 inline-flex">Volver al inicio</Link>
      </div>
    );
  }

  const canEdit = user?.id === project.ownerId || isAdmin();
  const impact = project.impactType ? impactConfig[project.impactType] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver al feed
      </Link>

      {/* Main card */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {project.isFeatured && (
                  <span className="badge bg-amber-100 text-amber-700">
                    <Star className="w-3 h-3 mr-1 fill-amber-500" />
                    Destacado
                  </span>
                )}
                <StatusBadge status={project.status} />
                {project.department && (
                  <span
                    className="badge"
                    style={{ backgroundColor: project.department.color + '20', color: project.department.color }}
                  >
                    {project.department.name}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <p className="text-gray-500 text-lg">{project.shortDescription}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {canEdit && isAdmin() && (
                <button
                  onClick={() => featureMutation.mutate(!project.isFeatured)}
                  className={cn('btn-secondary gap-2', project.isFeatured && 'border-amber-300 text-amber-600 bg-amber-50')}
                  title={project.isFeatured ? 'Quitar destacado' : 'Destacar proyecto'}
                >
                  <Star className={cn('w-4 h-4', project.isFeatured && 'fill-amber-500')} />
                </button>
              )}
              {canEdit && (
                <Link to={`/proyecto/${id}/editar`} className="btn-secondary gap-2">
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar</span>
                </Link>
              )}
              {canEdit && (
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de eliminar este proyecto?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  className="btn-secondary gap-2 hover:border-red-200 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Main content */}
          <div className="lg:col-span-2 p-6 sm:p-8 border-r border-gray-100 space-y-8">
            {/* Description */}
            <div>
              <h2 className="font-semibold text-gray-900 mb-3">Descripción</h2>
              <div
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{
                  __html: project.description
                    .replace(/^## (.*)/gm, '<h2>$1</h2>')
                    .replace(/^### (.*)/gm, '<h3>$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>')
                }}
              />
            </div>

            {/* Impact */}
            {impact && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-5">
                <h2 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <span>{impact.icon}</span> Impacto
                </h2>
                <p className="text-sm text-emerald-700 mb-1">
                  <span className={cn('font-semibold', impact.color)}>{impact.label}</span>
                </p>
                {project.impactDescription && (
                  <p className="text-sm text-emerald-700">{project.impactDescription}</p>
                )}
                {project.impactQuantification && (
                  <div className="mt-3 bg-white rounded-lg px-4 py-2.5 border border-emerald-100">
                    <p className="text-sm font-semibold text-emerald-800">
                      📊 {project.impactQuantification}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tools */}
            {project.tools?.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-3">Herramientas de AI</h2>
                <div className="flex flex-wrap gap-2">
                  {project.tools.map(({ tool }) => (
                    <span key={tool.id} className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-100 rounded-lg text-sm font-medium">
                      {tool.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {project.tags?.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-3">Etiquetas</h2>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map(({ tag }) => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      <Hash className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Media */}
            {project.media?.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-3">Recursos multimedia</h2>
                <MediaGallery media={project.media} />
              </div>
            )}

            {/* Reactions */}
            <div>
              <h2 className="font-semibold text-gray-900 mb-3">Reacciones</h2>
              <ReactionBar targetType="PROJECT" targetId={id} />
            </div>

            {/* Comments */}
            <div>
              <CommentSection projectId={id} comments={project.comments || []} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="p-6 sm:p-8 space-y-6 bg-gray-50/50">
            {/* Metadata */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Responsable</p>
                <div className="flex items-center gap-2">
                  {project.owner?.avatarUrl ? (
                    <img src={project.owner.avatarUrl} alt={project.owner.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-700">{project.owner?.name?.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{project.owner?.name}</p>
                    <p className="text-xs text-gray-400">{project.owner?.email}</p>
                  </div>
                </div>
              </div>

              {project.contributors?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Co-responsables</p>
                  <div className="space-y-2">
                    {project.contributors.map(({ user: u }) => (
                      <div key={u.id} className="flex items-center gap-2">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-semibold text-gray-500">{u.name?.charAt(0)}</span>
                          </div>
                        )}
                        <span className="text-sm text-gray-700">{u.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Fecha de registro</p>
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(project.createdAt)}
                </p>
              </div>

              {project.deploymentPlatform && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Plataforma</p>
                  <p className="text-sm text-gray-700">{project.deploymentPlatform}</p>
                </div>
              )}

              {project.repoUrl && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Repositorio / Enlace</p>
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver proyecto
                  </a>
                </div>
              )}

              {project.slackChannel && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Canal de Slack</p>
                  <p className="text-sm text-gray-700 flex items-center gap-1.5">
                    <Slack className="w-3.5 h-3.5 text-[#4A154B]" />
                    {project.slackChannel}
                  </p>
                </div>
              )}
            </div>

            {/* Activity */}
            {project.activityLog?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Actividad reciente
                </h3>
                <ActivityTimeline logs={project.activityLog} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
