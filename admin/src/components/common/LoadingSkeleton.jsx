import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div style={{ width: '100%', padding: '1rem' }}>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: '1rem',
            padding: '0.875rem 0',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="skeleton"
              style={{
                height: '1.25rem',
                width: cIdx === 0 ? '70%' : cIdx === cols - 1 ? '40%' : '90%',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div className="skeleton" style={{ height: '1.5rem', width: '40%', marginBottom: '1rem' }} />
      <div className="skeleton" style={{ height: '2.5rem', width: '70%', marginBottom: '0.75rem' }} />
      <div className="skeleton" style={{ height: '1rem', width: '50%' }} />
    </div>
  );
};
