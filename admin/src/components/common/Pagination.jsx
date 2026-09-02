import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  meta,
  onPageChange,
}) => {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages, totalItems, limit } = meta;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
      }}
    >
      <div>
        Showing <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{startItem}</span> to{' '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{endItem}</span> of{' '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{totalItems}</span> results
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <span style={{ padding: '0 0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
