import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, updateOrderStatus } from '../store/slices/ordersSlice';
import { Link } from 'react-router-dom';
import { Search, Eye, Filter, ShoppingBag } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ORDER_STATUSES } from '../constants';
import toast from 'react-hot-toast';

export const OrdersListPage = () => {
  const dispatch = useDispatch();
  const { items: orders, meta, loading, error } = useSelector((state) => state.orders);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = {
      page,
      limit: 15,
    };
    if (statusFilter) params.status = statusFilter;
    if (search.trim()) params.search = search.trim();

    dispatch(fetchOrders(params));
  }, [dispatch, page, statusFilter, search]);

  const handleStatusChange = async (orderId, newStatus) => {
    const result = await dispatch(updateOrderStatus({ id: orderId, status: newStatus }));
    if (updateOrderStatus.fulfilled.match(result)) {
      toast.success(`Order updated to ${newStatus}`);
    } else {
      toast.error(result.payload || 'Failed to update order status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Orders Management
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Track fulfillment lifecycle, manage shipping statuses, and view audit history
        </p>
      </div>

      {/* Filter Toolbar & Status Pills */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setStatusFilter('');
                setPage(1);
              }}
            >
              All Orders
            </button>
            {ORDER_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Row */}
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by Order ID, Name, Phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        {loading ? (
          <TableSkeleton rows={7} cols={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => dispatch(fetchOrders({ page, limit: 15 }))} />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description="There are no orders matching your current filter criteria."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status (Quick Update)</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>
                        {order.orderNumber}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {order.userId?.name || order.address?.fullName || 'Customer'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.userId?.email || order.address?.phone || ''}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatCurrency(order.total)}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        ({order.items?.length || 0} items)
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                        {order.paymentMethod}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '0.6875rem',
                          color: order.paymentStatus === 'Paid' ? 'var(--emerald)' : 'var(--amber)',
                        }}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          width: 'auto',
                        }}
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/orders/${order._id}`}
                        className="btn btn-secondary btn-sm"
                        title="View Full Order Details"
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

        <Pagination meta={meta} onPageChange={(newPage) => setPage(newPage)} />
      </div>
    </div>
  );
};
