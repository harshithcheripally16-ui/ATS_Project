import React from 'react';
import AtsScoreBadge from '../common/AtsScoreBadge';
import Modal from '../common/Modal';

export default function CandidateDetailModal({
  isOpen,
  onClose,
  application,
  onScheduleInterview,
  onProvideOffer,
  onStatusChange
}) {
  if (!application) return null;

  const cand = application.candidate || {};
  const job = application.job || {};
  const ats = application.ats_match;

  const skillsList = (cand.skills || '').split(',').map(s => s.trim()).filter(Boolean);
  const matchedSkills = ats?.matched_skills || [];
  const missingSkills = ats?.missing_skills || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Candidate Profile & Resume Dossier"
      maxWidth="900px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['shortlisted', 'interview_scheduled'].includes(application.status) && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  if (onScheduleInterview) onScheduleInterview(application);
                }}
              >
                <span className="material-icons icon-sm">event</span> Schedule Interview
              </button>
            )}
            {application.status === 'interview_scheduled' && (
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => {
                  onClose();
                  if (onProvideOffer) onProvideOffer(application);
                }}
              >
                <span className="material-icons icon-sm">card_giftcard</span> Extend Offer
              </button>
            )}
          </div>
        </div>
      }
    >
      <div>
        {/* Candidate Header Summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--md-sys-color-outline)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '18px'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
              {cand.name || 'Candidate #' + application.candidate_id}
            </h2>
            <div style={{ fontSize: '0.86rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
              <a href={`mailto:${cand.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{cand.email}</a>
              {cand.phone && <> &bull; <span>{cand.phone}</span></>}
            </div>
            <div style={{ fontSize: '0.82rem', marginTop: '6px' }}>
              Applied for: <strong style={{ color: 'var(--accent-cyan)' }}>{job.title || 'Job Position'}</strong>
              <span style={{ margin: '0 6px' }}>&bull;</span>
              Status: <span className={`badge badge-${application.status}`}>{application.status}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '4px', textAlign: 'right' }}>
              ATS Compatibility:
            </div>
            <AtsScoreBadge ats={ats} />
          </div>
        </div>

        {/* ATS Skills Breakdown */}
        {ats && (
          <div
            style={{
              background: 'rgba(0, 240, 255, 0.04)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '18px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-icons" style={{ fontSize: '16px' }}>analytics</span> ATS Skill Analysis
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Skills: <strong>{ats.breakdown?.skills_score || 0}%</strong> &bull; Exp: <strong>{ats.breakdown?.experience_score || 0}%</strong>
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {matchedSkills.map((s, idx) => (
                <span
                  key={`m-${idx}`}
                  className="badge"
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontSize: '0.74rem',
                    padding: '3px 8px'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '11px', marginRight: '3px' }}>check</span> {s}
                </span>
              ))}
              {missingSkills.map((s, idx) => (
                <span
                  key={`ms-${idx}`}
                  className="badge"
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: '0.74rem',
                    padding: '3px 8px'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '11px', marginRight: '3px' }}>help_outline</span> Missing: {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Profile Tabs / Information */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Education</label>
            <div style={{ fontSize: '0.86rem', color: 'var(--md-sys-color-on-surface)', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
              {cand.education || 'No formal education listed'}
            </div>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Experience Overview</label>
            <div style={{ fontSize: '0.86rem', color: 'var(--md-sys-color-on-surface)', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
              {cand.experience || 'No experience summary listed'}
            </div>
          </div>
        </div>

        {/* Resume Previewer with Dark Theme Frame */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-icons icon-sm" style={{ color: 'var(--accent-cyan)' }}>picture_as_pdf</span>
              Uploaded Resume Document
            </label>
            {cand.resume_url && (
              <a
                href={cand.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              >
                <span className="material-icons icon-sm">open_in_new</span> Open External
              </a>
            )}
          </div>

          {cand.resume_url ? (
            <div
              className="resume-preview-frame"
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--md-sys-color-outline)',
                background: '#07090e',
                height: '420px'
              }}
            >
              <iframe
                src={cand.resume_url}
                title="Candidate Resume"
                style={{ width: '100%', height: '100%', border: 'none', background: '#0e131f' }}
              />
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '36px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                color: 'var(--md-sys-color-on-surface-variant)'
              }}
            >
              <span className="material-icons" style={{ fontSize: '36px', opacity: 0.5 }}>description</span>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>No resume file attached to this candidate profile.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
