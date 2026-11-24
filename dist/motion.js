/* Progressive enhancement: content stays readable if GSAP cannot load. */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const media = gsap.matchMedia();
  const sectionReveals = '.ref-about, .ref-treatment, .ref-benefits-header, .ref-comparison, .ref-story, .ref-journal, .ref-faq, .ref-footer';
  const benefits = document.querySelector('#why');
  const benefitTrack = document.querySelector('#benefit-track');
  let lenis;
  if (window.Lenis) {
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const content = document.querySelector('#main');
      const scroller = new Lenis({
        lerp: 0,
        duration: 2,
        easing: progress => Math.min(1, 1.001 - Math.pow(2, -10 * progress)),
        wheelMultiplier: 1.3,
        smoothWheel: true,
        syncTouch: true,
        syncTouchLerp: 0.12,
        touchInertiaExponent: 1.5,
        prevent: node => node.closest('dialog, #mobile-nav, .ref-select-options'),
      });
      lenis = scroller;
      const updateFrame = time => scroller.raf(time * 1000);
      scroller.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(updateFrame);
      gsap.ticker.lagSmoothing(0);
      const resizeScroll = () => scroller.resize();
      document.addEventListener('dentora:layout-change', resizeScroll);

      const syncDialog = () => {
        if (document.querySelector('dialog[open]') || document.body.classList.contains('menu-open')) scroller.stop();
        else scroller.start();
      };
      const dialogs = new MutationObserver(syncDialog);
      document.querySelectorAll('dialog').forEach(dialog => dialogs.observe(dialog, {attributes: true, attributeFilter: ['open']}));
      dialogs.observe(document.body, {attributes: true, attributeFilter: ['class']});
      syncDialog();
      const anchorTarget = hash => {
        const target = document.getElementById(hash.slice(1));
        return content.contains(target) ? target : null;
      };
      const moveToAnchor = (target, smooth) => {
        const section = target.closest(sectionReveals);
        // Anchor to the resting position even if the section is still animating.
        const entranceOffset = section ? Number(gsap.getProperty(section, 'y')) : 0;
        scroller.scrollTo(target, {offset: -entranceOffset, immediate: !smooth});
      };
      const onAnchorClick = event => {
        if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        const link = event.target.closest('a[href^="#"]');
        const target = link && anchorTarget(link.hash);
        if (!target || (link.target && link.target !== '_self')) return;

        event.preventDefault();
        if (location.hash !== link.hash) history.pushState(history.state, '', link.hash);
        if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
        target.focus({preventScroll: true});
        syncDialog();
        moveToAnchor(target, true);
      };
      const restoreAnchor = () => {
        const target = anchorTarget(location.hash);
        if (target) moveToAnchor(target, false);
      };
      const scrollToRequest = event => { event.preventDefault(); scroller.scrollTo(event.detail, {offset: -24}); };
      document.addEventListener('dentora:scroll-to', scrollToRequest);
      document.addEventListener('click', onAnchorClick);
      window.addEventListener('hashchange', restoreAnchor);
      if (document.readyState === 'complete') restoreAnchor();
      else window.addEventListener('load', restoreAnchor, {once: true});

      return () => {
        dialogs.disconnect();
        gsap.ticker.remove(updateFrame);
        document.removeEventListener('dentora:layout-change', resizeScroll);
        scroller.off('scroll', ScrollTrigger.update);
        scroller.destroy();
        lenis = undefined;
        document.removeEventListener('click', onAnchorClick);
        document.removeEventListener('dentora:scroll-to', scrollToRequest);
        window.removeEventListener('hashchange', restoreAnchor);
        window.removeEventListener('load', restoreAnchor);
      };
    });
  }
  if (window.SplitText) gsap.registerPlugin(SplitText);
  if (window.DrawSVGPlugin) {
    gsap.registerPlugin(DrawSVGPlugin);
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const paths = document.querySelectorAll('.brand-word path');
      gsap.timeline()
        .fromTo(paths, {drawSVG: '0%', fill: 'transparent'}, {
          drawSVG: '100%', duration: 0.4, ease: 'power2.inOut',
        })
        .to(paths, {fill: '#27a8c1', duration: 0.2}, '-=0.1');
    });
  }
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const formSection = document.querySelector('.ref-visit-section');
    if (!formSection) return;
    gsap.from('.ref-visit-intro > .ref-label, .ref-visit-intro h2, .ref-visit-intro > p', {
      opacity: 0, y: 24, duration: .6, stagger: .08, clearProps: 'opacity,transform',
      scrollTrigger: {trigger: formSection, start: 'top 82%', once: true},
    });
    gsap.from('.ref-visit-photo figcaption', {opacity: 0, y: 20, duration: .65, clearProps: 'opacity,transform', scrollTrigger: {trigger: '.ref-visit-photo', start: 'top 88%', once: true}});
    gsap.from('.ref-visit-form', {opacity: 0, y: 32, duration: .65, clearProps: 'opacity,transform', scrollTrigger: {trigger: '.ref-visit-form', start: 'top 85%', once: true}});
    gsap.from('.ref-visit-action .ref-button', {opacity: 0, y: 20, duration: .65, clearProps: 'opacity,transform', scrollTrigger: {trigger: '.ref-visit-action', start: 'top 93%', once: true}});
  });
  // Both pages share Lenis, the logo and form reveals; page-specific scenes start below.
  if (document.body.dataset.page === 'about') return;

  // Hero entrances use native CSS so the first screen never waits for text splitting.

  media.add('(prefers-reduced-motion: no-preference)', context => {
    const overlayPhoto = '.ref-treatment-photo, .ref-article-visual, .ref-benefit-photo, .ref-preview-visual, .ref-visit-photo, .ref-comparison-frame';
    const treatmentPanel = document.querySelector('.ref-treatment-panel');
    gsap.from(treatmentPanel, {opacity: 0, y: 20, duration: .65, clearProps: 'opacity,transform', scrollTrigger: {trigger: treatmentPanel, start: 'top 90%', once: true}});
    const images = [...document.querySelectorAll('.reference-site img:not(.hero-photo, .ref-about-inline-photo img, .ref-story-incoming), .booking-visual img')].filter(image => !image.closest(overlayPhoto));
    document.querySelectorAll('.ref-benefit-photo > div').forEach(copy => gsap.from(copy, {opacity: 0, y: 20, duration: .65, clearProps: 'opacity,transform', scrollTrigger: {trigger: copy.parentElement, start: 'top 88%', once: true}}));
    const imageGroups = new Map();
    const imageRevisions = new WeakMap();
    const covered = 'inset(0 0 100% 0)';
    const stories = document.querySelector('#stories');
    const storyText = stories.querySelector('.ref-story-main');
    const storyPhotos = [stories.querySelector('#story-preview'), stories.querySelector('#story-avatar')];
    let active = true;
    gsap.set(images, {clipPath: covered});
    images.forEach(image => {
      const frame = image.parentElement;
      if (!imageGroups.has(frame)) imageGroups.set(frame, []);
      imageGroups.get(frame).push(image);
    });

    const reveal = context.add(null, image => gsap.to(image, {
      clipPath: 'inset(0 0 0% 0)',
      duration: image.closest('.ref-hero') ? 0.4 : 1.2,
      ease: 'power3.inOut',
      clearProps: 'clipPath',
    }));
    const revealAfterDecode = image => {
      const revision = (imageRevisions.get(image) || 0) + 1;
      imageRevisions.set(image, revision);
      // Start loading once the frame is visible even while the image is clipped.
      if (image.loading === 'lazy') image.loading = 'eager';
      image.decode().catch(() => {}).then(() => {
        if (active && imageRevisions.get(image) === revision) reveal(image);
      });
    };
    // Observe the frames so the clipped photos can still be detected in both axes.
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const frame = entry.target;
        observer.unobserve(frame);
        imageGroups.get(frame).forEach(revealAfterDecode);
      }
    }, {threshold: 0.1});
    imageGroups.forEach((group, frame) => observer.observe(frame));
    const revealStory = context.add(null, (photo, incoming, source, revision, direction) => {
      gsap.to(incoming, {
        // Animate one inset value so reverse clipping cannot switch discretely.
        '--story-reveal-inset': '0%', duration: .85, ease: 'power3.inOut',
        onComplete: () => {
          if (!active || imageRevisions.get(photo) !== revision) return;
          photo.src = source;
          incoming.hidden = true;
        },
      });
    });
    let storyTransition;
    const animateStory = context.add(null, event => {
      event.preventDefault();
      const direction = event.detail.direction;
      storyTransition?.kill();
      storyPhotos.forEach(photo => {
        observer.unobserve(photo.parentElement);
        const incoming = photo.nextElementSibling;
        const source = event.detail[photo.id === 'story-preview' ? 'preview' : 'avatar'];
        const revision = (imageRevisions.get(photo) || 0) + 1;
        imageRevisions.set(photo, revision);
        gsap.killTweensOf([photo, incoming], 'clipPath,--story-reveal-inset');
        gsap.set(photo, {clearProps: 'clipPath'});
        gsap.set(incoming, {
          '--story-reveal-inset': '100%',
          clipPath: direction > 0 ? 'inset(0 0 var(--story-reveal-inset) 0)' : 'inset(var(--story-reveal-inset) 0 0 0)',
        });
        incoming.hidden = false;
        incoming.src = source;
        incoming.decode().catch(() => {}).then(() => {
          if (active && imageRevisions.get(photo) === revision) revealStory(photo, incoming, source, revision, direction);
        });
      });
      storyTransition = gsap.timeline()
        .to(storyText, {opacity: 0, y: direction * 18, duration: .2, ease: 'power1.in'})
        .call(event.detail.applyCopy)
        .fromTo(storyText, {opacity: 0, y: -direction * 24}, {opacity: 1, y: 0, duration: .6, immediateRender: false, ease: 'power2.out', clearProps: 'opacity,transform'});
    });
    stories.addEventListener('dentora:story-change', animateStory);
    return () => {
      active = false;
      storyTransition?.kill();
      observer.disconnect();
      storyPhotos.forEach(photo => { photo.nextElementSibling.hidden = true; });
      stories.removeEventListener('dentora:story-change', animateStory);
    };
  });

  document.fonts.ready.then(() => {
    media.add('(prefers-reduced-motion: no-preference)', context => {
      const labels = document.querySelectorAll('.ref-label');
      gsap.set(labels, {opacity: 0, y: 20});
      const reveal = context.add(null, label => gsap.to(label, {
        opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'opacity,transform',
      }));
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          reveal(entry.target);
        }
      }, {threshold: 0.2});
      labels.forEach(label => observer.observe(label));

      const counters = document.querySelectorAll('[data-count]');
      const finalValues = [...counters].map(counter => counter.textContent);
      counters.forEach(counter => {
        const state = {value: 0};
        const suffix = counter.dataset.suffix || '';
        const decimals = Number(counter.dataset.decimals || 0);
        counter.textContent = state.value.toFixed(decimals) + suffix;
        gsap.to(state, {
          value: Number(counter.dataset.count), duration: 1.4, ease: 'power1.out',
          onUpdate: () => { counter.textContent = state.value.toFixed(decimals) + suffix; },
          scrollTrigger: {trigger: '.ref-metrics', start: 'top 85%', once: true},
        });
      });
      return () => {
        observer.disconnect();
        counters.forEach((counter, index) => { counter.textContent = finalValues[index]; });
      };
    });

    media.add('(prefers-reduced-motion: no-preference) and (min-width: 1101px) and (min-height: 700px) and (pointer: fine)', () => {
      const travel = () => benefitTrack.scrollWidth - benefitTrack.clientWidth;
      const stage = benefits.querySelector('.ref-benefits-stage');
      const measure = () => {
        benefits.style.setProperty('--benefit-travel', `${travel()}px`);
        benefits.style.setProperty('--benefit-top', `${Math.max(16, (innerHeight - stage.offsetHeight) / 2)}px`);
      };
      benefitTrack.classList.add('is-scroll-driven');
      benefits.classList.add('is-scroll-driven');
      measure();
      ScrollTrigger.addEventListener('refreshInit', measure);
      const slide = gsap.fromTo(benefitTrack, {scrollLeft: 0}, {
        scrollLeft: travel,
        ease: 'none',
        scrollTrigger: {
          trigger: benefits,
          start: () => `top top+=${parseFloat(benefits.style.getPropertyValue('--benefit-top')) - parseFloat(getComputedStyle(benefits).paddingTop)}`,
          end: () => `+=${travel()}`,
          scrub: 0.2, invalidateOnRefresh: true,
        },
      });
      const moveToCard = event => {
        if (!travel()) return;
        event.preventDefault();
        const {start, end} = slide.scrollTrigger;
        const top = start + (end - start) * (event.detail / travel());
        if (lenis) lenis.scrollTo(top, {duration: 0.6});
        else window.scrollTo({top, behavior: 'smooth'});
      };
      benefitTrack.addEventListener('dentora:benefit-scroll', moveToCard);
      return () => {
        benefitTrack.removeEventListener('dentora:benefit-scroll', moveToCard);
        ScrollTrigger.removeEventListener('refreshInit', measure);
        benefitTrack.classList.remove('is-scroll-driven');
        benefits.classList.remove('is-scroll-driven');
        benefits.style.removeProperty('--benefit-travel');
        benefits.style.removeProperty('--benefit-top');
      };
    });

    media.add('(prefers-reduced-motion: no-preference)', context => {
      const splits = [];
      document.querySelectorAll('.ref-journal-header h2, .ref-footer-top h2').forEach(heading => {
        // Measure and split offscreen headings only when the visitor reaches them.
        const enter = context.add(null, () => {
          const split = window.SplitText?.create(heading, {type: 'lines', tag: 'span', aria: 'auto'});
          if (split) splits.push(split);
          gsap.from(split?.lines || heading, {
            opacity: 0, y: 32, duration: 0.6, stagger: 0.1, ease: 'power2.out',
            clearProps: 'opacity,transform', onComplete: () => split?.revert(),
          });
        });
        ScrollTrigger.create({trigger: heading, start: 'top 85%', once: true, onEnter: enter});
      });
      document.querySelectorAll('.ref-footer-columns > div, .ref-footer-connect, .ref-footer-bottom').forEach(group => {
        const actions = [...group.children].filter(child => !child.matches('h2, h3, small'));
        gsap.from(actions, {
          opacity: 0, y: 24, duration: 0.5, stagger: 0.07, ease: 'power2.out',
          scrollTrigger: {trigger: group, start: group.matches('.ref-footer-bottom') ? 'top bottom' : 'top 92%', once: true},
          clearProps: 'opacity,transform',
        });
      });
      return () => splits.forEach(split => split.revert());
    });

    media.add('(prefers-reduced-motion: no-preference)', context => {
      // Keep the hero, About statement, and existing line animations intact.
      const headings = [...document.querySelectorAll('.reference-site h2, .reference-site h3, .ref-article > strong')]
        .filter(heading => !heading.matches('#about-title, .ref-label, .ref-journal-header h2, .ref-footer-top h2'));
      const copies = [...document.querySelectorAll([
        '.ref-caption', '.ref-metrics dd', '.ref-treatment-main > div > p',
        '.ref-doctor-copy p', '.ref-treatment-panel dt', '.ref-progress-title > span',
        '.ref-benefit p', '.ref-benefit-faces > span', '.ref-comparison-heading p',
        '.ref-story figcaption > span', '.ref-article-meta small', '.ref-article-meta time',
        '.ref-learn', '.ref-faq-intro > p', '.ref-newsletter-description', '.ref-footer-intro > p', '.ref-footer-social > span', '.ref-footer form small',
      ].join(','))];
      const headingSet = new Set(headings);
      const activeSplits = new Set();
      headings.forEach(heading => { heading.dataset.scrollAnimation = 'fade-up'; });
      copies.forEach(copy => { copy.dataset.scrollAnimation = 'text-reveal'; });
      gsap.set(headings, {opacity: 0, y: 32});
      gsap.set(copies, {visibility: 'hidden'});

      const enter = context.add(null, element => {
        if (headingSet.has(element)) {
          gsap.to(element, {
            opacity: 1, y: 0, duration: 0.65, ease: 'power2.out',
            clearProps: 'opacity,transform',
          });
          return;
        }
        const split = !element.matches('.ref-learn, .ref-rating') && window.SplitText ? SplitText.create(element, {
          type: 'lines', tag: 'span', linesClass: 'ref-reveal-line', aria: 'auto',
        }) : undefined;
        if (split) activeSplits.add(split);
        const lines = split?.lines || element;
        gsap.set(lines, {clipPath: 'inset(0 100% 0 0)'});
        gsap.set(element, {clearProps: 'visibility'});
        gsap.to(lines, {
          clipPath: 'inset(0 0% 0 0)', duration: 0.85, stagger: 0.07, ease: 'power3.inOut',
          clearProps: 'clipPath',
          onComplete: () => {
            split?.revert();
            if (split) activeSplits.delete(split);
          },
        });
      });
      // IntersectionObserver also respects the horizontal clipping of carousel cards.
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          enter(entry.target);
        });
      }, {rootMargin: '0px 0px -12% 0px', threshold: 0.12});
      [...headings, ...copies].forEach(element => observer.observe(element));
      return () => {
        observer.disconnect();
        activeSplits.forEach(split => split.revert());
        [...headings, ...copies].forEach(element => { delete element.dataset.scrollAnimation; });
      };
    });

    media.add('(prefers-reduced-motion: no-preference)', context => {
      gsap.from('.ref-faq-item', {
        opacity: 0, y: 24, duration: 0.5, stagger: 0.06, ease: 'power2.out', clearProps: 'opacity,transform',
        scrollTrigger: {trigger: '.ref-faq-list', start: 'top 85%', once: true},
      });
      const cards = [...benefitTrack.children];
      gsap.set(cards, {opacity: 0, y: 40});
      const reveal = context.add(null, card => gsap.to(card, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', clearProps: 'opacity,transform',
      }));
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.intersectionRatio < 0.12) continue;
          observer.unobserve(entry.target);
          reveal(entry.target);
        }
      }, {threshold: 0.12});
      ScrollTrigger.create({
        trigger: benefitTrack, start: 'top 80%', once: true,
        onEnter: () => cards.forEach(card => observer.observe(card)),
      });
      return () => {
        observer.disconnect();
        cards.forEach(card => {
          card.style.removeProperty('opacity');
          card.style.removeProperty('transform');
        });
      };
    });

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const aboutTitle = document.querySelector('#about-title');
      const aboutWords = window.SplitText?.create(aboutTitle.querySelectorAll('.ref-about-copy'), {type: 'words', tag: 'span', aria: 'auto'});
      if (aboutWords) {
        // Words and inline photos share one reading-order timeline and duration.
        const tokens = [...aboutWords.words, ...aboutTitle.querySelectorAll('.ref-about-inline-photo')]
          .sort((first, second) => first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
        const reveal = gsap.timeline({scrollTrigger: {
          id: 'home-about-reading', trigger: aboutTitle,
          start: 'top 75%', end: 'bottom 10%', scrub: 1.1,
        }});
        tokens.forEach((token, index) => {
          if (token.classList.contains('ref-about-inline-photo')) {
            reveal.fromTo(token, {'--about-photo-progress': 0, clipPath: 'inset(0 50% 0 50%)', opacity: 0}, {
              '--about-photo-progress': 1, clipPath: 'inset(0 0% 0 0%)', opacity: 1, duration: 1.2, ease: 'sine.inOut',
            }, index * .12);
          } else {
            reveal.fromTo(token, {color: '#ccc'}, {color: '#101213', duration: 1.2, ease: 'none'}, index * .12);
          }
        });
      }
      const sections = document.querySelectorAll(sectionReveals);
      sections.forEach(section => {
        gsap.from(section, {
          opacity: 0,
          y: 40,
          duration: 0.6,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
          scrollTrigger: {trigger: section, start: 'top 80%', once: true},
        });
      });
      ScrollTrigger.refresh();
      return () => {
        aboutWords?.revert();
        sections.forEach(section => {
          section.style.removeProperty('opacity');
          section.style.removeProperty('transform');
        });
      };
    });
    media.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)',() => {
      const cleanup = [];
      document.querySelectorAll('.hero,.booking-visual').forEach(area => {
        const light = area.querySelector('.cursor-light');
        if (!light) return;
        const move = event => {
          const box = area.getBoundingClientRect();
          gsap.to(light,{left:event.clientX-box.left,top:event.clientY-box.top,opacity:1,duration:.2,overwrite:'auto'});
        };
        const leave = () => gsap.to(light,{opacity:0,duration:.3,overwrite:'auto'});
        area.addEventListener('pointermove',move); area.addEventListener('pointerleave',leave);
        cleanup.push(() => { area.removeEventListener('pointermove',move);area.removeEventListener('pointerleave',leave);gsap.set(light,{opacity:0}); });
      });
      return () => cleanup.forEach(fn => fn());
    });
  });
})();
