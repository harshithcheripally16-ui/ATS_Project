import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../services/authApi';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentInfo, setSentInfo] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      const devOtp = res.data?.dev_otp;
      setSentInfo({
        email: email.trim(),
        devOtp
      });
      toast.success(res.message || 'Password reset instructions sent!');
      if (devOtp) {
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email.trim())}&otp=${encodeURIComponent(devOtp)}`);
        }, 2500);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '40px 20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <span className="material-icons" style={{ color: 'var(--accent-cyan)', fontSize: '26px' }}>lock_reset</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Reset Your Password</h2>
          <p className="text-muted" style={{ marginTop: '6px', fontSize: '0.86rem' }}>
            Enter your registered email address and we will dispatch a 6-digit recovery code.
          </p>
        </div>

        {sentInfo ? (
          <div className="alert alert-success" style={{ fontSize: '0.88rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <strong>Reset code dispatched!</strong>
            <p style={{ margin: '6px 0', fontSize: '0.82rem' }}>
              Check <strong>{sentInfo.email}</strong> for your recovery code.
            </p>
            {sentInfo.devOtp && (
              <div style={{ margin: '8px 0', padding: '6px 10px', background: 'rgba(0, 240, 255, 0.15)', border: '1px solid rgba(0, 240, 255, 0.4)', borderRadius: '6px', fontWeight: 700, color: '#38bdf8' }}>
                Demo Recovery Code: {sentInfo.devOtp}
              </div>
            )}
            <Link
              to={`/reset-password?email=${encodeURIComponent(sentInfo.email)}${sentInfo.devOtp ? '&otp=' + encodeURIComponent(sentInfo.devOtp) : ''}`}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}
            >
              Continue to Reset Password &rarr;
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="reset-email">Registered Email</label>
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

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              disabled={loading}
            >
              {loading ? 'Sending Code...' : 'Send Recovery Code'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.86rem', borderTop: '1px solid var(--md-sys-color-outline)', paddingTop: '16px' }}>
          <Link to="/login" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
            &larr; Return to Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
