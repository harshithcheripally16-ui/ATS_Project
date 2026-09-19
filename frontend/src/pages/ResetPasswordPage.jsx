import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authApi from '../services/authApi';
import { useToast } from '../context/ToastContext';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState(searchParams.get('otp') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload = token
        ? { token, password: newPassword }
        : { email: email.trim(), otp: otp.trim(), password: newPassword };

      const res = await authApi.resetPassword(payload);
      toast.success(res.message || 'Password reset successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '40px 20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <span className="material-icons" style={{ color: 'var(--accent-cyan)', fontSize: '26px' }}>vpn_key</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Set New Password</h2>
          <p className="text-muted" style={{ marginTop: '6px', fontSize: '0.86rem' }}>
            Enter your recovery verification code and new password.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!token && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Account Email</label>
                <input
                  type="email"
                  id="reset-email"
                  className="form-control"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-otp">6-Digit Recovery Code</label>
                <input
                  type="text"
                  id="reset-otp"
                  className="form-control"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.25em', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="new-password">New Password</label>
            <input
              type="password"
              id="new-password"
              className="form-control"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
            <input
              type="password"
              id="confirm-password"
              className="form-control"
              required
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Resetting Password...' : 'Save New Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.86rem', borderTop: '1px solid var(--md-sys-color-outline)', paddingTop: '16px' }}>
          <Link to="/login" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
            &larr; Cancel and Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
