import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 24, className = '', fullScreen = false, text = 'Loading...' }) => {
  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 size={size} className="animate-spin text-indigo-500" style={{ animation: 'spin 1s linear infinite' }} />
      {text && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};
