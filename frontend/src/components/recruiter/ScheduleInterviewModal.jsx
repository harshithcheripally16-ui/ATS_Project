import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import interviewsApi from '../../services/interviewsApi';
import Modal from '../common/Modal';

export default function ScheduleInterviewModal({ isOpen, onClose, application, onSuccess }) {
  const toast = useToast();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState('online');
  const [notes, setNotes] = useState('https://meet.google.com/abc-defg-hij');
  const [submitting, setSubmitting] = useState(false);

  if (!application) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error('Please select both an interview date and time.');
      return;
    }

    setSubmitting(true);
    try {
      await interviewsApi.scheduleInterview(application.id, date, time, mode, notes);
      toast.success('Interview scheduled and notification sent to candidate!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule interview.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Candidate Interview"
      maxWidth="540px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Scheduling...' : 'Schedule & Notify Candidate'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: 'rgba(0, 240, 255, 0.05)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--md-sys-color-on-surface)' }}>
            Candidate: {application.candidate?.name}
          </div>
          <div className="text-muted" style={{ fontSize: '0.82rem', marginTop: '2px' }}>
            Position: <strong>{application.job?.title}</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="int-date">Interview Date</label>
            <input
              type="date"
              id="int-date"
              className="form-control"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="int-time">Interview Time</label>
            <input
              type="time"
              id="int-time"
              className="form-control"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" htmlFor="int-mode">Interview Mode</label>
          <select
            id="int-mode"
            className="form-control"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="online">Online (Video Call / Google Meet / Zoom)</option>
            <option value="onsite">Onsite (Office Headquarters)</option>
            <option value="telephonic">Telephonic Screening</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label className="form-label" htmlFor="int-notes">Meeting Link or Location Notes</label>
          <input
            type="text"
            id="int-notes"
            className="form-control"
            placeholder="e.g., https://meet.google.com/xyz-abcd-efg or Conference Room 4B"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
