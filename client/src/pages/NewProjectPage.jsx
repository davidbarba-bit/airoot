import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ProjectForm from '../components/projects/ProjectForm';

export default function NewProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: project } = await api.post('/projects', data);
      return project;
    },
    onSuccess: async (project, { files }) => {
      // Upload files if any
      if (files?.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        await api.post(`/upload/${project.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      queryClient.invalidateQueries(['projects']);
      navigate(`/proyecto/${project.id}`);
    },
  });

  const handleSubmit = (formData, files) => {
    createMutation.mutate({ ...formData, files });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver al feed
      </Link>

      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Registrar nuevo proyecto</h1>
        <p className="text-gray-500 text-sm mb-6">
          Documenta tu iniciativa de AI para que toda la empresa pueda descubrirla y colaborar.
        </p>

        {createMutation.isError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            Error al crear el proyecto. Verifica los datos e intenta de nuevo.
          </div>
        )}

        <ProjectForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
        />
      </div>
    </div>
  );
}
