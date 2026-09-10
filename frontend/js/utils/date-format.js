/**
 * Shared Date Formatting Utility
 * Standardizes date display across all frontend views to DD-MM-YYYY format
 * without altering backend storage or API ISO strings.
 */
const DateFormat = {
  /**
   * Format ISO string or Date object to DD-MM-YYYY
   * @param {string|Date} dateInput 
   * @returns {string} Formatted date (e.g., "06-09-2026") or "—" if invalid
   */
  formatDate(dateInput) {
    if (!dateInput) return '—';
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return '—';

      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      return `${day}-${month}-${year}`;
    } catch (e) {
      return '—';
    }
  },

  /**
   * Format ISO string or Date object to DD-MM-YYYY, HH:mm
   * @param {string|Date} dateInput 
   * @returns {string} Formatted date & time (e.g., "06-09-2026, 14:30") or "—" if invalid
   */
  formatDateTime(dateInput) {
    if (!dateInput) return '—';
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return '—';

      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');

      return `${day}-${month}-${year}, ${hours}:${minutes}`;
    } catch (e) {
      return '—';
    }
  }
};

window.DateFormat = DateFormat;
