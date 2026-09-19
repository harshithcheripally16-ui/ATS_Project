import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function HeroCanvas() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId = null;

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const getColors = () => {
      const isLight = !isDark;
      const cyan = isLight ? '#0284c7' : '#00f0ff';
      const blue = isLight ? '#2563eb' : '#3b82f6';
      return { cyan, blue, isLight };
    };

    const hexToRgba = (hex, alpha) => {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
    };

    let width = 800;
    let height = 450;
    let layers = [];

    const generateParticles = (count, radius, opacity, speedScale, color) => {
      const particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * speedScale,
          vy: (Math.random() - 0.5) * speedScale,
          radius,
          opacity,
          color
        });
      }
      return particles;
    };

    const createLayers = () => {
      const isMobile = width < 768;
      const { cyan, blue, isLight } = getColors();

      layers = [
        {
          parallaxFactor: 0.015,
          maxLines: 80,
          particles: generateParticles(isMobile ? 12 : 25, 1.4, isLight ? 0.35 : 0.25, 0.3, blue)
        },
        {
          parallaxFactor: 0.035,
          maxLines: 120,
          particles: generateParticles(isMobile ? 18 : 35, 2.4, isLight ? 0.65 : 0.5, 0.6, cyan)
        },
        {
          parallaxFactor: 0.075,
          maxLines: 0,
          particles: generateParticles(isMobile ? 8 : 15, 3.8, isLight ? 0.9 : 0.85, 0.9, isLight ? blue : cyan)
        }
      ];
    };

    const resize = () => {
      width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      height = canvas.parentElement ? canvas.parentElement.clientHeight : 450;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      createLayers();
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      targetMouseX = e.clientX - centerX;
      targetMouseY = e.clientY - centerY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const { cyan, blue, isLight } = getColors();

      const gradient = ctx.createRadialGradient(
        width / 2 + mouseX * 0.02,
        height / 2 + mouseY * 0.02,
        20,
        width / 2,
        height / 2,
        width * 0.6
      );
      if (isLight) {
        gradient.addColorStop(0, hexToRgba(cyan, 0.12));
        gradient.addColorStop(0.5, hexToRgba(blue, 0.06));
        gradient.addColorStop(1, 'transparent');
      } else {
        gradient.addColorStop(0, hexToRgba(cyan, 0.08));
        gradient.addColorStop(0.5, hexToRgba(blue, 0.03));
        gradient.addColorStop(1, 'transparent');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      layers.forEach(layer => {
        const offsetX = mouseX * layer.parallaxFactor;
        const offsetY = mouseY * layer.parallaxFactor;

        if (layer.maxLines > 0) {
          for (let i = 0; i < layer.particles.length; i++) {
            for (let j = i + 1; j < layer.particles.length; j++) {
              const p1 = layer.particles[i];
              const p2 = layer.particles[j];
              const dx = (p1.x + offsetX) - (p2.x + offsetX);
              const dy = (p1.y + offsetY) - (p2.y + offsetY);
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < layer.maxLines) {
                const alpha = (1 - dist / layer.maxLines) * p1.opacity * (isLight ? 0.6 : 0.4);
                ctx.beginPath();
                ctx.moveTo(p1.x + offsetX, p1.y + offsetY);
                ctx.lineTo(p2.x + offsetX, p2.y + offsetY);
                ctx.strokeStyle = hexToRgba(p1.color, alpha);
                ctx.lineWidth = isLight ? 1.1 : 0.8;
                ctx.stroke();
              }
            }
          }
        }

        layer.particles.forEach(p => {
          const px = p.x + offsetX;
          const py = p.y + offsetY;

          ctx.beginPath();
          ctx.arc(px, py, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(p.color, p.opacity);
          ctx.fill();
        });
      });
    };

    const loop = () => {
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      layers.forEach(layer => {
        layer.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        });
      });

      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    if (prefersReducedMotion) {
      draw();
    } else {
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return <canvas ref={canvasRef} id="hero-canvas" />;
}
