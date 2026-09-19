import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authApi from '../services/authApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const toast = useToast();

  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';
  const codeParam = searchParams.get('code') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(codeParam || (emailParam ? sessionStorage.getItem('pending_otp_' + emailParam) || '' : ''));
  const [resendSeconds, setResendSeconds] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(token ? 'verifying' : null);
  const [tokenMessage, setTokenMessage] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (token) {
      authApi.verifyEmail(token)
        .then(res => {
          setTokenStatus('success');
          setTokenMessage(res.message || 'Email verified successfully! You can now log in.');
          toast.success('Email verified successfully!');
        })
        .catch(err => {
          setTokenStatus('error');
          setTokenMessage(err.message || 'Verification token is invalid or has expired.');
          toast.error('Token verification failed.');
        });
    }
  }, [token, toast]);

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

  const handleManualVerify = async (e) => {
    e.preventDefault();
    if (!email || !otp || otp.trim().length !== 6) {
      toast.error('Please enter your account email and a valid 6-digit OTP code.');
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyOtp(email.trim(), otp.trim(), 'first_login_verify');
      toast.success('Account verified successfully!');
      sessionStorage.removeItem('pending_otp_' + email);
      navigate('/login?verified=1');
    } catch (err) {
      toast.error(err.message || 'Verification failed. Please check the code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.warning('Please enter your account email first.');
      return;
    }
    try {
      const res = await authApi.resendOtp(email.trim(), 'first_login_verify');
      toast.success(res.message || 'A new 6-digit OTP has been sent to your email!');
      if (res.data?.dev_otp) {
        setOtp(res.data.dev_otp);
        toast.info(`Verification code: ${res.data.dev_otp}`);
      }
      startResendCountdown(60);
    } catch (err) {
      toast.error(err.message || 'Failed to resend OTP.');
    }
  };

  return (
    <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '40px 20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '36px 32px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <span className="material-icons" style={{ color: 'var(--accent-cyan)', fontSize: '28px' }}>mark_email_read</span>
        </div>

        <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Email Verification</h2>

        {/* Token Verification Status View */}
        {tokenStatus === 'verifying' && (
          <div style={{ padding: '24px 0' }}>
            <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 12px', border: '3px solid rgba(0, 240, 255, 0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            <p className="text-muted">Verifying your account token...</p>
          </div>
        )}

        {tokenStatus === 'success' && (
          <div className="alert alert-success" style={{ textAlign: 'left', marginBottom: '20px' }}>
            <strong>Verification Successful!</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>{tokenMessage}</p>
            <div style={{ marginTop: '12px' }}>
              <Link to="/login" className="btn btn-primary btn-sm">Proceed to Sign In</Link>
            </div>
          </div>
        )}

        {tokenStatus === 'error' && (
          <div className="alert alert-danger" style={{ textAlign: 'left', marginBottom: '20px' }}>
            <strong>Verification Failed</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>{tokenMessage}</p>
          </div>
        )}

        {/* Manual OTP Form View */}
        {(!token || tokenStatus === 'error') && (
          <form onSubmit={handleManualVerify} style={{ textAlign: 'left', marginTop: '16px' }}>
            <p className="text-muted" style={{ fontSize: '0.86rem', textAlign: 'center', marginBottom: '18px' }}>
              Enter the 6-digit OTP code sent to your registered email to verify and activate your account.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="manual-email">Account Email</label>
              <input
                type="email"
                id="manual-email"
                className="form-control"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="manual-otp">6-Digit Verification Code</label>
              <input
                type="text"
                id="manual-otp"
                className="form-control"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                inputMode="numeric"
                style={{ textAlign: 'center', fontSize: '1.6rem', letterSpacing: '0.3em', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '8px' }}
              disabled={verifying}
            >
              <span className="material-icons icon-sm">check_circle</span>
              {verifying ? 'Verifying...' : ' Verify Account'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.85rem' }}>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Didn't receive code?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendSeconds > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  cursor: resendSeconds > 0 ? 'not-allowed' : 'pointer',
                  padding: 0,
                  fontWeight: 600,
                  opacity: resendSeconds > 0 ? 0.6 : 1
                }}
              >
                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: '24px' }}>
          <Link to="/login" className="btn btn-secondary btn-sm">
            Proceed to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
