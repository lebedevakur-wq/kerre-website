(() => {
  const controls = document.querySelector('.portfolio-filters');
  const grid = document.getElementById('portfolio-companies');
  if (!controls || !grid) return;

  const buttons = Array.from(controls.querySelectorAll('button[data-filter]'));
  const cards = Array.from(grid.querySelectorAll('.portfolio-entry'));
  const status = document.querySelector('.portfolio-filter-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animations = [];

  function filterCompanies(button) {
    if (button.getAttribute('aria-pressed') === 'true') return;
    animations.forEach(animation => animation.cancel());
    animations = [];
    const before = new Map(cards.filter(card => !card.hidden)
      .map(card => [card, card.getBoundingClientRect()]));
    const category = button.dataset.filter;

    cards.forEach(card => {
      const categories = card.dataset.categories.split(' ');
      card.hidden = category !== 'all' && !categories.includes(category);
    });
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));

    const visible = cards.filter(card => !card.hidden);
    status.textContent = `${visible.length} ${visible.length === 1 ? 'company' : 'companies'} shown: ${button.textContent.trim()}.`;

    // Animate incoming cards and the movement of cards that remain visible.
    // Hidden cards leave both the layout and keyboard navigation immediately.
    if (reducedMotion.matches) return;
    visible.forEach(card => {
      if (typeof card.animate !== 'function') return;
      const previous = before.get(card);
      const current = card.getBoundingClientRect();
      const x = previous ? previous.left - current.left : 0;
      const y = previous ? previous.top - current.top : 8;
      animations.push(card.animate([
        { transform: `translate(${x}px, ${y}px)`, opacity: previous ? 1 : 0 },
        { transform: 'translate(0, 0)', opacity: 1 }
      ], { duration: 240, easing: 'ease-out' }));
    });
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (button && controls.contains(button)) filterCompanies(button);
  });

  // Native Tab, Enter and Space work; arrow keys offer an extra shortcut.
  controls.addEventListener('keydown', event => {
    const index = buttons.indexOf(event.target);
    if (index < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    buttons[next].focus();
  });

  status.textContent = `${cards.length} companies shown: All Companies.`;
  controls.hidden = false;
})();
