/**
 * Lightweight canvas particle background for homepage-admin v2.
 * Particles drift slowly, connect when close, and gently react to the cursor.
 * No dependencies, no build step.
 */
(function () {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width, height;
  let particles = [];
  let animationId;
  let mouse = { x: null, y: null, active: false };

  const config = {
    particleCount: 0, // computed based on area
    baseCount: 60,
    color: "118, 189, 255", // #76BDFF
    lineColor: "118, 189, 255",
    radius: 2,
    speed: 0.3,
    connectionDistance: 120,
    mouseDistance: 160,
    mouseForce: 0.4,
  };

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.scale(dpr, dpr);

    const areaFactor = Math.sqrt(width * height) / 1000;
    config.particleCount = Math.max(
      30,
      Math.min(140, Math.floor(config.baseCount * areaFactor))
    );

    initParticles();
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * config.speed,
        vy: (Math.random() - 0.5) * config.speed,
        radius: config.radius + Math.random(),
      });
    }
  }

  function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${config.color}, ${0.5 + Math.random() * 0.3})`;
    ctx.fill();
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);

        if (dist < config.connectionDistance) {
          const opacity = 1 - dist / config.connectionDistance;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${config.lineColor}, ${opacity * 0.25})`;
          ctx.lineWidth = 1;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function applyMouseForce(p) {
    if (!mouse.active || mouse.x === null || mouse.y === null) return;

    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const dist = Math.hypot(dx, dy);

    if (dist < config.mouseDistance && dist > 5) {
      const force = (1 - dist / config.mouseDistance) * config.mouseForce;
      p.vx += (dx / dist) * force * 0.05;
      p.vy += (dy / dist) * force * 0.05;
    }
  }

  function update() {
    for (const p of particles) {
      applyMouseForce(p);

      p.x += p.vx;
      p.y += p.vy;

      // gentle friction to calm velocities after mouse interaction
      p.vx *= 0.99;
      p.vy *= 0.99;

      // keep a minimum drift so particles never fully stop
      if (Math.abs(p.vx) < 0.05) p.vx += (Math.random() - 0.5) * 0.02;
      if (Math.abs(p.vy) < 0.05) p.vy += (Math.random() - 0.5) * 0.02;

      // wrap around edges
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    drawConnections();
    for (const p of particles) {
      drawParticle(p);
    }
  }

  function loop() {
    update();
    render();
    animationId = requestAnimationFrame(loop);
  }

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;

    clearTimeout(mouse.timer);
    mouse.timer = setTimeout(() => {
      mouse.active = false;
    }, 2000);
  }

  function onMouseLeave() {
    mouse.active = false;
  }

  function start() {
    resize();
    loop();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    document.body.addEventListener("mouseleave", onMouseLeave);
  }

  function stop() {
    cancelAnimationFrame(animationId);
    window.removeEventListener("resize", resize);
    window.removeEventListener("mousemove", onMouseMove);
    document.body.removeEventListener("mouseleave", onMouseLeave);
  }

  // expose minimal API for the app
  window.particleBackground = { start, stop };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
