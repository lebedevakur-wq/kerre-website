(() => {
  const carousel = document.querySelector('[data-logo-carousel]');
  if (!carousel) return;
  const logos = Array.from(carousel.children);
  if (logos.length <= 4) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const track = document.createElement('div');
  track.className = 'home-logo-track';
  const slides = [];
  // Advance four positions, wrapping the company list without empty spaces.
  let start = 0;
  do {
    const slide = document.createElement('div');
    slide.className = 'home-logo-slide';
    for (let i = 0; i < 4; i++) {
      const logo = logos[(start + i) % logos.length].cloneNode(true);
      logo.querySelector('img').loading = 'eager';
      slide.append(logo);
    }
    track.append(slide);
    slides.push(slide);
    start = (start + 4) % logos.length;
  } while (start !== 0);
  // A final copy makes the last-to-first movement continue in the same direction.
  const ending = slides[0].cloneNode(true);
  ending.inert = true;
  ending.setAttribute('aria-hidden', 'true');
  track.append(ending);
  carousel.replaceChildren(track);
  carousel.classList.add('is-carousel');
  const controls = document.createElement('div');
  controls.className = 'home-logo-controls';
  controls.innerHTML = '<button type="button" aria-label="Previous companies">←</button><button type="button" aria-label="Next companies">→</button>';
  carousel.after(controls);
  const [previous, next] = controls.children;
  let current = 0;
  let timer;
  let animation;
  function show(index) {
    animation?.cancel();
    const from = current;
    const wrapping = index === slides.length;
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.inert = i !== current;
      slide.setAttribute('aria-hidden', String(i !== current));
    });
    track.style.transform = `translateX(-${current * 100}%)`;
    if (!motion.matches && track.animate) {
      animation = track.animate([
        { transform: `translateX(-${from * 100}%)` },
        { transform: `translateX(-${(wrapping ? slides.length : current) * 100}%)` }
      ], { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
  }
  function restart() {
    clearInterval(timer);
    if (motion.matches || document.hidden || carousel.contains(document.activeElement)) return;
    timer = setInterval(() => show(current + 1), 8000);
  }
  previous.addEventListener('click', () => { show(current - 1); restart(); });
  next.addEventListener('click', () => { show(current + 1); restart(); });
  carousel.addEventListener('focusin', restart);
  carousel.addEventListener('focusout', () => setTimeout(restart, 0));
  document.addEventListener('visibilitychange', restart);
  motion.addEventListener('change', () => {
    if (motion.matches) animation?.cancel();
    restart();
  });
  show(0);
  restart();
})();
