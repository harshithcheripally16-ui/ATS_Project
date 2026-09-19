import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const success = useCallback((msg, dur) => show(msg, 'success', dur), [show]);
  const error = useCallback((msg, dur) => show(msg, 'error', dur), [show]);
  const warning = useCallback((msg, dur) => show(msg, 'warning', dur), [show]);
  const info = useCallback((msg, dur) => show(msg, 'info', dur), [show]);

  // Set window.Toast for compatibility
  useEffect(() => {
    window.Toast = {
      show,
      success,
      error,
      warning,
      info
    };
  }, [show, success, error, warning, info]);

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} role="alert">
            <span>{t.message}</span>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                marginLeft: '12px',
                lineHeight: 1
              }}
              onClick={() => removeToast(t.id)}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
