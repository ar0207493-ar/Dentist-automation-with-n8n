const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const contentDialog = $('#content-dialog');
const appointmentForm = $('#appointment-form');
const bookingDialog = $('#booking-dialog');
const successDialog = $('#success-dialog');
const formHome = document.createComment('Appointment form home');
appointmentForm.before(formHome);
let lastTrigger = null;
let toastTimeout;

$('#year').textContent = new Date().getFullYear();
const localToday = new Date();
localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset());
appointmentForm.elements.date.min = localToday.toISOString().slice(0, 10);

function notify(message) {
  clearTimeout(toastTimeout);
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  toastTimeout = setTimeout(() => $('#toast').classList.remove('show'), 5500);
}

function openBooking(service, trigger) {
  lastTrigger = trigger || document.activeElement;
  if (contentDialog.open) contentDialog.close();
  if (service) appointmentForm.elements.service.value = service;
  closeMenu();
  if (successDialog.open) successDialog.close();
  $('#booking-form-slot').append(appointmentForm);
  if (!bookingDialog.open) bookingDialog.showModal();
  document.body.classList.add('modal-open');
  bookingDialog.dispatchEvent(new Event('booking:open'));
  appointmentForm.elements.name.focus({preventScroll:true});
}

$$('[data-book]').forEach(button => button.addEventListener('click', () => openBooking(null, button)));
$$('[data-service]').forEach(button => button.addEventListener('click', () => openBooking(button.dataset.service, button)));
$$('dialog').forEach(dialog => {
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (dialog === bookingDialog) formHome.after(appointmentForm);
    if (!$$('dialog[open]').length) {
      document.body.classList.remove('modal-open');
      lastTrigger?.focus({preventScroll: true});
    }
  });
});
$$('[data-close-booking]').forEach(link => link.addEventListener('click', () => bookingDialog.close()));
$('#success-done').addEventListener('click', () => successDialog.close());

const menuToggle = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
function closeMenu() {
  mobileNav.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
}
menuToggle.addEventListener('click', () => {
  const isOpening = mobileNav.hidden;
  mobileNav.hidden = !isOpening;
  menuToggle.setAttribute('aria-expanded', String(isOpening));
  menuToggle.setAttribute('aria-label', isOpening ? 'Close navigation' : 'Open navigation');
});
$$('a', mobileNav).forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => {
  if (!mobileNav.hidden && !mobileNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
});

appointmentForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!appointmentForm.reportValidity()) return;
  const values = Object.fromEntries(new FormData(appointmentForm));
  if (values.company) return;
  if (values.date < appointmentForm.elements.date.min) {
    notify('Please choose today or a future date.');
    appointmentForm.elements.date.focus();
    return;
  }
  const webhookUrl = appointmentForm.dataset.webhookUrl.trim();
  const status = $('#appointment-status');
  status.dataset.state = 'sending';
  const isLocalPreview = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const pointsToLocalN8n = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(webhookUrl);
  if (!webhookUrl || (pointsToLocalN8n && !isLocalPreview)) {
    status.dataset.state = 'error';
    status.textContent = 'The email service is not connected yet, so your request was not sent. Please email the clinic directly.';
    return;
  }
  const submitButton = appointmentForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  status.textContent = 'Sending your appointment request…';
  try {
    const response = await fetch(webhookUrl, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        name:values.name.trim(), email:values.email.trim(), phone:values.phone.trim(),
        service:values.service, date:values.date, time:values.time,
        message:values.message.trim(),
        contactConsent:{appointmentUpdates:true,noticeVersion:'2026-10-30',source:'appointment-form-submit'}
      })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.success !== true) {
      const issue = new Error('n8n did not confirm the request');
      issue.serviceRestarting = [502, 503, 504].includes(response.status);
      throw issue;
    }
    status.textContent = result.whatsapp?.patientAccepted === false
      ? 'Your request was received and emailed. The WhatsApp update could not be sent; the clinic will follow up by email.'
      : 'Request received. Check your email and WhatsApp; the clinic will contact you to confirm a time.';
    status.dataset.state = 'success';
    $('#success-message').textContent = 'Thank you, ' + values.name.trim() + '. Your appointment request has been received. A receipt has been sent to:';
    $('#success-email').textContent = values.email.trim();
    $('#success-whatsapp').textContent = result.whatsapp?.patientAccepted === true
      ? 'An appointment update has also been sent to your WhatsApp number.'
      : result.whatsapp?.patientAccepted === false
        ? 'The WhatsApp update could not be sent. Please use your email receipt for now.'
        : '';
    if (bookingDialog.open) bookingDialog.close();
    successDialog.showModal();
    document.body.classList.add('modal-open');
    appointmentForm.reset();
    appointmentForm.elements.date.min = localToday.toISOString().slice(0, 10);
  } catch (error) {
    status.dataset.state = 'error';
    status.textContent = error.serviceRestarting
      ? 'The booking service is restarting. Please try again in a few minutes or email ar0207493@gmail.com.'
      : 'We could not confirm that your request finished. Please email the clinic before submitting again.';
  } finally {
    submitButton.disabled = false;
  }
});

const benefitTrack = $('#benefit-track');
function moveBenefits(direction) {
  const card = benefitTrack.firstElementChild;
  const step = card.getBoundingClientRect().width + 20;
  const end = benefitTrack.scrollWidth - benefitTrack.clientWidth;
  const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  let target = benefitTrack.scrollLeft + direction * step;
  if (direction > 0 && benefitTrack.scrollLeft >= end - 5) target = 0;
  if (direction < 0 && benefitTrack.scrollLeft <= 5) target = end;
  benefitTrack.scrollTo({left: target, behavior: motion});
}
$('#benefit-prev').addEventListener('click', () => moveBenefits(-1));
$('#benefit-next').addEventListener('click', () => moveBenefits(1));

const articles = [
  {category:'Your first visit',title:'A first visit that feels a little more familiar.',body:'<p>New places can bring new questions. A first appointment is a chance to meet the team, talk about your concerns, and understand what comes next.</p><h3>Start with a conversation.</h3><p>Bring any questions you want to ask, along with the information your clinic requests before the visit. Let the team know if anything about dental care makes you nervous, so they can discuss how to support your comfort.</p><h3>Leave with a clearer picture.</h3><p>Your dentist can explain what they find, discuss available options, and help you understand the next steps. Ask about timing, costs, and anything you would like explained again.</p>'},
  {category:'Behind the scenes',title:'Thoughtful spaces. A more comfortable experience.',body:'<p>The way a space feels can make a difference. This Dentora concept pairs natural light, soft colors, and uncluttered spaces to create a calmer welcome.</p><h3>A place to pause.</h3><p>The design leaves room to breathe: open layouts, clear wayfinding, and comfortable seating. A friendly conversation matters just as much as the surroundings.</p><h3>Designed around people.</h3><p>Clinic details shown on this website are illustrative. Ask your clinic about accessibility, appointment support, and any accommodations you need before your visit.</p>'},
  {category:'Your smile, your way',title:'Make room for the questions on your mind.',body:'<p>A good conversation starts with what matters to you. You might want to ask about a change you have noticed, understand an option, or simply know what to expect from an appointment.</p><h3>A few questions to bring along.</h3><p>What are the available options? What happens at the next visit? How much time should I allow? What does the cost include? You can write your questions down in advance.</p><h3>Take your time.</h3><p>Your dentist is the right person to discuss your individual needs. This journal is part of a website design concept and does not provide personal dental advice.</p>'}
];
function showContent(category, title, body, trigger) {
  lastTrigger = trigger;
  $('#content-category').textContent = category;
  $('#content-title').textContent = title;
  $('#content-body').innerHTML = body;
  contentDialog.showModal();
  document.body.classList.add('modal-open');
  contentDialog.scrollTop = 0;
}
$$('[data-article]').forEach(button => button.addEventListener('click', () => {
  const article = articles[Number(button.dataset.article)];
  showContent(article.category, article.title, article.body, button);
}));
$$('[data-info]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.info === 'privacy') showContent('Your privacy', 'A little clarity about your details.', '<p>Appointment details are sent to the clinic to respond to your request. We use Gmail for email and WaAPI to send appointment updates to the WhatsApp number you provide. WaAPI processes the recipient number and message content. To stop updates, contact ar0207493@gmail.com.</p><p>If you include a note, its text is sent to Google Gemini to draft a brief, courteous acknowledgement. Separate name, email and phone fields are not included in the Gemini request. The reply is not dental advice or a clinical review. Your appointment is confirmed only when the clinic agrees a time with you.</p><p>Fonts may load from Google Fonts; no advertising or analytics scripts are included.</p>', button);
  else showContent('Accessibility', 'A comfortable experience for everyone.', '<p>The page supports keyboard navigation, visible focus indicators, reduced motion preferences, and layouts that adapt to different screen sizes.</p><p>Dialog windows can be closed with Escape, and every form field has a visible label. For appointment help, use the form or email the clinic.</p>', button);
}));

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$('.desktop-nav a').forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
      }
    });
  }, {rootMargin:'-10% 0px -65% 0px'});
  $$('#home, #about, #services, #insights, #appointment').forEach(section => navObserver.observe(section));
}

