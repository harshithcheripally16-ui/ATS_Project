import React, { useState, useEffect } from 'react';
import candidateApi from '../../services/candidateApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function CandidateProfile() {
  const { user } = useAuth();
  const toast = useToast();

  const [skills, setSkills] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    candidateApi.getProfile()
      .then(res => {
        const prof = res.data?.profile || {};
        const rawSkills = prof.skills_raw || (Array.isArray(prof.skills) ? prof.skills.join(', ') : (prof.skills || ''));
        setSkills(rawSkills);
        setExperience(prof.experience || '');
        setEducation(prof.education || '');
        setPhone(prof.phone || user?.phone || '');
        setResumeUrl(prof.resume_url || '');
      })
      .catch(err => {
        toast.error('Failed to load candidate profile: ' + err.message);
      })
      .finally(() => setLoading(false));
  }, [user, toast]);

  const skillsList = Array.isArray(skills)
    ? skills
    : (typeof skills === 'string' && skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : []);

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skillsList.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput('');
      return;
    }
    const updated = [...skillsList, trimmed].join(', ');
    setSkills(updated);
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = skillsList.filter(s => s !== skillToRemove).join(', ');
    setSkills(updated);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skillsStr = Array.isArray(skills) ? skills.join(', ') : (skills || '');
      await candidateApi.updateProfile({
        skills: skillsStr,
        experience,
        education,
        phone
      });
      toast.success('Candidate profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      toast.error('Please select a PDF or DOCX file to upload.');
      return;
    }

    setUploadingResume(true);
    try {
      const res = await candidateApi.uploadResume(resumeFile);
      setResumeUrl(res.data?.resume_url || '');
      setResumeFile(null);
      toast.success('Resume uploaded and attached to your profile!');
    } catch (err) {
      toast.error(err.message || 'Failed to upload resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  if (loading) {
    return (
      <main className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 12px', border: '3px solid rgba(0, 240, 255, 0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <p className="text-muted">Loading candidate credentials...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <div style={{ marginBottom: '32px' }}>
        <div className="mono-tag" style={{ marginBottom: '6px' }}>CANDIDATE DOSSIER</div>
        <h1 style={{ fontSize: '2.1rem', margin: 0 }}>Profile & Technical Resume</h1>
        <p className="text-muted" style={{ marginTop: '4px', fontSize: '0.94rem' }}>
          Keep your skills and resume up to date to maximize your automated ATS Match score against active job listings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '28px', alignItems: 'flex-start' }}>
        {/* Left Column: Profile Form & Skills */}
        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons icon-sm" style={{ color: 'var(--accent-cyan)' }}>person</span>
            Candidate Professional Details
          </h3>

          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="cand-phone">Contact Phone Number</label>
              <input
                type="tel"
                id="cand-phone"
                className="form-control"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cand-education">Education / Degree</label>
              <input
                type="text"
                id="cand-education"
                className="form-control"
                placeholder="e.g. B.Tech in Computer Science, IIT Bombay (2020-2024)"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cand-experience">Professional Experience Summary</label>
              <textarea
                id="cand-experience"
                className="form-control"
                rows="4"
                placeholder="Summarize your years of experience, core technical specialties, projects, and impact."
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>

            {/* Technical Skills Input & Tags */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="skill-adder">
                Technical Skills (Press Enter or Add to create tags)
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  id="skill-adder"
                  className="form-control"
                  placeholder="e.g. Python, Flask, React, Docker, AWS"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <button type="button" className="btn btn-secondary" onClick={handleAddSkill}>
                  Add Skill
                </button>
              </div>

              {/* Skills Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {skillsList.map((skill, idx) => (
                  <span
                    key={idx}
                    className="badge"
                    style={{
                      background: 'rgba(0, 240, 255, 0.1)',
                      border: '1px solid rgba(0, 240, 255, 0.3)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.8rem',
                      padding: '4px 10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: '13px', lineHeight: 1 }}
                      title="Remove skill"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              disabled={saving}
            >
              {saving ? 'Saving Changes...' : 'Save Profile Credentials'}
            </button>
          </form>
        </div>

        {/* Right Column: Resume Upload & Previewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Resume Upload Card */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-icons icon-sm" style={{ color: 'var(--accent-cyan)' }}>upload_file</span>
              Upload Resume Document
            </h3>

            <form onSubmit={handleResumeUpload}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <input
                  type="file"
                  className="form-control"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setResumeFile(e.target.files[0] || null)}
                />
                <span className="text-muted" style={{ fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>
                  Supported formats: PDF, DOCX, DOC (Max 10MB)
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-secondary"
                style={{ width: '100%' }}
                disabled={uploadingResume || !resumeFile}
              >
                {uploadingResume ? 'Uploading...' : 'Upload New Resume'}
              </button>
            </form>
          </div>

          {/* Resume Previewer */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-icons icon-sm" style={{ color: 'var(--accent-cyan)' }}>picture_as_pdf</span>
                Resume Viewer
              </h3>
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                >
                  <span className="material-icons icon-sm">open_in_new</span> External
                </a>
              )}
            </div>

            {resumeUrl ? (
              <div
                className="resume-preview-frame"
                style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--md-sys-color-outline)',
                  background: '#07090e',
                  height: '460px'
                }}
              >
                <iframe
                  src={resumeUrl}
                  title="Candidate Resume"
                  style={{ width: '100%', height: '100%', border: 'none', background: '#0e131f' }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 16px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
                <span className="material-icons" style={{ fontSize: '40px', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.5 }}>
                  description
                </span>
                <p className="text-muted" style={{ fontSize: '0.86rem', margin: '8px 0 0 0' }}>
                  No resume attached yet. Upload a PDF above to enable in-browser document preview.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
