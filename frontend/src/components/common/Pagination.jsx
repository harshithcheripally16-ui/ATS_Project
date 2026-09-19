import React from 'react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.total_pages <= 1) return null;

  const { page, total_pages, has_prev, has_next } = pagination;

  const pageNumbers = [];
  for (let i = 1; i <= total_pages; i++) {
    if (i === 1 || i === total_pages || (i >= page - 1 && i <= page + 1)) {
      pageNumbers.push(i);
    } else if (i === page - 2 || i === page + 2) {
      pageNumbers.push('...');
    }
  }

  // Deduplicate consecutive '...'
  const filteredPageNumbers = pageNumbers.filter((val, idx, arr) => {
    if (val === '...' && arr[idx - 1] === '...') return false;
    return true;
  });

  return (
    <div className="pagination">
      <button
        type="button"
        className="page-btn"
        disabled={!has_prev}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>

      {filteredPageNumbers.map((p, idx) => {
        if (p === '...') {
          return <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: 'var(--md-sys-color-on-surface-variant)' }}>...</span>;
        }
        return (
          <button
            key={p}
            type="button"
            className={`page-btn ${p === page ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        className="page-btn"
        disabled={!has_next}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
