// Progressive enhancement: nothing is hidden until the observer is ready.
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;

  const main = document.querySelector('main');
  if (!main) return;
  const compact = window.matchMedia('(max-width: 760px)');
  const units = '.portfolio-entry, .editorial-story, .philosophy-principle, .about-milestone, .approach-theme, .company-visual, .about-portrait, .editorial-detail-figure, .founder-belief-quote, .approach-interest-grid > div';
  const details = '.eyebrow, h1, h2, h3, p, img, .btn, .about-story-link, .company-back, .editorial-back, .approach-interest-grid > div';
  const candidates = Array.from(main.querySelectorAll(`${units}, ${details}`));
  const targets = candidates.filter(element => {
    const unit = element.closest(units);
    return (!unit || unit === element) && !element.closest('[hidden], .portfolio-filter-status, .contact-privacy');
  });
  const pending = new Set(targets);
  const running = new Map();
  let observer;

  function finish(element) {
    pending.delete(element);
    element.classList.remove('reveal-pending');
    element.classList.add('reveal-seen');
    observer?.unobserve(element);
    const animation = running.get(element);
    if (animation) { animation.cancel(); running.delete(element); }
  }

  function disable() {
    observer?.disconnect();
    targets.forEach(finish);
    main.classList.remove('reveals-ready');
  }

  function delayFor(element, hero) {
    if (element.matches('.eyebrow')) return 0;
    let delay = 0;
    const cardGrid = element.parentElement;
    if (element.matches('.portfolio-entry, .editorial-story, .philosophy-principle')) {
      const columns = getComputedStyle(cardGrid).gridTemplateColumns.split(' ').length;
      const index = Array.from(cardGrid.children).indexOf(element);
      delay = (index % Math.max(1, columns)) * (compact.matches ? 50 : 80);
    } else if (element.matches('h1, h2, h3')) delay = 100;
    else if (element.matches('p')) delay = 200;
    else if (element.matches('.btn, .about-story-link, .company-back, .editorial-back')) delay = 300;
    else if (element.matches('img, figure, .company-visual')) delay = 240;
    if (compact.matches) delay *= .6;
    return hero ? Math.min(delay, 240) : delay;
  }

  function reveal(element, immediate = false, hero = false) {
    if (!pending.has(element)) { if (immediate) finish(element); return; }
    if (immediate || motion.matches) { finish(element); return; }
    pending.delete(element);
    observer.unobserve(element);
    const image = element.matches('img, figure, .company-visual');
    const distance = compact.matches ? (image ? 6 : 10) : (image ? 15 : 20);
    const animation = element.animate([
      { opacity: 0, translate: `0 ${distance}px` },
      { opacity: 1, translate: '0 0' }
    ], {
      duration: hero || compact.matches ? 650 : 720,
      delay: delayFor(element, hero),
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both'
    });
    running.set(element, animation);
    element.classList.remove('reveal-pending');
    element.classList.add('reveal-seen');
    animation.finished.then(() => {
      if (running.get(element) === animation) { animation.cancel(); running.delete(element); }
    }).catch(() => {}); // Focus, filtering or reduced motion may finish it early.
  }

  function showTarget(target) {
    targets.forEach(element => {
      if (element === target || element.contains(target) || target.contains(element)) reveal(element, true);
    });
  }

  try {
    observer = new IntersectionObserver(entries => {
      try {
        entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
      } catch { disable(); }
    }, { threshold: .12, rootMargin: '0px 0px 48px 0px' });
    targets.forEach(element => observer.observe(element));

    // Select just two sets of editorial dividers; all other borders stay static.
    main.querySelectorAll('.philosophy-principle, .approach-interest-grid > div').forEach(element => {
      element.classList.add('reveal-divider');
    });
    main.classList.add('reveals-ready');
    targets.forEach(element => element.classList.add('reveal-pending'));

    // Above-the-fold content starts now, without waiting for a scroll event.
    targets.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0 && !element.closest('[hidden]')) reveal(element, false, true);
    });

    document.addEventListener('focusin', event => showTarget(event.target));
    const showFragment = () => {
      let id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
      const target = id && document.getElementById(id);
      if (target) showTarget(target);
    };
    window.addEventListener('hashchange', showFragment);
    showFragment();

    document.addEventListener('kerre:portfolio-filter', event => {
      event.detail.cards.forEach(card => reveal(card, true));
    });
    motion.addEventListener('change', event => { if (event.matches) disable(); });

    // Large jumps should never leave a reader waiting for the visible content.
    let previousY = scrollY;
    window.addEventListener('scroll', () => {
      const jump = Math.abs(scrollY - previousY);
      previousY = scrollY;
      if (jump < innerHeight * .6) return;
      targets.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.top < innerHeight && rect.bottom > 0) reveal(element, true);
      });
    }, { passive: true });
    window.addEventListener('beforeprint', disable);
  } catch { disable(); }
})();
