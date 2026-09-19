import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import candidateApi from '../../services/candidateApi';
import applicationsApi from '../../services/applicationsApi';
import Modal from '../common/Modal';

export default function ApplyModal({ isOpen, onClose, job, onSuccess }) {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({});
  const [phone, setPhone] = useState('');
  const [resumeChoice, setResumeChoice] = useState('existing');
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setLoadingProfile(true);
      candidateApi.getProfile()
        .then(res => {
          const prof = res.data?.profile || {};
          setProfile(prof);
          setPhone(prof.phone || user.phone || '');
          if (!prof.resume_url) {
            setResumeChoice('new');
          } else {
            setResumeChoice('existing');
          }
        })
        .catch(err => {
          console.warn('Failed to load candidate profile for apply modal:', err);
        })
        .finally(() => setLoadingProfile(false));
    }
  }, [isOpen, user]);

  if (!job) return null;

  const hasResume = Boolean(profile.resume_url);
  const resumeFilename = hasResume ? profile.resume_url.split('/').pop() : '';

  // Calculate ATS match score preview
  const candSkills = (profile.skills || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const jobSkills = (job.skills || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  let matchScore = null;
  let matchedSkills = [];
  if (jobSkills.length > 0 && candSkills.length > 0) {
    matchedSkills = jobSkills.filter(js => candSkills.some(cs => cs === js || cs.includes(js) || js.includes(cs)));
    matchScore = Math.round((matchedSkills.length / jobSkills.length) * 100);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (resumeChoice === 'new') {
      if (!resumeFile) {
        toast.error('Please select a resume file (PDF, DOCX) to upload.');
        return;
      }
    } else if (!hasResume) {
      toast.error('Please upload a resume file to apply.');
      return;
    }

    setSubmitting(true);
    try {
      // If user uploaded a new resume, upload it first
      if (resumeChoice === 'new' && resumeFile) {
        await candidateApi.uploadResume(resumeFile);
      }

      // Update phone if edited
      if (phone && phone !== profile.phone) {
        await candidateApi.updateProfile({ phone });
      }

      // Submit application
      const res = await applicationsApi.applyToJob(job.id);
      toast.success(res.message || 'Application submitted successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Position"
      maxWidth="580px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || loadingProfile}
          >
            {submitting ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </div>
      }
    >
      <div>
        {/* Job Summary Banner */}
        <div
          style={{
            background: 'rgba(0, 240, 255, 0.05)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--md-sys-color-on-surface)' }}>
            {job.title}
          </div>
          <div className="text-muted" style={{ fontSize: '0.82rem', marginTop: '2px' }}>
            {job.location && (
              <>
                <span className="material-icons" style={{ fontSize: '13px', verticalAlign: '-2px' }}>location_on</span>
                {' '}{job.location}
              </>
            )}
            <span style={{ margin: '0 4px' }}>&bull;</span> Candidate: <strong>{user?.name || user?.email}</strong>
          </div>

          {matchScore !== null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(0, 240, 255, 0.2)',
                fontSize: '0.78rem'
              }}
            >
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-icons" style={{ fontSize: '14px' }}>speed</span> ATS Compatibility:
              </span>
              <span
                className={`badge ${matchScore >= 70 ? 'badge-selected' : (matchScore >= 45 ? 'badge-shortlisted' : 'badge-draft')}`}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}
              >
                {matchScore}% Match ({matchedSkills.length}/{jobSkills.length} skills)
              </span>
            </div>
          )}
        </div>

        {/* Contact Phone */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" htmlFor="apply-phone" style={{ fontSize: '0.84rem' }}>
            Contact Phone Number:
          </label>
          <input
            type="tel"
            id="apply-phone"
            className="form-control"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Resume Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-icons icon-sm" style={{ color: 'var(--accent-cyan)' }}>description</span>
            Resume for Recruiter Review:
          </label>

          {hasResume ? (
            <>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-icons" style={{ fontSize: '16px' }}>check_circle</span> Active Resume on File
                    </span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                      {resumeFilename}
                    </div>
                  </div>
                  <a
                    href={profile.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    <span className="material-icons icon-sm">visibility</span> Preview Resume
                  </a>
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <input
                    type="radio"
                    name="resume-choice"
                    value="existing"
                    checked={resumeChoice === 'existing'}
                    onChange={() => setResumeChoice('existing')}
                  />
                  <span>Submit with current resume on file</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="radio"
                    name="resume-choice"
                    value="new"
                    checked={resumeChoice === 'new'}
                    onChange={() => setResumeChoice('new')}
                  />
                  <span>Upload a new / updated resume for this application</span>
                </label>
              </div>
            </>
          ) : (
            <div className="alert alert-warning" style={{ fontSize: '0.84rem', padding: '8px 12px', marginBottom: '10px' }}>
              You do not have a resume uploaded on your profile. Please attach one below.
            </div>
          )}

          {resumeChoice === 'new' && (
            <div style={{ marginTop: '10px' }}>
              <input
                type="file"
                className="form-control"
                accept=".pdf,.docx,.doc"
                onChange={(e) => setResumeFile(e.target.files[0] || null)}
              />
              <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                Supported formats: PDF, DOCX, DOC (Max 10MB)
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
