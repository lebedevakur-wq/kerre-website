(() => {
  const carousel = document.querySelector('[data-logo-carousel]');
  if (!carousel) return;
  const logos = Array.from(carousel.children);
  if (logos.length <= 4) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const track = document.createElement('div');
  track.className = 'home-logo-track';
  const slides = [];
  const mobile = matchMedia('(max-width: 600px)');
  function build(offset = 0) {
    slides.length = 0;
    track.replaceChildren();
    const count = mobile.matches ? 2 : 4;
    const first = offset % logos.length;
    let start = first;
    do {
      const slide = document.createElement('div');
      slide.className = 'home-logo-slide';
      slide.dataset.logoStart = start;
      for (let i = 0; i < count; i++) {
        const logo = logos[(start + i) % logos.length].cloneNode(true);
        logo.querySelector('img').loading = 'eager';
        slide.append(logo);
      }
      track.append(slide);
      slides.push(slide);
      start = (start + count) % logos.length;
    } while (start !== first);
    // Continue forwards seamlessly when the last slide wraps to the first.
    const ending = slides[0].cloneNode(true);
    ending.inert = true;
    ending.setAttribute('aria-hidden', 'true');
    track.append(ending);
    carousel.replaceChildren(track);
  }
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
  mobile.addEventListener('change', () => {
    const focused = carousel.contains(document.activeElement) ? document.activeElement.closest('a') : null;
    const focusedIndex = focused ? logos.findIndex(logo => logo.href === focused.href) : -1;
    const offset = focusedIndex >= 0 ? focusedIndex : Number(slides[current].dataset.logoStart);
    animation?.cancel();
    build(offset);
    current = 0;
    show(0);
    if (focused) slides[0].querySelector('a').focus({ preventScroll: true });
    restart();
  });
  build();
  show(0);
  restart();
})();
