/**
 * Pagination Component Generator
 */
const PaginationComponent = {
  render(pagination, containerElement, onPageChange) {
    if (!containerElement || !pagination || pagination.total_pages <= 1) {
      if (containerElement) containerElement.innerHTML = '';
      return;
    }

    const { page, total_pages, has_prev, has_next } = pagination;

    let html = `
      <div class="pagination">
        <button class="page-btn" ${!has_prev ? 'disabled' : ''} data-page="${page - 1}">Previous</button>
    `;

    for (let i = 1; i <= total_pages; i++) {
      if (i === 1 || i === total_pages || (i >= page - 1 && i <= page + 1)) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === page - 2 || i === page + 2) {
        html += `<span style="padding: 0 4px;">...</span>`;
      }
    }

    html += `
        <button class="page-btn" ${!has_next ? 'disabled' : ''} data-page="${page + 1}">Next</button>
      </div>
    `;

    containerElement.innerHTML = html;

    containerElement.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPage = parseInt(btn.getAttribute('data-page'));
        if (targetPage && targetPage !== page) {
          onPageChange(targetPage);
        }
      });
    });
  }
};

window.PaginationComponent = PaginationComponent;
