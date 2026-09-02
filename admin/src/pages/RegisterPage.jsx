import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerAdmin, clearAuthError } from '../store/slices/authSlice';
import {
  Store,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);

  // If already logged in, go to dashboard
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
    return () => { dispatch(clearAuthError()); };
  }, [isAuthenticated, navigate, dispatch]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    if (!phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone.trim())) {
      errs.phone = 'Phone number must be exactly 10 digits';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await dispatch(
      registerAdmin({ name: name.trim(), phone: phone.trim() })
    );

    if (registerAdmin.fulfilled.match(result)) {
      setSuccess(true);
      toast.success('Registration successful! You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  // ── Phone input — digits only, max 10 ───────────────────────────────────────
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(val);
    if (validationErrors.phone) setValidationErrors({ ...validationErrors, phone: null });
  };

  // ── Detect "already registered" error from API ───────────────────────────────
  const isPhoneDuplicate =
    error &&
    (error.toLowerCase().includes('phone') ||
      error.toLowerCase().includes('number') ||
      error.toLowerCase().includes('already') ||
      error.toLowerCase().includes('exist') ||
      error.toLowerCase().includes('registered') ||
      error.toLowerCase().includes('duplicate'));

  const displayError = isPhoneDuplicate
    ? 'This phone number is already registered.'
    : error;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0b0f19 70%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-80px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-60px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>

        {/* ── Brand Header ─────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '56px', height: '56px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(99,102,241,0.45)',
              marginBottom: '1rem',
            }}
          >
            <Store size={30} />
          </div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 800,
            letterSpacing: '-0.03em', color: 'var(--text-primary)',
          }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Register to access the ShopAdmin Portal
          </p>
        </div>

        {/* ── Card ─────────────────────────────────────────────────────────── */}
        <div className="card" style={{ padding: '2rem' }}>

          {/* Success state */}
          {success && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '0.75rem', padding: '1.5rem 0', textAlign: 'center',
              animation: 'fadeIn 300ms ease',
            }}>
              <CheckCircle size={48} style={{ color: 'var(--emerald)' }} />
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Registration Successful!
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Redirecting you to login…
              </p>
            </div>
          )}

          {!success && (
            <>
              {/* API error banner */}
              {displayError && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                  backgroundColor: 'var(--rose-light)',
                  color: 'var(--rose)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  marginBottom: '1.25rem',
                  animation: 'fadeIn 200ms ease',
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>{displayError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Name field */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-name">
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="reg-name"
                      type="text"
                      className={`form-input${validationErrors.name ? ' form-input-error' : ''}`}
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (validationErrors.name)
                          setValidationErrors({ ...validationErrors, name: null });
                      }}
                      style={{ paddingLeft: '2.5rem' }}
                      autoComplete="name"
                      autoFocus
                    />
                    <User
                      size={16}
                      style={{
                        position: 'absolute', left: '0.875rem',
                        top: '50%', transform: 'translateY(-50%)',
                        color: validationErrors.name ? 'var(--rose)' : 'var(--text-muted)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                  {validationErrors.name && (
                    <p className="form-error">{validationErrors.name}</p>
                  )}
                </div>

                {/* Phone field */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-phone">
                    Phone Number
                    <span style={{
                      marginLeft: '0.4rem',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      fontWeight: 400,
                    }}>
                      (10 digits)
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="reg-phone"
                      type="tel"
                      inputMode="numeric"
                      className={`form-input${validationErrors.phone ? ' form-input-error' : ''}`}
                      placeholder="9876543210"
                      value={phone}
                      onChange={handlePhoneChange}
                      maxLength={10}
                      style={{ paddingLeft: '2.5rem', paddingRight: '3.5rem', letterSpacing: '0.05em' }}
                      autoComplete="tel"
                    />
                    <Phone
                      size={16}
                      style={{
                        position: 'absolute', left: '0.875rem',
                        top: '50%', transform: 'translateY(-50%)',
                        color: validationErrors.phone ? 'var(--rose)' : 'var(--text-muted)',
                        pointerEvents: 'none',
                      }}
                    />
                    {/* Live digit counter */}
                    <span style={{
                      position: 'absolute', right: '0.875rem',
                      top: '50%', transform: 'translateY(-50%)',
                      fontSize: '0.75rem', fontWeight: 600,
                      color: phone.length === 10 ? 'var(--emerald)' : 'var(--text-muted)',
                      pointerEvents: 'none',
                    }}>
                      {phone.length}/10
                    </span>
                  </div>
                  {validationErrors.phone && (
                    <p className="form-error">{validationErrors.phone}</p>
                  )}
                  {/* Duplicate phone inline error */}
                  {isPhoneDuplicate && !validationErrors.phone && (
                    <p className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} /> Number already registered
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem', marginTop: '0.25rem' }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="spinner" />
                      Creating account…
                    </span>
                  ) : (
                    <>
                      Create Account <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Login link */}
              <div style={{
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-color)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    style={{
                      color: 'var(--primary)',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <ArrowLeft size={13} /> Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
