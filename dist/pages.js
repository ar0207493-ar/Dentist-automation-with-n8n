/* Local editorial filters. No requests, persistence or form submission. */
(() => {
  document.querySelectorAll('[data-visit-process]').forEach(process => {
    const steps = [...process.querySelectorAll('.page-visit-step')];
    const caption = process.querySelector('.page-process-caption');
    let current = -1;
    let captionAnimation;
    const update = () => {
      const active = steps.findIndex(step => step.querySelector('summary').getAttribute('aria-expanded') === 'true');
      if (active < 0 || active === current) return;
      process.querySelector('.page-process-steps').style.setProperty('--process-progress', active / Math.max(1, steps.length - 1));
      process.querySelector('[data-process-number]').textContent = String(active + 1).padStart(2, '0');
      process.querySelector('[data-process-caption]').textContent = steps[active].querySelector('.page-visit-title').textContent;
      if (current >= 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        captionAnimation?.cancel();
        captionAnimation = caption.animate([{opacity: .3, transform: 'translateY(12px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 450, easing: 'cubic-bezier(.22,1,.36,1)'});
      }
      current = active;
    };
    steps.forEach(step => {
      step.addEventListener('toggle', update);
      step.querySelector('summary').addEventListener('click', () => requestAnimationFrame(update));
    });
    update();
  });
  document.querySelectorAll('[data-filter-region]').forEach(region => {
    const input = region.querySelector('input[type="search"]');
    const filters = [...region.querySelectorAll('[data-filter]')];
    const cards = [...region.querySelectorAll('[data-category]')];
    const count = region.querySelector('[data-result-count]');
    const empty = region.querySelector('[data-empty]');
    let category = 'all';
    const update = () => {
      const query = input?.value.trim().toLowerCase() || '';
      let visible = 0;
      cards.forEach(card => {
        const match = (category === 'all' || card.dataset.category === category) && card.textContent.toLowerCase().includes(query);
        card.hidden = !match;
        if (match) visible++;
      });
      filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
      if (empty) empty.hidden = visible > 0;
      if (count) count.textContent = `${visible} ${region.dataset.filterRegion === 'journal' ? (visible === 1 ? 'article' : 'articles') : (visible === 1 ? 'topic' : 'topics')}`;
      document.dispatchEvent(new Event('dentora:layout-change'));
    };
    filters.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; update(); }));
    input?.addEventListener('input', update);
    update();
  });
})();
