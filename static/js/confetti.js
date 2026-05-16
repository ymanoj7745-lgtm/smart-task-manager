/* ══════════════════════════════════════════════
   Confetti burst on task completion
   ══════════════════════════════════════════════ */
function burstConfetti(x, y) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9998;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ["#2dd4bf","#10b981","#06b6d4","#6ee7b7","#f59e0b","#a78bfa","#fb7185"];
  const pieces = Array.from({ length: 80 }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 14,
    vy: -(Math.random() * 12 + 4),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 8 + 4,
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 10,
    shape: Math.random() > 0.5 ? "rect" : "circle",
    alpha: 1,
    gravity: Math.random() * 0.4 + 0.2,
  }));

  let frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    pieces.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += p.gravity;
      p.rot += p.rotV;
      p.alpha -= 0.015;
      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    });
    if (alive) { frame = requestAnimationFrame(draw); }
    else { canvas.remove(); cancelAnimationFrame(frame); }
  }
  draw();
}
