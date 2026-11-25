/* Editorial scenes for About; scrolling and dialogs use the shared runtime. */
(() => {
  const valueCards = [...document.querySelectorAll('.about-value')];
  const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');
  const setValueOpen = (card, open) => {
    card.classList.toggle('is-expanded', open);
    card.querySelector('.about-value-toggle').setAttribute('aria-expanded', String(open));
    const detail = card.querySelector('.about-value-detail');
    detail.inert = !open;
    detail.setAttribute('aria-hidden', String(!open));
  };
  valueCards.forEach(card => {
    const toggle = card.querySelector('.about-value-toggle');
    card.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch' && hoverPointer.matches) setValueOpen(card, true);
    });
    card.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'touch' && hoverPointer.matches && !toggle.matches(':focus-visible')) setValueOpen(card, false);
    });
    toggle.addEventListener('focus', () => {
      if (toggle.matches(':focus-visible')) setValueOpen(card, true);
    });
    toggle.addEventListener('blur', () => {
      if (!hoverPointer.matches || !card.matches(':hover')) setValueOpen(card, false);
    });
    toggle.addEventListener('click', event => {
      if (event.detail === 0 || !hoverPointer.matches) {
        const open = !card.classList.contains('is-expanded');
        valueCards.forEach(other => setValueOpen(other, other === card && open));
      }
    });
    toggle.addEventListener('keydown', event => {
      if (event.key === 'Escape') setValueOpen(card, false);
    });
  });
  document.addEventListener('pointerdown', event => {
    valueCards.forEach(card => {
      if (!card.contains(event.target)) setValueOpen(card, false);
    });
  });
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  document.fonts.ready.then(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', context => {
      const splits = new Set();
      const title = document.querySelector('#about-hero-title');
      const titleSplit = window.SplitText?.create(title, {type: 'words,chars', tag: 'span', aria: 'auto'});
      if (titleSplit) splits.add(titleSplit);
      const heroText = document.querySelector('.about-hero-lede');
      const heroLines = window.SplitText?.create(heroText, {type: 'lines', tag: 'span', aria: 'auto'});
      if (heroLines) splits.add(heroLines);
      const finishSplit = split => { split?.revert(); if (split) splits.delete(split); };
      gsap.timeline()
        .from('.about-hero .ref-header', {opacity: 0, y: 16, duration: .35, clearProps: 'opacity,transform'}, 0)
        .from('.about-hero-tag', {opacity: 0, y: 18, duration: .4, clearProps: 'opacity,transform'}, .05)
        .from(titleSplit?.chars || title, {opacity: 0, y: 32, stagger: .004, duration: .45, ease: 'power3.out', clearProps: 'opacity,transform', onComplete: () => finishSplit(titleSplit)}, .08)
        .from(heroLines?.lines || heroText, {clipPath: 'inset(0 100% 0 0)', duration: .5, stagger: .04, ease: 'power3.inOut', clearProps: 'clipPath', onComplete: () => finishSplit(heroLines)}, .18)
        .from('.about-hero-bottom', {opacity: 0, y: 20, duration: .4, stagger: .04, clearProps: 'opacity,transform'}, .28);

      document.querySelectorAll('[data-about-image]').forEach(frame => {
        const image = frame.querySelector('img');
        if (frame.querySelector('figcaption')) {
          gsap.from(frame.querySelector('figcaption'), {opacity: 0, y: 20, duration: .65, clearProps: 'opacity,transform', scrollTrigger: {trigger: frame, start: 'top 88%', once: true}});
          return;
        }
        gsap.from(frame, {clipPath: 'inset(0 0 100% 0)', duration: .95, ease: 'power3.inOut', clearProps: 'clipPath', scrollTrigger: {trigger: frame, start: 'top 88%', once: true}});
        gsap.from(image, {scale: 1.06, duration: 1.2, ease: 'power2.out', clearProps: 'transform', scrollTrigger: {trigger: frame, start: 'top 88%', once: true}});
      });
      document.querySelectorAll('.about-section h2:not(.about-manifesto-text), .about-section h3:not(.about-value-title, .about-step-title), .ref-footer h2, .ref-footer h3, .ref-label:not(.about-hero-tag)').forEach(heading => {
        gsap.from(heading, {opacity: 0, y: 26, duration: .6, ease: 'power2.out', clearProps: 'opacity,transform', scrollTrigger: {trigger: heading, start: 'top 88%', once: true}});
      });
      document.querySelectorAll('.about-copy-reveal, .ref-footer-intro > p').forEach(copy => {
        const reveal = context.add(null, () => {
          const split = window.SplitText?.create(copy, {type: 'lines', tag: 'span', aria: 'auto'});
          if (split) splits.add(split);
          gsap.from(split?.lines || copy, {clipPath: 'inset(0 100% 0 0)', duration: .75, stagger: .06, ease: 'power3.inOut', clearProps: 'clipPath', onComplete: () => finishSplit(split)});
        });
        ScrollTrigger.create({trigger: copy, start: 'top 88%', once: true, onEnter: reveal});
      });
      const statement = document.querySelector('.about-manifesto-text');
      const words = window.SplitText?.create(statement, {type: 'words', tag: 'span', aria: 'auto'});
      if (words) {
        splits.add(words);
        gsap.fromTo(words.words, {color: '#c8c8c8'}, {color: '#101213', stagger: .1, ease: 'none', scrollTrigger: {trigger: statement, start: 'top 78%', end: 'bottom 52%', scrub: true}});
      }
      gsap.from('.about-value', {opacity: 0, y: 32, stagger: .1, duration: .65, clearProps: 'opacity,transform', scrollTrigger: {trigger: '.about-value-grid', start: 'top 85%', once: true}});
      const journeySteps = gsap.utils.toArray('.about-journey-step');
      gsap.set('.about-step-number', {opacity: 0, scale: .85});
      gsap.set('.about-step-copy', {opacity: 0, y: 24});
      gsap.set('.about-step-line', {scaleY: 0});
      const journey = gsap.timeline({scrollTrigger: {
        id: 'about-visit-sequence', trigger: '.about-journey-steps',
        start: 'top 82%', end: 'bottom 68%', scrub: .3,
      }});
      journeySteps.forEach(step => {
        journey.to(step.querySelector('.about-step-number'), {opacity: 1, scale: 1, duration: .2, ease: 'power2.out'})
          .to(step.querySelector('.about-step-copy'), {opacity: 1, y: 0, duration: .45, ease: 'power2.out'}, '+=.06');
        const line = step.querySelector('.about-step-line');
        if (line) journey.to(line, {scaleY: 1, duration: .85, ease: 'none'}, '+=.14');
      });
      gsap.from('.ref-faq-item', {opacity: 0, y: 20, duration: .5, stagger: .06, clearProps: 'opacity,transform', scrollTrigger: {trigger: '.ref-faq-list', start: 'top 85%', once: true}});
      document.querySelectorAll('.ref-footer-columns > div, .ref-footer-connect, .ref-footer-bottom').forEach(group => {
        gsap.from([...group.children].filter(child => !child.matches('h2,h3')), {opacity: 0, y: 20, duration: .5, stagger: .06, clearProps: 'opacity,transform', scrollTrigger: {trigger: group, start: group.matches('.ref-footer-bottom') ? 'top bottom' : 'top 93%', once: true}});
      });
      ScrollTrigger.refresh();
      return () => { splits.forEach(split => split.revert()); };
    });

  });
})();
