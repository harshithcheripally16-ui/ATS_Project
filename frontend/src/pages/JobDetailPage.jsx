import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import jobsApi from '../services/jobsApi';
import { useAuth } from '../context/AuthContext';
import { useJobComparison } from '../context/JobComparisonContext';
import AtsScoreBadge from '../components/common/AtsScoreBadge';
import ApplyModal from '../components/candidate/ApplyModal';

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const { isAuthenticated, role } = useAuth();
  const { toggleCompareJob, isInComparison } = useJobComparison();
  const navigate = useNavigate();

  useEffect(() => {
    jobsApi.getJob(id)
      .then(res => setJob(res.data || null))
      .catch(err => {
        console.warn('Failed to load job details:', err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px', border: '3px solid rgba(0, 240, 255, 0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <p className="text-muted">Loading position details...</p>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Position Not Found</h2>
        <p className="text-muted">The job listing you requested may have closed or does not exist.</p>
        <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Browse All Jobs
        </Link>
      </main>
    );
  }

  const compared = isInComparison(job.id);
  const skillsList = (job.skills || '').split(',').map(s => s.trim()).filter(Boolean);

  return (
    <main className="container">
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '20px', fontSize: '0.86rem' }}>
        <Link to="/jobs" style={{ color: 'var(--md-sys-color-on-surface-variant)', textDecoration: 'none' }}>
          &larr; Back to Job Listings
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '28px', alignItems: 'flex-start' }}>
        {/* Left Column: Job Main Content */}
        <div>
          {/* Header Card */}
          <div className="card" style={{ marginBottom: '24px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
              <div>
                <span className="mono-tag" style={{ fontSize: '0.78rem' }}>
                  {job.category?.name || 'ENGINEERING'}
                </span>
                <h1 style={{ fontSize: '2.1rem', margin: '6px 0 10px 0' }}>{job.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-icons icon-sm" style={{ color: 'var(--accent-cyan)' }}>location_on</span>
                    {job.location || 'Remote'}
                  </span>
                  <span>&bull;</span>
                  <span>{job.experience || 'Experience not specified'}</span>
                  <span>&bull;</span>
                  <span className={`badge badge-${job.status}`}>{job.status}</span>
                </div>
              </div>

              {job.ats_match && (
                <div style={{ textAlign: 'right' }}>
                  <span className="text-muted" style={{ fontSize: '0.76rem', display: 'block', marginBottom: '4px' }}>
                    Your Profile Compatibility:
                  </span>
                  <AtsScoreBadge ats={job.ats_match} />
                </div>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--md-sys-color-outline)',
                borderRadius: '8px',
                padding: '14px',
                marginTop: '18px'
              }}
            >
              <div>
                <span className="text-muted" style={{ fontSize: '0.76rem' }}>COMPENSATION</span>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {job.salary || 'Competitive'}
                </div>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: '0.76rem' }}>EXPERIENCE</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--md-sys-color-on-surface)' }}>
                  {job.experience || 'Not specified'}
                </div>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: '0.76rem' }}>APPLICATION DEADLINE</span>
                <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--md-sys-color-on-surface)' }}>
                  {job.deadline || 'Ongoing / Open'}
                </div>
              </div>
            </div>
          </div>

          {/* Job Description Card */}
          <div className="card" style={{ marginBottom: '24px', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-icons icon-sm" style={{ color: 'var(--accent-cyan)' }}>description</span>
              Role Description & Responsibilities
            </h3>
            <div style={{ fontSize: '0.96rem', lineHeight: 1.7, color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'pre-line' }}>
              {job.description}
            </div>
          </div>

          {/* Required Skills Matrix Card */}
          <div className="card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-icons icon-sm" style={{ color: 'var(--accent-cyan)' }}>hub</span>
              Required Technical Competencies & Skills
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {skillsList.map((skill, idx) => (
                <span
                  key={idx}
                  className="badge"
                  style={{
                    background: 'rgba(0, 240, 255, 0.08)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.84rem',
                    padding: '6px 14px'
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Action Sidebar */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Take Action</h4>

            {role === 'candidate' ? (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '12px', padding: '12px' }}
                onClick={() => setIsApplyOpen(true)}
              >
                <span className="material-icons icon-sm">send</span> Apply for this Position
              </button>
            ) : !isAuthenticated ? (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '12px', padding: '12px' }}
                onClick={() => navigate(`/login?redirect=/jobs/${job.id}`)}
              >
                <span className="material-icons icon-sm">login</span> Sign In to Apply
              </button>
            ) : null}

            {/* Compare Toggle Button */}
            <button
              type="button"
              className={`btn ${compared ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: '100%', marginBottom: '18px' }}
              onClick={() => toggleCompareJob(job)}
            >
              <span className="material-icons icon-sm">
                {compared ? 'check_box' : 'compare_arrows'}
              </span>
              <span>{compared ? 'In Comparison Matrix' : 'Compare Side-by-Side'}</span>
            </button>

            {/* Recruiter Details */}
            <div style={{ borderTop: '1px solid var(--md-sys-color-outline)', paddingTop: '16px' }}>
              <span className="text-muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>
                Hiring Organization
              </span>
              <div style={{ fontWeight: 700, marginTop: '4px', fontSize: '0.94rem' }}>
                {job.recruiter?.name || 'Recruitment Team'}
              </div>
              <div className="text-muted" style={{ fontSize: '0.82rem', marginTop: '2px' }}>
                Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {isApplyOpen && (
        <ApplyModal
          isOpen={isApplyOpen}
          onClose={() => setIsApplyOpen(false)}
          job={job}
          onSuccess={() => {
            // Reload job details to refresh ATS state
            jobsApi.getJob(id).then(res => setJob(res.data || job));
          }}
        />
      )}
    </main>
  );
}
