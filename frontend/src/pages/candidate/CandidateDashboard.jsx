import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import applicationsApi from '../../services/applicationsApi';
import interviewsApi from '../../services/interviewsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AtsScoreBadge from '../../components/common/AtsScoreBadge';
import OfferModal from '../../components/candidate/OfferModal';
import Pagination from '../../components/common/Pagination';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeOfferApp, setActiveOfferApp] = useState(null);

  const loadData = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const [appRes, intRes] = await Promise.all([
        applicationsApi.getMyApplications(targetPage, 10),
        interviewsApi.getMyInterviews(1, 10)
      ]);
      setApplications(appRes.data?.items || []);
      setPagination(appRes.data?.pagination || null);
      setInterviews(intRes.data?.items || []);
      setPage(targetPage);
    } catch (err) {
      toast.error('Failed to load dashboard data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData(page);
  }, [loadData, page]);

  // Metric counts
  const counts = {
    total: applications.length,
    shortlisted: applications.filter(a => ['shortlisted', 'interview_scheduled'].includes(a.status)).length,
    interviews: interviews.length,
    offers: applications.filter(a => a.status === 'selected' || a.offer_letter).length
  };

  return (
    <main className="container">
      {/* Top Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '32px' }}>
        <div>
          <div className="mono-tag" style={{ marginBottom: '6px' }}>CANDIDATE PORTAL</div>
          <h1 style={{ fontSize: '2.1rem', margin: 0 }}>Welcome back, {user?.name || 'Candidate'}!</h1>
          <p className="text-muted" style={{ marginTop: '4px', fontSize: '0.94rem' }}>
            Track your job applications, interview schedules, and official offers in real time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/jobs" className="btn btn-primary btn-sm">
            <span className="material-icons icon-sm">search</span> Find New Jobs
          </Link>
          <Link to="/candidate/profile" className="btn btn-secondary btn-sm">
            <span className="material-icons icon-sm">badge</span> Edit Profile & Resume
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4" style={{ marginBottom: '32px' }}>
        <div className="card">
          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Applications
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', marginTop: '4px' }}>
            {counts.total}
          </div>
        </div>

        <div className="card">
          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Shortlisted
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {counts.shortlisted}
          </div>
        </div>

        <div className="card">
          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Upcoming Interviews
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>
            {counts.interviews}
          </div>
        </div>

        <div className="card">
          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Formal Offers
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {counts.offers}
          </div>
        </div>
      </div>

      {/* Upcoming Interviews Widget if any */}
      {interviews.length > 0 && (
        <section className="card" style={{ marginBottom: '32px', border: '1px solid rgba(168, 85, 247, 0.35)', background: 'rgba(168, 85, 247, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span className="material-icons" style={{ color: '#c084fc', fontSize: '22px' }}>event_available</span>
            <h3 style={{ margin: 0, fontSize: '1.18rem' }}>Confirmed Interview Schedules</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {interviews.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--md-sys-color-outline)',
                  borderRadius: '8px',
                  padding: '14px'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--md-sys-color-on-surface)' }}>
                  {item.application?.job?.title || 'Technical Interview'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.85rem' }}>
                  <span className="material-icons" style={{ fontSize: '16px', color: 'var(--accent-cyan)' }}>schedule</span>
                  <span>{item.date} at {item.time}</span>
                  <span className="badge badge-interview" style={{ fontSize: '0.7rem' }}>{item.mode}</span>
                </div>
                {item.notes && (
                  <div style={{ marginTop: '8px', fontSize: '0.82rem' }}>
                    {item.notes.startsWith('http') ? (
                      <a
                        href={item.notes}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.78rem' }}
                      >
                        <span className="material-icons" style={{ fontSize: '14px' }}>videocam</span> Join Meeting Link
                      </a>
                    ) : (
                      <span className="text-muted">Notes: {item.notes}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Applications Table Section */}
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div className="mono-tag">// APPLICATION PIPELINE</div>
            <h2 style={{ fontSize: '1.45rem', marginTop: '4px' }}>My Active Applications</h2>
          </div>
          <Link to="/jobs" className="btn btn-secondary btn-sm">
            Browse More Jobs &rarr;
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 12px', border: '3px solid rgba(0, 240, 255, 0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            <p className="text-muted">Loading your applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <span className="material-icons" style={{ fontSize: '44px', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.5, marginBottom: '8px' }}>
              folder_open
            </span>
            <p style={{ margin: 0, fontWeight: 600 }}>You haven't submitted any job applications yet.</p>
            <p className="text-muted" style={{ fontSize: '0.88rem', margin: '4px 0 16px 0' }}>
              Explore active job postings, check your ATS compatibility match score, and apply directly.
            </p>
            <Link to="/jobs" className="btn btn-primary btn-sm">
              <span className="material-icons icon-sm">search</span> Search Jobs
            </Link>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Category & Location</th>
                    <th>Date Applied</th>
                    <th>ATS Match</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => {
                    const hasOffer = Boolean(app.offer_letter);
                    const offerAccepted = app.offer_response_status === 'accepted';
                    const offerDeclined = app.offer_response_status === 'declined';

                    return (
                      <tr key={app.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            <Link to={`/jobs/${app.job_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              {app.job?.title || 'Job Position'}
                            </Link>
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                            Salary: <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{app.job?.salary || 'Competitive'}</span>
                          </div>
                        </td>

                        <td>
                          <div>{app.job?.category?.name || 'Engineering'}</div>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>{app.job?.location || 'Remote'}</div>
                        </td>

                        <td style={{ fontSize: '0.86rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                          {app.applied_date ? new Date(app.applied_date).toLocaleDateString() : '-'}
                        </td>

                        <td>
                          <AtsScoreBadge ats={app.ats_match} />
                        </td>

                        <td>
                          <span className={`badge badge-${app.status}`}>{app.status}</span>
                          {app.recruiter_remarks && (
                            <div className="text-muted" style={{ fontSize: '0.76rem', marginTop: '4px', maxWidth: '180px' }}>
                              Note: {app.recruiter_remarks}
                            </div>
                          )}
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {hasOffer && (
                              <button
                                type="button"
                                className={`btn btn-sm ${offerAccepted ? 'btn-success' : (offerDeclined ? 'btn-secondary' : 'btn-primary')}`}
                                onClick={() => setActiveOfferApp(app)}
                                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                              >
                                <span className="material-icons icon-sm">card_giftcard</span>
                                {offerAccepted ? 'View Accepted Offer' : (offerDeclined ? 'View Declined Offer' : 'Review Offer')}
                              </button>
                            )}

                            <Link to={`/jobs/${app.job_id}`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem', padding: '4px 8px' }}>
                              Job Details
                            </Link>
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
                onPageChange={(newPage) => loadData(newPage)}
              />
            )}
          </>
        )}
      </section>

      {/* Offer Letter Review Modal */}
      {activeOfferApp && (
        <OfferModal
          isOpen={Boolean(activeOfferApp)}
          onClose={() => setActiveOfferApp(null)}
          application={activeOfferApp}
          onActionSuccess={() => loadData(page)}
        />
      )}
    </main>
  );
}
