import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import jobsApi from '../services/jobsApi';
import adminApi from '../services/adminApi';
import { useAuth } from '../context/AuthContext';
import { useJobComparison } from '../context/JobComparisonContext';
import Pagination from '../components/common/Pagination';
import AtsScoreBadge from '../components/common/AtsScoreBadge';
import ApplyModal from '../components/candidate/ApplyModal';

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyingJob, setApplyingJob] = useState(null);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('category_id') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'open');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const { role } = useAuth();
  const { toggleCompareJob, isInComparison } = useJobComparison();

  // Load categories once
  useEffect(() => {
    adminApi.listCategories()
      .then(res => setCategories(res.data || []))
      .catch(err => console.warn('Failed to load categories:', err));
  }, []);

  const fetchJobs = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        limit: 8,
        status: status || undefined,
        category_id: categoryId || undefined,
        search: search || undefined
      };
      const res = await jobsApi.listJobs(params);
      setJobs(res.data?.items || []);
      setPagination(res.data?.pagination || null);
      setPage(targetPage);
    } catch (err) {
      console.warn('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, status]);

  useEffect(() => {
    fetchJobs(page);
  }, [fetchJobs, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategoryId('');
    setStatus('open');
    setPage(1);
  };

  return (
    <main className="container">
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <div className="mono-tag">// CAREER OPPORTUNITIES</div>
        <h1 style={{ fontSize: '2.2rem', marginTop: '4px', marginBottom: '8px' }}>
          Explore Open Tech Positions
        </h1>
        <p className="text-muted" style={{ fontSize: '1rem', maxWidth: '750px' }}>
          Browse full-time, hybrid, and remote career opportunities. Compare roles side-by-side and evaluate your real-time ATS match compatibility.
        </p>
      </div>

      {/* Filter and Search Card */}
      <div className="card" style={{ marginBottom: '32px', padding: '20px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="job-search" style={{ fontSize: '0.82rem' }}>
                Keyword or Title:
              </label>
              <input
                type="text"
                id="job-search"
                className="form-control"
                placeholder="e.g. Python, Architect, Remote"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="category-select" style={{ fontSize: '0.82rem' }}>
                Job Category:
              </label>
              <select
                id="category-select"
                className="form-control"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="status-select" style={{ fontSize: '0.82rem' }}>
                Listing Status:
              </label>
              <select
                id="status-select"
                className="form-control"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="open">Active Openings Only</option>
                <option value="">All Listings</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <span className="material-icons icon-sm">search</span> Search
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleClearFilters} title="Reset search">
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px', border: '3px solid rgba(0, 240, 255, 0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <p className="text-muted">Filtering career opportunities...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '54px 20px' }}>
          <span className="material-icons" style={{ fontSize: '48px', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.5, marginBottom: '12px' }}>
            work_off
          </span>
          <h3>No matching job opportunities found</h3>
          <p className="text-muted" style={{ maxWidth: '480px', margin: '8px auto 18px auto', fontSize: '0.92rem' }}>
            Try adjusting your search criteria or clearing active filters to browse all open positions.
          </p>
          <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2" style={{ marginBottom: '32px' }}>
            {jobs.map(job => {
              const compared = isInComparison(job.id);
              const skillsList = (job.skills || '').split(',').map(s => s.trim()).filter(Boolean);

              return (
                <div
                  key={job.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: compared ? '1px solid var(--accent-cyan)' : undefined,
                    boxShadow: compared ? '0 0 16px rgba(0, 240, 255, 0.15)' : undefined
                  }}
                >
                  <div>
                    {/* Top Row: Title, ATS Match, and Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.24rem', margin: 0 }}>
                          <Link to={`/jobs/${job.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {job.title}
                          </Link>
                        </h3>
                        <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          {job.category?.name || 'Engineering'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {job.ats_match && <AtsScoreBadge ats={job.ats_match} />}
                        <span className={`badge badge-${job.status}`}>{job.status}</span>
                      </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                      <span>{job.location || 'Remote'}</span> &bull; <span>{job.experience || 'Not specified'}</span>
                    </div>

                    {/* Description preview */}
                    <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {job.description ? job.description.substring(0, 160) : ''}...
                    </p>

                    {/* Skills preview */}
                    {skillsList.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                        {skillsList.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="badge"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--md-sys-color-outline)',
                              fontSize: '0.74rem',
                              padding: '2px 8px'
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                        {skillsList.length > 5 && (
                          <span className="badge" style={{ fontSize: '0.74rem', padding: '2px 8px', background: 'none' }}>
                            +{skillsList.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Salary and Action Buttons */}
                  <div
                    style={{
                      borderTop: '1px solid var(--md-sys-color-outline)',
                      paddingTop: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <span className="text-muted" style={{ fontSize: '0.76rem', display: 'block' }}>COMPENSATION</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                        {job.salary || 'Competitive'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Compare Toggle Button */}
                      <button
                        type="button"
                        className={`btn btn-sm ${compared ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => toggleCompareJob(job)}
                        title="Add to side-by-side comparison matrix"
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      >
                        <span className="material-icons" style={{ fontSize: '15px' }}>
                          {compared ? 'check_box' : 'compare_arrows'}
                        </span>
                        <span>{compared ? 'Comparing' : 'Compare'}</span>
                      </button>

                      {role === 'candidate' ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setApplyingJob(job)}
                        >
                          <span className="material-icons icon-sm">send</span> Apply
                        </button>
                      ) : (
                        <Link to={`/jobs/${job.id}`} className="btn btn-primary btn-sm">
                          Details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={(newPage) => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                fetchJobs(newPage);
              }}
            />
          )}
        </>
      )}

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
