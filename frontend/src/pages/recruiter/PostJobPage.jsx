import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import jobsApi from '../../services/jobsApi';
import adminApi from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';

export default function PostJobPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const editJobId = searchParams.get('id');

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('Remote (Global)');
  const [experience, setExperience] = useState('0–2 years');
  const [salary, setSalary] = useState('₹8 - 14 LPA');
  const [deadline, setDeadline] = useState('');
  const [skills, setSkills] = useState('Python, Flask, React, SQL, Git');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('open');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    adminApi.listCategories()
      .then(res => {
        const cats = res.data || [];
        setCategories(cats);
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
        }
      })
      .catch(err => console.warn('Failed to load categories:', err));

    if (editJobId) {
      jobsApi.getJob(editJobId).then(res => {
        const j = res.data;
        if (j) {
          setTitle(j.title || '');
          setCategoryId(j.category_id || '');
          setLocation(j.location || '');
          setExperience(j.experience || '');
          setSalary(j.salary || '');
          setDeadline(j.deadline || '');
          setSkills(j.skills || '');
          setDescription(j.description || '');
          setStatus(j.status || 'open');
        }
      });
    }
  }, [editJobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category_id: parseInt(categoryId, 10),
        location: location.trim(),
        experience: experience.trim(),
        salary: salary.trim(),
        deadline: deadline || null,
        skills: skills.trim(),
        description: description.trim(),
        status
      };

      if (editJobId) {
        await jobsApi.updateJob(editJobId, payload);
        toast.success('Job listing updated successfully!');
      } else {
        await jobsApi.createJob(payload);
        toast.success('Job listing published to the talent board!');
      }

      navigate('/recruiter/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to save job opening.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container" style={{ maxWidth: '850px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div className="mono-tag" style={{ marginBottom: '6px' }}>
          {editJobId ? '// EDIT POSITION' : '// TALENT ACQUISITION'}
        </div>
        <h1 style={{ fontSize: '2.1rem', margin: 0 }}>
          {editJobId ? 'Modify Job Opening' : 'Post New Career Opportunity'}
        </h1>
        <p className="text-muted" style={{ marginTop: '4px', fontSize: '0.94rem' }}>
          Define role responsibilities, compensation, and required competencies for automatic candidate ATS matching.
        </p>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="post-title">Job Title</label>
            <input
              type="text"
              id="post-title"
              className="form-control"
              required
              placeholder="e.g., Senior Cloud Architect or Full-Stack Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="post-category">Department / Category</label>
              <select
                id="post-category"
                className="form-control"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="post-location">Work Location & Mode</label>
              <input
                type="text"
                id="post-location"
                className="form-control"
                required
                placeholder="e.g., Bengaluru (Hybrid) or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="post-salary">Compensation / Salary</label>
              <input
                type="text"
                id="post-salary"
                className="form-control"
                placeholder="e.g., ₹10 - 16 LPA"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="post-experience">Required Experience</label>
              <input
                type="text"
                id="post-experience"
                className="form-control"
                placeholder="e.g., 2–4 years"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="post-deadline">Application Deadline</label>
              <input
                type="date"
                id="post-deadline"
                className="form-control"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="post-skills">
              Required Technical Skills (Comma-separated for ATS Matching Engine)
            </label>
            <input
              type="text"
              id="post-skills"
              className="form-control"
              required
              placeholder="e.g., Python, Flask, React, Docker, PostgreSQL, REST APIs"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
              These skills will be matched against candidate profiles to generate real-time ATS match percentages.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="post-description">Full Job Description & Requirements</label>
            <textarea
              id="post-description"
              className="form-control"
              required
              rows="6"
              placeholder="Detail the daily responsibilities, ideal candidate background, team mission, and growth path."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="post-status">Listing Visibility</label>
            <select
              id="post-status"
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="open">Open (Publicly Visible & Accepting Applications)</option>
              <option value="closed">Closed / Archived</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/recruiter/dashboard')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              <span className="material-icons icon-sm">publish</span>
              {submitting ? 'Saving Position...' : (editJobId ? 'Update Position' : 'Publish Opportunity')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
