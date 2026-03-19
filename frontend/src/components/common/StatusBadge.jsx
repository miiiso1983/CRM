import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../../utils/constants';

export function StatusBadge({ status }) {
  return (
    <span className={STATUS_COLORS[status] || 'badge bg-gray-100 text-gray-700'}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={PRIORITY_COLORS[priority] || 'badge bg-gray-100 text-gray-700'}>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

export function RoleBadge({ role }) {
  const colors = {
    admin: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    sales: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`badge ${colors[role?.name] || 'bg-gray-100 text-gray-700'}`}>
      {role?.name_ar || role?.name}
    </span>
  );
}

