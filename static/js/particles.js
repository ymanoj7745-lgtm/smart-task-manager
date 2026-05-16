/* ══════════════════════════════════════════════
   Floating Particles Background
   ══════════════════════════════════════════════ */
(function () {
  const canvas = document.createElement("canvas");
  canvas.id = "particles-canvas";
  canvas.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.5;";
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  let W, H, particles = [];
  const COUNT = 70;
  const COLORS = ["#2dd4bf", "#0d9488", "#06b6d4", "#10b981", "#6ee7b7"];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function Particle() {
    this.reset();
  }
  Particle.prototype.reset = function () {
    this.x    = rand(0, W);
    this.y    = rand(0, H);
    this.r    = rand(1.5, 4);
    this.vx   = rand(-0.4, 0.4);
    this.vy   = rand(-0.4, 0.4);
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.alpha = rand(0.3, 0.8);
    this.pulse = rand(0, Math.PI * 2);
    this.pulseSpeed = rand(0.01, 0.03);
  };
  Particle.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    this.pulse += this.pulseSpeed;
    this.currentR = this.r + Math.sin(this.pulse) * 1.2;
    if (this.x < -10) this.x = W + 10;
    if (this.x > W + 10) this.x = -10;
    if (this.y < -10) this.y = H + 10;
    if (this.y > H + 10) this.y = -10;
  };
  Particle.prototype.draw = function () {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentR, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.fill();

    // glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentR * 2.5, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.currentR * 2.5);
    grad.addColorStop(0, this.color + "40");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.globalAlpha = this.alpha * 0.4;
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  function connectParticles() {
    const MAX_DIST = 130;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = "#2dd4bf";
          ctx.globalAlpha = (1 - dist / MAX_DIST) * 0.15;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, () => new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    connectParticles();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  init();
  loop();
})();
