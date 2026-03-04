import React from 'react';
import { statusConfig } from '../../utils/helpers';

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.DEVELOPMENT;
  return (
    <span className={config.className}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5 inline-block`} />
      {config.label}
    </span>
  );
}
