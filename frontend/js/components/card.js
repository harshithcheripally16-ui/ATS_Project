/**
 * Consolidated Card Component
 * Provides unified job cards, applicant cards, and skeleton loading cards
 * with MUI-consistent elevation, interactive feedback, high text contrast, and badge styling
 * fully responsive to light and dark theme switching.
 */
const CardComponent = {
  /**
   * Render a Job Card
   */
  renderJobCard(job, options = {}) {
    const { isApplied = false, userRole = null, onApply = null } = options;
    const categoryName = job.category ? job.category.name : (job.category_name || "General");
    const skillsList = job.skills_required ? job.skills_required.split(",").map(s => s.trim()).filter(Boolean) : (Array.isArray(job.skills) ? job.skills : []);

    let actionBtn = "";
    if (userRole === "candidate") {
      if (isApplied) {
        actionBtn = `<span class="badge badge-selected" style="padding: 8px 14px; font-size: 0.85rem;"><span class="material-icons icon-sm">check_circle</span> Applied</span>`;
      } else {
        actionBtn = `<button onclick="${onApply || `window.applyJobDirect(${job.id})`}" class="btn btn-primary btn-sm"><span class="material-icons icon-sm">send</span> Quick Apply</button>`;
      }
    }

    return `
      <div class="card card-interactive" id="job-card-${job.id}" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px;">
            <h3 style="font-size: 1.15rem; font-weight: 700; margin: 0; line-height: 1.3;">
              <a href="/pages/job-detail.html?id=${job.id}" style="text-decoration: none; color: inherit;">${job.title}</a>
            </h3>
            <span class="badge badge-category" style="white-space: nowrap;">${categoryName}</span>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 0.88rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 16px;">
            <span style="display: flex; align-items: center; gap: 4px;"><span class="material-icons icon-sm" style="color: var(--accent-cyan);">location_on</span> <strong>${job.location || "Remote"}</strong></span>
            <span style="display: flex; align-items: center; gap: 4px;"><span class="material-icons icon-sm" style="color: var(--accent-cyan);">work</span> <strong>${job.experience || (job.experience_required ? `${job.experience_required} yrs exp` : "Any Experience")}</strong></span>
            ${job.salary ? `<span style="display: flex; align-items: center; gap: 4px;"><span class="material-icons icon-sm" style="color: var(--accent-cyan);">payments</span> <strong style="color: var(--accent-cyan); font-family: var(--font-mono);">${job.salary}</strong></span>` : ""}
          </div>

          <p style="font-size: 0.92rem; color: var(--md-sys-color-on-surface-variant); line-height: 1.5; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${job.description || "No description available."}
          </p>

          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px;">
            ${skillsList.map(skill => `<span class="badge badge-skill">${skill}</span>`).join("")}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid var(--md-sys-color-outline);">
          <a href="/pages/job-detail.html?id=${job.id}" class="btn btn-secondary btn-sm"><span class="material-icons icon-sm">visibility</span> View Details</a>
          ${actionBtn}
        </div>
      </div>
    `;
  },

  /**
   * Render an Applicant Card (for Kanban / Table views)
   */
  renderApplicantCard(app, options = {}) {
    const candidateName = app.candidate ? app.candidate.name : "Unknown Candidate";
    const skillsList = app.candidate && app.candidate.skills ? app.candidate.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
    const statusLabel = (app.status || "applied").replace("_", " ").toUpperCase();

    let resumeBtn = "";
    if (app.candidate && app.candidate.resume_url) {
      resumeBtn = `<a href="${app.candidate.resume_url}" target="_blank" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 0.78rem;"><span class="material-icons icon-sm">description</span> Resume</a>`;
    }

    return `
      <div class="card card-interactive applicant-card" data-app-id="${app.id}" data-status="${app.status}" style="margin-bottom: 12px; padding: 16px; background: var(--bg-surface); border: 1px solid var(--md-sys-color-outline);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h4 style="font-size: 0.98rem; font-weight: 700; margin: 0; color: var(--md-sys-color-on-surface);">${candidateName}</h4>
          <span class="badge badge-${app.status || "applied"}" style="font-size: 0.72rem; padding: 3px 8px;">${statusLabel}</span>
        </div>

        <p style="font-size: 0.85rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 10px; line-height: 1.4;">
          ${app.candidate && app.candidate.experience ? app.candidate.experience : "No experience notes."}
        </p>

        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px;">
          ${skillsList.slice(0, 3).map(skill => `<span class="badge badge-skill" style="font-size: 0.72rem; padding: 2px 6px;">${skill}</span>`).join("")}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          ${resumeBtn}
          <small style="font-size: 0.78rem; color: var(--md-sys-color-on-surface-variant); font-weight: 500;">${app.applied_date ? (window.DateFormat ? window.DateFormat.formatDate(app.applied_date) : (window.formatDate ? window.formatDate(app.applied_date) : app.applied_date)) : ""}</small>
        </div>
      </div>
    `;
  },

  /**
   * Render a Skeleton Loading Card
   */
  renderSkeletonCard() {
    return `
      <div class="skeleton-card" style="height: 220px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
            <div class="skeleton-box" style="width: 60%; height: 24px;"></div>
            <div class="skeleton-box" style="width: 25%; height: 24px;"></div>
          </div>
          <div class="skeleton-box" style="width: 40%; height: 16px; margin-bottom: 16px;"></div>
          <div class="skeleton-box" style="width: 100%; height: 40px; margin-bottom: 16px;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="skeleton-box" style="width: 30%; height: 32px;"></div>
          <div class="skeleton-box" style="width: 30%; height: 32px;"></div>
        </div>
      </div>
    `;
  },

  /**
   * Render multiple Skeleton Loading Cards into a container
   */
  renderSkeletonsInto(containerElement, count = 4) {
    if (!containerElement) return;
    containerElement.innerHTML = Array(count).fill(this.renderSkeletonCard()).join("");
  }
};

window.CardComponent = CardComponent;

