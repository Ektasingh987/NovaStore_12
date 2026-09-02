import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const getVariantClass = () => {
    switch (variant.toLowerCase()) {
      case 'pending': return 'badge-pending';
      case 'confirmed': return 'badge-confirmed';
      case 'shipped': return 'badge-shipped';
      case 'delivered': return 'badge-delivered';
      case 'cancelled': return 'badge-cancelled';
      case 'active': case 'true': return 'badge-active';
      case 'inactive': case 'false': return 'badge-inactive';
      case 'admin': return 'badge-admin';
      case 'customer': return 'badge-customer';
      default: return 'badge-customer';
    }
  };

  return <span className={`badge ${getVariantClass()} ${className}`}>{children}</span>;
};
