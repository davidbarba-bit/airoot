import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Star, ExternalLink, Users } from 'lucide-react';
import { statusConfig, formatRelativeDate, truncate, cn } from '../../utils/helpers';

export default function ProjectCard({ project }) {
  const status = statusConfig[project.status] || statusConfig.DEVELOPMENT;

  return (
    <Link
      to={`/proyecto/${project.id}`}
      className="card block hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {project.isFeatured && (
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
              )}
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">
                {project.title}
              </h3>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">{project.shortDescription}</p>
          </div>
          <span className={status.className}>{status.label}</span>
        </div>

        {/* Department */}
        {project.department && (
          <div className="flex items-center gap-1.5 mb-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: project.department.color }}
            />
            <span className="text-xs text-gray-500">{project.department.name}</span>
          </div>
        )}

        {/* Tools */}
        {project.tools?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {project.tools.slice(0, 4).map(({ tool }) => (
              <span
                key={tool.id}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
              >
                {tool.name}
              </span>
            ))}
            {project.tools.length > 4 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-xs">
                +{project.tools.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.tags.slice(0, 3).map(({ tag }) => (
              <span key={tag} className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3">
            {/* Owner */}
            <div className="flex items-center gap-1.5">
              {project.owner?.avatarUrl ? (
                <img
                  src={project.owner.avatarUrl}
                  alt={project.owner.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-600">
                    {project.owner?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs text-gray-500 max-w-[100px] truncate">
                {project.owner?.name}
              </span>
            </div>

            {/* Co-contributors count */}
            {project.contributors?.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="w-3.5 h-3.5" />
                <span>{project.contributors.length}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{project._count?.comments || 0}</span>
            </div>
            <span>{formatRelativeDate(project.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
