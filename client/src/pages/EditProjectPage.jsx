import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import ProjectForm from '../components/projects/ProjectForm';

export default function EditProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { data: updated } = await api.put(`/projects/${id}`, data);
      return updated;
    },
    onSuccess: async (updated, { files }) => {
      if (files?.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        await api.post(`/upload/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      queryClient.invalidateQueries(['project', id]);
      queryClient.invalidateQueries(['projects']);
      navigate(`/proyecto/${id}`);
    },
  });

  const handleSubmit = (formData, files) => {
    updateMutation.mutate({ ...formData, files });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><div className="spinner w-8 h-8" /></div>;
  }

  if (!project) {
    return <div className="text-center py-16"><p>Proyecto no encontrado</p></div>;
  }

  const initialData = {
    title: project.title,
    shortDescription: project.shortDescription,
    description: project.description,
    departmentId: project.departmentId,
    status: project.status,
    slackChannel: project.slackChannel || '',
    repoUrl: project.repoUrl || '',
    deploymentPlatform: project.deploymentPlatform || '',
    impactType: project.impactType || '',
    impactDescription: project.impactDescription || '',
    impactQuantification: project.impactQuantification || '',
    tools: project.tools?.map(pt => pt.toolId || pt.tool?.id) || [],
    contributors: project.contributors?.map(pc => pc.userId || pc.user?.id) || [],
    tags: project.tags?.map(t => t.tag) || [],
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to={`/proyecto/${id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver al proyecto
      </Link>

      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Editar proyecto</h1>
        <p className="text-gray-500 text-sm mb-6">{project.title}</p>

        <ProjectForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
        />
      </div>
    </div>
  );
}
