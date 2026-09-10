/**
 * 2.5D Layered Canvas Hero - Pure JS & 2D HTML5 Canvas (No External Libraries)
 * 3-layer particle field with differential mouse-parallax tilt, intra-layer vector lines,
 * tab backgrounding pause, prefers-reduced-motion fallback, responsive viewport scaling,
 * and dynamic light/dark theme synchronization.
 */
class HeroCanvas25D {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d");
    this.animationFrameId = null;

    // Mouse Parallax Tracking
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    // Reduced Motion Detection
    this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Layer Configuration
    this.layers = [];
    this.init();
  }

  getThemeColors() {
    const isLight = (document.documentElement.getAttribute("data-theme") || "dark") === "light";
    const style = getComputedStyle(document.documentElement);
    const cyan = style.getPropertyValue("--accent-cyan").trim() || (isLight ? "#0284c7" : "#00f0ff");
    const blue = style.getPropertyValue("--accent-blue").trim() || (isLight ? "#2563eb" : "#3b82f6");
    return { cyan, blue, isLight };
  }

  hexToRgba(hex, alpha) {
    let c = hex.replace("#", "");
    if (c.length === 3) c = c.split("").map(x => x + x).join("");
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  resize() {
    this.width = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : window.innerWidth;
    this.height = this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 450;
    
    // Support High DPI Displays
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);

    this.createLayers();
  }

  createLayers() {
    const isMobile = this.width < 768;
    const { cyan, blue, isLight } = this.getThemeColors();

    // 3 Particle Depth Layers (Background, Midground, Foreground)
    this.layers = [
      // Background Layer (Slowest, smallest, dimmest, smallest parallax shift)
      {
        parallaxFactor: 0.015,
        maxLines: 80,
        particles: this.generateParticles(isMobile ? 12 : 25, 1.4, isLight ? 0.35 : 0.25, 0.3, blue)
      },
      // Midground Layer (Medium speed, mid size, intra-layer connecting lines)
      {
        parallaxFactor: 0.035,
        maxLines: 120,
        particles: this.generateParticles(isMobile ? 18 : 35, 2.4, isLight ? 0.65 : 0.5, 0.6, cyan)
      },
      // Foreground Layer (Fastest, largest, brightest, maximum parallax shift)
      {
        parallaxFactor: 0.075,
        maxLines: 0,
        particles: this.generateParticles(isMobile ? 8 : 15, 3.8, isLight ? 0.9 : 0.85, 0.9, isLight ? blue : cyan)
      }
    ];
  }

  onThemeChange() {
    const { cyan, blue, isLight } = this.getThemeColors();
    if (this.layers && this.layers.length >= 3) {
      this.layers[0].particles.forEach(p => {
        p.color = blue;
        p.opacity = isLight ? 0.35 : 0.25;
      });
      this.layers[1].particles.forEach(p => {
        p.color = cyan;
        p.opacity = isLight ? 0.65 : 0.5;
      });
      this.layers[2].particles.forEach(p => {
        p.color = isLight ? blue : cyan;
        p.opacity = isLight ? 0.9 : 0.85;
      });
    }
    if (this.prefersReducedMotion) {
      this.renderStaticFrame();
    }
  }

  generateParticles(count, radius, opacity, speedScale, color) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * speedScale,
        vy: (Math.random() - 0.5) * speedScale,
        radius,
        opacity,
        color
      });
    }
    return particles;
  }

  init() {
    this.resize();

    window.addEventListener("resize", () => this.resize());

    // Mouse Movement Listener for Parallax Shift
    window.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      this.targetMouseX = e.clientX - centerX;
      this.targetMouseY = e.clientY - centerY;
    });

    // Visibility Listener to Pause Loop when Tab is Hidden
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.start();
      } else {
        this.stop();
      }
    });

    // Theme Change Observer for Real-Time Theme Switching Response
    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
          this.onThemeChange();
        }
      });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    if (this.prefersReducedMotion) {
      this.renderStaticFrame();
    } else {
      this.start();
    }
  }

  start() {
    if (this.animationFrameId || this.prefersReducedMotion) return;
    const loop = () => {
      this.update();
      this.draw();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  update() {
    // Smooth Interpolation for Mouse Parallax
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    // Update Particle Positions
    this.layers.forEach(layer => {
      layer.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce at Boundaries
        if (p.x < 0 || p.x > this.width) p.vx *= -1;
        if (p.y < 0 || p.y > this.height) p.vy *= -1;
      });
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const { cyan, blue, isLight } = this.getThemeColors();

    // Soft Radial Ambient Glow behind the particle field
    const gradient = this.ctx.createRadialGradient(
      this.width / 2 + this.mouseX * 0.02,
      this.height / 2 + this.mouseY * 0.02,
      20,
      this.width / 2,
      this.height / 2,
      this.width * 0.6
    );
    if (isLight) {
      gradient.addColorStop(0, this.hexToRgba(cyan, 0.12));
      gradient.addColorStop(0.5, this.hexToRgba(blue, 0.06));
      gradient.addColorStop(1, "transparent");
    } else {
      gradient.addColorStop(0, this.hexToRgba(cyan, 0.08));
      gradient.addColorStop(0.5, this.hexToRgba(blue, 0.03));
      gradient.addColorStop(1, "transparent");
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw Layers from Background to Foreground
    this.layers.forEach(layer => {
      const offsetX = this.mouseX * layer.parallaxFactor;
      const offsetY = this.mouseY * layer.parallaxFactor;

      // Draw Intra-layer Vector Lines between nearby particles in the same layer
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
              this.ctx.beginPath();
              this.ctx.moveTo(p1.x + offsetX, p1.y + offsetY);
              this.ctx.lineTo(p2.x + offsetX, p2.y + offsetY);
              this.ctx.strokeStyle = this.hexToRgba(p1.color, alpha);
              this.ctx.lineWidth = isLight ? 1.1 : 0.8;
              this.ctx.stroke();
            }
          }
        }
      }

      // Draw Particles in Layer
      layer.particles.forEach(p => {
        const px = p.x + offsetX;
        const py = p.y + offsetY;

        this.ctx.beginPath();
        this.ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.hexToRgba(p.color, p.opacity);
        if (!isLight) {
          this.ctx.shadowColor = p.color;
          this.ctx.shadowBlur = p.radius > 3 ? 10 : 0;
        } else {
          this.ctx.shadowColor = this.hexToRgba(p.color, 0.4);
          this.ctx.shadowBlur = p.radius > 3 ? 6 : 0;
        }
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      });
    });
  }

  renderStaticFrame() {
    this.update();
    this.draw();
  }
}

/**
 * 2.5D Interactive Card Tilt Controller
 * Smooth spring-interpolated 3D parallax tilt responsive to cursor coordinates
 */
class Card25DTilt {
  constructor(cardId = "hero-interactive-card") {
    this.card = document.getElementById(cardId);
    if (!this.card) return;

    this.container = this.card.closest(".hero-ats-split") || this.card.parentElement;
    this.targetRotX = 0;
    this.targetRotY = 0;
    this.currentRotX = 0;
    this.currentRotY = 0;
    this.isHovered = false;
    this.rafId = null;

    this.init();
  }

  init() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    this.container.addEventListener("mousemove", (e) => {
      const rect = this.card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - cardCenterX) / (window.innerWidth * 0.4);
      const deltaY = (e.clientY - cardCenterY) / (window.innerHeight * 0.4);

      // Clamp max tilt angles between -14 deg and +14 deg
      this.targetRotY = Math.max(-14, Math.min(14, deltaX * 16));
      this.targetRotX = Math.max(-14, Math.min(14, -deltaY * 16));
      this.isHovered = true;
    });

    this.container.addEventListener("mouseleave", () => {
      this.targetRotX = 0;
      this.targetRotY = 0;
      this.isHovered = false;
    });

    this.startLoop();
  }

  startLoop() {
    const loop = () => {
      // Smooth spring inertia (12% lerp per frame)
      this.currentRotX += (this.targetRotX - this.currentRotX) * 0.12;
      this.currentRotY += (this.targetRotY - this.currentRotY) * 0.12;

      if (this.card) {
        this.card.style.transform = `perspective(1200px) rotateX(${this.currentRotX.toFixed(2)}deg) rotateY(${this.currentRotY.toFixed(2)}deg)`;
      }

      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("hero-canvas")) {
    window.heroCanvas25D = new HeroCanvas25D("hero-canvas");
  }
  if (document.getElementById("hero-interactive-card")) {
    window.card25DTilt = new Card25DTilt("hero-interactive-card");
  }
});


