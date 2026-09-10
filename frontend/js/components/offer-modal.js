/**
 * Offer Letter Modal Component
 * Handles both Recruiter (Issue/Edit Offer) and Candidate (Review & Respond) experiences.
 */
const OfferModal = {
  /**
   * Recruiter: Open modal to draft, customize, and issue an official offer letter
   */
  openRecruiterModal(application, onSaved = null) {
    const job = application.job || {};
    const cand = application.candidate || {};
    const existing = application.offer_letter || {};

    // Default joining date: 3 weeks from today
    const defaultJoiningDate = new Date();
    defaultJoiningDate.setDate(defaultJoiningDate.getDate() + 21);
    const defaultDateStr = defaultJoiningDate.toISOString().split('T')[0];

    const positionTitle = existing.position_title || job.title || '';
    const department = existing.department || job.category_name || '';
    const employmentType = existing.employment_type || 'Full-Time';
    const salary = existing.salary || job.salary || '';
    const joiningDate = existing.joining_date || defaultDateStr;
    const location = existing.location || job.location || 'Remote';
    const reportingManager = existing.reporting_manager || '';
    const benefits = existing.benefits || 'Comprehensive Health & Dental Insurance, 401(k) / Provident Fund matching, Paid Time Off, Annual Learning & Wellness Stipend.';
    const terms = existing.terms || 'This offer is contingent upon successful reference verification and standard background check. Employment is at-will.';
    const hasDoc = Boolean(existing.document_url);

    const bodyHtml = `
      <div style="margin-bottom: 16px;">
        <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: var(--md-sys-radius-sm); padding: 14px 16px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <span class="mono-tag" style="margin-bottom: 2px;">// FORMAL JOB OFFER GENERATOR</span>
              <h4 style="margin: 4px 0 0 0; color: var(--md-sys-color-on-surface); font-size: 1.05rem;">
                Candidate: <strong>${cand.name || 'Candidate'}</strong>
              </h4>
              <div class="text-muted" style="font-size: 0.82rem; margin-top: 2px;">
                Target Role: <strong>${job.title || 'Role'}</strong> &bull; ${cand.email || ''}
              </div>
            </div>
            ${existing.status ? `
              <div>
                <span class="badge badge-${existing.status === 'accepted' ? 'selected' : (existing.status === 'declined' ? 'rejected' : 'shortlisted')}" style="text-transform: uppercase;">
                  ${existing.status === 'accepted' ? 'Offer Accepted' : (existing.status === 'declined' ? 'Offer Declined' : 'Offer Sent / Pending')}
                </span>
              </div>
            ` : ''}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="offer-position">Official Position / Job Title <span style="color:var(--md-sys-color-error);">*</span></label>
            <input type="text" id="offer-position" class="form-control" value="${positionTitle}" required placeholder="e.g. Senior Software Engineer">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="offer-dept">Department / Division</label>
            <input type="text" id="offer-dept" class="form-control" value="${department}" placeholder="e.g. Core Engineering">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="offer-salary">Compensation / Annual Salary <span style="color:var(--md-sys-color-error);">*</span></label>
            <input type="text" id="offer-salary" class="form-control" value="${salary}" required placeholder="e.g. $125,000 / year or ₹18,00,000">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="offer-joining">Proposed Joining Date <span style="color:var(--md-sys-color-error);">*</span></label>
            <input type="date" id="offer-joining" class="form-control" value="${joiningDate}" required min="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="offer-type">Employment Type</label>
            <select id="offer-type" class="form-select">
              <option value="Full-Time" ${employmentType === 'Full-Time' ? 'selected' : ''}>Full-Time</option>
              <option value="Contract" ${employmentType === 'Contract' ? 'selected' : ''}>Contract</option>
              <option value="Part-Time" ${employmentType === 'Part-Time' ? 'selected' : ''}>Part-Time</option>
              <option value="Internship" ${employmentType === 'Internship' ? 'selected' : ''}>Internship</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="offer-loc">Work Location</label>
            <input type="text" id="offer-loc" class="form-control" value="${location}" placeholder="e.g. Remote or San Francisco, CA">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="offer-manager">Reporting Manager</label>
            <input type="text" id="offer-manager" class="form-control" value="${reportingManager}" placeholder="e.g. Director of Product">
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label" for="offer-benefits">Benefits, Perks & Stipends</label>
          <textarea id="offer-benefits" class="form-control" rows="2" placeholder="List health benefits, 401k/PF match, PTO, stipends...">${benefits}</textarea>
        </div>

        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label" for="offer-terms">Offer Terms, Conditions & Contingencies</label>
          <textarea id="offer-terms" class="form-control" rows="2" placeholder="Standard terms, validity period, background check stipulations...">${terms}</textarea>
        </div>

        <!-- Optional Document Upload -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" for="offer-doc-file" style="display: flex; align-items: center; justify-content: space-between;">
            <span><span class="material-icons icon-sm" style="color:var(--accent-cyan); vertical-align:-2px;">attachment</span> Attach Official Offer Letter Document (Optional PDF / DOCX):</span>
            ${hasDoc ? `<a href="${existing.document_url}" target="_blank" style="font-size: 0.78rem; color: var(--accent-cyan); text-decoration: none;"><span class="material-icons" style="font-size:13px; vertical-align:-2px;">visibility</span> View Current Document</a>` : ''}
          </label>
          <input type="file" id="offer-doc-file" class="form-control" accept=".pdf,.docx,.doc">
          <small class="text-muted" style="display: block; margin-top: 4px;">Upload custom signed PDF or formal corporate agreement (Max 10MB)</small>
        </div>
      </div>
    `;

    window.Modal.create({
      title: existing.id ? `Update Offer Letter — ${cand.name || 'Candidate'}` : `Issue Formal Job Offer — ${cand.name || 'Candidate'}`,
      bodyHtml: bodyHtml,
      cancelText: 'Cancel',
      confirmText: existing.id ? 'Update & Send Offer' : 'Issue & Send Offer Letter',
      onConfirm: async (backdrop) => {
        const position = backdrop.querySelector('#offer-position').value.trim();
        const dept = backdrop.querySelector('#offer-dept').value.trim();
        const salaryVal = backdrop.querySelector('#offer-salary').value.trim();
        const joining = backdrop.querySelector('#offer-joining').value;
        const type = backdrop.querySelector('#offer-type').value;
        const loc = backdrop.querySelector('#offer-loc').value.trim();
        const manager = backdrop.querySelector('#offer-manager').value.trim();
        const ben = backdrop.querySelector('#offer-benefits').value.trim();
        const trm = backdrop.querySelector('#offer-terms').value.trim();
        const fileInput = backdrop.querySelector('#offer-doc-file');
        const docFile = fileInput && fileInput.files ? fileInput.files[0] : null;

        if (!position || !salaryVal || !joining) {
          window.Toast.error("Position title, compensation, and joining date are required.");
          return false;
        }

        const formData = new FormData();
        formData.append('position_title', position);
        formData.append('department', dept);
        formData.append('salary', salaryVal);
        formData.append('joining_date', joining);
        formData.append('employment_type', type);
        formData.append('location', loc);
        formData.append('reporting_manager', manager);
        formData.append('benefits', ben);
        formData.append('terms', trm);
        if (docFile) {
          formData.append('offer_document', docFile);
        }

        try {
          window.Toast.info("Dispatching formal offer letter...");
          const res = await window.applicationsApi.provideOfferLetter(application.id, formData);
          window.Toast.success("Formal job offer issued successfully! Candidate notified via email.");
          if (onSaved) onSaved(res.data);
          return true;
        } catch (err) {
          window.Toast.error(err.message || "Failed to issue offer letter.");
          return false;
        }
      }
    });
  },

  /**
   * Candidate: Open modal to inspect full job offer details, download PDF, and respond (Accept/Decline)
   */
  async openCandidateModal(application, onResponded = null) {
    let offer = application.offer_letter;
    if (!offer) {
      try {
        const res = await window.applicationsApi.getOfferLetter(application.id);
        offer = res.data.offer_letter;
      } catch (err) {
        window.Toast.warning("No formal offer letter is available for review yet.");
        return;
      }
    }

    const job = application.job || {};
    const cand = application.candidate || (window.authApi ? window.authApi.getCurrentUser() : {}) || {};
    const isPending = (offer.status === 'pending');
    const isAccepted = (offer.status === 'accepted');
    const isDeclined = (offer.status === 'declined');

    const formattedJoining = offer.joining_date ? (window.DateFormat ? window.DateFormat.formatDate(offer.joining_date) : offer.joining_date) : 'To be confirmed';

    let statusBanner = '';
    if (isAccepted) {
      statusBanner = `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
          <span class="material-icons" style="color: #10b981; font-size: 24px;">check_circle</span>
          <div>
            <strong style="color: #10b981; font-size: 0.95rem;">You Accepted This Offer</strong>
            <div class="text-muted" style="font-size: 0.82rem; margin-top: 2px;">
              Responded on ${offer.responded_at ? (window.DateFormat ? window.DateFormat.formatDate(offer.responded_at) : offer.responded_at) : 'Recently'}. The recruitment team has been notified.
            </div>
          </div>
        </div>
      `;
    } else if (isDeclined) {
      statusBanner = `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
          <span class="material-icons" style="color: #ef4444; font-size: 24px;">cancel</span>
          <div>
            <strong style="color: #ef4444; font-size: 0.95rem;">You Declined This Offer</strong>
            <div class="text-muted" style="font-size: 0.82rem; margin-top: 2px;">
              Status recorded on ${offer.responded_at ? (window.DateFormat ? window.DateFormat.formatDate(offer.responded_at) : offer.responded_at) : 'Recently'}.
            </div>
          </div>
        </div>
      `;
    } else {
      statusBanner = `
        <div style="background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
          <span class="material-icons" style="color: var(--accent-cyan); font-size: 24px;">stars</span>
          <div>
            <strong style="color: var(--accent-cyan); font-size: 0.96rem;">Formal Job Offer Extended</strong>
            <div class="text-muted" style="font-size: 0.82rem; margin-top: 2px;">
              Please carefully review the compensation, role responsibilities, and proposed start date below.
            </div>
          </div>
        </div>
      `;
    }

    const bodyHtml = `
      <div>
        ${statusBanner}

        <!-- Official Letterhead Layout -->
        <div style="background: var(--bg-surface-glass); border: 1px solid var(--md-sys-color-outline); border-radius: var(--md-sys-radius-sm); padding: 22px; margin-bottom: 20px; box-shadow: var(--md-sys-elevation-1);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--md-sys-color-outline); padding-bottom: 16px; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
            <div>
              <div class="mono-tag" style="margin-bottom: 4px;">// RECRUITMENT ATS &bull; OFFICIAL OFFER</div>
              <h3 style="margin: 0; font-size: 1.4rem; color: var(--md-sys-color-on-surface);">${offer.position_title}</h3>
              <div class="text-muted" style="font-size: 0.88rem; margin-top: 4px;">
                ${offer.department ? `<strong>${offer.department}</strong> &bull; ` : ''} ${offer.employment_type || 'Full-Time'}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--accent-cyan); text-transform: uppercase;">Candidate</div>
              <div style="font-weight: 700; color: var(--md-sys-color-on-surface);">${cand.name || 'Candidate'}</div>
            </div>
          </div>

          <!-- Position Core Attributes Grid -->
          <div class="grid grid-cols-3" style="background: var(--bg-surface); border: 1px solid var(--md-sys-color-outline); border-radius: var(--md-sys-radius-sm); padding: 16px; margin-bottom: 20px; gap: 12px;">
            <div>
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-cyan); font-family: var(--font-mono); font-weight: 700; margin-bottom: 4px;">Annual Compensation</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-cyan); font-family: var(--font-mono);">${offer.salary}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-cyan); font-family: var(--font-mono); font-weight: 700; margin-bottom: 4px;">Proposed Start Date</div>
              <div style="font-size: 1.05rem; font-weight: 700; color: var(--md-sys-color-on-surface);">${formattedJoining}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-cyan); font-family: var(--font-mono); font-weight: 700; margin-bottom: 4px;">Location / Workplace</div>
              <div style="font-size: 1.05rem; font-weight: 700; color: var(--md-sys-color-on-surface);">${offer.location || 'Remote'}</div>
            </div>
          </div>

          ${offer.reporting_manager ? `
            <div style="margin-bottom: 16px; font-size: 0.9rem;">
              <span class="text-muted">Reporting To:</span> <strong>${offer.reporting_manager}</strong>
            </div>
          ` : ''}

          <!-- Benefits Section -->
          ${offer.benefits ? `
            <div style="margin-bottom: 18px;">
              <h4 style="font-size: 0.95rem; margin-bottom: 8px; color: var(--md-sys-color-on-surface); display: flex; align-items: center; gap: 6px;">
                <span class="material-icons icon-sm" style="color: var(--accent-purple);">card_giftcard</span> Benefits & Perks
              </h4>
              <div style="background: var(--bg-surface); padding: 12px 14px; border-radius: var(--md-sys-radius-sm); border: 1px solid var(--md-sys-color-outline); font-size: 0.88rem; line-height: 1.5; color: var(--md-sys-color-on-surface-variant); white-space: pre-wrap;">${offer.benefits}</div>
            </div>
          ` : ''}

          <!-- Terms & Conditions Section -->
          ${offer.terms ? `
            <div style="margin-bottom: 18px;">
              <h4 style="font-size: 0.95rem; margin-bottom: 8px; color: var(--md-sys-color-on-surface); display: flex; align-items: center; gap: 6px;">
                <span class="material-icons icon-sm" style="color: var(--accent-cyan);">gavel</span> Terms & Conditions
              </h4>
              <div style="background: var(--bg-surface); padding: 12px 14px; border-radius: var(--md-sys-radius-sm); border: 1px solid var(--md-sys-color-outline); font-size: 0.85rem; line-height: 1.5; color: var(--md-sys-color-on-surface-variant); white-space: pre-wrap;">${offer.terms}</div>
            </div>
          ` : ''}

          <!-- Attached Document Download -->
          ${offer.document_url ? `
            <div style="background: rgba(2, 132, 199, 0.08); border: 1px solid rgba(2, 132, 199, 0.25); border-radius: var(--md-sys-radius-sm); padding: 12px 16px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="material-icons" style="color: var(--accent-cyan); font-size: 24px;">description</span>
                <div>
                  <div style="font-weight: 700; font-size: 0.92rem; color: var(--md-sys-color-on-surface);">Signed Offer Document Attached</div>
                  <div class="text-muted" style="font-size: 0.78rem;">Official corporate agreement document</div>
                </div>
              </div>
              <a href="${offer.document_url}" target="_blank" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
                <span class="material-icons icon-sm">download</span> Download Offer Letter
              </a>
            </div>
          ` : ''}
        </div>

        <!-- Interactive Candidate Decision Controls (Only if pending) -->
        ${isPending ? `
          <div style="border-top: 1px solid var(--md-sys-color-outline); padding-top: 18px;">
            <div class="form-group" style="margin-bottom: 16px;">
              <label class="form-label" for="candidate-offer-notes" style="font-size: 0.86rem;">
                Optional Note / Response Message for Recruiter:
              </label>
              <textarea id="candidate-offer-notes" class="form-control" rows="2" placeholder="e.g. Delighted to accept and eager to start on the proposed date!"></textarea>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
              <button type="button" id="btn-decline-offer" class="btn btn-danger btn-sm" style="padding: 10px 18px;">
                <span class="material-icons icon-sm">cancel</span> Decline Offer
              </button>
              <button type="button" id="btn-accept-offer" class="btn btn-primary btn-sm" style="padding: 10px 22px;">
                <span class="material-icons icon-sm">check_circle</span> Accept Job Offer
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    const modal = window.Modal.create({
      title: `Job Offer Review — ${offer.position_title}`,
      bodyHtml: bodyHtml,
      cancelText: 'Close',
      confirmText: '' // We use custom accept/decline buttons
    });

    if (isPending) {
      const btnAccept = modal.backdrop.querySelector('#btn-accept-offer');
      const btnDecline = modal.backdrop.querySelector('#btn-decline-offer');
      const notesInput = modal.backdrop.querySelector('#candidate-offer-notes');

      btnAccept?.addEventListener('click', async () => {
        btnAccept.disabled = true;
        btnAccept.innerText = 'Accepting...';
        try {
          const notes = notesInput ? notesInput.value.trim() : '';
          await window.applicationsApi.respondToOffer(application.id, 'accepted', notes);
          window.Toast.success("Congratulations! You have accepted the job offer. The recruitment team has been alerted.");
          modal.close();
          if (onResponded) onResponded('accepted');
        } catch (err) {
          window.Toast.error(err.message || "Failed to accept offer.");
          btnAccept.disabled = false;
          btnAccept.innerHTML = '<span class="material-icons icon-sm">check_circle</span> Accept Job Offer';
        }
      });

      btnDecline?.addEventListener('click', async () => {
        if (!confirm("Are you sure you wish to decline this job offer?")) return;
        btnDecline.disabled = true;
        btnDecline.innerText = 'Declining...';
        try {
          const notes = notesInput ? notesInput.value.trim() : '';
          await window.applicationsApi.respondToOffer(application.id, 'declined', notes);
          window.Toast.info("You have declined the job offer. The recruiter has been notified.");
          modal.close();
          if (onResponded) onResponded('declined');
        } catch (err) {
          window.Toast.error(err.message || "Failed to decline offer.");
          btnDecline.disabled = false;
          btnDecline.innerHTML = '<span class="material-icons icon-sm">cancel</span> Decline Offer';
        }
      });
    }
  }
};

window.OfferModal = OfferModal;
