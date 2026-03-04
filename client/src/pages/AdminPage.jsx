import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, BarChart3, Settings, Building2, Wrench,
  Shield, TrendingUp, Activity, Star, AlertTriangle,
} from 'lucide-react';
import api from '../utils/api';
import { cn, formatDate } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const TABS = [
  { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'departments', label: 'Departamentos', icon: Building2 },
  { id: 'tools', label: 'Herramientas', icon: Wrench },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

const STATUS_COLORS = {
  PRODUCTION: '#10B981',
  DEVELOPMENT: '#3B82F6',
  PAUSED: '#F59E0B',
  DEPRECATED: '#9CA3AF',
};

const STATUS_LABELS = {
  PRODUCTION: 'En producción',
  DEVELOPMENT: 'En desarrollo',
  PAUSED: 'Pausado',
  DEPRECATED: 'Deprecado',
};

const ROLE_LABELS = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  CONTRIBUTOR: 'Contributor',
};

function StatsTab({ stats }) {
  if (!stats) return <div className="flex justify-center py-8"><div className="spinner w-6 h-6" /></div>;

  const statusData = stats.projectsByStatus?.map(s => ({
    name: STATUS_LABELS[s.status],
    value: s._count,
    color: STATUS_COLORS[s.status],
  })) || [];

  const deptData = stats.projectsByDepartment?.map(d => ({
    name: d.department?.name || 'N/A',
    proyectos: d.count,
  })) || [];

  const toolData = stats.projectsByTool?.map(t => ({
    name: t.tool?.name || 'N/A',
    proyectos: t.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-primary-600">{stats.totalProjects}</p>
          <p className="text-sm text-gray-500 mt-1">Total proyectos</p>
        </div>
        {statusData.map(s => (
          <div key={s.name} className="card p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.name}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By department */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Proyectos por departamento</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="proyectos" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By tool - pie */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Herramientas más utilizadas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={toolData.slice(0, 8)}
                dataKey="proyectos"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {toolData.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444', '#84CC16'][i % 8]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top contributors */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          Top contribuidores
        </h3>
        <div className="divide-y divide-gray-50">
          {stats.topContributors?.map((user, i) => (
            <div key={user.id} className="flex items-center gap-3 py-3">
              <span className="w-6 text-center text-sm font-bold text-gray-400">#{i + 1}</span>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-700">{user.name?.charAt(0)}</span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-900 flex-1">{user.name}</span>
              <span className="badge bg-primary-50 text-primary-700">
                {user._count.ownedProjects} proyectos
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Projects with impact */}
      {stats.projectsWithImpact?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Proyectos con impacto documentado</h3>
          <div className="space-y-3">
            {stats.projectsWithImpact.map(p => (
              <div key={p.id} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                <span className="text-emerald-500">💰</span>
                <div>
                  <p className="font-medium text-sm text-gray-900">{p.title}</p>
                  <p className="text-xs text-emerald-700 mt-0.5">{p.impactQuantification}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/admin/users/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries(['admin-users']),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{users.length} usuarios registrados</p>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Usuario</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Proyectos</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary-700">{user.name?.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={e => updateMutation.mutate({ id: user.id, role: e.target.value })}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                    >
                      <option value="CONTRIBUTOR">Contributor</option>
                      <option value="ADMIN">Admin</option>
                      <option value="OWNER">Owner</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user._count?.ownedProjects || 0}</td>
                  <td className="px-4 py-3">
                    <span className={cn('badge', user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => updateMutation.mutate({ id: user.id, isActive: !user.isActive })}
                      className={cn('text-xs px-2 py-1 rounded-lg', user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50')}
                    >
                      {user.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DepartmentsTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/departments', { name, color }),
    onSuccess: () => { setName(''); queryClient.invalidateQueries(['departments']); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/departments/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['departments']),
  });

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Agregar departamento</h3>
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del departamento" className="input flex-1" />
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
          <button onClick={() => createMutation.mutate()} disabled={!name} className="btn-primary">Agregar</button>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="divide-y divide-gray-50">
          {departments.map(d => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="flex-1 text-sm font-medium text-gray-900">{d.name}</span>
              <span className="text-xs text-gray-400">{d._count?.projects || 0} proyectos</span>
              {(!d._count?.projects) && (
                <button onClick={() => deleteMutation.mutate(d.id)} className="text-xs text-red-500 hover:text-red-600">Eliminar</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolsTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => api.get('/tools').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/tools', { name, category }),
    onSuccess: () => { setName(''); setCategory(''); queryClient.invalidateQueries(['tools']); },
  });

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Agregar herramienta</h3>
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la herramienta" className="input flex-1" />
          <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Categoría" className="input flex-1" />
          <button onClick={() => createMutation.mutate()} disabled={!name} className="btn-primary">Agregar</button>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-y divide-gray-50">
          {tools.map(t => (
            <div key={t.id} className="flex items-center gap-2 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.name}</p>
                {t.category && <p className="text-xs text-gray-400">{t.category}</p>}
              </div>
              <span className="ml-auto text-xs text-gray-400">{t._count?.projects || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const queryClient = useQueryClient();
  const [slackWebhook, setSlackWebhook] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data),
    onSuccess: (data) => setSlackWebhook(data.slack_webhook_url || ''),
  });

  const saveMutation = useMutation({
    mutationFn: () => api.put('/admin/settings', { slack_webhook_url: slackWebhook }),
    onSuccess: () => queryClient.invalidateQueries(['admin-settings']),
  });

  return (
    <div className="space-y-6 max-w-lg">
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Integración con Slack
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Configura el Webhook de Slack para recibir notificaciones de actividad en el portal.
        </p>
        <div className="space-y-3">
          <div>
            <label className="label">URL del Incoming Webhook</label>
            <input
              type="url"
              value={slackWebhook}
              onChange={e => setSlackWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="input"
            />
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary"
          >
            {saveMutation.isPending ? 'Guardando...' : 'Guardar configuración'}
          </button>
          {saveMutation.isSuccess && (
            <p className="text-sm text-emerald-600">✓ Configuración guardada</p>
          )}
        </div>
      </div>

      <div className="card p-5 border-amber-100 bg-amber-50">
        <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Variables de entorno requeridas
        </h3>
        <p className="text-sm text-amber-700 mb-2">
          Asegúrate de configurar estas variables en Replit Secrets:
        </p>
        <ul className="text-xs text-amber-700 space-y-1 font-mono">
          <li>DATABASE_URL</li>
          <li>GOOGLE_CLIENT_ID</li>
          <li>GOOGLE_CLIENT_SECRET</li>
          <li>GOOGLE_CALLBACK_URL</li>
          <li>JWT_SECRET</li>
          <li>SESSION_SECRET</li>
          <li>OPENAI_API_KEY (o ANTHROPIC_API_KEY)</li>
          <li>CLOUDINARY_CLOUD_NAME</li>
          <li>CLOUDINARY_API_KEY</li>
          <li>CLOUDINARY_API_SECRET</li>
          <li>CLIENT_URL</li>
        </ul>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('stats');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
    enabled: activeTab === 'stats',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary-600" />
          Panel de Administración
        </h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona usuarios, contenido y configuración del portal</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-gray-100">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap border-b-2',
              activeTab === id
                ? 'border-primary-600 text-primary-700 bg-primary-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'stats' && <StatsTab stats={statsLoading ? null : stats} />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'departments' && <DepartmentsTab />}
      {activeTab === 'tools' && <ToolsTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
}
