import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), "d 'de' MMMM, yyyy", { locale: es });
};

export const formatRelativeDate = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
};

export const statusConfig = {
  PRODUCTION: { label: 'En producción', className: 'badge-production', dot: 'bg-emerald-500' },
  DEVELOPMENT: { label: 'En desarrollo', className: 'badge-development', dot: 'bg-blue-500' },
  PAUSED: { label: 'Pausado', className: 'badge-paused', dot: 'bg-amber-500' },
  DEPRECATED: { label: 'Deprecado', className: 'badge-deprecated', dot: 'bg-gray-400' },
};

export const impactConfig = {
  COST_REDUCTION: { label: 'Reducción de costos', icon: '💰', color: 'text-emerald-600' },
  REVENUE_INCREASE: { label: 'Incremento de ingresos', icon: '📈', color: 'text-blue-600' },
  CUSTOMER_EXPERIENCE: { label: 'Mejora de experiencia cliente', icon: '⭐', color: 'text-amber-600' },
  INTERNAL_EFFICIENCY: { label: 'Eficiencia interna', icon: '⚡', color: 'text-purple-600' },
  OTHER: { label: 'Otro', icon: '🎯', color: 'text-gray-600' },
};

export const activityLabels = {
  PROJECT_CREATED: 'creó el proyecto',
  PROJECT_UPDATED: 'actualizó el proyecto',
  PROJECT_STATUS_CHANGED: 'cambió el estado del proyecto',
  COMMENT_ADDED: 'agregó un comentario',
  FILE_UPLOADED: 'subió archivos',
  REACTION_ADDED: 'reaccionó al proyecto',
  CONTRIBUTOR_ADDED: 'fue agregado como co-responsable',
};

export const EMOJIS = ['👍', '🔥', '💡', '🚀', '👏', '❤️', '🎉'];

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const truncate = (text, max = 120) => {
  if (!text || text.length <= max) return text;
  return text.slice(0, max) + '...';
};
