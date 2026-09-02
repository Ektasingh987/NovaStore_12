import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserById, fetchUserOrders, clearCurrentUser } from '../store/slices/usersSlice';
import { ArrowLeft, User, Mail, Phone, Calendar, ShoppingBag, Eye } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';

export const UserDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentUser: user, userOrders, detailLoading, ordersLoading, error } = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchUserById(id));
    dispatch(fetchUserOrders({ id }));
    return () => {
      dispatch(clearCurrentUser());
    };
  }, [dispatch, id]);

  if (detailLoading && !user) {
    return <LoadingSpinner fullScreen text="Loading user profile..." />;
  }

  if (error && !user) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchUserById(id))} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/users" className="btn btn-secondary btn-icon">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {user?.name}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            Customer Profile & Order History
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 lg-grid-cols-1 gap-6">
        {/* Left Card: Profile Information (1 col) */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} className="text-indigo-400" /> Account Summary
            </h3>
            <Badge variant={user?.isActive ? 'active' : 'inactive'}>
              {user?.isActive ? 'Active' : 'Deactivated'}
            </Badge>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                }}
              >
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                  {user?.name}
                </p>
                <Badge variant={user?.role} style={{ marginTop: '0.2rem' }}>
                  {user?.role}
                </Badge>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Mail size={16} className="text-muted" />
                <span>{user?.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Phone size={16} className="text-muted" />
                <span>{user?.phone || 'No phone provided'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Calendar size={16} className="text-muted" />
                <span>Member since {formatDate(user?.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Order History (2 cols) */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} className="text-indigo-400" /> Orders Placed ({userOrders.length})
              </h3>
            </div>

            {ordersLoading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : userOrders.length === 0 ? (
              <EmptyState
                title="No orders placed"
                description="This user has not placed any orders yet."
              />
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order Number</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOrders.map((order) => (
                      <tr key={order._id}>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>
                            {order.orderNumber}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                            {formatDate(order.createdAt)}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatCurrency(order.total)}
                          </span>
                        </td>
                        <td>
                          <Badge variant={order.status}>{order.status}</Badge>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/orders/${order._id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            <Eye size={14} /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
