import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { formatDate } from '../utils/helpers';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ProjectCard from '../components/projects/ProjectCard';
import { User, Mail, Calendar, Layers } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => api.get(`/users/${user.id}/projects`).then(r => r.data),
    enabled: !!user?.id,
  });

  const roleLabel = { OWNER: 'Owner', ADMIN: 'Admin', CONTRIBUTOR: 'Contributor' };
  const roleColor = {
    OWNER: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-blue-100 text-blue-700',
    CONTRIBUTOR: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-start gap-5">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-2xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-700">{user?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <span className={`badge ${roleColor[user?.role]}`}>{roleLabel[user?.role]}</span>
            </div>
            <div className="mt-3 space-y-2">
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
              {user?.createdAt && (
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  Miembro desde {formatDate(user.createdAt)}
                </p>
              )}
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Layers className="w-4 h-4" />
                {projects.length} proyecto(s) registrado(s)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User's projects */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mis proyectos</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="spinner w-6 h-6" /></div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 card">
            <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aún no tienes proyectos registrados</p>
            <Link to="/nuevo" className="btn-primary mt-4 inline-flex text-sm">
              Registrar mi primer proyecto
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
