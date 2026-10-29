/* Dentora: considered motion, normal scrolling, locally hosted GSAP. */
(() => {
  const video = document.getElementById('hero-video');
  const toggle = document.getElementById('video-toggle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = reducedMotion.matches || !!navigator.connection?.saveData;
  let heroVisible = true;

  function syncVideoControl() {
    const paused = video.paused;
    document.getElementById('video-toggle-label').textContent = paused ? 'Play film' : 'Pause film';
    toggle.querySelector('.video-toggle-icon').textContent = paused ? '▷' : 'Ⅱ';
    toggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
    toggle.setAttribute('aria-pressed', String(paused));
  }
  function updatePlayback() {
    if (userPaused || document.hidden || !heroVisible) {
      video.pause();
      syncVideoControl();
    } else {
      video.play().then(syncVideoControl).catch(syncVideoControl);
    }
  }
  toggle.addEventListener('click', () => {
    userPaused = !video.paused;
    updatePlayback();
  });
  video.addEventListener('play', syncVideoControl);
  video.addEventListener('pause', syncVideoControl);
  video.addEventListener('error', () => { video.hidden = true; toggle.hidden = true; });
  video.querySelector('source').addEventListener('error', () => { video.hidden = true; toggle.hidden = true; });
  document.addEventListener('visibilitychange', updatePlayback);
  reducedMotion.addEventListener('change', event => { userPaused = event.matches; updatePlayback(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      updatePlayback();
    }, {threshold: 0.08}).observe(document.querySelector('.hero'));
  }
  if (userPaused) video.removeAttribute('autoplay');
  updatePlayback();

  // Content is visible by default, including if an animation dependency fails.
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();

  function splitWords(element) {
    if (element.dataset.split === 'true') return [...element.querySelectorAll('.motion-word')];
    const originalLabel = element.innerText.replace(/\s+/g, ' ').trim();
    element.setAttribute('aria-label', originalLabel);
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(token => {
        if (!token) return;
        if (/^\s+$/.test(token)) fragment.append(document.createTextNode(token));
        else {
          const mask = document.createElement('span');
          mask.className = 'word-mask';
          mask.setAttribute('aria-hidden', 'true');
          const word = document.createElement('span');
          word.className = 'motion-word';
          word.textContent = token;
          mask.append(word);
          fragment.append(mask);
        }
      });
      node.replaceWith(fragment);
    });
    element.dataset.split = 'true';
    return [...element.querySelectorAll('.motion-word')];
  }

  media.add('(prefers-reduced-motion: no-preference)', () => {
    const heroWords = splitWords(document.getElementById('hero-title'));
    const intro = gsap.timeline({defaults: {ease: 'power3.out'}});
    intro.fromTo('.site-header', {y: -14, opacity: 0}, {y: 0, opacity: 1, duration: 0.7}, 0)
      .fromTo('.hero-content .eyebrow', {y: 12, opacity: 0}, {y: 0, opacity: 1, duration: 0.6}, 0.1)
      .fromTo(heroWords, {yPercent: 112, rotate: 1.2}, {yPercent: 0, rotate: 0, duration: 1, stagger: 0.085}, 0.18)
      .fromTo('.hero-description', {y: 16, opacity: 0}, {y: 0, opacity: 1, duration: 0.75}, 0.5)
      .fromTo('.hero-content .button', {y: 15, opacity: 0}, {y: 0, opacity: 1, duration: 0.65}, 0.65)
      .fromTo('.hero-bottom', {y: 18, opacity: 0}, {y: 0, opacity: 1, duration: 0.8}, 0.8)
      .fromTo('.hero-caption', {opacity: 0}, {opacity: 1, duration: 0.6}, 1);

    document.querySelectorAll('main .section h2').forEach(heading => {
      if (heading.id === 'stories-title') return; // Carousel content remains stable.
      const words = splitWords(heading);
      gsap.fromTo(words, {yPercent: 112}, {
        yPercent: 0, duration: 0.85, stagger: 0.035, ease: 'power3.out',
        scrollTrigger: {trigger: heading, start: 'top 88%', once: true}
      });
    });
    document.querySelectorAll('.care-grid, .treatment-grid, .article-grid').forEach(group => {
      gsap.fromTo(group.children, {y: 30, opacity: 0}, {
        y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: {trigger: group, start: 'top 88%', once: true}
      });
    });
    gsap.fromTo('.benefit-track > article', {x: 32, opacity: 0}, {
      x: 0, opacity: 1, duration: 0.8, stagger: 0.09, ease: 'power3.out',
      scrollTrigger: {trigger: '.benefit-track', start: 'top 88%', once: true}
    });
    if (matchMedia('(min-width: 801px)').matches) {
      gsap.to('.hero-video, .hero-poster', {
        yPercent: 9, ease: 'none',
        scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.7}
      });
    }
    const progress = document.createElement('div');
    progress.className = 'reading-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.append(progress);
    gsap.fromTo(progress, {scaleX: 0}, {
      scaleX: 1, ease: 'none',
      scrollTrigger: {start: 0, end: 'max', scrub: 0.15}
    });
    document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh(), {once: true});
    return () => { progress.remove(); };
  });
})();
