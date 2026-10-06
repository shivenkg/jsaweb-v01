/* ===================== THEME TOGGLE (dark navy <-> ivory white) ===================== */
(function(){
  const STORAGE_KEY = 'jsalpha-theme';
  const root = document.documentElement;

  function applyTheme(theme, announce){
    root.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle').forEach(btn=>{
      btn.setAttribute('aria-checked', theme === 'light');
      btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to ivory white theme');
    });
    if(announce) window.dispatchEvent(new CustomEvent('themechange', {detail:{theme}}));
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  const initial = saved || 'dark';
  applyTheme(initial, false);

  document.querySelectorAll('.theme-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next, true);
    });
  });

  // let the 3D hero scene react once it's ready, even if it initializes after this runs
  window.__jsalphaTheme = () => root.getAttribute('data-theme') || 'dark';
})();

/* ===================== NAV SCROLL STATE ===================== */
const header = document.getElementById('siteHeader');
if(header){
  window.addEventListener('scroll', ()=>{
    header.classList.toggle('scrolled', window.scrollY > 40);
  });
}
const yr = document.getElementById('yr');
if(yr) yr.textContent = new Date().getFullYear();

/* ===================== CINEMATIC FLY-IN STAGGER ===================== */
/* Grid-style groups get per-child 3D fly-in animation instead of appearing as
   one flat block — alternating left/right/up entrances with a staggered delay
   so the content feels like it's flying into place rather than just fading in. */
(function(){
  const groups = document.querySelectorAll(
    '.svc-grid, .why-grid, .industry-grid, .value-grid, .engagement-grid, .chip-grid, .leader-grid, .process-flow'
  );
  groups.forEach(group=>{
    const children = Array.from(group.children);
    group.classList.remove('reveal');
    children.forEach((child, i)=>{
      child.classList.add('fly-in', i % 2 === 0 ? 'fly-left' : 'fly-right');
      child.style.transitionDelay = (i % 6) * 0.09 + 's';
    });
  });

  const miniSteps = document.querySelectorAll('.p-step-mini, .p-step, .svc-detail, .industry-card, .tl-row, .eng-card');
  miniSteps.forEach((el, i)=>{
    if(el.classList.contains('reveal')) el.classList.remove('reveal');
    el.classList.add('fly-in', 'fly-up');
    el.style.transitionDelay = (i % 5) * 0.08 + 's';
  });
})();

/* ===================== REVEAL ON SCROLL ===================== */
/* threshold near 0 means "as soon as any part enters view" — this matters for
   tall elements (long lists), where a percentage-based threshold may never be
   satisfiable within the viewport. No negative rootMargin, so elements at the
   very bottom of the page still trigger once they're on screen. */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
},{threshold:0.01});
document.querySelectorAll('.reveal, .fly-in').forEach(el=>io.observe(el));

/* ===================== HERO STATS SCROLL-TRIGGERED COUNTER ===================== */
(function(){
  const statsRow = document.getElementById('statsRow');
  if(!statsRow) return;

  const countEls = statsRow.querySelectorAll('[data-count]');
  if(!countEls.length) return;

  let animated = false;

  function runCounterAnimation(){
    if(animated) return;
    animated = true;

    countEls.forEach((el, index) => {
      const target = parseInt(el.dataset.count, 10);
      if(isNaN(target)) return;

      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = 2000; // 2 seconds silky-smooth count-up
      const startDelay = index * 120; // cascading stagger for dynamic visual appeal

      el.textContent = prefix + '0' + suffix;

      setTimeout(() => {
        let startTime = null;

        function step(timestamp){
          if(!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Cubic ease-out: brisk start, decelerates elegantly to final number
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const currentVal = Math.floor(easeOut * target);

          el.textContent = prefix + currentVal.toLocaleString() + suffix;

          if(progress < 1){
            window.requestAnimationFrame(step);
          } else {
            el.textContent = prefix + target.toLocaleString() + suffix;
          }
        }

        window.requestAnimationFrame(step);
      }, startDelay);
    });
  }

  // Trigger when entering viewport
  if('IntersectionObserver' in window){
    const statIO = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          runCounterAnimation();
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -30px 0px'
    });

    statIO.observe(statsRow);

    // Fallback: If statsRow is already visible upon initial page load
    const rect = statsRow.getBoundingClientRect();
    if(rect.top < window.innerHeight && rect.bottom > 0){
      setTimeout(runCounterAnimation, 250);
    }
  } else {
    runCounterAnimation();
  }
})();

/* ===================== SERVICE / CARD SPOTLIGHT ===================== */
document.querySelectorAll('.svc-card').forEach(card=>{
  card.addEventListener('mousemove', e=>{
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX-r.left)+'px');
    card.style.setProperty('--my', (e.clientY-r.top)+'px');
  });
});

/* ===================== SVC CARD 3D TILT ===================== */
document.querySelectorAll('[data-tilt]').forEach(card=>{
  card.addEventListener('mousemove', e=>{
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left)/r.width - 0.5;
    const py = (e.clientY - r.top)/r.height - 0.5;
    card.style.transform = `perspective(700px) rotateX(${py*-6}deg) rotateY(${px*6}deg) translateZ(4px)`;
  });
  card.addEventListener('mouseleave', ()=>{ card.style.transform=''; });
});

/* ===================== SERVICES COLLAPSIBLE ACCORDION ===================== */
(function(){
  const accordionGroups = document.querySelectorAll('.svc-accordion-group');
  if(!accordionGroups.length) return;

  function revealChildren(group){
    group.querySelectorAll('.fly-in, .reveal').forEach(child=>{
      child.classList.add('in');
    });
  }

  accordionGroups.forEach(group=>{
    const trigger = group.querySelector('.svc-group-head');
    if(!trigger) return;

    // Trigger fly-in animation for children on hover
    group.addEventListener('mouseenter', ()=>{
      revealChildren(group);
    });

    // Toggle on click or keyboard enter
    function toggle(){
      const isOpen = group.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if(isOpen) revealChildren(group);
    }

    trigger.addEventListener('click', toggle);
    trigger.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        toggle();
      }
    });
  });

  // Auto-expand and scroll if URL links directly to a service hash
  const HASH_ALIASES = {
    // Software & Digital Engineering aliases
    'web-development': 'web-application-development',
    'mobile-app-development': 'web-application-development',
    'enterprise-software': 'web-application-development',
    'system-integration-and-apis': 'web-application-development',
    'cloud-devops-engineering': 'cloud-and-devops-engineering',
    'ai-machine-learning': 'ai-and-machine-learning',
    'data-engineering-and-analytics': 'ai-and-machine-learning',

    // IT Infrastructure & Networking aliases
    'network-designing': 'wired-and-wireless-networks',
    'network-consultancy-services': 'wired-and-wireless-networks',
    'server-and-network-enclosure': 'data-centre-setup',
    'structured-cabling-solutions': 'data-centre-setup',
    'power-backup-solutions': 'data-centre-setup',
    'network-security-solutions': 'it-audit-cyber-security-vapt',
    'cybersecurity-vapt': 'it-audit-cyber-security-vapt',
    'av-solutions': 'security-surveillance-cctv',
    'it-infrastructure-solutions': 'facility-management-services',
    'amc-services': 'facility-management-services',
    'managed-it-support-and-amc': 'facility-management-services',
    'network-monitoring': 'unified-network-monitoring',
    'unified-network-monitoring-solution': 'unified-network-monitoring',
    'dcim': 'unified-network-monitoring',
    'dcim-monitoring': 'unified-network-monitoring',
    'data-center-monitoring': 'unified-network-monitoring',
    'datacenter-monitoring': 'unified-network-monitoring',
    'data-center-monitoring-information-system': 'unified-network-monitoring'
  };

  function checkHash(){
    if(!window.location.hash) return;
    let targetId = window.location.hash.substring(1);
    let targetEl = document.getElementById(targetId);
    if(!targetEl && HASH_ALIASES[targetId]){
      targetId = HASH_ALIASES[targetId];
      targetEl = document.getElementById(targetId);
    }
    if(targetEl){
      const parentGroup = targetEl.closest('.svc-accordion-group');
      if(parentGroup){
        parentGroup.classList.add('is-open');
        const trigger = parentGroup.querySelector('.svc-group-head');
        if(trigger) trigger.setAttribute('aria-expanded', 'true');
        revealChildren(parentGroup);
        setTimeout(()=>{
          targetEl.scrollIntoView({behavior:'smooth', block:'start'});
        }, 200);
      }
    }
  }

  window.addEventListener('hashchange', checkHash);
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(checkHash, 100);
  } else {
    window.addEventListener('DOMContentLoaded', checkHash);
  }
})();

/* ===================== FLOATING CONTACT BUTTON ===================== */
(function(){
  /* ── configuration ── */
  const WA_NUMBER  = '+918800028867';   // WhatsApp number (country code + digits, no +)
  const WA_MESSAGE = encodeURIComponent('Hi! I visited JS AlphaSoft website and would like to discuss a project.');
  const CALL_NUMBER = 'tel:+918800028867';

  const fcb = document.createElement('div');
  fcb.className = 'fcb';
  fcb.innerHTML = `
    <div class="fcb-actions">
      <a class="fcb-pill wa" href="https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.122 1.532 5.857L.057 23.428a.5.5 0 0 0 .515.572l5.701-1.494A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.373l-.36-.213-3.724.976.997-3.634-.234-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
        Chat on WhatsApp
      </a>
      <a class="fcb-pill cb" href="${CALL_NUMBER}">
        <svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.4 2.1L8 10.3a16 16 0 0 0 6 6l1.5-1.4a2 2 0 0 1 2.1-.4c1 .4 2 .6 3 .7a2 2 0 0 1 1.4 2.7z"/></svg>
        Request a Callback
      </a>
    </div>
    <button class="fcb-trigger" aria-label="Contact us" type="button">
      <span class="fcb-pulse"></span>
      <svg class="ico-chat" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <svg class="ico-close" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>
    </button>`;

  document.body.appendChild(fcb);

  const trigger = fcb.querySelector('.fcb-trigger');
  trigger.addEventListener('click', () => fcb.classList.toggle('open'));

  // Close when clicking outside
  document.addEventListener('click', e => {
    if (!fcb.contains(e.target)) fcb.classList.remove('open');
  });

  // Stop pulse animation after first open (user has noticed)
  trigger.addEventListener('click', () => {
    fcb.querySelector('.fcb-pulse').style.animation = 'none';
  }, {once: true});
})();

/* ===================== MOBILE & DROPDOWN NAVIGATION ===================== */
const burgerBtn = document.getElementById('burgerBtn');
if (burgerBtn) {
  burgerBtn.addEventListener('click', () => {
    const nav = document.querySelector('.navlinks');
    if (!nav) return;
    const open = nav.classList.toggle('mobile-open');
    if (open) {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const bg = isLight ? '#ffffff' : '#080E28';
      const border = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)';
      nav.style.cssText = `display:flex;flex-direction:column;position:fixed;top:70px;right:16px;left:16px;max-height:85vh;overflow-y:auto;background:${bg};border:1px solid ${border};border-radius:20px;padding:20px;gap:14px;z-index:99;box-shadow:0 24px 60px rgba(0,0,0,0.7);`;
    } else {
      nav.style.cssText = '';
    }
  });
}

// Close mobile menu on navigation click
document.addEventListener('click', (e) => {
  const nav = document.querySelector('.navlinks');
  if (!nav || !nav.classList.contains('mobile-open')) return;
  if (e.target.closest('.nav-dropdown-item') || (e.target.closest('.nav-link') && !e.target.closest('.nav-item.dropdown'))) {
    nav.classList.remove('mobile-open');
    nav.style.cssText = '';
  }
});

// Dropdown click/touch toggle support
document.querySelectorAll('.nav-item.dropdown > .nav-link').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    // On small screens or when clicked, toggle open state
    if (window.innerWidth <= 980) {
      e.preventDefault();
      const parent = btn.closest('.nav-item');
      parent.classList.toggle('open');
    }
  });
});

/* ===================== "START A PROJECT" ONCLICK NAVIGATION ===================== */
(function(){
  function scrollToContactForm(){
    const formEl = document.getElementById('contactForm') || document.getElementById('contact');
    if(formEl){
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = document.getElementById('fieldName') || formEl.querySelector('input:not([type="hidden"]), textarea');
      if(firstInput){
        setTimeout(() => firstInput.focus(), 350);
      }
    }
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('a, button');
    if(!el) return;
    const text = (el.textContent || '').trim().toLowerCase();
    const isStartProject = text.includes('start a project') || el.classList.contains('navcta');
    if(!isStartProject) return;

    // Close mobile nav if open
    const nav = document.querySelector('.navlinks');
    if(nav && nav.classList.contains('mobile-open')){
      nav.classList.remove('mobile-open');
      nav.style.cssText = '';
    }

    const currentPath = window.location.pathname;
    const isContactPage = currentPath.endsWith('contact.html') || currentPath.endsWith('/contact') || window.location.href.includes('contact.html');

    if(isContactPage){
      e.preventDefault();
      scrollToContactForm();
    } else {
      // If href is missing, #, or invalid, ensure explicit landing on contact.html
      const href = el.getAttribute('href');
      if(!href || href === '#' || href === 'javascript:void(0)'){
        e.preventDefault();
        window.location.href = 'contact.html#contact';
      }
    }
  });

  // If landing on contact page with hash
  if(window.location.hash === '#contact' || window.location.hash === '#contactForm'){
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(scrollToContactForm, 250);
    });
    if(document.readyState === 'complete' || document.readyState === 'interactive'){
      setTimeout(scrollToContactForm, 250);
    }
  }
})();

/* ===================== HERO MOUSE MOTION & PARALLAX ===================== */
(function(){
  const hero = document.querySelector('.hero');
  if(!hero) return;

  const heroInner = document.getElementById('heroInner');
  const blob1 = document.getElementById('hvBlob1');
  const blob2 = document.getElementById('hvBlob2');

  let targetTiltX = 0, targetTiltY = 0;
  let currentTiltX = 0, currentTiltY = 0;
  let rafId = null;

  function onMouseMove(e){
    const rect = hero.getBoundingClientRect();
    if(e.clientY < rect.top || e.clientY > rect.bottom) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalized relative coordinates from center: -1 to 1
    const relX = ((x / rect.width) - 0.5) * 2;
    const relY = ((y / rect.height) - 0.5) * 2;

    targetTiltX = relX * 6.5; // Max 6.5 deg tilt
    targetTiltY = -relY * 5.5;

    // Update dynamic spotlight position CSS variables
    hero.style.setProperty('--mouse-x', `${x}px`);
    hero.style.setProperty('--mouse-y', `${y}px`);

    if(blob1) blob1.style.transform = `translate(${relX * -35}px, ${relY * -25}px)`;
    if(blob2) blob2.style.transform = `translate(${relX * 30}px, ${relY * 20}px)`;
  }

  function onMouseLeave(){
    targetTiltX = 0;
    targetTiltY = 0;
    if(blob1) blob1.style.transform = '';
    if(blob2) blob2.style.transform = '';
  }

  function updateParallax(){
    currentTiltX += (targetTiltX - currentTiltX) * 0.08;
    currentTiltY += (targetTiltY - currentTiltY) * 0.08;

    if(heroInner){
      heroInner.style.transform = `perspective(1000px) rotateY(${currentTiltX.toFixed(2)}deg) rotateX(${currentTiltY.toFixed(2)}deg)`;
    }

    rafId = requestAnimationFrame(updateParallax);
  }

  hero.addEventListener('mousemove', onMouseMove, {passive: true});
  hero.addEventListener('mouseleave', onMouseLeave);
  rafId = requestAnimationFrame(updateParallax);
})();
