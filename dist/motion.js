/* Progressive enhancement: content stays readable if GSAP cannot load. */
(() => {
  const video = document.getElementById('hero-video');
  const toggle = document.getElementById('video-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = reduced.matches || !!navigator.connection?.saveData;
  let heroVisible = true;
  function syncVideoControl() {
    const paused = video.paused;
    document.getElementById('video-toggle-label').textContent = paused ? 'Play film' : 'Pause film';
    toggle.querySelector('use').setAttribute('href', paused ? '#play' : '#pause');
    toggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
    toggle.setAttribute('aria-pressed', String(paused));
  }
  function updatePlayback() {
    if (userPaused || document.hidden || !heroVisible) { video.pause(); syncVideoControl(); }
    else video.play().then(syncVideoControl).catch(syncVideoControl);
  }
  toggle.addEventListener('click', () => { userPaused = !video.paused; updatePlayback(); });
  video.addEventListener('play', syncVideoControl);
  video.addEventListener('pause', syncVideoControl);
  const showPoster = () => { video.hidden = true; toggle.hidden = true; };
  video.addEventListener('error', showPoster);
  video.querySelector('source').addEventListener('error', showPoster);
  document.addEventListener('visibilitychange', updatePlayback);
  reduced.addEventListener('change', event => { userPaused = event.matches; updatePlayback(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting; updatePlayback();
  }, {threshold:.08}).observe(document.querySelector('.hero'));
  if (userPaused) video.removeAttribute('autoplay');
  updatePlayback();
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  document.fonts.ready.then(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const splits = [];
      if (window.SplitText) {
        // Domino Fall: preserve words so characters never wrap mid-word.
        document.querySelectorAll('main h1, main h2, main h3, .footer-top h2').forEach(heading => {
          const split = SplitText.create(heading, {type:'words,chars',wordsClass:'domino-word',charsClass:'domino-char',aria:'auto'});
          splits.push(split);
          gsap.from(split.chars, {
            rotationZ:-90,transformOrigin:'bottom left',opacity:0,
            stagger:{each:.06,amount:Math.min(1.6,split.chars.length * .06)},
            duration:.5,ease:'power3.out',
            scrollTrigger:{trigger:heading,start:'top 92%',once:true}
          });
        });
        // Firework Burst resolves to scale 1; the supplied demo ended at 0.
        const wordmark = document.querySelector('.footer-name');
        const firework = SplitText.create(wordmark, {type:'chars',charsClass:'footer-char',aria:'none'});
        splits.push(firework);
        gsap.fromTo(firework.chars,{scale:3,opacity:0},{scale:1,opacity:1,
          stagger:{each:.03,from:'center'},duration:.6,ease:'power4.out',
          scrollTrigger:{trigger:wordmark,start:'top 95%',once:true}});
      }
      // Reveal Wipe for supporting copy, separated from headings and controls.
      document.querySelectorAll('.hero-description,.about-intro p,.section-heading>p:not(.section-label),.doctor-copy>p,.benefit-teal p,.benefit-simple p,.appointment-copy>p:not(.section-label)').forEach(copy => {
        gsap.fromTo(copy,{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:1.2,ease:'power3.inOut',scrollTrigger:{trigger:copy,start:'top 92%',once:true}});
      });
      document.querySelectorAll('.about-image img,.doctor-portrait img,.technology-card>img,.benefit-photo>img,.article-photo img,.appointment-photo img').forEach(image => {
        gsap.fromTo(image,{clipPath:'polygon(0 0,0 0,0 100%,0 100%)'},{clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)',duration:1.2,ease:'power3.inOut',scrollTrigger:{trigger:image,start:'top 92%',once:true}});
      });
      const progress = document.createElement('div');
      progress.className = 'reading-progress'; progress.setAttribute('aria-hidden','true'); document.body.append(progress);
      gsap.fromTo(progress,{scaleX:0},{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.15}});
      const booking = document.getElementById('booking-dialog');
      const animateBooking = () => gsap.fromTo('.booking-visual>img',{clipPath:'polygon(0 0,0 0,0 100%,0 100%)'},{clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)',duration:.85,ease:'power3.inOut'});
      booking.addEventListener('booking:open',animateBooking);
      window.addEventListener('load',() => ScrollTrigger.refresh(),{once:true});
      ScrollTrigger.refresh();
      return () => { booking.removeEventListener('booking:open',animateBooking); splits.forEach(split => split.revert()); progress.remove(); };
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
