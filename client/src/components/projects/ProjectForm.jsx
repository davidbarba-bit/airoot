import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, X, Upload, Link2, Hash } from 'lucide-react';
import api from '../../utils/api';
import { cn } from '../../utils/helpers';

const STEPS = [
  { id: 1, label: 'Información básica' },
  { id: 2, label: 'Herramientas e impacto' },
  { id: 3, label: 'Recursos y etiquetas' },
];

const STATUS_OPTIONS = [
  { value: 'DEVELOPMENT', label: 'En desarrollo' },
  { value: 'PRODUCTION', label: 'En producción' },
  { value: 'PAUSED', label: 'Pausado' },
  { value: 'DEPRECATED', label: 'Deprecado' },
];

const IMPACT_OPTIONS = [
  { value: '', label: 'Seleccionar...' },
  { value: 'COST_REDUCTION', label: 'Reducción de costos' },
  { value: 'REVENUE_INCREASE', label: 'Incremento de ingresos' },
  { value: 'CUSTOMER_EXPERIENCE', label: 'Mejora de experiencia cliente' },
  { value: 'INTERNAL_EFFICIENCY', label: 'Eficiencia interna' },
  { value: 'OTHER', label: 'Otro' },
];

export default function ProjectForm({ initialData, onSubmit, isLoading }) {
  const [step, setStep] = useState(1);
  const [newTool, setNewTool] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);

  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    description: '',
    departmentId: '',
    status: 'DEVELOPMENT',
    slackChannel: '',
    repoUrl: '',
    deploymentPlatform: '',
    impactType: '',
    impactDescription: '',
    impactQuantification: '',
    tools: [],
    contributors: [],
    tags: [],
    ...initialData,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data),
  });

  const { data: toolsList = [], refetch: refetchTools } = useQuery({
    queryKey: ['tools'],
    queryFn: () => api.get('/tools').then(r => r.data),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-search'],
    queryFn: () => api.get('/users/search').then(r => r.data),
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleTool = (toolId) => {
    set('tools', form.tools.includes(toolId)
      ? form.tools.filter(t => t !== toolId)
      : [...form.tools, toolId]
    );
  };

  const toggleContributor = (userId) => {
    set('contributors', form.contributors.includes(userId)
      ? form.contributors.filter(u => u !== userId)
      : [...form.contributors, userId]
    );
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      set('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  const addNewTool = async () => {
    if (!newTool.trim()) return;
    try {
      const { data } = await api.post('/tools', { name: newTool.trim() });
      await refetchTools();
      set('tools', [...form.tools, data.id]);
      setNewTool('');
    } catch { }
  };

  const validate = () => {
    if (step === 1) return form.title && form.shortDescription && form.description && form.departmentId;
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    onSubmit(form, uploadFiles);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              type="button"
              onClick={() => step > s.id ? setStep(s.id) : null}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0',
                step === s.id
                  ? 'bg-primary-600 text-white'
                  : step > s.id
                    ? 'bg-emerald-100 text-emerald-700 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-default'
              )}
            >
              <span className={cn(
                'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center',
                step === s.id ? 'bg-white/20' : step > s.id ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              )}>
                {step > s.id ? '✓' : s.id}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn('h-0.5 w-6 shrink-0', step > s.id ? 'bg-emerald-300' : 'bg-gray-200')} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Basic info */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="label">Nombre del proyecto <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="ej. IRIS, Sequence, Numai..."
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Descripción corta <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.shortDescription}
              onChange={e => set('shortDescription', e.target.value)}
              placeholder="Una línea que explique de qué trata el proyecto"
              className="input"
              maxLength={200}
              required
            />
            <p className="text-xs text-gray-400 mt-1">{form.shortDescription.length}/200</p>
          </div>

          <div>
            <label className="label">Descripción detallada <span className="text-red-500">*</span></label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe el proyecto: funcionalidades, tecnologías, proceso, beneficios... Puedes usar Markdown."
              rows={8}
              className="input resize-y"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Departamento <span className="text-red-500">*</span></label>
              <select
                value={form.departmentId}
                onChange={e => set('departmentId', e.target.value)}
                className="select"
                required
              >
                <option value="">Seleccionar departamento</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Estado</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="select"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Tools & Impact */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Tools */}
          <div>
            <label className="label">Herramientas de AI utilizadas</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {toolsList.map(tool => (
                <button
                  type="button"
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                    form.tools.includes(tool.id)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                  )}
                >
                  {tool.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTool}
                onChange={e => setNewTool(e.target.value)}
                placeholder="Agregar nueva herramienta..."
                className="input"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewTool())}
              />
              <button type="button" onClick={addNewTool} className="btn-secondary gap-1">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Platform & Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Plataforma de despliegue</label>
              <input
                type="text"
                value={form.deploymentPlatform}
                onChange={e => set('deploymentPlatform', e.target.value)}
                placeholder="ej. Replit, Vercel, Railway, AWS..."
                className="input"
              />
            </div>
            <div>
              <label className="label">Repositorio / Enlace</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={form.repoUrl}
                  onChange={e => set('repoUrl', e.target.value)}
                  placeholder="https://..."
                  className="input pl-9"
                />
              </div>
            </div>
          </div>

          {/* Impact */}
          <div className="space-y-3">
            <label className="label">Impacto</label>
            <select
              value={form.impactType}
              onChange={e => set('impactType', e.target.value)}
              className="select"
            >
              {IMPACT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {form.impactType && (
              <>
                <input
                  type="text"
                  value={form.impactDescription}
                  onChange={e => set('impactDescription', e.target.value)}
                  placeholder="Describe brevemente el impacto..."
                  className="input"
                />
                <input
                  type="text"
                  value={form.impactQuantification}
                  onChange={e => set('impactQuantification', e.target.value)}
                  placeholder='Cuantifica: "Ahorro de 2 FTEs", "30% menos tiempo en conciliación"...'
                  className="input"
                />
              </>
            )}
          </div>

          {/* Co-contributors */}
          <div>
            <label className="label">Co-responsables</label>
            <div className="flex flex-wrap gap-2">
              {users.map(u => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => toggleContributor(u.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-all',
                    form.contributors.includes(u.id)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                  )}
                >
                  {u.avatarUrl && <img src={u.avatarUrl} alt={u.name} className="w-5 h-5 rounded-full" />}
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Resources & Tags */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label className="label">Canal de Slack</label>
            <input
              type="text"
              value={form.slackChannel}
              onChange={e => set('slackChannel', e.target.value)}
              placeholder="#nombre-del-canal"
              className="input"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="label">Etiquetas</label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="cobranza, automatización, facturas..."
                  className="input pl-9"
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
              </div>
              <button type="button" onClick={addTag} className="btn-secondary">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => set('tags', form.tags.filter(t => t !== tag))}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* File upload */}
          <div>
            <label className="label">Imágenes, videos y archivos</label>
            <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 transition-colors">
              <Upload className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Arrastra archivos o haz clic para seleccionar</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, MP4, PDF, DOCX, XLSX (máx. 50MB)</p>
              <input
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                className="hidden"
                onChange={e => setUploadFiles(Array.from(e.target.files))}
              />
            </label>
            {uploadFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {uploadFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-gray-400 text-xs">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="btn-secondary disabled:opacity-50"
        >
          Anterior
        </button>

        <button
          type="submit"
          disabled={!validate() || isLoading}
          className="btn-primary gap-2"
        >
          {isLoading ? (
            <><span className="spinner w-4 h-4" /> Guardando...</>
          ) : step === 3 ? (
            '✓ Publicar proyecto'
          ) : (
            'Siguiente →'
          )}
        </button>
      </div>
    </form>
  );
}
