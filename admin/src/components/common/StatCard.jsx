import React from 'react';

export const StatCard = ({
  icon: Icon,
  label,
  value,
  trend = null,
  color = 'var(--primary)',
  bgColor = 'var(--primary-light)',
}) => {
  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: bgColor,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {value}
        </span>
        {trend && (
          <span style={{ fontSize: '0.75rem', color: trend.isPositive ? 'var(--emerald)' : 'var(--rose)', fontWeight: 600 }}>
            {trend.text}
          </span>
        )}
      </div>
    </div>
  );
};
