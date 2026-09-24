import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function HeroInteractiveCard() {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const container = card.closest('.hero-ats-split') || card.parentElement;
    if (!container) return;

    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let isHovered = false;
    let idleTime = 0;
    let rafId = null;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - cardCenterX) / (window.innerWidth * 0.35);
      const deltaY = (e.clientY - cardCenterY) / (window.innerHeight * 0.35);

      // Clamp max tilt angles between -15 deg and +15 deg
      targetRotY = Math.max(-15, Math.min(15, deltaX * 18));
      targetRotX = Math.max(-15, Math.min(15, -deltaY * 18));
      isHovered = true;
    };

    const handleMouseLeave = () => {
      isHovered = false;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    const loop = () => {
      if (!isHovered) {
        // Idle gentle breathing float motion when mouse is not over container
        idleTime += 0.025;
        targetRotX = Math.sin(idleTime) * 3.5;
        targetRotY = Math.cos(idleTime * 0.8) * 4.5;
      }

      // Smooth spring inertia (12% lerp per frame)
      currentRotX += (targetRotX - currentRotX) * 0.12;
      currentRotY += (targetRotY - currentRotY) * 0.12;

      card.style.transform = `perspective(1200px) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="card-25d-viewport">
      <div className="card-25d-stage" id="hero-interactive-card" ref={cardRef}>
        <div className="card-25d-panel">
          {/* 3D Floating Match Score Chip */}
          <div className="match-score-chip">
            <span className="material-icons" style={{ fontSize: '14px' }}>auto_awesome</span>
            <span>98% Match Rate</span>
          </div>

          {/* Top Layer: Candidate Profile Overview */}
          <div className="float-3d-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: '#07090e',
                  boxShadow: '0 4px 12px rgba(0, 240, 255, 0.3)'
                }}
              >
                AV
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                    Alex Vance
                  </h4>
                  <span className="badge badge-interview" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                    In Review
                  </span>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Senior Full-Stack Architect &bull; San Francisco
                </p>
              </div>
            </div>
          </div>

          {/* Mid Layer: 4-Stage ATS Stepper Pipeline */}
          <div className="float-3d-mid">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="mono-tag" style={{ fontSize: '0.7rem' }}>// PIPELINE STAGE GATE</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>Stage 3 of 4</span>
            </div>
            <div className="ats-stepper">
              <div className="ats-step completed">
                <div className="ats-step-icon"><span className="material-icons" style={{ fontSize: '14px' }}>check</span></div>
                <div className="ats-step-label">Applied</div>
              </div>
              <div className="ats-step completed">
                <div className="ats-step-icon"><span className="material-icons" style={{ fontSize: '14px' }}>check</span></div>
                <div className="ats-step-label">Screened</div>
              </div>
              <div className="ats-step active">
                <div className="ats-step-icon"><span className="material-icons" style={{ fontSize: '14px' }}>psychology</span></div>
                <div className="ats-step-label">Interview</div>
              </div>
              <div className="ats-step">
                <div className="ats-step-icon">4</div>
                <div className="ats-step-label">Selected</div>
              </div>
            </div>
          </div>

          {/* Bottom Layer: Interview Event & Quick Actions */}
          <div className="float-3d-bottom">
            <div className="floating-interview-widget" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-icons" style={{ fontSize: '18px' }}>event</span>
                <span>System Architecture Deep-Dive</span>
              </div>
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>Today, 4:00 PM</strong>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/jobs" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center', fontSize: '0.82rem' }}>
                <span className="material-icons icon-sm">thumb_up</span> Advance Stage
              </Link>
              <Link to="/jobs" className="btn btn-secondary btn-sm" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                <span className="material-icons icon-sm">visibility</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
