import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const [role, setRole] = useState(searchParams.get('role') || 'candidate');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        role,
        password
      };

      const res = await register(payload);
      const devOtp = res.data?.dev_otp;

      if (devOtp) {
        sessionStorage.setItem('pending_otp_' + payload.email, devOtp);
      }

      setSuccessInfo({
        message: res.message || 'Registration successful! An OTP code has been sent.',
        devOtp,
        email: payload.email
      });

      toast.success(res.message || 'Account created successfully!');

      const redirectUrl = `/login?verify_email=${encodeURIComponent(payload.email)}${devOtp ? '&code=' + encodeURIComponent(devOtp) : ''}`;
      setTimeout(() => {
        navigate(redirectUrl);
      }, devOtp ? 3000 : 2000);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '40px 20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <span className="material-icons" style={{ color: 'var(--accent-cyan)', fontSize: '26px' }}>person_add</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', margin: 0 }}>Create an Account</h2>
          <p className="text-muted" style={{ marginTop: '6px', fontSize: '0.88rem' }}>
            Join the Recruitment ATS talent and hiring network.
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" style={{ marginBottom: '16px', fontSize: '0.88rem' }}>
            {errorMessage}
          </div>
        )}

        {successInfo && (
          <div
            className="alert alert-success"
            style={{ marginBottom: '18px', fontSize: '0.88rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}
          >
            <strong>{successInfo.message}</strong>
            <p style={{ margin: '8px 0', fontSize: '0.84rem' }}>
              A 6-digit verification code has been dispatched to <strong>{successInfo.email}</strong>.
            </p>
            {successInfo.devOtp && (
              <div style={{ margin: '8px 0', padding: '6px 10px', background: 'rgba(0, 240, 255, 0.15)', border: '1px solid rgba(0, 240, 255, 0.4)', borderRadius: '6px', fontWeight: 700, color: '#38bdf8' }}>
                Demo Verification Code: {successInfo.devOtp}
              </div>
            )}
            <Link
              to={`/login?verify_email=${encodeURIComponent(successInfo.email)}${successInfo.devOtp ? '&code=' + encodeURIComponent(successInfo.devOtp) : ''}`}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}
            >
              <span className="material-icons icon-sm">verified</span> Enter OTP to Sign In &rarr;
            </Link>
          </div>
        )}

        {!successInfo && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="role">Account Type</label>
              <select
                id="role"
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="candidate">Candidate (Job Seeker / Applicant)</option>
                <option value="recruiter">Recruiter (Hiring Manager / Talent Lead)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                className="form-control"
                required
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-control"
                required
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Contact Phone (Optional)</label>
              <input
                type="tel"
                id="phone"
                className="form-control"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                required
                placeholder="At least 6 characters"
                minLength={6}
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', borderTop: '1px solid var(--md-sys-color-outline)', paddingTop: '18px' }}>
          <span className="text-muted">Already registered? </span>
          <Link to="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
