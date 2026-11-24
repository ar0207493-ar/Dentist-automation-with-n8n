const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
$$('.ref-footer-social a[href="#"]').forEach(link => {
  link.addEventListener('click', event => event.preventDefault());
});
// Share the menu's rolling label with service pills and footer actions.
$$('.ref-hero-services button, .ref-footer-columns a, .ref-footer-columns button, .ref-footer-bottom button').forEach(action => {
  if (action.closest('.ref-footer-social')) return;
  const label = document.createElement('span');
  label.className = 'ref-nav-label';
  const text = document.createElement('span');
  text.textContent = action.textContent.trim();
  const repeat = text.cloneNode(true);
  repeat.setAttribute('aria-hidden', 'true');
  label.append(text, repeat);
  action.replaceChildren(label);
  action.classList.add('ref-roll');
});
const contentDialog = $('#content-dialog');
const appointmentForm = $('#appointment-form');
const bookingDialog = $('#booking-dialog');
const formHome = document.createComment('Appointment form home');
appointmentForm.before(formHome);
let lastTrigger = null;

$('#year').textContent = new Date().getFullYear();

const localToday = new Date();
localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset());
appointmentForm.elements.date.min = localToday.toISOString().slice(0, 10);

const panelClosures = new WeakMap();

function closeSlidingPanel(panel, close) {
  if (panelClosures.has(panel)) return;
  panel.classList.add('is-closing');
  const exitAnimation = panel.id === 'mobile-nav' ? 'menu-slide-out' : 'panel-slide-out';
  const slide = panel.getAnimations().find(animation => animation.animationName === exitAnimation);
  if (!slide) {
    close();
    panel.classList.remove('is-closing');
    return;
  }

  panelClosures.set(panel, slide);
  const finish = () => {
    if (panelClosures.get(panel) !== slide) return;
    panelClosures.delete(panel);
    close();
    panel.classList.remove('is-closing');
  };
  slide.finished.then(finish, finish);
}

function openBooking(service) {
  if (contentDialog.open) contentDialog.close();
  closeMenu();
  const form = $('#visit-form');
  if (service && [...form.elements.service.options].some(option => option.value === service)) {
    form.elements.service.value = service;
    form.elements.service.dispatchEvent(new Event('change', {bubbles: true}));
  }
  const target = $('#appointment');
  const request = new CustomEvent('dentora:scroll-to', {detail: target, cancelable: true});
  if (document.dispatchEvent(request)) target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
}

function closeBooking() {
  if (bookingDialog.open) closeSlidingPanel(bookingDialog, () => bookingDialog.close());
}

$$('[data-book]').forEach(button => button.addEventListener('click', () => openBooking(null, button)));
$$('[data-service]').forEach(button => button.addEventListener('click', () => openBooking(button.dataset.service, button)));
$$('dialog').forEach(dialog => {
  const close = dialog === bookingDialog ? closeBooking : () => dialog.close();
  $('.dialog-close', dialog).addEventListener('click', close);
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) close();
  });
  dialog.addEventListener('close', () => {
    if (dialog === bookingDialog) {
      panelClosures.delete(bookingDialog);
      bookingDialog.classList.remove('is-closing');
      formHome.after(appointmentForm);
    }
    if (!$$('dialog[open]').length) {
      document.body.classList.remove('modal-open');
      lastTrigger?.focus({preventScroll: true});
    }
  });
});
bookingDialog.addEventListener('cancel', event => {
  event.preventDefault();
  closeBooking();
});
$$('[data-close-booking]').forEach(link => link.addEventListener('click', closeBooking));
const menuToggle = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
const menuClose = $('.ref-menu-close');
function closeMenu() {
  if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  $('#main').inert = false;
  document.body.classList.remove('menu-open');
  if (mobileNav.contains(document.activeElement)) {
    const restoreTarget = menuToggle.getClientRects().length ? menuToggle : $('.ref-header .brand');
    restoreTarget.focus({preventScroll: true});
  }
  mobileNav.inert = true;
  closeSlidingPanel(mobileNav, () => { mobileNav.hidden = true; });
}
menuToggle.addEventListener('click', () => {
  if (menuToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    return;
  }

  panelClosures.delete(mobileNav);
  mobileNav.classList.remove('is-closing');
  mobileNav.inert = false;
  mobileNav.hidden = false;
  $('#main').inert = true;
  document.body.classList.add('menu-open');
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-label', 'Close navigation');
  menuClose.focus({preventScroll: true});
});
menuClose.addEventListener('click', closeMenu);
$$('a', mobileNav).forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
  if (event.key !== 'Tab') return;
  const items = $$('a, button', mobileNav);
  const first = items[0], last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
});
matchMedia('(max-width: 1100px)').addEventListener('change', event => { if (!event.matches) closeMenu(); });
document.addEventListener('click', event => {
  if (!mobileNav.hidden && !mobileNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
});

// Presentation only: block native form submissions without reading or storing fields.
document.addEventListener('submit', event => event.preventDefault(), true);
$$('form').forEach(form => {
  form.removeAttribute('action');
  form.removeAttribute('method');
  form.noValidate = true;
});

// Theme-aware listboxes retain their native select values without submitting data.
const customSelects = [];
$$('.ref-visit-fields select').forEach((select, index) => {
  const label = select.closest('label');
  const name = label.firstChild.textContent.trim();
  const wrapper = document.createElement('span');
  wrapper.className = 'ref-select';
  select.before(wrapper);
  wrapper.append(select);
  select.hidden = true;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'ref-select-toggle';
  toggle.setAttribute('role', 'combobox');
  toggle.setAttribute('aria-label', name);
  toggle.setAttribute('aria-haspopup', 'listbox');
  toggle.setAttribute('aria-expanded', 'false');
  const list = document.createElement('ul');
  list.className = 'ref-select-options';
  list.id = 'visit-options-' + index;
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', name);
  list.hidden = true;
  toggle.setAttribute('aria-controls', list.id);
  const options = [...select.options].map((option, item) => {
    const row = document.createElement('li');
    row.id = list.id + '-' + item;
    row.setAttribute('role', 'option');
    row.textContent = option.textContent;
    list.append(row);
    row.addEventListener('pointerdown', event => event.preventDefault());
    row.addEventListener('click', () => choose(item));
    return row;
  });
  wrapper.append(toggle, list);
  let active = select.selectedIndex;
  const render = () => {
    toggle.textContent = select.options[select.selectedIndex].textContent;
    options.forEach((row, item) => {
      row.setAttribute('aria-selected', String(item === select.selectedIndex));
      row.classList.toggle('is-active', item === active);
    });
    if (!list.hidden) toggle.setAttribute('aria-activedescendant', options[active].id);
  };
  const close = () => {
    list.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.removeAttribute('aria-activedescendant');
  };
  const open = () => {
    customSelects.forEach(control => control.close());
    active = select.selectedIndex;
    list.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    render();
  };
  function choose(item) {
    select.selectedIndex = item;
    active = item;
    select.dispatchEvent(new Event('change', {bubbles: true}));
    close();
    toggle.focus({preventScroll: true});
  }
  toggle.addEventListener('click', () => list.hidden ? open() : close());
  toggle.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape'].includes(event.key)) event.preventDefault();
    if (event.key === 'Escape' || event.key === 'Tab') { close(); return; }
    if (event.key === 'Enter' || event.key === ' ') { list.hidden ? open() : choose(active); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    if (list.hidden) open();
    active = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : Math.max(0, Math.min(options.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1)));
    render();
    options[active].scrollIntoView({block: 'nearest'});
  });
  select.addEventListener('change', render);
  document.addEventListener('pointerdown', event => { if (!wrapper.contains(event.target)) close(); });
  customSelects.push({close});
  render();
});

const benefitTrack = $('#benefit-track');
const faqItems = $$('.ref-faq-item');
const faqMotion = matchMedia('(prefers-reduced-motion: no-preference)');
const faqStates = new WeakMap();
let faqRefreshFrame;
function refreshFaqLayout() {
  cancelAnimationFrame(faqRefreshFrame);
  faqRefreshFrame = requestAnimationFrame(() => {
    document.dispatchEvent(new Event('dentora:layout-change'));
    window.ScrollTrigger?.refresh();
  });
}
function expandFaq(item, expanded, immediate = false) {
  const state = faqStates.get(item);
  const summary = $('summary', item);
  const startHeight = item.getBoundingClientRect().height;
  state.animation?.cancel();
  state.expanded = expanded;
  summary.setAttribute('aria-expanded', String(expanded));
  item.style.height = startHeight + 'px';
  item.classList.toggle('is-collapsing', !expanded);
  if (expanded) item.open = true;
  const endHeight = summary.getBoundingClientRect().height + (expanded ? $('.ref-faq-answer', item).getBoundingClientRect().height : 0);

  const finish = () => {
    item.open = expanded;
    item.style.removeProperty('height');
    item.classList.remove('is-collapsing');
    state.animation?.cancel();
    state.animation = null;
    refreshFaqLayout();
  };
  if (immediate || !faqMotion.matches || Math.abs(startHeight - endHeight) < 1) {
    finish();
    return;
  }
  const animation = item.animate({height: [startHeight + 'px', endHeight + 'px']}, {
    duration: 360, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards',
  });
  state.animation = animation;
  animation.onfinish = () => { if (state.animation === animation) finish(); };
}
faqItems.forEach(item => {
  const state = {expanded: item.open, animation: null};
  const summary = $('summary', item);
  faqStates.set(item, state);
  // Native grouping remains available without JS; enhanced closing waits for its animation.
  item.removeAttribute('name');
  summary.setAttribute('aria-expanded', String(item.open));
  summary.addEventListener('click', event => {
    event.preventDefault();
    const expanded = !state.expanded;
    if (expanded) faqItems.forEach(other => {
      if (other !== item && faqStates.get(other).expanded) expandFaq(other, false);
    });
    expandFaq(item, expanded);
  });
  item.addEventListener('toggle', () => {
    if (state.animation || state.expanded === item.open) return;
    state.expanded = item.open;
    summary.setAttribute('aria-expanded', String(item.open));
    if (item.open) faqItems.forEach(other => {
      if (other !== item && faqStates.get(other).expanded) expandFaq(other, false);
    });
    refreshFaqLayout();
  });
});
function settleFaqAnimations() {
  faqItems.forEach(item => {
    const state = faqStates.get(item);
    if (state.animation) expandFaq(item, state.expanded, true);
  });
}
window.addEventListener('resize', settleFaqAnimations);
faqMotion.addEventListener('change', settleFaqAnimations);
const smileComparison = $('#smile-comparison');
const comparisonRange = $('#smile-comparison-range');
function updateComparison(value, duration = .16) {
  const position = Math.max(0, Math.min(100, Number(value)));
  comparisonRange.value = position;
  if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.to(smileComparison, {'--comparison': position + '%', duration, ease: 'power2.out', overwrite: 'auto'});
  } else {
    smileComparison.style.setProperty('--comparison', position + '%');
  }
}
smileComparison?.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse') return;
  const bounds = smileComparison.getBoundingClientRect();
  updateComparison((event.clientX - bounds.left) / bounds.width * 100);
});
comparisonRange?.addEventListener('input', () => updateComparison(comparisonRange.value));
const resetComparison = () => updateComparison(50, .5);
smileComparison?.addEventListener('pointerleave', resetComparison);
smileComparison?.addEventListener('pointerup', resetComparison);
smileComparison?.addEventListener('pointercancel', resetComparison);
comparisonRange?.addEventListener('change', resetComparison);
comparisonRange?.addEventListener('blur', resetComparison);


if (benefitTrack) {
function scrollBenefitsTo(target) {
  const request = new CustomEvent('dentora:benefit-scroll', {detail: target, cancelable: true});
  if (!benefitTrack.dispatchEvent(request)) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  benefitTrack.scrollTo({left: target, behavior: motion});
}
function benefitStops() {
  const end = benefitTrack.scrollWidth - benefitTrack.clientWidth;
  const start = benefitTrack.firstElementChild.getBoundingClientRect().left;
  return [...benefitTrack.children].map(card => Math.min(end, card.getBoundingClientRect().left - start));
}
function moveBenefits(direction) {
  const current = benefitTrack.scrollLeft;
  const stops = benefitStops();
  const target = direction > 0
    ? stops.find(stop => stop > current + 2) ?? 0
    : stops.findLast(stop => stop < current - 2) ?? stops.at(-1);
  scrollBenefitsTo(target);
}
const benefitPagination = document.createElement('div');
benefitPagination.className = 'ref-benefit-pagination';
benefitPagination.setAttribute('role', 'group');
benefitPagination.setAttribute('aria-label', 'Choose a reason to visit Dentora');
const benefitDots = [...benefitTrack.children].map((card, index, cards) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', `Show card ${index + 1} of ${cards.length}`);
  dot.addEventListener('click', () => scrollBenefitsTo(benefitStops()[index]));
  benefitPagination.append(dot);
  return dot;
});
benefitTrack.after(benefitPagination);
function syncBenefitPagination() {
  const stops = benefitStops();
  const nearest = stops.reduce((best, stop, index) => Math.abs(stop - benefitTrack.scrollLeft) < Math.abs(stops[best] - benefitTrack.scrollLeft) ? index : best, 0);
  benefitDots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === nearest)));
}
benefitTrack.addEventListener('scroll', syncBenefitPagination, {passive: true});
if (window.ResizeObserver) new ResizeObserver(syncBenefitPagination).observe(benefitTrack);
syncBenefitPagination();
benefitTrack.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  moveBenefits(event.key === 'ArrowRight' ? 1 : -1);
});

}

if ($('.hero-marquee-viewport')) {
const marquee = $('.hero-marquee-viewport');
const marqueeTrack = $('.hero-marquee-track', marquee);
const marqueeCopy = marqueeTrack.firstElementChild;
const marqueeMotion = matchMedia('(prefers-reduced-motion: no-preference)');

function syncMarquee() {
  marqueeTrack.classList.toggle('is-scrolling', marqueeMotion.matches);
  if (!marqueeMotion.matches) {
    marquee.removeAttribute('tabindex');
    while (marqueeTrack.childElementCount > 1) marqueeTrack.lastElementChild.remove();
    return;
  }

  marquee.tabIndex = 0;
  const copyWidth = marqueeCopy.getBoundingClientRect().width;
  if (!copyWidth) return;
  const copies = Math.ceil(marquee.getBoundingClientRect().width / copyWidth) + 1;
  while (marqueeTrack.childElementCount < copies) {
    const repeat = marqueeCopy.cloneNode(true);
    repeat.setAttribute('aria-hidden', 'true');
    marqueeTrack.append(repeat);
  }
  while (marqueeTrack.childElementCount > copies) marqueeTrack.lastElementChild.remove();
  marqueeTrack.style.setProperty('--marquee-offset', `-${copyWidth}px`);
}

syncMarquee();
marqueeMotion.addEventListener('change', syncMarquee);
if (window.ResizeObserver) {
  const marqueeResize = new ResizeObserver(syncMarquee);
  marqueeResize.observe(marquee);
  marqueeResize.observe(marqueeCopy);
} else {
  window.addEventListener('resize', syncMarquee);
  document.fonts.ready.then(syncMarquee);
}

}

if ($('#stories')) {
const stories = [
  {name:'Savannah Nguyen', kind:'Medical Assistant', image:'reference/story-woman.webp', quote:$('#story-quote').textContent},
  {name:'Alex R.', kind:'Care for the whole family', image:'reference/story-man.webp', quote:'A warm welcome and time for all our questions. It made a visit with the whole family feel much more manageable.'},
  {name:'Jamie L.', kind:'A fresh start for my smile', image:'reference/about-woman.webp', quote:'No pressure, just a clear conversation about my options. Having a plan helped me take that first step.'}
];
let storyIndex = 0;
function moveStory(direction) {
  storyIndex = (storyIndex + direction + stories.length) % stories.length;
  const story = stories[storyIndex];
  const applyCopy = () => {
    $('#story-quote').textContent = story.quote;
    $('#story-person').textContent = story.name;
    $('#story-kind').textContent = story.kind + ' · Sample testimonial';
  };
  const sources = {
    preview: 'assets/' + stories[(storyIndex + 1) % stories.length].image,
    avatar: 'assets/' + story.image,
    direction, applyCopy,
  };
  if ($('#stories').dispatchEvent(new CustomEvent('dentora:story-change', {detail: sources, cancelable: true}))) {
    applyCopy();
    $('#story-preview').src = sources.preview;
    $('#story-avatar').src = sources.avatar;
  }
}
$('#story-prev').addEventListener('click', () => moveStory(-1));
$('#story-next').addEventListener('click', () => moveStory(1));

}

const articles = [
  {category:'Dental Health',title:'Professional Cleaning vs. Regular Brushing',body:'<p>Daily oral care and a professional cleaning serve different roles. A dental appointment is a good time to ask what a cleaning involves and what your clinician recommends for your routine.</p><h3>Questions for your visit</h3><p>Ask what to expect, how much time to allow, and when your clinic would recommend a follow-up.</p>'},
  {category:'Dental Health',title:'Important signs that indicate it’s time to visit dentist',body:'<p>If you notice a change in your mouth or have a concern about your teeth or gums, tell the clinic when it started and how it has changed. Your dental team can help you decide the next step.</p><h3>Prepare for a conversation</h3><p>Write down your questions and mention any previous treatment you would like the team to know about.</p>'},
  {category:'Dental Health',title:'Professional Cleaning vs. Regular Brushing',body:'<p>At a visit, your dentist or hygienist can explain the difference between your at-home routine and the tools used in a professional cleaning. Bring any questions that would help you feel more comfortable.</p>'},
  {category:'First Visit',title:'Preparing for Your First Dental Visit',body:'<p>When booking your first visit, ask the clinic what information to bring and how much time to allow. Write down your questions and tell the team about anything that would help you feel comfortable.</p><h3>A conversation before treatment</h3><p>Your appointment is a chance to discuss your goals, previous dental experiences, and what happens next. Ask the team to explain the plan and any costs before proceeding.</p>'},
  {category:'Smile Care',title:'Questions to Ask About Teeth Whitening',body:'<p>If you are considering whitening, start with a conversation about your goals. Ask your dentist about the available options, what an assessment involves, and what results may be realistic for your smile.</p><h3>Make time for your questions</h3><p>Discuss sensitivity, existing dental work, treatment costs, and follow-up care with the dental team before choosing a treatment.</p>'},
  {category:'Family Care',title:'Building a Dental Care Routine for Your Family',body:'<p>A family dental appointment can help everyone ask questions about their everyday routine. Bring a list of the products you use and the parts of oral care that feel difficult to manage.</p><h3>Plan together</h3><p>Ask the team for guidance suited to each family member and discuss when to arrange the next visit. A clear plan can make it easier to keep up with appointments.</p>'}
];

if ($('#journal-slider')) {
const journalSlider = $('#journal-slider');
const journalPrevious = $('#journal-prev');
const journalNext = $('#journal-next');
function syncJournalControls() {
  const end = journalSlider.scrollWidth - journalSlider.clientWidth;
  journalPrevious.disabled = journalSlider.scrollLeft <= 2;
  journalNext.disabled = journalSlider.scrollLeft >= end - 2;
}
function moveJournal(direction) {
  const card = journalSlider.firstElementChild;
  const gap = parseFloat(getComputedStyle(journalSlider).columnGap);
  const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  journalSlider.scrollBy({left: direction * (card.getBoundingClientRect().width + gap), behavior});
}
journalPrevious.addEventListener('click', () => moveJournal(-1));
journalNext.addEventListener('click', () => moveJournal(1));
journalSlider.addEventListener('scroll', syncJournalControls, {passive: true});
journalSlider.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  moveJournal(event.key === 'ArrowRight' ? 1 : -1);
});
syncJournalControls();
if (window.ResizeObserver) new ResizeObserver(syncJournalControls).observe(journalSlider);
else window.addEventListener('resize', syncJournalControls);

}

function showContent(category, title, body, trigger) {
  if (!contentDialog.open) lastTrigger = trigger;
  $('#content-category').textContent = category;
  $('#content-title').textContent = title;
  $('#content-body').innerHTML = body;
  if (!contentDialog.open) contentDialog.showModal();
  document.body.classList.add('modal-open');
  contentDialog.scrollTop = 0;
}

$('#hero-film')?.addEventListener('click', event => {
  showContent('Welcome to Dentora', 'Good care starts with feeling comfortable.',
    '<video class="ref-preview-video" controls autoplay playsinline preload="metadata" poster="assets/dental-poster.webp" aria-label="Dental care film"><source src="assets/dental-banner.mp4" type="video/mp4"></video>', event.currentTarget);
});
contentDialog.addEventListener('close', () => {
  if (!contentDialog.open) $('#content-body').replaceChildren();
});

// Article previews stay on the page instead of opening placeholder popups.
$$('[data-article]').forEach(button => button.addEventListener('click', event => event.preventDefault()));
const infoPages = {
  faq: {title:'Frequently asked questions', body:'<h3>How do I request a visit?</h3><p>Use Book an Appointment and enter your preferred date. The clinic will contact you to confirm availability.</p><h3>Can I call instead?</h3><p>Use the clinic’s phone number in Contact Us.</p>'},
  'not-found': {title:'Page not found', body:'<p>Return to the <a href="#home" data-close-content>homepage</a> to explore services and articles.</p>'},
  terms: {title:'Terms and Conditions', body:'<p>This website is a design preview. Forms are for presentation only and cannot create an appointment or newsletter subscription.</p>'},
  license: {title:'Design and media credits', body:'<p>The Dentora reference design is by <a href="https://dribbble.com/shots/27208818-Dentora-Dental-Care-Website-UI-Design">Orbix Studio</a>. The treatment preview uses footage from Pexels.</p>'},
  instructions: {title:'Using the website', body:'<p>Choose a service or use Book an Appointment to request a visit. Use the left and right buttons to browse previews and testimonials.</p>'},
  journal: {title:'Dentora Journal', body:'<div class="ref-dialog-entries">' + articles.map((article,index) => `<button type="button" data-journal-entry="${index}">${article.title}</button>`).join('') + '</div>'}
};
$('#content-body').addEventListener('click', event => {
  if (event.target.closest('[data-close-content]')) contentDialog.close();
  const entry = event.target.closest('[data-journal-entry]');
  if (entry) {
    const article = articles[Number(entry.dataset.journalEntry)];
    showContent(article.category, article.title, article.body, entry);
  }
});
$$('[data-info]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.info === 'journal') { $('#journal-slider')?.scrollBy({left: $('#journal-slider').clientWidth, behavior: 'smooth'}); return; }
  const page = infoPages[button.dataset.info];
  if (page) {
    showContent('Dentora', page.title, page.body, button);
    return;
  }
  if (button.dataset.info === 'privacy') showContent('Your privacy', 'Your details stay with you.', '<p>This is a frontend design preview. Appointment and newsletter forms do not submit, store or send the details you enter. No booking, email, WhatsApp or database service is connected.</p><p>Fonts may load from Google Fonts; no advertising or analytics scripts are included.</p>', button);
  else showContent('Accessibility', 'A comfortable experience for everyone.', '<p>The page supports keyboard navigation, visible focus indicators, reduced motion preferences, and layouts that adapt to different screen sizes.</p><p>Dialog windows can be closed with Escape, and every form field has a visible label. For appointment help, use the form or email the clinic.</p>', button);
}));

if ('IntersectionObserver' in window && document.body.dataset.page !== 'about' && document.body.dataset.linkMode !== 'placeholder') {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$('.desktop-nav a').forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
      }
    });
  }, {rootMargin:'-10% 0px -65% 0px'});
  $$('#home, #services, #stories, #journal, #appointment').forEach(section => navObserver.observe(section));
}

