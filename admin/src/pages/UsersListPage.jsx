import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUserStatus } from '../store/slices/usersSlice';
import { Link } from 'react-router-dom';
import { Search, Eye, UserCheck, UserX, Users, ShieldAlert } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { formatDateShort } from '../utils/formatters';
import toast from 'react-hot-toast';

export const UsersListPage = () => {
  const dispatch = useDispatch();
  const { items: users, meta, loading, error } = useSelector((state) => state.users);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Status Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const params = {
      page,
      limit: 10,
    };
    if (search.trim()) params.search = search.trim();
    if (roleFilter) params.role = roleFilter;
    if (activeFilter) params.isActive = activeFilter;

    dispatch(fetchUsers(params));
  }, [dispatch, page, search, roleFilter, activeFilter]);

  const handleToggleClick = (user) => {
    setUserToToggle(user);
    setStatusModalOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!userToToggle) return;
    setToggling(true);
    const newStatus = !userToToggle.isActive;
    const result = await dispatch(updateUserStatus({ id: userToToggle._id || userToToggle.id, isActive: newStatus }));
    setToggling(false);
    setStatusModalOpen(false);
    setUserToToggle(null);

    if (updateUserStatus.fulfilled.match(result)) {
      toast.success(`User successfully ${newStatus ? 'activated' : 'deactivated'}`);
    } else {
      toast.error(result.payload || 'Failed to update user status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          User Accounts
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Monitor customer accounts, manage permissions, and enforce security policies
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div className="grid grid-cols-3 md-grid-cols-1 gap-3">
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, email, or phone..."
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

          {/* Role Filter */}
          <div>
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Roles</option>
              <option value="customer">Customers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          {/* Active Filter */}
          <div>
            <select
              className="form-select"
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => dispatch(fetchUsers({ page, limit: 10 }))} />
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="No user records match your search query."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const id = user._id || user.id;
                  return (
                    <tr key={id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-light)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '0.8125rem',
                              flexShrink: 0,
                            }}
                          >
                            {user.name ? user.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                              {user.name}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {user.phone || '—'}
                        </span>
                      </td>
                      <td>
                        <Badge variant={user.role}>{user.role}</Badge>
                      </td>
                      <td>
                        <Badge variant={user.isActive ? 'active' : 'inactive'}>
                          {user.isActive ? 'Active' : 'Deactivated'}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {formatDateShort(user.createdAt)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <Link
                            to={`/users/${id}`}
                            className="btn btn-secondary btn-icon"
                            title="View User Details & Orders"
                          >
                            <Eye size={15} />
                          </Link>
                          <button
                            type="button"
                            className={`btn btn-icon ${user.isActive ? 'btn-outline-danger' : 'btn-secondary'}`}
                            title={user.isActive ? 'Deactivate User' : 'Activate User'}
                            onClick={() => handleToggleClick(user)}
                          >
                            {user.isActive ? <UserX size={15} /> : <UserCheck size={15} className="text-emerald-400" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={meta} onPageChange={(newPage) => setPage(newPage)} />
      </div>

      {/* Deactivation / Activation Confirmation Modal */}
      <ConfirmModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setUserToToggle(null);
        }}
        onConfirm={handleStatusConfirm}
        title={userToToggle?.isActive ? 'Deactivate User Account' : 'Activate User Account'}
        message={
          userToToggle?.isActive
            ? `Are you sure you want to deactivate ${userToToggle?.name}'s account? This will immediately revoke all active refresh token sessions and block login access.`
            : `Are you sure you want to restore active access for ${userToToggle?.name}?`
        }
        confirmText={userToToggle?.isActive ? 'Deactivate' : 'Activate'}
        isDestructive={userToToggle?.isActive}
        loading={toggling}
      />
    </div>
  );
};
