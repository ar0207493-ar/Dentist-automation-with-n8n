/* Interior scenes; the shared runtime owns Lenis, logo and appointment reveals. */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  document.fonts.ready.then(() => media.add('(prefers-reduced-motion: no-preference)', context => {
    const splits = new Set();
    const observers = [];
    const splitHeading = heading => {
      const split = window.SplitText?.create(heading, {type: 'lines', tag: 'span', aria: 'auto'});
      if (!split) return null;
      splits.add(split);
      split.lines.forEach(line => {
        const mask = document.createElement('span');
        mask.className = 'page-title-mask';
        line.before(mask);
        mask.append(line);
      });
      return split;
    };
    const finishSplit = split => {split?.revert(); splits.delete(split);};
    const heroHeading = document.querySelector('.page-hero h1');
    const heroSplit = splitHeading(heroHeading);
    heroHeading.dataset.scrollAnimation = 'line-reveal';
    gsap.timeline()
      .from('.page-hero .ref-header', {opacity: 0, y: 16, duration: .4, clearProps: 'opacity,transform'}, 0)
      .from('.page-hero-copy > .ref-label', {opacity: 0, y: 18, duration: .45, clearProps: 'opacity,transform'}, .06)
      .from(heroSplit?.lines || heroHeading, {yPercent: 110, opacity: 0, duration: .85, stagger: .09, ease: 'power3.out', clearProps: 'opacity,transform', onComplete: () => finishSplit(heroSplit)}, .12)
      .from('.page-hero-copy > p, .page-hero-bottom', {opacity: 0, y: 20, duration: .65, stagger: .08, clearProps: 'opacity,transform'}, .22);
    const headings = [...document.querySelectorAll('.page-section h2:not(.ref-label), .page-section h3, .page-article-body h2, .ref-comparison h2, .ref-footer h2, .ref-footer h3')];
    gsap.set(headings, {visibility: 'hidden'});
    const revealHeading = context.add(null, heading => {
      const split = splitHeading(heading);
      heading.dataset.scrollAnimation = 'line-reveal';
      gsap.set(heading, {clearProps: 'visibility'});
      gsap.from(split?.lines || heading, {yPercent: 110, opacity: 0, duration: .85, stagger: .09, ease: 'power3.out', clearProps: 'opacity,transform', onComplete: () => finishSplit(split)});
    });
    const headingObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        headingObserver.unobserve(entry.target);
        revealHeading(entry.target);
      });
    }, {rootMargin: '0px 0px -10% 0px', threshold: .08});
    headings.forEach(heading => headingObserver.observe(heading));
    document.querySelectorAll('.page-heading .ref-label, .page-copy > .ref-label').forEach(label => {
      gsap.from(label, {opacity: 0, y: 24, duration: .65, clearProps: 'opacity,transform', scrollTrigger: {trigger: label, start: 'top 86%', once: true}});
    });
    const reviewQuote = document.querySelector('.ref-story-main blockquote');
    if (reviewQuote) gsap.from(reviewQuote, {opacity: 0, y: 36, duration: .8, ease: 'power3.out', clearProps: 'opacity,transform', scrollTrigger: {trigger: reviewQuote, start: 'top 86%', once: true}});
    document.querySelectorAll('.page-copy > p, .page-heading > p, .page-article-body section > p, .ref-footer-intro > p').forEach(copy => {
      const trigger = ScrollTrigger.create({trigger: copy, start: 'top 93%', once: true, onEnter: () => {
        const split = window.SplitText?.create(copy, {type: 'lines', tag: 'span', aria: 'auto'});
        if (split) splits.add(split);
        gsap.from(split?.lines || copy, {clipPath: 'inset(0 100% 0 0)', duration: .75, stagger: .06, ease: 'power3.inOut', clearProps: 'clipPath', onComplete: () => {split?.revert(); splits.delete(split);}});
      }});
      observers.push(trigger);
    });
    document.querySelectorAll('.page-review, .page-contact-detail > svg, .page-faq-group .ref-faq-item').forEach(item => {
      gsap.from(item, {opacity: 0, y: 25, duration: .6, clearProps: 'opacity,transform', scrollTrigger: {trigger: item, start: 'top 94%', once: true}});
    });
    // Photographs with text on top remain still; only the caption enters.
    document.querySelectorAll('.page-feature-copy > p, .page-feature-copy > .ref-button, .page-photo-note, .page-process-caption').forEach(caption => {
      gsap.from(caption, {opacity: 0, y: 24, duration: .7, clearProps: 'opacity,transform', scrollTrigger: {trigger: caption, start: 'top 92%', once: true}});
    });
    document.querySelectorAll('[data-page-image]').forEach(frame => {
      gsap.from(frame, {clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'power3.inOut', clearProps: 'clipPath', scrollTrigger: {trigger: frame, start: 'top 90%', once: true}});
    });
    document.querySelectorAll('[data-visit-process]').forEach(process => {
      gsap.timeline({scrollTrigger: {trigger: process.querySelector('.page-process-steps'), start: 'top 85%', once: true}})
        .from(process.querySelector('.page-process-line'), {scaleY: 0, transformOrigin: 'center top', duration: 1.1, ease: 'power2.inOut', clearProps: 'transform'}, 0)
        .from(process.querySelectorAll('.page-step-number'), {opacity: 0, scale: .7, duration: .55, stagger: .18, ease: 'power2.out', clearProps: 'opacity,transform'}, .05)
        .from(process.querySelectorAll('.page-visit-title'), {opacity: 0, y: 28, duration: .7, stagger: .18, ease: 'power3.out', clearProps: 'opacity,transform'}, .16)
        .from(process.querySelectorAll('.page-step-chevron'), {opacity: 0, duration: .5, stagger: .18, clearProps: 'opacity'}, .3);
    });
    ScrollTrigger.refresh();
    return () => { headingObserver.disconnect(); splits.forEach(split => split.revert()); observers.forEach(trigger => trigger.kill()); };
  }));
  const stories = document.querySelector('#stories');
  if (!stories) return;
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const revisions = new WeakMap();
    const text = stories.querySelector('.ref-story-main');
    const photos = [...stories.querySelectorAll('#story-preview, #story-avatar')];
    let timeline;
    let active = true;
    const animate = event => {
      event.preventDefault();
      const direction = event.detail.direction;
      timeline?.kill();
      photos.forEach(photo => {
        const incoming = photo.nextElementSibling;
        const source = event.detail[photo.id === 'story-preview' ? 'preview' : 'avatar'];
        const revision = (revisions.get(photo) || 0) + 1;
        revisions.set(photo, revision);
        gsap.killTweensOf(incoming);
        gsap.set(incoming, {'--story-reveal-inset': '100%', clipPath: direction > 0 ? 'inset(0 0 var(--story-reveal-inset) 0)' : 'inset(var(--story-reveal-inset) 0 0 0)'});
        incoming.hidden = false;
        incoming.loading = 'eager';
        incoming.fetchPriority = 'high';
        incoming.src = source;
        incoming.decode().catch(() => {}).then(() => {
          if (!active || revisions.get(photo) !== revision) return;
          gsap.to(incoming, {'--story-reveal-inset': '0%', duration: .85, ease: 'power3.inOut', onComplete: () => {
            if (active && revisions.get(photo) === revision) { photo.src = source; incoming.hidden = true; }
          }});
        });
      });
      timeline = gsap.timeline().to(text, {opacity: 0, y: direction * 18, duration: .2})
        .call(event.detail.applyCopy)
        .fromTo(text, {opacity: 0, y: -direction * 24}, {opacity: 1, y: 0, duration: .6, immediateRender: false, ease: 'power2.out', clearProps: 'opacity,transform'});
    };
    stories.addEventListener('dentora:story-change', animate);
    return () => { active = false; timeline?.kill(); stories.removeEventListener('dentora:story-change', animate); photos.forEach(photo => {gsap.killTweensOf(photo.nextElementSibling); photo.nextElementSibling.hidden = true;}); };
  });
})();
