import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import applicationsApi from '../../services/applicationsApi';
import jobsApi from '../../services/jobsApi';
import { useToast } from '../../context/ToastContext';
import AtsScoreBadge from '../../components/common/AtsScoreBadge';
import Pagination from '../../components/common/Pagination';
import CandidateDetailModal from '../../components/recruiter/CandidateDetailModal';
import ScheduleInterviewModal from '../../components/recruiter/ScheduleInterviewModal';
import OfferLetterModal from '../../components/recruiter/OfferLetterModal';

const ALLOWED_TRANSITIONS = {
  'applied': ['shortlisted', 'rejected'],
  'shortlisted': ['interview_scheduled', 'rejected'],
  'interview_scheduled': ['selected', 'rejected'],
  'selected': [],
  'rejected': []
};

export default function ApplicantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const [jobId, setJobId] = useState(searchParams.get('job_id') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'ats_desc');
  const [page, setPage] = useState(1);

  // Modals state
  const [detailApp, setDetailApp] = useState(null);
  const [interviewApp, setInterviewApp] = useState(null);
  const [offerApp, setOfferApp] = useState(null);

  // Load recruiter's jobs for filter dropdown
  useEffect(() => {
    jobsApi.getMyJobs(1, 100, 'all')
      .then(res => setJobs(res.data?.items || []))
      .catch(err => console.warn('Failed to load jobs list:', err));
  }, []);

  const fetchApplicants = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        limit: 10,
        status: status || undefined,
        search: search || undefined,
        sort: sort || undefined
      };
      const res = await applicationsApi.getJobApplicants(jobId || null, targetPage, 10, status, search, sort);
      setApplications(res.data?.items || []);
      setPagination(res.data?.pagination || null);
      setPage(targetPage);
    } catch (err) {
      toast.error('Failed to load applicants: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [jobId, status, search, sort, toast]);

  useEffect(() => {
    fetchApplicants(page);
  }, [fetchApplicants, page]);

  const handleStatusChange = async (appId, targetStatus) => {
    try {
      await applicationsApi.updateStatus(appId, targetStatus);
      toast.success(`Candidate status updated to '${targetStatus}'.`);
      fetchApplicants(page);
    } catch (err) {
      toast.error(err.message || 'Failed to update candidate status.');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <main className="container">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '28px' }}>
        <div>
          <div className="mono-tag" style={{ marginBottom: '6px' }}>PIPELINE MANAGEMENT</div>
          <h1 style={{ fontSize: '2.1rem', margin: 0 }}>Candidate Applicants Pipeline</h1>
          <p className="text-muted" style={{ marginTop: '4px', fontSize: '0.94rem' }}>
            Evaluate incoming candidates, inspect resumes, examine automated ATS Match scores, and manage stage gates.
          </p>
        </div>
        <Link to="/recruiter/post-job" className="btn btn-primary btn-sm">
          <span className="material-icons icon-sm">add</span> Post Another Opening
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '28px', padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Filter by Position</label>
            <select
              className="form-control"
              value={jobId}
              onChange={(e) => {
                setJobId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Job Listings</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Hiring Stage Status</label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Stages</option>
              <option value="applied">Applied (New)</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="selected">Offer / Selected</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Sort Candidates</label>
            <select
              className="form-control"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="ats_desc">Highest ATS Match Score</option>
              <option value="ats_asc">Lowest ATS Match Score</option>
              <option value="date_desc">Newest Application</option>
              <option value="date_asc">Oldest Application</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Search Candidate / Skills</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Name, Python, AWS"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  fetchApplicants(1);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <section className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 12px', border: '3px solid rgba(0, 240, 255, 0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            <p className="text-muted">Filtering candidate pipeline...</p>
          </div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <span className="material-icons" style={{ fontSize: '44px', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.5, marginBottom: '8px' }}>
              group_off
            </span>
            <p style={{ margin: 0, fontWeight: 600 }}>No applicants found matching this filter criteria.</p>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              Try selecting "All Job Listings" or clearing your stage and keyword filters.
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Role Applied</th>
                    <th>ATS Match</th>
                    <th>Stage Status</th>
                    <th>Manage Stage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => {
                    const cand = app.candidate || {};
                    const job = app.job || {};
                    const allowedNext = ALLOWED_TRANSITIONS[app.status] || [];

                    return (
                      <tr key={app.id}>
                        {/* Candidate Identity */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                color: '#07090e',
                                flexShrink: 0
                              }}
                            >
                              {getInitials(cand.name)}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => setDetailApp(app)}
                                style={{ background: 'none', border: 'none', padding: 0, fontWeight: 700, fontSize: '0.94rem', color: 'var(--md-sys-color-on-surface)', cursor: 'pointer', textAlign: 'left' }}
                              >
                                {cand.name || 'Candidate #' + app.candidate_id}
                              </button>
                              <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                {cand.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Applied */}
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{job.title || 'General Opening'}</div>
                          <div className="text-muted" style={{ fontSize: '0.78rem' }}>{job.location || 'Remote'}</div>
                        </td>

                        {/* ATS Score */}
                        <td>
                          <AtsScoreBadge ats={app.ats_match} />
                        </td>

                        {/* Current Status */}
                        <td>
                          <span className={`badge badge-${app.status}`}>{app.status}</span>
                        </td>

                        {/* State Machine Transition Dropdown */}
                        <td>
                          {allowedNext.length > 0 ? (
                            <select
                              className="form-control"
                              style={{ fontSize: '0.8rem', padding: '4px 8px', height: 'auto' }}
                              value={app.status}
                              onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            >
                              <option value={app.status} disabled>-- Change --</option>
                              {allowedNext.map(target => (
                                <option key={target} value={target}>&rarr; {target}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Final Stage</span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                              onClick={() => setDetailApp(app)}
                              title="View dossier and resume"
                            >
                              <span className="material-icons icon-sm">visibility</span>
                            </button>

                            {['shortlisted', 'interview_scheduled'].includes(app.status) && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                                onClick={() => setInterviewApp(app)}
                                title="Schedule Interview"
                              >
                                <span className="material-icons icon-sm">event</span>
                              </button>
                            )}

                            {app.status === 'interview_scheduled' && (
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                                onClick={() => setOfferApp(app)}
                                title="Extend Offer Letter"
                              >
                                <span className="material-icons icon-sm">card_giftcard</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination && (
              <Pagination
                pagination={pagination}
                onPageChange={(newPage) => fetchApplicants(newPage)}
              />
            )}
          </>
        )}
      </section>

      {/* Candidate Detail Modal */}
      {detailApp && (
        <CandidateDetailModal
          isOpen={Boolean(detailApp)}
          onClose={() => setDetailApp(null)}
          application={detailApp}
          onScheduleInterview={(app) => setInterviewApp(app)}
          onProvideOffer={(app) => setOfferApp(app)}
        />
      )}

      {/* Schedule Interview Modal */}
      {interviewApp && (
        <ScheduleInterviewModal
          isOpen={Boolean(interviewApp)}
          onClose={() => setInterviewApp(null)}
          application={interviewApp}
          onSuccess={() => fetchApplicants(page)}
        />
      )}

      {/* Offer Letter Modal */}
      {offerApp && (
        <OfferLetterModal
          isOpen={Boolean(offerApp)}
          onClose={() => setOfferApp(null)}
          application={offerApp}
          onSuccess={() => fetchApplicants(page)}
        />
      )}
    </main>
  );
}
