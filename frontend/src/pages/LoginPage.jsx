import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authApi from '../services/authApi';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, verifyOtp } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState(searchParams.get('verify_email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification View state
  const [isOtpView, setIsOtpView] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(searchParams.get('verify_email') || '');
  const [otpCode, setOtpCode] = useState(searchParams.get('code') || '');
  const [devOtp, setDevOtp] = useState(searchParams.get('code') || '');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [otpErrorMessage, setOtpErrorMessage] = useState('');

  const timerRef = useRef(null);

  // Check URL params on mount
  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      toast.success('Your email has been verified! You can now sign in.');
    } else if (searchParams.get('expired') === '1') {
      toast.warning('Your session has expired. Please sign in again.');
    }

    const verifyEmailParam = searchParams.get('verify_email');
    const codeParam = searchParams.get('code');
    const storedOtp = verifyEmailParam ? sessionStorage.getItem('pending_otp_' + verifyEmailParam) : null;
    const initialCode = codeParam || storedOtp || '';

    if (verifyEmailParam) {
      setIsOtpView(true);
      setPendingEmail(verifyEmailParam);
      if (initialCode) {
        setOtpCode(initialCode);
        setDevOtp(initialCode);
      }
      startResendCountdown(60);
    }
  }, [searchParams, toast]);

  const startResendCountdown = (seconds) => {
    setResendSeconds(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const routeByRole = (role) => {
    setTimeout(() => {
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'recruiter') navigate('/recruiter/dashboard');
      else navigate('/candidate/dashboard');
    }, 300);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await login(email.trim(), password);

      // If first-login OTP verification is required
      if (res.data && res.data.requires_otp) {
        toast.info(res.message || 'OTP verification required.');
        setPendingEmail(res.data.email || email);
        setIsOtpView(true);
        if (res.data.dev_otp) {
          setOtpCode(res.data.dev_otp);
          setDevOtp(res.data.dev_otp);
          toast.info(`Verification code: ${res.data.dev_otp}`, 6000);
        }
        startResendCountdown(60);
        return;
      }

      toast.success('Login successful!');
      routeByRole(res.data?.user?.role);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpErrorMessage('Please enter a valid 6-digit OTP code.');
      return;
    }

    setOtpVerifying(true);
    setOtpErrorMessage('');

    try {
      const res = await verifyOtp(pendingEmail, otpCode.trim(), 'first_login_verify');
      toast.success('Account verified successfully!');
      sessionStorage.removeItem('pending_otp_' + pendingEmail);
      routeByRole(res.data?.user?.role);
    } catch (err) {
      setOtpErrorMessage(err.message || 'Verification failed. Please check the code.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendSeconds > 0) return;
    try {
      const res = await authApi.resendOtp(pendingEmail, 'first_login_verify');
      toast.success('A new 6-digit OTP has been sent to your email!');
      if (res.data && res.data.dev_otp) {
        setOtpCode(res.data.dev_otp);
        setDevOtp(res.data.dev_otp);
        toast.info(`Verification code: ${res.data.dev_otp}`, 6000);
      }
      startResendCountdown(60);
    } catch (err) {
      toast.error(err.message || 'Failed to resend OTP.');
    }
  };

  return (
    <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '40px 20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '36px 32px' }}>
        {!isOtpView ? (
          /* Standard Login Form */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <span className="material-icons" style={{ color: 'var(--accent-cyan)', fontSize: '26px' }}>lock_open</span>
              </div>
              <h2 style={{ fontSize: '1.6rem', margin: 0 }}>Sign In to Portal</h2>
              <p className="text-muted" style={{ marginTop: '6px', fontSize: '0.88rem' }}>
                Access candidate tracking, job applications, or recruiter hub.
              </p>
            </div>

            {errorMessage && (
              <div className="alert alert-danger" style={{ marginBottom: '16px', fontSize: '0.88rem' }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
                  <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  required
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', borderTop: '1px solid var(--md-sys-color-outline)', paddingTop: '18px' }}>
              <span className="text-muted">Don't have an account? </span>
              <Link to="/register" style={{ color: 'var(--accent-cyan)', fontWeight: 600, textDecoration: 'none' }}>
                Create Account
              </Link>
            </div>
          </div>
        ) : (
          /* OTP Verification View */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.12)', border: '1px solid var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <span className="material-icons" style={{ color: 'var(--accent-cyan)', fontSize: '28px' }}>mark_email_read</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Verify Your Email</h2>
              <p className="text-muted" style={{ marginTop: '6px', fontSize: '0.85rem' }}>
                A 6-digit verification code has been dispatched to:
                <br />
                <strong style={{ color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>{pendingEmail}</strong>
              </p>
            </div>

            {/* On-Screen Verification Code Banner */}
            {devOtp && (
              <div
                style={{
                  marginBottom: '18px',
                  padding: '12px 16px',
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid rgba(0, 240, 255, 0.35)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '4px' }}>
                  Verification Code
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '6px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {devOtp}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px', lineHeight: 1.3 }}>
                  Render Free Tier blocks outbound email ports (587). The code is displayed here for instant verification.
                </div>
              </div>
            )}

            {otpErrorMessage && (
              <div className="alert alert-danger" style={{ marginBottom: '16px', fontSize: '0.88rem' }}>
                {otpErrorMessage}
              </div>
            )}

            <form onSubmit={handleOtpSubmit}>
              <div className="form-group" style={{ textAlign: 'center', marginBottom: '18px' }}>
                <label className="form-label" htmlFor="otp-code">Enter 6-Digit Code</label>
                <input
                  type="text"
                  id="otp-code"
                  className="form-control"
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  style={{
                    textAlign: 'center',
                    fontSize: '1.75rem',
                    letterSpacing: '0.35em',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    height: '56px'
                  }}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
                <span className="text-muted" style={{ fontSize: '0.76rem', marginTop: '6px', display: 'block' }}>
                  Code expires in 10 minutes
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
                disabled={otpVerifying}
              >
                <span className="material-icons icon-sm">verified</span>
                {otpVerifying ? 'Verifying...' : ' Verify & Sign In'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
              <button
                type="button"
                onClick={() => setIsOtpView(false)}
                style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-primary)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <span className="material-icons icon-sm">arrow_back</span> Change Credentials
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendSeconds > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  cursor: resendSeconds > 0 ? 'not-allowed' : 'pointer',
                  opacity: resendSeconds > 0 ? 0.6 : 1,
                  padding: 0,
                  fontWeight: 600
                }}
              >
                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend OTP'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
