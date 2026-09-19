import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import applicationsApi from '../../services/applicationsApi';
import Modal from '../common/Modal';

export default function OfferLetterModal({ isOpen, onClose, application, onSuccess }) {
  const toast = useToast();
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [terms, setTerms] = useState(
    'Standard 3-month probation period applies. Comprehensive medical coverage, 24 days annual paid leave, and performance-linked bonus plan.'
  );
  const [notes, setNotes] = useState('We were very impressed with your technical interview!');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (application) {
      setSalary(application.job?.salary || '₹12 - 16 LPA');
      const defaultJoinDate = new Date();
      defaultJoinDate.setDate(defaultJoinDate.getDate() + 30);
      setJoiningDate(defaultJoinDate.toISOString().split('T')[0]);
    }
  }, [application]);

  if (!application) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salary) {
      toast.error('Please enter the offered compensation.');
      return;
    }

    setSubmitting(true);
    try {
      await applicationsApi.provideOfferLetter(application.id, {
        salary,
        joining_date: joiningDate,
        terms,
        notes
      });
      toast.success('Offer letter successfully extended to candidate!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to extend offer letter.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Extend Formal Job Offer"
      maxWidth="580px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Extending Offer...' : 'Send Formal Offer'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#10b981' }}>
            Selected Candidate: {application.candidate?.name}
          </div>
          <div className="text-muted" style={{ fontSize: '0.82rem', marginTop: '2px' }}>
            Position: <strong>{application.job?.title}</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="offer-salary">Offered Compensation / CTC</label>
            <input
              type="text"
              id="offer-salary"
              className="form-control"
              required
              placeholder="e.g., ₹14 LPA or $120,000"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="offer-join-date">Proposed Joining Date</label>
            <input
              type="date"
              id="offer-join-date"
              className="form-control"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" htmlFor="offer-terms">Offer Terms & Benefits</label>
          <textarea
            id="offer-terms"
            className="form-control"
            rows="3"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label className="form-label" htmlFor="offer-notes">Personal Note to Candidate (Optional)</label>
          <input
            type="text"
            id="offer-notes"
            className="form-control"
            placeholder="e.g., We look forward to having you on the core engineering team!"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
