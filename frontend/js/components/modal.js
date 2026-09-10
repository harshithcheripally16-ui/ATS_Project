/**
 * Reusable Accessible Modal Component
 */
const Modal = {
  create({ title, bodyHtml, confirmText = 'Confirm', onConfirm = null, cancelText = 'Cancel' }) {
    const modalId = 'modal_' + Math.random().toString(36).substr(2, 9);

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop active';
    backdrop.id = modalId;

    backdrop.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button style="background:none;border:none;font-size:22px;cursor:pointer;" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${bodyHtml}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">${cancelText}</button>
          ${onConfirm ? `<button class="btn btn-primary modal-confirm">${confirmText}</button>` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const close = () => {
      backdrop.classList.remove('active');
      setTimeout(() => backdrop.remove(), 200);
    };

    backdrop.querySelector('.modal-close').addEventListener('click', close);
    backdrop.querySelector('.modal-cancel').addEventListener('click', close);

    if (onConfirm) {
      backdrop.querySelector('.modal-confirm').addEventListener('click', async () => {
        const shouldClose = await onConfirm(backdrop);
        if (shouldClose !== false) {
          close();
        }
      });
    }

    return { backdrop, close };
  }
};

window.Modal = Modal;
