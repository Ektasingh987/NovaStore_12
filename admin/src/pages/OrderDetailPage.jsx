import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById, updateOrderStatus, clearCurrentOrder } from '../store/slices/ordersSlice';
import { ArrowLeft, MapPin, User, CreditCard, Package, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ORDER_STATUSES } from '../constants';
import toast from 'react-hot-toast';

export const OrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder: order, detailLoading, updatingStatus, error } = useSelector((state) => state.orders);

  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    dispatch(fetchOrderById(id));
    return () => {
      dispatch(clearCurrentOrder());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
    }
  }, [order]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) return;

    const result = await dispatch(
      updateOrderStatus({ id, status: selectedStatus, note: statusNote.trim() })
    );

    if (updateOrderStatus.fulfilled.match(result)) {
      toast.success(`Order status updated to ${selectedStatus}`);
      setStatusNote('');
    } else {
      toast.error(result.payload || 'Failed to update order status');
    }
  };

  if (detailLoading) {
    return <LoadingSpinner fullScreen text="Loading order details..." />;
  }

  if (error || !order) {
    return (
      <ErrorState
        title="Order Not Found"
        message={error || 'Unable to retrieve order details.'}
        onRetry={() => dispatch(fetchOrderById(id))}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/orders" className="btn btn-secondary btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {order.orderNumber}
              </h2>
              <Badge variant={order.status}>{order.status}</Badge>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 lg-grid-cols-1 gap-6">
        {/* Left Column: Items & Timeline (2 cols) */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Order Items Table */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={18} className="text-indigo-400" /> Order Items ({order.items?.length || 0})
              </h3>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, idx) => {
                    const price = item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price;
                    const lineTotal = price * item.quantity;
                    return (
                      <tr key={idx}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--bg-surface-elevated)',
                                border: '1px solid var(--border-color)',
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}
                            >
                              {item.image ? (
                                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Package size={20} style={{ margin: '12px auto', color: 'var(--text-muted)' }} />
                              )}
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                {item.name}
                              </p>
                              {item.discount > 0 && (
                                <span style={{ fontSize: '0.6875rem', color: 'var(--emerald)' }}>
                                  {item.discount}% discount applied
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{formatCurrency(price)}</td>
                        <td>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span>Delivery Charge:</span>
                <span>{order.deliveryCharge === 0 ? 'Free' : formatCurrency(order.deliveryCharge)}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--emerald)' }}>
                  <span>Coupon Discount:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border-color)',
                  marginTop: '0.25rem',
                }}
              >
                <span>Total Amount:</span>
                <span style={{ color: 'var(--primary)' }}>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Status History Log */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} className="text-indigo-400" /> Status & Audit Timeline
              </h3>
            </div>
            <div className="card-body">
              {order.statusHistory?.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No status changes recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {order.statusHistory?.map((hist, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                          marginTop: '6px',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {hist.status}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatDate(hist.changedAt)}
                          </span>
                        </div>
                        {hist.note && (
                          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {hist.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Update Status & Customer Details (1 col) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Updater Card */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Update Order Status
              </h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="status-select">
                    Fulfillment Status
                  </label>
                  <select
                    id="status-select"
                    className="form-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="status-note">
                    Internal Note / Reason (Optional)
                  </label>
                  <textarea
                    id="status-note"
                    className="form-textarea"
                    rows={2}
                    placeholder="e.g. Courier tracking #AWB12345 dispatched"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updatingStatus || selectedStatus === order.status}
                  style={{ width: '100%' }}
                >
                  {updatingStatus ? 'Updating...' : 'Save Status Change'}
                </button>
              </form>
            </div>
          </div>

          {/* Customer & Address Details Card */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} className="text-indigo-400" /> Customer & Shipping
              </h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Customer Profile
                </p>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  {order.userId?.name || order.address?.fullName}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {order.userId?.email || 'No email attached'}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {order.address?.phone || order.userId?.phone}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Delivery Address
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {order.address?.line1}
                  {order.address?.line2 ? `, ${order.address.line2}` : ''}
                  <br />
                  {order.address?.city}, {order.address?.state} - {order.address?.postalCode}
                  <br />
                  {order.address?.country}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Payment Details
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{order.paymentMethod}</span>
                  <Badge variant={order.paymentStatus === 'Paid' ? 'active' : 'pending'}>
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
