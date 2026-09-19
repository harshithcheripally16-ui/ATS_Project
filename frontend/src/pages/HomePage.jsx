import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobsApi from '../services/jobsApi';
import { useAuth } from '../context/AuthContext';
import { useJobComparison } from '../context/JobComparisonContext';
import HeroCanvas from '../components/common/HeroCanvas';
import ApplyModal from '../components/candidate/ApplyModal';
import AtsScoreBadge from '../components/common/AtsScoreBadge';

export default function HomePage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingJob, setApplyingJob] = useState(null);
  const { role } = useAuth();
  const { toggleCompareJob, isInComparison } = useJobComparison();

  useEffect(() => {
    jobsApi.listJobs({ limit: 4, status: 'open' })
      .then(res => {
        setJobs(res.data?.items || []);
      })
      .catch(err => {
        console.warn('Failed to load featured jobs:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container">
      {/* 2.5D Interactive ATS Talent Pipeline Hero Section */}
      <section className="hero-ats-split">
        <HeroCanvas />

        {/* Left Column: ATS Value Proposition & CTA */}
        <div className="hero-ats-content">
          <div className="hero-badge-pill">
            <span className="hero-pulse-dot"></span>
            <span>NEXT-GEN RECRUITMENT ATS V1.1</span>
          </div>
          <h1>Modern Hiring & Talent Tracking Platform</h1>
          <p>
            Streamline your hiring process from application to offer. Review candidates, track pipeline stages, and collaborate seamlessly across your recruiting team.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <Link to="/jobs" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
              <span className="material-icons icon-sm">explore</span> Explore Positions
            </Link>
            <Link to="/register" className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
              <span className="material-icons icon-sm">how_to_reg</span> Get Started Free
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.84rem', color: 'var(--md-sys-color-on-surface-variant)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-icons icon-sm" style={{ color: '#10b981' }}>check_circle</span> Zero Setup Fee
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-icons icon-sm" style={{ color: 'var(--accent-cyan)' }}>shield</span> JWT & Role Security
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-icons icon-sm" style={{ color: 'var(--accent-blue)' }}>compare_arrows</span> Side-by-Side Role Comparison
            </span>
          </div>
        </div>

        {/* Right Column: Interactive 2.5D ATS Candidate Showcase Card */}
        <div className="card-25d-viewport">
          <div className="card-25d-stage" id="hero-interactive-card">
            <div className="card-25d-panel">
              <div className="match-score-chip">
                <span className="material-icons" style={{ fontSize: '14px' }}>auto_awesome</span>
                <span>98% Match Rate</span>
              </div>

              {/* Top Layer: Candidate Profile Overview */}
              <div className="float-3d-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: '#07090e', boxShadow: '0 4px 12px rgba(0, 240, 255, 0.3)' }}>
                    AV
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>Alex Vance</h4>
                      <span className="badge badge-interview" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>In Review</span>
                    </div>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)' }}>Senior Full-Stack Architect &bull; San Francisco</p>
                  </div>
                </div>
              </div>

              {/* Mid Layer: 4-Stage ATS Stepper Pipeline */}
              <div className="float-3d-mid">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="mono-tag" style={{ fontSize: '0.7rem' }}>// PIPELINE STAGE GATE</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>Stage 3 of 4</span>
                </div>
                <div className="ats-stepper">
                  <div className="ats-step completed">
                    <div className="ats-step-icon"><span className="material-icons" style={{ fontSize: '14px' }}>check</span></div>
                    <div className="ats-step-label">Applied</div>
                  </div>
                  <div className="ats-step completed">
                    <div className="ats-step-icon"><span className="material-icons" style={{ fontSize: '14px' }}>check</span></div>
                    <div className="ats-step-label">Screened</div>
                  </div>
                  <div className="ats-step active">
                    <div className="ats-step-icon"><span className="material-icons" style={{ fontSize: '14px' }}>psychology</span></div>
                    <div className="ats-step-label">Interview</div>
                  </div>
                  <div className="ats-step">
                    <div className="ats-step-icon">4</div>
                    <div className="ats-step-label">Selected</div>
                  </div>
                </div>
              </div>

              {/* Bottom Layer: Interview Event & Quick Actions */}
              <div className="float-3d-bottom">
                <div className="floating-interview-widget" style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-icons" style={{ fontSize: '18px' }}>event</span>
                    <span>System Architecture Deep-Dive</span>
                  </div>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>Today, 4:00 PM</strong>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link to="/jobs" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center', fontSize: '0.82rem' }}>
                    <span className="material-icons icon-sm">thumb_up</span> Advance Stage
                  </Link>
                  <Link to="/jobs" className="btn btn-secondary btn-sm" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                    <span className="material-icons icon-sm">visibility</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Highlights Grid */}
      <div className="grid grid-cols-3" style={{ marginBottom: '48px' }}>
        <div className="card card-interactive">
          <div className="mono-tag" style={{ marginBottom: '8px' }}>// FOR CANDIDATES</div>
          <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '12px', fontSize: '1.25rem' }}>Candidate Portal</h3>
          <p className="text-muted" style={{ marginBottom: '20px', fontSize: '0.92rem', lineHeight: 1.55 }}>
            Create your profile, upload your resume, compare jobs side-by-side, search openings by skill or location, and track your application progress in real time.
          </p>
          <Link to="/register?role=candidate" className="btn btn-secondary btn-sm">
            <span className="material-icons icon-sm">person_add</span> Join as Candidate
          </Link>
        </div>

        <div className="card card-interactive">
          <div className="mono-tag" style={{ marginBottom: '8px' }}>// FOR RECRUITERS</div>
          <h3 style={{ color: 'var(--accent-blue)', marginBottom: '12px', fontSize: '1.25rem' }}>Recruiter Suite</h3>
          <p className="text-muted" style={{ marginBottom: '20px', fontSize: '0.92rem', lineHeight: 1.55 }}>
            Post new job listings, review incoming applicants, evaluate resumes, move candidates through hiring stages, and schedule interviews.
          </p>
          <Link to="/register?role=recruiter" className="btn btn-secondary btn-sm">
            <span className="material-icons icon-sm">work</span> Post Jobs as Recruiter
          </Link>
        </div>

        <div className="card card-interactive">
          <div className="mono-tag" style={{ marginBottom: '8px' }}>// FOR DEVELOPERS</div>
          <h3 style={{ color: 'var(--accent-purple)', marginBottom: '12px', fontSize: '1.25rem' }}>Developer API & Docs</h3>
          <p className="text-muted" style={{ marginBottom: '20px', fontSize: '0.92rem', lineHeight: 1.55 }}>
            Explore interactive Swagger documentation to test endpoints live, check request formats, and easily connect recruitment data with your external tools.
          </p>
          <a href="/api/docs" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            <span className="material-icons icon-sm">code</span> View API Docs
          </a>
        </div>
      </div>

      {/* Featured Job Openings Section */}
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="mono-tag">// LIVE LISTINGS</div>
            <h2 style={{ marginTop: '4px', fontSize: '1.5rem' }}>Featured Job Opportunities</h2>
          </div>
          <Link to="/jobs" className="btn btn-secondary btn-sm">
            <span className="material-icons icon-sm">list_alt</span> View All Jobs &rarr;
          </Link>
        </div>

        {loading ? (
          <p className="text-muted">Loading open positions...</p>
        ) : jobs.length === 0 ? (
          <p className="text-muted">No open jobs at the moment. Recruiters can post new positions!</p>
        ) : (
          <div className="grid grid-cols-2">
            {jobs.map(job => {
              const compared = isInComparison(job.id);
              return (
                <div key={job.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                        <Link to={`/jobs/${job.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {job.title}
                        </Link>
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {job.ats_match && <AtsScoreBadge ats={job.ats_match} />}
                        <span className="badge badge-open">Open</span>
                      </div>
                    </div>

                    <p className="text-muted" style={{ marginBottom: '14px', fontSize: '0.86rem' }}>
                      {job.location || 'Remote'} &bull; {job.experience || 'Experience not specified'}
                    </p>

                    <p style={{ fontSize: '0.92rem', marginBottom: '20px', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.5 }}>
                      {job.description ? job.description.substring(0, 150) : ''}...
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--md-sys-color-outline)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {job.salary || 'Competitive'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Compare toggle button */}
                      <button
                        type="button"
                        className={`btn btn-sm ${compared ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => toggleCompareJob(job)}
                        title="Compare with other jobs"
                        style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                      >
                        <span className="material-icons" style={{ fontSize: '14px' }}>
                          {compared ? 'check_box' : 'add_box'}
                        </span>
                        <span>{compared ? 'Comparing' : 'Compare'}</span>
                      </button>

                      {role === 'candidate' ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setApplyingJob(job)}
                        >
                          Apply
                        </button>
                      ) : (
                        <Link to={`/jobs/${job.id}`} className="btn btn-primary btn-sm">
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Apply Modal */}
      {applyingJob && (
        <ApplyModal
          isOpen={Boolean(applyingJob)}
          onClose={() => setApplyingJob(null)}
          job={applyingJob}
        />
      )}
    </main>
  );
}
