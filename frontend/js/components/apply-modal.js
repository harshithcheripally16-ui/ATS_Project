/**
 * Candidate Job Application Modal with Resume Review & Upload
 * Ensures candidates can attach, update, or preview their resume when applying for any job.
 */
const ApplyModal = {
  async open({ jobId, jobTitle = 'Job Position', jobLocation = '', jobSkills = [], jobExperience = '', onApplied = null }) {
    const user = window.authApi ? window.authApi.getCurrentUser() : null;

    if (!user) {
      window.Toast ? window.Toast.info("Please log in with your candidate account to apply.") : alert("Please log in to apply.");
      setTimeout(() => {
        window.location.href = `/pages/login.html?redirect=${encodeURIComponent(window.location.href)}`;
      }, 800);
      return;
    }

    if (user.role !== 'candidate') {
      window.Toast ? window.Toast.warning(`You are logged in as '${user.role}'. Only candidate accounts can apply for jobs.`) : alert("Only candidates can apply.");
      return;
    }

    let profile = {};
    try {
      if (window.candidatesApi) {
        const res = await window.candidatesApi.getProfile();
        profile = (res.data && res.data.profile) ? res.data.profile : {};
      }
    } catch (err) {
      console.warn("Could not fetch candidate profile details:", err);
    }

    const hasResume = Boolean(profile.resume_url);
    const resumeFilename = hasResume ? profile.resume_url.split('/').pop() : '';

    const rawCandSkills = profile.skills || '';
    const candSkills = (Array.isArray(rawCandSkills) ? rawCandSkills : rawCandSkills.split(',')).map(s => s.trim().toLowerCase()).filter(Boolean);
    const skillsList = (Array.isArray(jobSkills) ? jobSkills : (jobSkills ? jobSkills.split(',') : [])).map(s => s.trim().toLowerCase()).filter(Boolean);
    let matchPillHtml = '';
    if (skillsList.length > 0 && candSkills.length > 0) {
      const matched = skillsList.filter(js => candSkills.some(cs => cs === js || cs.includes(js) || js.includes(cs)));
      const score = Math.round((matched.length / skillsList.length) * 100);
      matchPillHtml = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0, 240, 255, 0.2); font-size: 0.78rem;">
          <span style="color: var(--accent-cyan); font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span class="material-icons" style="font-size: 14px;">speed</span> ATS Compatibility:</span>
          <span class="badge ${score >= 70 ? 'badge-selected' : (score >= 45 ? 'badge-shortlisted' : 'badge-draft')}" style="font-family: var(--font-mono); font-size: 0.72rem;">${score}% Match (${matched.length}/${skillsList.length} skills)</span>
        </div>
      `;
    }

    const bodyHtml = `
      <div style="margin-bottom: 16px;">
        <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 8px; padding: 12px 14px; margin-bottom: 16px;">
          <div style="font-weight: 700; font-size: 1.05rem; color: var(--md-sys-color-on-surface);">${jobTitle}</div>
          <div class="text-muted" style="font-size: 0.82rem; margin-top: 2px;">
            ${jobLocation ? `<span class="material-icons" style="font-size: 13px; vertical-align: -2px;">location_on</span> ${jobLocation}` : ''}
            <span style="margin: 0 4px;">&bull;</span> Candidate: <strong>${user.name || user.email}</strong>
          </div>
          ${matchPillHtml}
        </div>

        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" for="apply-phone" style="font-size: 0.84rem;">Contact Phone Number:</label>
          <input type="tel" id="apply-phone" class="form-control" placeholder="+1 (555) 000-0000" value="${profile.phone || user.phone || ''}">
        </div>

        <!-- Resume Review & Upload Section -->
        <div style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 0.84rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            <span class="material-icons icon-sm" style="color: var(--accent-cyan);">description</span>
            Resume for Recruiter Review:
          </label>

          ${hasResume ? `
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 12px 14px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <div>
                  <span style="font-weight: 700; color: #10b981; font-size: 0.88rem; display: flex; align-items: center; gap: 4px;">
                    <span class="material-icons" style="font-size: 16px;">check_circle</span> Active Resume on File
                  </span>
                  <div style="font-size: 0.78rem; color: var(--md-sys-color-on-surface-variant); margin-top: 2px;">${resumeFilename}</div>
                </div>
                <a href="${profile.resume_url}" target="_blank" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 4px 8px;">
                  <span class="material-icons icon-sm">visibility</span> Preview Resume
                </a>
              </div>
            </div>

            <div style="margin-bottom: 10px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; margin-bottom: 6px;">
                <input type="radio" name="resume-choice" value="existing" checked id="choice-existing">
                <span>Submit with current resume on file</span>
              </label>
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem;">
                <input type="radio" name="resume-choice" value="new" id="choice-new">
                <span>Upload a new / updated resume for this application</span>
              </label>
            </div>

            <div id="new-resume-group" style="display: none; margin-top: 10px;">
              <input type="file" id="apply-resume-file" class="form-control" accept=".pdf,.docx,.doc">
              <small class="text-muted" style="display: block; margin-top: 4px;">Supported formats: PDF, DOCX, DOC (max 10MB)</small>
            </div>
          ` : `
            <div style="background: rgba(2, 132, 199, 0.08); border: 1px solid rgba(2, 132, 199, 0.3); border-radius: 8px; padding: 12px 14px; margin-bottom: 12px;">
              <div style="font-weight: 700; color: var(--accent-cyan); font-size: 0.88rem; display: flex; align-items: center; gap: 4px;">
                <span class="material-icons" style="font-size: 16px;">upload_file</span> Resume Upload Required
              </div>
              <p class="text-muted" style="font-size: 0.82rem; margin: 4px 0 0 0;">
                You haven't uploaded a resume yet. Please attach your resume document so the recruiter can review your experience.
              </p>
            </div>

            <div id="new-resume-group">
              <input type="file" id="apply-resume-file" class="form-control" accept=".pdf,.docx,.doc" required>
              <small class="text-muted" style="display: block; margin-top: 4px;">Supported formats: PDF, DOCX, DOC (max 10MB)</small>
            </div>
          `}
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" for="apply-note" style="font-size: 0.84rem;">Note to Recruiter (Optional):</label>
          <textarea id="apply-note" class="form-control" rows="2" placeholder="Briefly mention key highlights or why you're interested in this role..."></textarea>
        </div>
      </div>
    `;

    const modal = window.Modal.create({
      title: `Submit Application`,
      bodyHtml: bodyHtml,
      confirmText: `Submit Application & Resume`,
      cancelText: `Cancel`,
      onConfirm: async (backdrop) => {
        const fileInput = backdrop.querySelector('#apply-resume-file');
        const phoneInput = backdrop.querySelector('#apply-phone');
        const choiceNew = backdrop.querySelector('#choice-new');
        const isNewChosen = choiceNew ? choiceNew.checked : true;

        const file = fileInput && fileInput.files ? fileInput.files[0] : null;

        // Validation: If no resume on file and no file selected
        if (!hasResume && !file) {
          window.Toast ? window.Toast.error("Please select a resume file (.pdf, .doc, .docx) before applying.") : alert("Resume required.");
          return false;
        }

        // If candidate chose to upload a new resume
        if (isNewChosen && file) {
          const allowedExts = ['pdf', 'doc', 'docx'];
          const ext = file.name.split('.').pop().toLowerCase();
          if (!allowedExts.includes(ext)) {
            window.Toast.error("Unsupported file extension. Allowed formats: .pdf, .doc, .docx");
            return false;
          }
          if (file.size > 10 * 1024 * 1024) {
            window.Toast.error("File size exceeds 10MB limit.");
            return false;
          }

          // Upload resume first
          try {
            window.Toast.info("Uploading resume document...");
            await window.candidatesApi.uploadResume(file);
          } catch (uploadErr) {
            window.Toast.error(`Resume upload failed: ${uploadErr.message}`);
            return false;
          }
        } else if (isNewChosen && !hasResume && !file) {
          window.Toast.error("Please choose a resume file to upload.");
          return false;
        }

        // Optional phone update
        const phoneVal = phoneInput ? phoneInput.value.trim() : '';
        if (phoneVal && phoneVal !== profile.phone) {
          try {
            await window.candidatesApi.updateProfile({ phone: phoneVal });
          } catch (e) {
            console.warn("Could not update candidate phone:", e);
          }
        }

        // Submit the application
        try {
          const res = await window.applicationsApi.applyToJob(jobId);
          window.Toast.success("Application and resume submitted successfully! The recruiter can now review your profile.");
          if (onApplied) {
            onApplied(res.data.application);
          }
          return true;
        } catch (applyErr) {
          window.Toast.error(applyErr.message || "Failed to submit application.");
          return false;
        }
      }
    });

    // Toggle listener for radio buttons
    const choiceExisting = modal.backdrop.querySelector('#choice-existing');
    const choiceNew = modal.backdrop.querySelector('#choice-new');
    const newResumeGroup = modal.backdrop.querySelector('#new-resume-group');

    if (choiceExisting && choiceNew && newResumeGroup) {
      choiceExisting.addEventListener('change', () => {
        if (choiceExisting.checked) newResumeGroup.style.display = 'none';
      });
      choiceNew.addEventListener('change', () => {
        if (choiceNew.checked) newResumeGroup.style.display = 'block';
      });
    }
  }
};

window.ApplyModal = ApplyModal;
window.openApplyModal = (jobId, jobTitle, jobLocation, onApplied) => {
  ApplyModal.open({ jobId, jobTitle, jobLocation, onApplied });
};
window.applyJobDirect = async (jobId) => {
  let jobTitle = 'Job Position';
  let jobLocation = '';
  try {
    if (window.jobsApi) {
      const res = await window.jobsApi.getJob(jobId);
      if (res && res.data && res.data.job) {
        jobTitle = res.data.job.title;
        jobLocation = res.data.job.location || 'Remote';
      }
    }
  } catch (err) {
    console.warn("Could not fetch job info for apply modal:", err);
  }

  ApplyModal.open({
    jobId,
    jobTitle,
    jobLocation,
    onApplied: () => {
      if (typeof loadJobs === 'function') {
        const page = (typeof currentPage !== 'undefined') ? currentPage : 1;
        loadJobs(page);
      }
    }
  });
};
