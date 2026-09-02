import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../store/slices/dashboardSlice';
import { deleteOrder } from '../store/slices/ordersSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatCurrency, formatDate, formatDateShort } from '../utils/formatters';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  Package,
  ShoppingBag,
  IndianRupee,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Trash2,
  Eye,
  UserCheck,
  FolderTree,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const DashboardPage = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((state) => state.dashboard);
  const { items: customerUsers, loading: usersLoading } = useSelector((state) => state.users);

  // Delete Order Modal state
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchUsers({ page: 1, limit: 5, role: 'customer' }));
  }, [dispatch]);

  const handleDeleteOrderClick = (order) => {
    setOrderToDelete(order);
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    const orderId = orderToDelete.id || orderToDelete._id;

    try {
      const result = await dispatch(deleteOrder(orderId));
      if (deleteOrder.fulfilled.match(result)) {
        toast.success(`Order ${orderToDelete.orderNumber || ''} deleted successfully`);
        // Refresh dashboard statistics immediately
        dispatch(fetchDashboardStats());
      } else {
        toast.error(result.payload || 'Failed to delete order');
      }
    } catch {
      toast.error('An unexpected error occurred while deleting order');
    } finally {
      setIsDeleting(false);
      setOrderToDelete(null);
    }
  };

  if (loading && !stats.totalOrders) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="grid grid-cols-4 lg-grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error && !stats.totalOrders) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchDashboardStats())} />;
  }

  const {
    totalUsers = 0,
    totalProducts = 0,
    totalOrders = 0,
    totalRevenue = 0,
    recentOrders = [],
    ordersByStatus = {},
  } = stats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner & Quick Management Options */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Store Dashboard & Management
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Real-time analytics, user account management, and order fulfillment controls
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link to="/users" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={15} className="text-blue-400" />
            <span>User Accounts</span>
            <span
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--blue)',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontSize: '0.6875rem',
                fontWeight: 700,
              }}
            >
              {totalUsers}
            </span>
          </Link>

          <Link to="/orders" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShoppingBag size={15} className="text-indigo-400" />
            <span>Orders</span>
            <span
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontSize: '0.6875rem',
                fontWeight: 700,
              }}
            >
              {totalOrders}
            </span>
          </Link>

          <Link to="/products" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Package size={15} className="text-purple-400" />
            <span>Products</span>
          </Link>

          <Link to="/categories" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FolderTree size={15} />
            <span>Categories</span>
          </Link>
        </div>
      </div>

      {/* 4 Clickable Metric Cards */}
      <div className="grid grid-cols-4 lg-grid-cols-2 gap-4">
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          color="var(--emerald)"
          bgColor="var(--emerald-light)"
        />

        <Link to="/orders" style={{ textDecoration: 'none', color: 'inherit' }} title="View all orders">
          <StatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={totalOrders}
            color="var(--primary)"
            bgColor="var(--primary-light)"
          />
        </Link>

        <Link to="/products" style={{ textDecoration: 'none', color: 'inherit' }} title="Manage products">
          <StatCard
            icon={Package}
            label="Active Products"
            value={totalProducts}
            color="var(--purple)"
            bgColor="var(--purple-light)"
          />
        </Link>

        <Link to="/users" style={{ textDecoration: 'none', color: 'inherit' }} title="Manage user accounts">
          <StatCard
            icon={Users}
            label="User Accounts"
            value={totalUsers}
            color="var(--blue)"
            bgColor="var(--blue-light)"
          />
        </Link>
      </div>

      {/* Status Breakdown Section */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} className="text-indigo-400" /> Fulfillment Status Breakdown
          </h3>
          <Link to="/orders" className="btn btn-secondary btn-sm">
            View All Orders <ArrowRight size={14} />
          </Link>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-5 md-grid-cols-1 gap-3">
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--amber)', marginBottom: '0.25rem' }}>
                <Clock size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Pending</span>
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {ordersByStatus.Pending || 0}
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--blue)', marginBottom: '0.25rem' }}>
                <CheckCircle2 size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Confirmed</span>
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {ordersByStatus.Confirmed || 0}
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--purple)', marginBottom: '0.25rem' }}>
                <Truck size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Shipped</span>
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {ordersByStatus.Shipped || 0}
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--emerald)', marginBottom: '0.25rem' }}>
                <CheckCircle2 size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Delivered</span>
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {ordersByStatus.Delivered || 0}
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rose)', marginBottom: '0.25rem' }}>
                <XCircle size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Cancelled</span>
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {ordersByStatus.Cancelled || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section with Delete Order Action */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} className="text-primary" />
              Recent Orders & Fulfillment Controls
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Inspect recent purchases, review customer details, or delete unwanted order records
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/orders" className="btn btn-secondary btn-sm">
              Manage All Orders <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <EmptyState
            title="No orders placed yet"
            description="When customers make purchases, orders will appear here."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id || order._id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>
                        {order.orderNumber}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{order.customerName}</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(order.total)}</span>
                    </td>
                    <td>
                      <Badge variant={order.status}>{order.status}</Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/orders/${order.id || order._id}`}
                          className="btn btn-secondary btn-sm"
                          title="View Order Details"
                        >
                          <Eye size={13} /> View
                        </Link>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          title="Delete Order"
                          onClick={() => handleDeleteOrderClick(order)}
                          style={{ padding: '0.35rem 0.6rem' }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Accounts Overview Section */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} className="text-blue-400" />
              Registered Customer Accounts
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Verified active customer profiles and authentication statuses
            </p>
          </div>
          <Link to="/users" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Manage All Accounts</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {usersLoading && customerUsers.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading customer accounts...
          </div>
        ) : customerUsers.length === 0 ? (
          <EmptyState
            title="No customer accounts found"
            description="When users register on the mobile app or web, their accounts will appear here."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Registered Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customerUsers.map((user) => (
                  <tr key={user._id || user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            color: 'var(--blue)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                          }}
                        >
                          {user.name ? user.name[0].toUpperCase() : 'U'}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{user.email}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          textTransform: 'capitalize',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: user.role === 'admin' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                          color: user.role === 'admin' ? 'var(--primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: user.isActive !== false ? 'var(--emerald)' : 'var(--rose)',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: user.isActive !== false ? 'var(--emerald)' : 'var(--rose)',
                          }}
                        />
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {formatDateShort(user.createdAt)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/users/${user._id || user.id}`}
                        className="btn btn-secondary btn-sm"
                        title="View User Account Details"
                      >
                        <ExternalLink size={13} /> View Account
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Delete Order Modal */}
      <ConfirmModal
        isOpen={Boolean(orderToDelete)}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleConfirmDeleteOrder}
        title="Delete Order Record"
        message={`Are you sure you want to permanently delete order "${orderToDelete?.orderNumber}"? This will remove the order and its fulfillment history from the database.`}
        confirmText="Delete Order"
        cancelText="Keep Order"
        isDestructive={true}
        loading={isDeleting}
      />
    </div>
  );
};
