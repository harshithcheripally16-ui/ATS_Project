import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobsApi from '../../services/jobsApi';
import applicationsApi from '../../services/applicationsApi';
import interviewsApi from '../../services/interviewsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AtsScoreBadge from '../../components/common/AtsScoreBadge';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [interviewCount, setInterviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      jobsApi.getMyJobs(1, 10, 'all'),
      applicationsApi.getAllApplications({ limit: 6 }),
      interviewsApi.getRecruiterInterviews(1, 5)
    ])
      .then(([jobsRes, appsRes, intRes]) => {
        setJobs(jobsRes.data?.items || []);
        setRecentApplications(appsRes.data?.items || []);
        setInterviewCount(intRes.data?.pagination?.total_items || intRes.data?.items?.length || 0);
      })
      .catch(err => {
        toast.error('Failed to load recruiter hub metrics: ' + err.message);
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const activeJobsCount = jobs.filter(j => j.status === 'open').length;
  const totalApplicantsCount = recentApplications.length;

  return (
    <main className="container">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '32px' }}>
        <div>
          <div className="mono-tag" style={{ marginBottom: '6px' }}>RECRUITER COMMAND CENTER</div>
          <h1 style={{ fontSize: '2.1rem', margin: 0 }}>Recruiter Hub</h1>
          <p className="text-muted" style={{ marginTop: '4px', fontSize: '0.94rem' }}>
            Manage active job listings, review candidate pipelines, and coordinate interview stages.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/recruiter/post-job" className="btn btn-primary btn-sm">
            <span className="material-icons icon-sm">add_circle_outline</span> Post New Opening
          </Link>
          <Link to="/recruiter/applicants" className="btn btn-secondary btn-sm">
            <span className="material-icons icon-sm">view_kanban</span> Candidate Pipeline
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4" style={{ marginBottom: '32px' }}>
        <div className="card">
          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Openings
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {activeJobsCount}
          </div>
        </div>

        <div className="card">
          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Job Posts
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', marginTop: '4px' }}>
            {jobs.length}
          </div>
        </div>

        <div className="card">
          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pipeline Candidates
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>
            {totalApplicantsCount}
          </div>
        </div>

        <div className="card">
          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scheduled Interviews
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>
            {interviewCount}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '28px', alignItems: 'flex-start' }}>
        {/* Left Column: Posted Jobs Table */}
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>My Active Job Listings</h3>
            <Link to="/recruiter/post-job" className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
              + Create Post
            </Link>
          </div>

          {loading ? (
            <p className="text-muted">Loading job posts...</p>
          ) : jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px' }}>
              <p className="text-muted">No jobs posted yet.</p>
              <Link to="/recruiter/post-job" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                Post Your First Position
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th>Role Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td>
                        <strong style={{ fontSize: '0.94rem' }}>{job.title}</strong>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>{job.location || 'Remote'}</div>
                      </td>
                      <td style={{ fontSize: '0.86rem' }}>{job.category?.name || 'General'}</td>
                      <td>
                        <span className={`badge badge-${job.status}`}>{job.status}</span>
                      </td>
                      <td>
                        <Link
                          to={`/recruiter/applicants?job_id=${job.id}`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.78rem', padding: '3px 8px' }}
                        >
                          Review Applicants
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right Column: Recent Applicant Activity */}
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Recent Candidates</h3>
            <Link to="/recruiter/applicants" className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
              Full Pipeline &rarr;
            </Link>
          </div>

          {loading ? (
            <p className="text-muted">Loading applicants...</p>
          ) : recentApplications.length === 0 ? (
            <p className="text-muted">No applicants received yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentApplications.map(app => (
                <div
                  key={app.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--md-sys-color-outline)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--md-sys-color-on-surface)' }}>
                      {app.candidate?.name || 'Candidate #' + app.candidate_id}
                    </strong>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                      {app.job?.title}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${app.status}`} style={{ fontSize: '0.72rem', display: 'block', marginBottom: '3px' }}>
                      {app.status}
                    </span>
                    {app.ats_match && <AtsScoreBadge ats={app.ats_match} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
