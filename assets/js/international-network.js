// Geographic highlights and their accessible, generously sized country controls.
(() => {
  const network = document.querySelector('[data-international-network]');
  if (!network) return;
  const controls = network.querySelector('.network-controls');
  const buttons = [...controls.querySelectorAll('[data-network-select]')];
  const details = [...network.querySelectorAll('[data-network-detail]')];
  const locations = [...network.querySelectorAll('[data-network-country]')];
  const countries = new Set(buttons.map(button => button.dataset.networkSelect));
  const order = [...countries];
  const playback = network.querySelector('[data-network-pause]');
  const panel = network.querySelector('.network-details');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;
  let timer;
  let current;

  function restart() {
    clearInterval(timer);
    if (paused || document.hidden || network.contains(document.activeElement)) return;
    timer = setInterval(() => {
      select(order[(order.indexOf(current) + 1) % order.length]);
    }, 5000);
  }

  function updatePlayback() {
    playback.setAttribute('aria-pressed', String(paused));
    playback.textContent = paused ? 'Resume country rotation' : 'Pause country rotation';
    restart();
  }

  function select(country) {
    if (!countries.has(country) || current === country) return;
    current = country;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.networkSelect === country)));
    details.forEach(detail => { detail.hidden = detail.dataset.networkDetail !== country; });
    locations.forEach(location => location.classList.toggle('is-active', location.dataset.networkCountry === country));
  }

  network.addEventListener('click', event => {
    const target = event.target.closest('[data-network-select], [data-network-country]');
    if (target) {
      panel.setAttribute('aria-live', 'polite');
      select(target.dataset.networkSelect || target.dataset.networkCountry);
      restart();
      panel.setAttribute('aria-live', 'off');
    }
  });
  network.addEventListener('pointerover', event => {
    if (event.pointerType !== 'mouse') return;
    const target = event.target.closest('[data-network-select], [data-network-country]');
    if (target) {
      select(target.dataset.networkSelect || target.dataset.networkCountry);
      restart();
    }
  });
  controls.addEventListener('focusin', event => {
    const button = event.target.closest('[data-network-select]');
    if (button) select(button.dataset.networkSelect);
  });
  // Initialise only after the event handlers are ready. Without JS every detail stays visible.
  select('belgium');
  controls.hidden = false;
  network.classList.add('network-enhanced');
  playback.hidden = false;
  playback.addEventListener('click', () => { paused = !paused; updatePlayback(); });
  network.addEventListener('focusin', restart);
  network.addEventListener('focusout', () => setTimeout(restart, 0));
  document.addEventListener('visibilitychange', restart);
  motion.addEventListener('change', () => { paused = motion.matches; updatePlayback(); });
  updatePlayback();
})();
