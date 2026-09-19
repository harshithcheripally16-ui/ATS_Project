import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import applicationsApi from '../../services/applicationsApi';
import Modal from '../common/Modal';

export default function OfferModal({ isOpen, onClose, application, onActionSuccess }) {
  const toast = useToast();
  const [candidateNotes, setCandidateNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!application) return null;

  const offer = application.offer_letter || {};
  const isPending = !application.offer_response_status || application.offer_response_status === 'pending';

  const handleRespond = async (decision) => {
    setSubmitting(true);
    try {
      await applicationsApi.respondToOffer(application.id, decision, candidateNotes);
      toast.success(`Offer successfully ${decision === 'accepted' ? 'accepted! Congratulations!' : 'declined.'}`);
      if (onActionSuccess) onActionSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit offer response.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Job Offer Letter"
      maxWidth="620px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={submitting}>
            Close
          </button>
          {isPending && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleRespond('declined')}
                disabled={submitting}
              >
                <span className="material-icons icon-sm">cancel</span> Decline Offer
              </button>
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => handleRespond('accepted')}
                disabled={submitting}
              >
                <span className="material-icons icon-sm">check_circle</span> Accept Offer
              </button>
            </div>
          )}
        </div>
      }
    >
      <div>
        {/* Banner Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(0, 240, 255, 0.1) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Congratulations! You have received a formal offer
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', marginTop: '4px' }}>
            {application.job?.title || 'Job Position'}
          </div>
          <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '2px' }}>
            {application.job?.location || 'Remote'}
          </div>
        </div>

        {/* Offer Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '16px'
          }}
        >
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--md-sys-color-outline)' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Offered Compensation</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {offer.salary || application.job?.salary || 'Competitive'}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--md-sys-color-outline)' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Proposed Joining Date</span>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)', marginTop: '2px' }}>
              {offer.joining_date || 'To be mutually agreed'}
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        {offer.terms && (
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 700 }}>
              Terms & Benefits:
            </label>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--md-sys-color-outline)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.86rem',
                lineHeight: 1.5,
                color: 'var(--md-sys-color-on-surface-variant)',
                maxHeight: '140px',
                overflowY: 'auto'
              }}
            >
              {offer.terms}
            </div>
          </div>
        )}

        {/* Response Status Banner if already decided */}
        {!isPending && (
          <div
            className={`alert alert-${application.offer_response_status === 'accepted' ? 'success' : 'warning'}`}
            style={{ fontSize: '0.88rem', padding: '10px 14px', marginBottom: '14px' }}
          >
            <strong>Offer Decision:</strong> You have {application.offer_response_status} this offer.
            {application.offer_candidate_notes && (
              <div style={{ marginTop: '4px', fontSize: '0.82rem' }}>
                Your notes: "{application.offer_candidate_notes}"
              </div>
            )}
          </div>
        )}

        {/* Decision Response Notes input if pending */}
        {isPending && (
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label" htmlFor="candidate-notes" style={{ fontSize: '0.84rem' }}>
              Notes or Comments to Recruiter (Optional):
            </label>
            <textarea
              id="candidate-notes"
              className="form-control"
              rows="3"
              placeholder="e.g., Thrilled to accept and look forward to joining on Nov 15th!"
              value={candidateNotes}
              onChange={(e) => setCandidateNotes(e.target.value)}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
