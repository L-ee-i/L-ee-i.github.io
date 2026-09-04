(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isSmallScreen = window.matchMedia('(max-width: 767px)');

  if (reducedMotion.matches || isSmallScreen.matches) return;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  canvas.id = 'snowfall';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '1'
  });
  document.body.appendChild(canvas);

  let width = 0;
  let height = 0;
  let flakes = [];
  let animationFrame = 0;
  let previousFrame = 0;

  const createFlake = (startAtTop = false) => ({
    x: Math.random() * width,
    y: startAtTop ? -10 : Math.random() * height,
    radius: 1.5 + Math.random() * 3.5,
    speed: 18 + Math.random() * 30,
    drift: -8 + Math.random() * 16,
    opacity: 0.35 + Math.random() * 0.55
  });

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const flakeCount = Math.min(40, Math.max(18, Math.round(width / 36)));
    flakes = Array.from({ length: flakeCount }, () => createFlake());
  };

  const draw = (timestamp) => {
    animationFrame = window.requestAnimationFrame(draw);
    if (timestamp - previousFrame < 33) return;

    const elapsed = Math.min((timestamp - previousFrame) / 1000, 0.1);
    previousFrame = timestamp;
    context.clearRect(0, 0, width, height);

    for (const flake of flakes) {
      flake.y += flake.speed * elapsed;
      flake.x += flake.drift * elapsed;

      if (flake.y > height + 10 || flake.x < -10 || flake.x > width + 10) {
        Object.assign(flake, createFlake(true));
      }

      context.beginPath();
      context.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
      context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      context.fill();
    }
  };

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
    } else {
      previousFrame = performance.now();
      animationFrame = window.requestAnimationFrame(draw);
    }
  });

  resize();
  animationFrame = window.requestAnimationFrame(draw);
})();
