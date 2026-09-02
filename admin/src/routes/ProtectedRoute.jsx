import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { checkAuth } from '../store/slices/authSlice';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user, initialCheckDone, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!initialCheckDone && localStorage.getItem('accessToken')) {
      dispatch(checkAuth());
    }
  }, [dispatch, initialCheckDone]);

  // Initial check is running
  if (!initialCheckDone && localStorage.getItem('accessToken') && loading) {
    return <LoadingSpinner fullScreen text="Verifying session..." />;
  }

  // Not authenticated or not an admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
