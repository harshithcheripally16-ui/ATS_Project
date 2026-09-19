import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobComparison } from '../../context/JobComparisonContext';
import { useAuth } from '../../context/AuthContext';
import AtsScoreBadge from './AtsScoreBadge';
import Modal from './Modal';

export default function JobComparisonModal({ onApplyToJob }) {
  const { selectedJobs, isModalOpen, closeModal, removeJob, clearComparison } = useJobComparison();
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();

  if (selectedJobs.length === 0) return null;

  // Compute skills overlap if candidate profile skills exist
  const candSkills = (user?.candidate_profile?.skills || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const renderSkillsChips = (skillsStr) => {
    if (!skillsStr) return <span className="text-muted">None listed</span>;
    const skillsList = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
        {skillsList.map((skill, idx) => {
          const isMatched = candSkills.some(cs => cs === skill.toLowerCase() || skill.toLowerCase().includes(cs));
          return (
            <span
              key={idx}
              className="badge"
              style={{
                fontSize: '0.72rem',
                padding: '3px 8px',
                background: isMatched ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 240, 255, 0.08)',
                color: isMatched ? '#34d399' : 'var(--accent-cyan)',
                border: isMatched ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(0, 240, 255, 0.25)'
              }}
            >
              {isMatched && <span className="material-icons" style={{ fontSize: '11px', verticalAlign: '-1px', marginRight: '3px' }}>check</span>}
              {skill}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Bottom Comparison Dock */}
      <div
        className="comparison-dock"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 900,
          background: 'rgba(14, 19, 31, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          borderRadius: '40px',
          padding: '8px 18px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 240, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          maxWidth: '92vw'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-icons" style={{ color: 'var(--accent-cyan)', fontSize: '20px' }}>compare_arrows</span>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface)' }}>
            Comparing {selectedJobs.length}/3 Roles
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', maxWidth: '360px' }}>
          {selectedJobs.map(j => (
            <div
              key={j.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--md-sys-color-outline)',
                borderRadius: '20px',
                padding: '3px 10px',
                fontSize: '0.78rem',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</span>
              <button
                type="button"
                onClick={() => removeJob(j.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Remove from comparison"
              >
                <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => useJobComparison().openModal()}
            style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '0.82rem' }}
          >
            <span className="material-icons icon-sm">visibility</span> Compare Now
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={clearComparison}
            style={{ borderRadius: '20px', padding: '6px 10px', fontSize: '0.82rem' }}
            title="Clear all"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Side-by-Side Job Comparison"
        maxWidth="1100px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.82rem' }}>
              Green skill chips indicate skills currently matched on your candidate profile.
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearComparison}>
                Clear Comparison
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={closeModal}>
                Done
              </button>
            </div>
          </div>
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${selectedJobs.length}, 1fr)`,
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '8px'
          }}
        >
          {selectedJobs.map(job => (
            <div
              key={job.id}
              className="card"
              style={{
                background: 'rgba(22, 28, 46, 0.7)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px',
                minWidth: '280px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span className="badge badge-open">Open</span>
                  <button
                    type="button"
                    onClick={() => removeJob(job.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', padding: 0 }}
                    title="Remove job"
                  >
                    <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
                  </button>
                </div>

                <h3 style={{ fontSize: '1.18rem', margin: '4px 0 6px 0', color: 'var(--md-sys-color-on-surface)' }}>
                  {job.title}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '14px' }}>
                  {job.category?.name || 'General Engineering'}
                </div>

                {/* ATS Match Score */}
                {job.ats_match && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '4px' }}>
                      ATS Profile Match:
                    </div>
                    <AtsScoreBadge ats={job.ats_match} />
                  </div>
                )}

                {/* Core Attributes */}
                <div style={{ borderTop: '1px solid var(--md-sys-color-outline)', paddingTop: '12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                  <div>
                    <span className="text-muted">Salary: </span>
                    <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {job.salary || 'Competitive'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted">Location: </span>
                    <span>{job.location || 'Remote'}</span>
                  </div>
                  <div>
                    <span className="text-muted">Experience: </span>
                    <span>{job.experience || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-muted">Deadline: </span>
                    <span>{job.deadline || 'Ongoing'}</span>
                  </div>
                </div>

                {/* Required Skills Matrix */}
                <div style={{ borderTop: '1px solid var(--md-sys-color-outline)', paddingTop: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Required Skills Matrix
                  </div>
                  {renderSkillsChips(job.skills)}
                </div>

                {/* Description Preview */}
                <div style={{ borderTop: '1px solid var(--md-sys-color-outline)', paddingTop: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Description
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.4, maxHeight: '90px', overflowY: 'auto' }}>
                    {job.description}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--md-sys-color-outline)', paddingTop: '14px' }}>
                {role === 'candidate' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      closeModal();
                      if (onApplyToJob) {
                        onApplyToJob(job);
                      } else {
                        navigate(`/jobs/${job.id}`);
                      }
                    }}
                  >
                    <span className="material-icons icon-sm">send</span> Apply Now
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    closeModal();
                    navigate(`/jobs/${job.id}`);
                  }}
                >
                  <span className="material-icons icon-sm">info</span> Full Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
