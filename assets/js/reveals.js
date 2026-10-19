// One entrance system: progressively reveal content without changing layout or navigation.
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const main = document.querySelector('main');
  if (!main) return;
  const compact = matchMedia('(max-width: 760px)');
  const root = document.documentElement;
  const records = new Map();
  const running = new Map();
  const gates = new Map();
  let observer;
  let disabled = false;

  function add(element, delay = 0, kind = 'text') {
    if (!element || records.has(element)) return;
    records.set(element, { delay, kind, seen: false });
    element.classList.add('reveal-pending');
    element.style.setProperty('--reveal-distance', kind === 'map' || kind === 'marker' ? '0px' : compact.matches ? '12px' : '24px');
    observer?.observe(element);
  }

  function finish(element) {
    const record = records.get(element);
    if (record) record.seen = true;
    element.classList.remove('reveal-pending');
    element.classList.add('reveal-seen');
    observer?.unobserve(element);
    const active = running.get(element);
    if (active) {
      running.delete(element);
      clearTimeout(active.fallback);
      active.animation.cancel();
    }
  }

  function disable() {
    disabled = true;
    observer?.disconnect();
    records.forEach((_, element) => finish(element));
    root.classList.remove('reveals-ready');
  }

  function reveal(element, immediate = false) {
    const record = records.get(element);
    if (!record) return;
    if (immediate || disabled || motion.matches) { finish(element); return; }
    if (record.seen || element.closest('[hidden], [inert], details:not([open])')) return;
    record.seen = true;
    observer.unobserve(element);
    const hero = !!element.closest('.investment-hero, .page-header, .portfolio-intro');
    const delay = Math.min(record.delay * (compact.matches ? .55 : 1), hero ? 220 : 520);
    const distance = record.kind === 'map' || record.kind === 'marker' ? 0 : compact.matches ? 12 : 24;
    try {
      const animation = element.animate([
        { opacity: 0, translate: `0 ${distance}px` },
        { opacity: 1, translate: '0 0' }
      ], { duration: compact.matches ? 650 : 750, delay, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' });
      const fallback = setTimeout(() => finish(element), delay + 1000);
      running.set(element, { animation, fallback });
      element.classList.remove('reveal-pending');
      element.classList.add('reveal-seen');
      animation.finished.then(() => {
        if (running.get(element)?.animation === animation) finish(element);
      }).catch(() => {
        if (running.get(element)?.animation === animation) finish(element);
      });
    } catch { disable(); }
  }

  function revealLogos(carousel, immediate = false) {
    const gate = gates.get(carousel);
    if (!gate || gate.seen) return;
    gate.seen = true;
    observer.unobserve(carousel);
    // The carousel may have advanced before the visitor reached it.
    carousel.querySelectorAll('.reveal-pending').forEach(finish);
    const visible = carousel.querySelector('.home-logo-slide:not([aria-hidden="true"])');
    const logos = visible ? [...visible.children] : [...carousel.children];
    logos.slice(0, 4).forEach((logo, i) => {
      add(logo, 220 + i * 90, 'logo');
      // A first slide that was registered before the gate opened can still enter once.
      records.get(logo).seen = false;
      reveal(logo, immediate);
    });
  }

  function showTarget(target) {
    records.forEach((_, element) => {
      if (element === target || element.contains(target) || target.contains(element)) reveal(element, true);
    });
    gates.forEach((_, element) => {
      if (element.contains(target) || target.contains(element)) revealLogos(element, true);
    });
  }

  try {
    const scope = [main, document.querySelector('.footer')].filter(Boolean);
    // Compound elements enter as one unit; their text does not animate twice.
    const units = '.portfolio-entry, .editorial-story, .about-milestone, .philosophy-principle, .approach-interest-grid > article, .company-visual, .about-portrait, .editorial-detail-figure, .network-controls, .home-logo-controls';
    scope.forEach(area => {
      area.querySelectorAll(units).forEach(element => {
        if (element.closest('details, .home-logo-grid')) return;
        const siblings = [...element.parentElement.children].filter(child => child.matches(units));
        const columns = getComputedStyle(element.parentElement).gridTemplateColumns.split(' ').length;
        const index = siblings.indexOf(element) % Math.max(1, columns);
        const delay = element.matches('.philosophy-principle, .approach-interest-grid > article') ? index * 110 : element.matches('.network-controls, .home-logo-controls, .company-visual, .about-portrait, .editorial-detail-figure') ? 220 : index * 90;
        add(element, delay, 'unit');
      });
      area.querySelectorAll('.eyebrow, h1, h2, h3, p, img, .btn, .about-story-link, .company-back, .editorial-back, .network-playback').forEach(element => {
        if (element.closest('details, [hidden], [inert], .home-logo-grid, .network-details, .portfolio-filter-status, .contact-privacy, .footer-brand')) return;
        if ([...records.keys()].some(unit => unit !== element && unit.contains(element))) return;
        let delay = 0;
        if (element.matches('h1, h2, h3')) {
          const section = element.closest('section, header, footer, .company-page');
          delay = section?.querySelector('.eyebrow') ? 110 : 0;
        } else if (element.matches('p')) {
          const section = element.closest('section, header, footer, .company-page');
          delay = element.matches('.editorial-meta') ? 0 : section?.querySelector('.eyebrow') ? 220 : 110;
        }
        else if (element.matches('img')) delay = 220;
        else if (element.matches('.btn, .about-story-link')) delay = element.closest('.home-selected') ? 520 : element.closest('.founder-intro') ? 220 : 330;
        else if (element.matches('.network-playback')) delay = 330;
        add(element, delay);
      });
    });

    document.querySelectorAll('.home-logo-grid').forEach(carousel => {
      gates.set(carousel, { seen: false });
      const first = carousel.querySelector('.home-logo-slide:not([aria-hidden="true"])');
      (first ? [...first.children] : [...carousel.children]).slice(0, 4).forEach((logo, i) => add(logo, 220 + i * 90, 'logo'));
    });
    document.querySelectorAll('.network-map').forEach(map => {
      add(map, 220, 'map');
      map.querySelectorAll('.network-node').forEach((marker, i) => add(marker, 300 + i * 55, 'marker'));
    });

    observer = new IntersectionObserver(entries => {
      if (disabled) return;
      try {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          if (gates.has(entry.target)) revealLogos(entry.target);
          else if (!entry.target.closest('.home-logo-grid')) reveal(entry.target);
        });
      } catch { disable(); }
    }, { threshold: .12, rootMargin: '0px 0px 48px 0px' });
    records.forEach((_, element) => observer.observe(element));
    gates.forEach((_, element) => observer.observe(element));
    root.classList.add('reveals-ready');

    const inView = element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0;
    };
    // The hero starts in the same frame; navigation and branding never get hidden.
    gates.forEach((_, element) => { if (inView(element)) revealLogos(element); });
    records.forEach((_, element) => {
      if (inView(element) && !element.closest('.home-logo-grid')) reveal(element);
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
    document.addEventListener('kerre:portfolio-filter', event => event.detail.cards.forEach(card => showTarget(card)));
    motion.addEventListener('change', event => { if (event.matches) disable(); });
    window.addEventListener('beforeprint', disable);
    window.addEventListener('pagehide', disable);
    window.addEventListener('pageshow', event => { if (event.persisted) disable(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) [...running.keys()].forEach(finish);
    });
    let previousY = scrollY;
    window.addEventListener('scroll', () => {
      const jump = Math.abs(scrollY - previousY);
      previousY = scrollY;
      if (jump < innerHeight * .6) return;
      gates.forEach((_, element) => { if (inView(element)) revealLogos(element, true); });
      records.forEach((_, element) => { if (inView(element)) reveal(element, true); });
    }, { passive: true });
  } catch { disable(); }
})();
