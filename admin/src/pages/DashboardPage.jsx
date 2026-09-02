import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../store/slices/dashboardSlice';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

export const DashboardPage = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

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
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    recentOrders = [],
    ordersByStatus = {},
  } = stats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Overview & Insights
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Real-time snapshot of your store's sales, inventory, and fulfillment
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-4 lg-grid-cols-2 gap-4">
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          color="var(--emerald)"
          bgColor="var(--emerald-light)"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={totalOrders}
          color="var(--primary)"
          bgColor="var(--primary-light)"
        />
        <StatCard
          icon={Package}
          label="Active Products"
          value={totalProducts}
          color="var(--purple)"
          bgColor="var(--purple-light)"
        />
        <StatCard
          icon={Users}
          label="Registered Customers"
          value={totalUsers}
          color="var(--blue)"
          bgColor="var(--blue-light)"
        />
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

      {/* Recent Orders Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Recent Orders
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Latest customer purchases and current status
            </p>
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
                      <Link
                        to={`/orders/${order.id || order._id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        View Details
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
  );
};
