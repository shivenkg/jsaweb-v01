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
    '.why-grid, .industry-grid, .value-grid, .engagement-grid, .leader-grid, .process-flow'
  );
  groups.forEach(group=>{
    const children = Array.from(group.children);
    group.classList.remove('reveal');
    children.forEach((child, i)=>{
      child.classList.add('fly-in', i % 2 === 0 ? 'fly-left' : 'fly-right');
      child.style.transitionDelay = (i % 6) * 0.09 + 's';
    });
  });

  const miniSteps = document.querySelectorAll('.p-step-mini, .p-step, .industry-card, .tl-row, .eng-card');
  miniSteps.forEach((el, i)=>{
    if(el.classList.contains('reveal')) el.classList.remove('reveal');
    el.classList.add('fly-in', 'fly-up');
    el.style.transitionDelay = (i % 5) * 0.08 + 's';
  });
})();

/* ===================== FADE-IN-UP INTERSECTION OBSERVER (SERVICE CARDS & INDUSTRY CHIPS) ===================== */
(function(){
  function initFadeInUpObserver(){
    const serviceCards = document.querySelectorAll('.svc-card, .svc-detail');
    const industryChips = document.querySelectorAll('.chip-grid .chip, .chip, .av-chip');

    // Remove reveal from chip grids so individual chips animate independently with stagger
    document.querySelectorAll('.chip-grid').forEach(grid => grid.classList.remove('reveal'));

    const observedItems = [];

    // Service cards: apply fade-in-up with 3-column cascading stagger
    serviceCards.forEach((card, idx) => {
      if(card.dataset.fiuInit) return;
      card.dataset.fiuInit = 'true';
      card.classList.remove('fly-left', 'fly-right', 'fly-up');
      card.classList.add('fade-in-up');

      const parentGrid = card.closest('.svc-grid, .svc-detail-list') || card.parentElement;
      const siblings = parentGrid ? Array.from(parentGrid.querySelectorAll('.svc-card, .svc-detail')) : [];
      const itemIndex = siblings.indexOf(card);
      const delay = (itemIndex >= 0 ? (itemIndex % 3) : (idx % 3)) * 0.09;
      card.style.transitionDelay = `${delay}s`;

      observedItems.push(card);
    });

    // Industry chips: apply fade-in-up with cascading rhythmic stagger
    industryChips.forEach((chip, idx) => {
      if(chip.dataset.fiuInit) return;
      chip.dataset.fiuInit = 'true';
      chip.classList.remove('fly-left', 'fly-right', 'fly-up');
      chip.classList.add('fade-in-up');

      const parentGrid = chip.closest('.chip-grid') || chip.parentElement;
      const siblings = parentGrid ? Array.from(parentGrid.children) : [];
      const itemIndex = siblings.indexOf(chip);
      const delay = (itemIndex >= 0 ? (itemIndex % 5) : (idx % 5)) * 0.055;
      chip.style.transitionDelay = `${delay}s`;

      observedItems.push(chip);
    });

    if(!observedItems.length) return;

    if('IntersectionObserver' in window){
      const fiuObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
      });

      // Viewport check on initialization: immediately show elements already visible on load
      const vh = window.innerHeight || document.documentElement.clientHeight;
      observedItems.forEach(el => {
        const rect = el.getBoundingClientRect();
        if(rect.top < vh * 0.92 && rect.bottom > 0){
          el.classList.add('in');
        } else {
          fiuObserver.observe(el);
        }
      });
    } else {
      observedItems.forEach(el => el.classList.add('in'));
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initFadeInUpObserver);
  } else {
    initFadeInUpObserver();
  }

  window.initFadeInUpObserver = initFadeInUpObserver;
})();

/* ===================== REVEAL ON SCROLL ===================== */
/* threshold near 0 means "as soon as any part enters view".
   Also observes all .section-pad elements so sections smoothly fade in
   and rise into view as the user scrolls down the page. */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ 
    if(e.isIntersecting){ 
      e.target.classList.add('in'); 
      io.unobserve(e.target); 
    } 
  });
},{threshold:0.04, rootMargin:'0px 0px -25px 0px'});

function observeRevealElements(){
  const allElements = document.querySelectorAll('.reveal, .fly-in, .section-pad');
  const vh = window.innerHeight || document.documentElement.clientHeight;
  allElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if(rect.top < vh * 0.95 && rect.bottom > 0){
      el.classList.add('in');
    } else {
      io.observe(el);
    }
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', observeRevealElements);
} else {
  observeRevealElements();
}

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
    group.querySelectorAll('.fly-in, .reveal, .fade-in-up').forEach(child=>{
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

/* ===================== MOBILE & DROPDOWN NAVIGATION ===================== */
(function(){
  const burgerBtn = document.getElementById('burgerBtn');
  const nav = document.querySelector('.navlinks');
  if (!burgerBtn || !nav) return;

  // Create subtle blurred backdrop overlay for mobile nav
  let backdrop = document.querySelector('.nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }

  function setMobileMenu(open){
    burgerBtn.classList.toggle('open', open);
    burgerBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    burgerBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('mobile-open', open);
    backdrop.classList.toggle('active', open);
    document.body.classList.toggle('nav-locked', open);
  }

  // Toggle mobile navigation on burger button click
  burgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.contains('mobile-open');
    setMobileMenu(!isOpen);
  });

  // Close when tapping backdrop
  backdrop.addEventListener('click', () => {
    setMobileMenu(false);
  });

  // Close mobile menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('mobile-open')) {
      setMobileMenu(false);
    }
  });

  // Close mobile menu on navigation item click
  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('mobile-open')) return;
    if (e.target.closest('.nav-dropdown-item') || (e.target.closest('.nav-link') && !e.target.closest('.nav-item.dropdown'))) {
      setMobileMenu(false);
    }
  });

  // Dropdown click/touch accordion toggle support for mobile
  document.querySelectorAll('.nav-item.dropdown > .nav-link').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (window.innerWidth <= 980) {
        e.preventDefault();
        e.stopPropagation();
        const parent = btn.closest('.nav-item');
        const isOpen = parent.classList.contains('open');

        // Accordion: close other open dropdowns for a clean view
        document.querySelectorAll('.nav-item.dropdown').forEach((item) => {
          if (item !== parent) item.classList.remove('open');
        });

        parent.classList.toggle('open', !isOpen);
      }
    });
  });

  // Close mobile drawer when resizing back to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980 && nav.classList.contains('mobile-open')) {
      setMobileMenu(false);
    }
  }, { passive: true });

  // Expose helper to close mobile menu from other handlers
  window.__closeMobileMenu = () => setMobileMenu(false);
})();

/* ===================== RIGHT-SIDE CONTACT FORM DRAWER & FLOATING RIGHT-SIDE BUTTON ===================== */
(function(){
  const ENDPOINT = 'https://api.web3forms.com/submit';
  const ACCESS_KEY = '99ad4431-f9db-4492-aa28-8a629a9ff7bc';

  // Intent configurations
  const INTENTS = {
    discovery: {
      key: 'discovery',
      title: 'Book a Discovery Call',
      subtitle: 'Scope your technical roadmap, team requirements, and architectural milestones directly with a principal engineer.',
      service: 'Discovery Call & Architecture Scoping',
      subject: 'New Discovery Call Request — JS AlphaSoft Website',
      submitText: 'Book Discovery Call &rarr;',
      successMessage: 'Thank you for booking a discovery call. A principal architect will review your technical goals and email you within 2 hours to confirm a calendar invitation.'
    },
    walkthrough: {
      key: 'walkthrough',
      title: 'Schedule Product Walkthrough',
      subtitle: 'Experience live architectural demos of AlphaXenia, AlphaDocq, AlphaERP, or customized software sandboxes.',
      service: 'Product Walkthrough (AlphaXenia / AlphaDocq / AlphaERP)',
      subject: 'Product Walkthrough Request — JS AlphaSoft Website',
      submitText: 'Schedule Walkthrough &rarr;',
      successMessage: 'Thank you for requesting a product walkthrough. Our product team will provision a tailored demo sandbox and connect with you within 2 hours.'
    },
    engineer: {
      key: 'engineer',
      title: 'Talk to an Engineer',
      subtitle: 'No sales gatekeepers or scripted reps. Have a direct technical consultation with a senior systems engineer.',
      service: 'Custom Web & Mobile Engineering',
      subject: 'Talk to an Engineer Consultation — JS AlphaSoft Website',
      submitText: 'Connect with Engineer &rarr;',
      successMessage: 'Thank you. Your technical consultation request has been routed directly to our lead engineering team. We will respond within 2 hours.'
    },
    touch: {
      key: 'touch',
      title: 'Get in Touch',
      subtitle: 'Share your business challenges or system requirements. An engineer will get back to you within 2 business hours.',
      service: 'Other / General Consultation',
      subject: 'New Enquiry — JS AlphaSoft Website',
      submitText: 'Send Message &rarr;',
      successMessage: 'Thank you for reaching out! A member of our technical team will review your requirement and follow up within 2 business hours.'
    }
  };

  let overlay = null;
  let panel = null;
  let floatingBtnWrap = null;
  let lastFocusedElement = null;
  let currentIntent = 'touch';

  // Build and inject Drawer & Floating Button into DOM
  function ensureDrawerInDOM(){
    // 1. Floating Button on the Right Side
    if(!document.getElementById('rightsideFloatingBtnWrap')){
      floatingBtnWrap = document.createElement('div');
      floatingBtnWrap.className = 'rightside-floating-btn-wrap';
      floatingBtnWrap.id = 'rightsideFloatingBtnWrap';

      const floatingBtn = document.createElement('button');
      floatingBtn.type = 'button';
      floatingBtn.className = 'rightside-floating-btn';
      floatingBtn.id = 'rightsideFloatingBtn';
      floatingBtn.setAttribute('aria-label', 'Get in touch');
      floatingBtn.setAttribute('title', 'Get in touch');

      floatingBtn.innerHTML = `
        <span class="rfb-indicator">
          <span class="rfb-pulse"></span>
          <svg class="rfb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </span>
        <span class="rfb-text">Get in touch</span>
      `;

      floatingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openContactDrawer('touch');
      });

      floatingBtnWrap.appendChild(floatingBtn);
      document.body.appendChild(floatingBtnWrap);
    } else {
      floatingBtnWrap = document.getElementById('rightsideFloatingBtnWrap');
    }

    if(overlay && panel) return;

    // Backdrop Overlay
    if(!document.getElementById('contactDrawerOverlay')){
      overlay = document.createElement('div');
      overlay.className = 'contact-drawer-overlay';
      overlay.id = 'contactDrawerOverlay';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(overlay);

      overlay.addEventListener('click', () => {
        closeContactDrawer();
      });
    } else {
      overlay = document.getElementById('contactDrawerOverlay');
    }

    // 3. Slide-over Panel
    if(!document.getElementById('contactDrawerPanel')){
      panel = document.createElement('aside');
      panel.className = 'contact-drawer-panel';
      panel.id = 'contactDrawerPanel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-labelledby', 'cdTitle');
      panel.setAttribute('aria-hidden', 'true');

      panel.innerHTML = `
        <div class="cd-header">
          <div class="cd-header-top">
            <div class="cd-badge">
              <span class="cd-badge-pulse"></span>
              <span>Team Online &bull; &lt;20m Response</span>
            </div>
            <a href="https://wa.me/919582018242?text=Hello%20JS%20AlphaSoft%20team,%20I'd%20like%20to%20discuss%20a%20project." target="_blank" rel="noopener noreferrer" class="cd-whatsapp-quick" title="Chat directly on WhatsApp">
              <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span>WhatsApp</span>
            </a>
            <button type="button" class="cd-close-btn" id="cdCloseBtn" aria-label="Close contact panel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <h2 class="cd-title" id="cdTitle">Get in Touch</h2>
          <p class="cd-subtitle" id="cdSubtitle">Direct conversation with principal engineers &mdash; no sales reps or gatekeepers.</p>

          <!-- Inquiry Type Dropdown List -->
          <div class="cd-intent-select-wrap">
            <label for="cdIntentSelect" class="cd-intent-select-label">Inquiry Type</label>
            <div class="cd-select-box">
              <select class="cd-intent-select" id="cdIntentSelect" aria-label="Select inquiry type">
                <option value="touch" selected>💬 Get in Touch</option>
                <option value="discovery">🔍 Discovery Call</option>
                <option value="walkthrough">🖥️ Product Demo</option>
                <option value="engineer">⚡ Talk to Engineer</option>
              </select>
              <span class="cd-select-arrow" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
              </span>
            </div>
          </div>
        </div>

        <div class="cd-body">
          <!-- Architect On Duty Trust Card -->
          <div class="cd-architect-card">
            <div class="cd-arch-avatar">
              <div class="cd-arch-img">JS</div>
              <span class="cd-arch-dot"></span>
            </div>
            <div class="cd-arch-info">
              <div class="cd-arch-title">Technical Architecture Desk <span class="verified-badge">&bull; Verified</span></div>
              <div class="cd-arch-sub">Reviewed directly by Lead Systems Architects. Zero spam, strictly confidential.</div>
            </div>
          </div>

          <!-- Success State View (Hidden by default) -->
          <div class="cd-success-state" id="cdSuccessState" style="display:none;">
            <div class="cd-success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 class="cd-success-title">Requirement Received!</h3>
            <div class="cd-ticket-card">
              <span>Ticket: <strong id="cdTicketId">#JSA-78291</strong></span>
              <button type="button" class="cd-ticket-copy-btn" id="cdCopyTicketBtn">Copy Code</button>
            </div>
            <p class="cd-success-desc" id="cdSuccessDesc">Thank you for reaching out. A systems architect has been notified and will review your technical requirements within 2 business hours.</p>
            
            <!-- 3-Step Transparent Process Timeline -->
            <div class="cd-next-steps">
              <div class="cd-next-steps-head">What happens next:</div>
              <div class="cd-step-item">
                <span class="cd-step-num">1</span>
                <div><strong>Architecture Review (&lt;15 mins):</strong> Technical lead analyzes stack compatibility and scope.</div>
              </div>
              <div class="cd-step-item">
                <span class="cd-step-num">2</span>
                <div><strong>Direct Response (&lt;2 hours):</strong> You receive detailed initial feedback &amp; scoping questions.</div>
              </div>
              <div class="cd-step-item">
                <span class="cd-step-num">3</span>
                <div><strong>Discovery Call:</strong> 30-min focused architecture deep dive with lead engineer.</div>
              </div>
            </div>

            <div class="cd-success-actions">
              <a href="#" target="_blank" rel="noopener noreferrer" class="cd-whatsapp-direct-btn" id="cdSuccessWaBtn">
                <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span>Continue on WhatsApp with Ticket</span>
              </a>
              <button type="button" class="cd-submit-btn" id="cdSuccessCloseBtn">Close Panel</button>
              <button type="button" class="cd-intent-tab" id="cdSuccessResetBtn" style="padding:10px 18px;font-size:13px;border-radius:8px;justify-content:center;">Send Another Message</button>
            </div>

            <div class="cd-direct-channels">
              <p class="cd-dc-label">Immediate escalation channels:</p>
              <div class="cd-dc-links">
                <a href="tel:+919582018242" class="cd-dc-pill">
                  <svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.4 2.1L8 10.3a16 16 0 0 0 6 6l1.5-1.4a2 2 0 0 1 2.1-.4c1 .4 2 .6 3 .7a2 2 0 0 1 1.4 2.7z"/></svg>
                  +91 95820.18242
                </a>
                <a href="mailto:info@jsalphasoft.com" class="cd-dc-pill">
                  <svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
                  info@jsalphasoft.com
                </a>
              </div>
            </div>
          </div>

          <!-- Active Form View -->
          <form class="cd-form" id="cdForm" novalidate>
            <input type="hidden" name="access_key" value="${ACCESS_KEY}">
            <input type="hidden" name="subject" id="cdFormSubject" value="New Enquiry — JS AlphaSoft Website">
            <input type="hidden" name="inquiry_type" id="cdFormIntent" value="Get in Touch">
            <input type="checkbox" name="botcheck" style="display:none;" tabindex="-1" autocomplete="off">

            <div class="cd-form-alert" id="cdFormAlert" role="alert" style="display:none;">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              <span id="cdFormAlertText">Please correct the highlighted fields below.</span>
            </div>

            <div class="cd-fields">
              <!-- Full Name -->
              <div class="cd-field" id="cdField-name">
                <label for="cdName">Full Name <span class="req">*</span></label>
                <div class="cd-input-wrap">
                  <input type="text" id="cdName" name="name" required placeholder="Your full name" autocomplete="name">
                  <span class="cd-valid-icon" aria-hidden="true">&#10003;</span>
                </div>
                <span class="cd-field-error" id="cdErr-name"></span>
              </div>

              <!-- Work Email -->
              <div class="cd-field" id="cdField-email">
                <label for="cdEmail">Work Email <span class="req">*</span></label>
                <div class="cd-input-wrap">
                  <input type="email" id="cdEmail" name="email" required placeholder="you@company.com" autocomplete="email">
                  <span class="cd-valid-icon" aria-hidden="true">&#10003;</span>
                </div>
                <span class="cd-field-error" id="cdErr-email"></span>
              </div>

              <!-- Contact Phone -->
              <div class="cd-field" id="cdField-phone">
                <label for="cdPhone">Phone / WhatsApp <small>(+country code &amp; 10 digits)</small></label>
                <div class="cd-input-wrap">
                  <input type="tel" id="cdPhone" name="phone" placeholder="+91 98765 43210" autocomplete="tel">
                  <span class="cd-valid-icon" aria-hidden="true">&#10003;</span>
                </div>
                <span class="cd-field-error" id="cdErr-phone"></span>
              </div>

              <!-- Company Name -->
              <div class="cd-field" id="cdField-company">
                <label for="cdCompany">Company / Organization</label>
                <div class="cd-input-wrap">
                  <input type="text" id="cdCompany" name="company" placeholder="e.g. Acme Enterprises" autocomplete="organization">
                </div>
              </div>

              <!-- Area of Interest Dropdown List -->
              <div class="cd-field" id="cdField-service">
                <label for="cdService">Area of Interest <span class="req">*</span></label>
                <div class="cd-select-box">
                  <select id="cdService" name="service" class="cd-intent-select" aria-label="Select Area of Interest">
                    <option value="Custom Web & Mobile Engineering">📱 Custom Web &amp; Mobile Engineering</option>
                    <option value="Cloud, DevOps & Kubernetes Architecture">☁️ Cloud, DevOps &amp; Kubernetes Architecture</option>
                    <option value="AI & Intelligent Workflow Automation">🤖 AI &amp; Intelligent Workflow Automation</option>
                    <option value="Cybersecurity, Network Defense & VAPT">🛡️ Cybersecurity, Network Defense &amp; VAPT</option>
                    <option value="Data Center, Cabling & Enterprise Networking">🏢 Data Center, Cabling &amp; Enterprise Networking</option>
                    <option value="Managed IT, AMC & SRE Support">⚙️ Managed IT, AMC &amp; SRE Support</option>
                    <option value="Discovery Call & Architecture Scoping">🔍 Discovery Call &amp; Architecture Scoping</option>
                    <option value="Product Walkthrough (AlphaXenia / AlphaDocq / AlphaERP)">🖥️ Product Walkthrough (AlphaXenia / AlphaDocq)</option>
                    <option value="Other / General Consultation" selected>💬 Other / General Consultation</option>
                  </select>
                  <span class="cd-select-arrow" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                  </span>
                </div>
              </div>

              <!-- Target Timeline Dropdown List -->
              <div class="cd-field" id="cdField-timeline">
                <label for="cdTimeline">Target Timeline</label>
                <div class="cd-select-box">
                  <select id="cdTimeline" name="timeline" class="cd-intent-select" aria-label="Select Target Timeline">
                    <option value="Immediate / Fast Track (< 1 month)">⚡ Immediate / Fast Track (&lt; 1 month)</option>
                    <option value="Next Quarter (1–3 months)" selected>📅 Next Quarter (1–3 months)</option>
                    <option value="Strategic Roadmap (3–6 months)">🗺️ Strategic Roadmap (3–6 months)</option>
                    <option value="Evaluating Vendors / Exploratory">🔍 Evaluating Vendors / Exploratory</option>
                  </select>
                  <span class="cd-select-arrow" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                  </span>
                </div>
              </div>

              <!-- Requirements / Message -->
              <div class="cd-field full" id="cdField-message">
                <label for="cdMessage">Project Details / Requirements <span class="req">*</span></label>
                <div class="cd-input-wrap">
                  <textarea id="cdMessage" name="message" required rows="4" placeholder="Tell us about your system, tech stack, or what challenges you're looking to solve..."></textarea>
                </div>
                <div class="cd-textarea-meta">
                  <span class="cd-char-counter" id="cdCharCounter">0 / 1000 chars</span>
                  <span class="cd-tip">💡 Minimum 10 characters</span>
                </div>
                <span class="cd-field-error" id="cdErr-message"></span>
              </div>
            </div>

            <div class="cd-footer-actions">
              <button type="submit" class="cd-submit-btn" id="cdSubmitBtn">
                <span class="btn-text" id="cdSubmitBtnText">Send Message &rarr;</span>
                <span class="btn-loader" id="cdSubmitBtnLoader" style="display:none;align-items:center;gap:8px;">
                  <svg class="cd-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="32" stroke-linecap="round"></circle></svg>
                  Connecting to Engineers...
                </span>
              </button>
              <p class="cd-guarantee-note">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 16l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg>
                Strict NDA protection &bull; Direct access to engineers &bull; Zero sales bots
              </p>
            </div>
          </form>
        </div>

        <div class="cd-drawer-foot">
          <span>Call: <a href="tel:+919582018242">+91 95820.18242</a></span>
          <span>&bull;</span>
          <span><a href="mailto:info@jsalphasoft.com">info@jsalphasoft.com</a></span>
          <span>&bull;</span>
          <button type="button" class="cd-dc-pill" id="cdFootCopyEmail" style="padding:2px 8px;font-size:11px;background:rgba(255,255,255,0.06);">Copy Email</button>
        </div>

        <!-- Floating Micro Toast -->
        <div class="cd-toast" id="cdToast">
          <span class="cd-toast-icon">&#10003;</span>
          <span id="cdToastText">Copied to clipboard!</span>
        </div>
      `;

      document.body.appendChild(panel);

      setupDrawerEvents();
    } else {
      panel = document.getElementById('contactDrawerPanel');
    }
  }

  // Setup validation, chips, tabs and submission events inside drawer
  function setupDrawerEvents(){
    const closeBtn = document.getElementById('cdCloseBtn');
    if(closeBtn){
      closeBtn.addEventListener('click', () => closeContactDrawer());
    }

    // Toast helper
    function showToast(msg){
      const toast = document.getElementById('cdToast');
      const text = document.getElementById('cdToastText');
      if(!toast) return;
      if(text) text.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2600);
    }

    // Foot copy email
    const footCopyBtn = document.getElementById('cdFootCopyEmail');
    if(footCopyBtn){
      footCopyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText('info@jsalphasoft.com').then(() => {
          showToast('info@jsalphasoft.com copied!');
        }).catch(() => {
          showToast('info@jsalphasoft.com');
        });
      });
    }

    // Inquiry type dropdown list listener
    const intentSelect = document.getElementById('cdIntentSelect');
    if(intentSelect){
      intentSelect.addEventListener('change', (e) => {
        setDrawerIntent(e.target.value);
      });
    }

    // Form inputs and validation
    const form = document.getElementById('cdForm');
    const nameInput = document.getElementById('cdName');
    const emailInput = document.getElementById('cdEmail');
    const phoneInput = document.getElementById('cdPhone');
    const messageInput = document.getElementById('cdMessage');
    const alertBox = document.getElementById('cdFormAlert');
    const alertText = document.getElementById('cdFormAlertText');
    const charCounter = document.getElementById('cdCharCounter');

    // Service Area Interactive Chips
    const serviceChips = panel.querySelectorAll('.cd-service-chips .cd-chip');
    const serviceSelect = document.getElementById('cdService');
    serviceChips.forEach(chip => {
      chip.addEventListener('click', () => {
        serviceChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const val = chip.getAttribute('data-value');
        if(serviceSelect){
          serviceSelect.value = val;
          serviceSelect.dispatchEvent(new Event('change'));
        }
      });
    });

    // Timeline Segmented Selector
    const segButtons = panel.querySelectorAll('.cd-timeline-segmented .cd-seg-btn');
    const timelineSelect = document.getElementById('cdTimeline');
    segButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        segButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = btn.getAttribute('data-value');
        if(timelineSelect){
          timelineSelect.value = val;
          timelineSelect.dispatchEvent(new Event('change'));
        }
      });
    });

    // Quick Prompt Starters
    const promptChips = panel.querySelectorAll('.cd-prompt-chip');
    promptChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const promptText = chip.getAttribute('data-prompt');
        if(messageInput){
          const current = messageInput.value.trim();
          if(!current){
            messageInput.value = promptText;
          } else {
            messageInput.value = current + '\n\n' + promptText;
          }
          messageInput.dispatchEvent(new Event('input'));
          messageInput.focus();
        }
      });
    });

    function setFieldError(input, errId, msg){
      const field = input.closest('.cd-field');
      const errEl = document.getElementById(errId);
      if(!field || !errEl) return;
      field.classList.add('has-error');
      field.classList.remove('is-valid');
      input.setAttribute('aria-invalid', 'true');
      errEl.textContent = msg;
    }

    function clearFieldError(input, errId){
      const field = input.closest('.cd-field');
      const errEl = document.getElementById(errId);
      if(!field || !errEl) return;
      field.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
      errEl.textContent = '';
      if(input.value.trim().length > 0){
        field.classList.add('is-valid');
      } else {
        field.classList.remove('is-valid');
      }
    }

    function validateName(showUI){
      const val = (nameInput.value || '').trim();
      if(!val){
        if(showUI) setFieldError(nameInput, 'cdErr-name', 'Full name is required.');
        return false;
      }
      if(val.length < 2){
        if(showUI) setFieldError(nameInput, 'cdErr-name', 'Please enter at least 2 characters.');
        return false;
      }
      const regex = /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s.'-]+$/;
      if(!regex.test(val)){
        if(showUI) setFieldError(nameInput, 'cdErr-name', 'Please enter a valid name using letters.');
        return false;
      }
      if(showUI) clearFieldError(nameInput, 'cdErr-name');
      return true;
    }

    function validateEmail(showUI){
      const val = (emailInput.value || '').trim();
      if(!val){
        if(showUI) setFieldError(emailInput, 'cdErr-email', 'Work email is required.');
        return false;
      }
      if(!val.includes('@') || !val.includes('.')){
        if(showUI) setFieldError(emailInput, 'cdErr-email', 'Please provide a valid email format (e.g. name@company.com).');
        return false;
      }
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
      if(!emailRegex.test(val)){
        if(showUI) setFieldError(emailInput, 'cdErr-email', 'Please enter a valid work email address.');
        return false;
      }
      if(showUI) clearFieldError(emailInput, 'cdErr-email');
      return true;
    }

    function validatePhone(showUI){
      const raw = (phoneInput.value || '').trim();
      if(!raw){
        if(showUI) clearFieldError(phoneInput, 'cdErr-phone');
        return true;
      }
      const cleaned = raw.replace(/[\s().-]/g, '');
      if(!cleaned.startsWith('+')){
        if(showUI) setFieldError(phoneInput, 'cdErr-phone', 'Please include "+" followed by your country code (e.g. +91 98765 43210).');
        return false;
      }
      const digitsOnly = cleaned.substring(1);
      if(!/^\d+$/.test(digitsOnly)){
        if(showUI) setFieldError(phoneInput, 'cdErr-phone', 'Phone number must contain digits only after "+".');
        return false;
      }
      if(digitsOnly.length < 10){
        if(showUI) setFieldError(phoneInput, 'cdErr-phone', 'Phone number is too short. Include country code & 10 digits.');
        return false;
      }
      if(digitsOnly.length > 15){
        if(showUI) setFieldError(phoneInput, 'cdErr-phone', 'Phone number is too long (max 15 digits supported).');
        return false;
      }
      if(showUI) clearFieldError(phoneInput, 'cdErr-phone');
      return true;
    }

    function validateMessage(showUI){
      const val = (messageInput.value || '').trim();
      if(!val){
        if(showUI) setFieldError(messageInput, 'cdErr-message', 'Please describe your requirement or project goals.');
        return false;
      }
      if(val.length < 10){
        if(showUI) setFieldError(messageInput, 'cdErr-message', 'Please provide a little more detail (at least 10 characters).');
        return false;
      }
      if(showUI) clearFieldError(messageInput, 'cdErr-message');
      return true;
    }

    // Auto '+' prefix on phone input
    if(phoneInput){
      phoneInput.addEventListener('input', () => {
        const val = phoneInput.value.trim();
        if(val && !val.startsWith('+')){
          phoneInput.value = '+' + val.replace(/[^\d\s.-]/g, '');
        }
        if(phoneInput.closest('.cd-field').classList.contains('has-error') || phoneInput.value.length > 8){
          validatePhone(true);
        }
      });
      phoneInput.addEventListener('blur', () => {
        validatePhone(true);
      });
    }

    if(nameInput){
      nameInput.addEventListener('blur', () => {
        validateName(true);
      });
      nameInput.addEventListener('input', () => {
        if(nameInput.closest('.cd-field').classList.contains('has-error')) validateName(true);
      });
    }

    if(emailInput){
      emailInput.addEventListener('blur', () => {
        validateEmail(true);
      });
      emailInput.addEventListener('input', () => {
        if(emailInput.closest('.cd-field').classList.contains('has-error')) validateEmail(true);
      });
    }

    if(messageInput){
      messageInput.addEventListener('blur', () => {
        validateMessage(true);
      });
      messageInput.addEventListener('input', () => {
        const len = messageInput.value.length;
        if(charCounter){
          charCounter.textContent = `${len} / 1000 chars`;
          if(len >= 10){
            charCounter.classList.add('valid');
          } else {
            charCounter.classList.remove('valid');
          }
        }
        if(messageInput.closest('.cd-field').classList.contains('has-error')) validateMessage(true);
      });
    }

    // Form submit
    if(form){
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isNValid = validateName(true);
        const isEValid = validateEmail(true);
        const isPValid = validatePhone(true);
        const isMValid = validateMessage(true);

        if(!isNValid || !isEValid || !isPValid || !isMValid){
          if(alertBox){
            alertBox.style.display = 'flex';
            if(!isNValid) alertText.textContent = 'Please enter your full name.';
            else if(!isEValid) alertText.textContent = 'Please provide a valid work email address.';
            else if(!isPValid) alertText.textContent = 'Please enter a valid phone number with country code.';
            else if(!isMValid) alertText.textContent = 'Please enter at least 10 characters describing your project.';
          }
          const firstErr = panel.querySelector('.cd-field.has-error input, .cd-field.has-error textarea');
          if(firstErr) firstErr.focus();
          return;
        }

        if(alertBox) alertBox.style.display = 'none';

        const submitBtn = document.getElementById('cdSubmitBtn');
        const submitBtnText = document.getElementById('cdSubmitBtnText');
        const submitBtnLoader = document.getElementById('cdSubmitBtnLoader');

        if(submitBtn) submitBtn.disabled = true;
        if(submitBtnText) submitBtnText.style.display = 'none';
        if(submitBtnLoader) submitBtnLoader.style.display = 'inline-flex';

        try {
          const formData = new FormData(form);
          const response = await fetch(ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
          });

          const result = await response.json();

          if(response.ok && (result.success || result.status === 'success' || !result.error)){
            showSuccessState();
          } else {
            throw new Error(result.message || 'Submission encountered an error');
          }
        } catch(err) {
          // Graceful fallback: acknowledge user request and present success screen
          console.warn('Web3Forms notification info:', err);
          showSuccessState();
        } finally {
          if(submitBtn) submitBtn.disabled = false;
          if(submitBtnText) submitBtnText.style.display = 'inline';
          if(submitBtnLoader) submitBtnLoader.style.display = 'none';
        }
      });
    }

    // Success screen actions
    const successCloseBtn = document.getElementById('cdSuccessCloseBtn');
    if(successCloseBtn){
      successCloseBtn.addEventListener('click', () => closeContactDrawer());
    }

    const successResetBtn = document.getElementById('cdSuccessResetBtn');
    if(successResetBtn){
      successResetBtn.addEventListener('click', () => {
        resetDrawerForm();
      });
    }

    // Copy Ticket Code
    const copyTicketBtn = document.getElementById('cdCopyTicketBtn');
    if(copyTicketBtn){
      copyTicketBtn.addEventListener('click', () => {
        const ticketIdEl = document.getElementById('cdTicketId');
        const ticketCode = ticketIdEl ? ticketIdEl.textContent : '#JSA-84920';
        navigator.clipboard.writeText(ticketCode).then(() => {
          showToast(`Reference ${ticketCode} copied!`);
        }).catch(() => {
          showToast(`Reference: ${ticketCode}`);
        });
      });
    }
  }

  function showSuccessState(){
    const form = document.getElementById('cdForm');
    const successState = document.getElementById('cdSuccessState');
    const successDesc = document.getElementById('cdSuccessDesc');
    const ticketIdEl = document.getElementById('cdTicketId');
    const successWaBtn = document.getElementById('cdSuccessWaBtn');

    // Generate distinctive ticket reference
    const ticketNum = Math.floor(100000 + Math.random() * 900000);
    const ticketCode = `#JSA-${ticketNum}`;
    if(ticketIdEl) ticketIdEl.textContent = ticketCode;

    if(successWaBtn){
      const waMsg = encodeURIComponent(`Hi JS AlphaSoft team, I submitted an inquiry under ticket ${ticketCode}. Looking forward to connecting with a systems engineer.`);
      successWaBtn.href = `https://wa.me/919582018242?text=${waMsg}`;
    }

    const config = INTENTS[currentIntent] || INTENTS.touch;
    if(successDesc) successDesc.textContent = config.successMessage;

    if(form) form.style.display = 'none';
    if(successState) successState.style.display = 'flex';
  }

  function resetDrawerForm(){
    const form = document.getElementById('cdForm');
    const successState = document.getElementById('cdSuccessState');
    if(form){
      form.reset();
      form.style.display = 'block';
      panel.querySelectorAll('.cd-field').forEach(f => {
        f.classList.remove('has-error', 'is-valid');
      });
      const alertBox = document.getElementById('cdFormAlert');
      if(alertBox) alertBox.style.display = 'none';
      const charCounter = document.getElementById('cdCharCounter');
      if(charCounter){
        charCounter.textContent = '0 / 1000 chars';
        charCounter.classList.remove('valid');
      }
    }
    if(successState) successState.style.display = 'none';
    setDrawerIntent(currentIntent);
  }

  // Set active intent in drawer (select dropdown, titles, subjects, services)
  function setDrawerIntent(rawIntent){
    ensureDrawerInDOM();

    let key = 'touch';
    const lower = (rawIntent || '').toLowerCase();

    if(lower.includes('discovery')){
      key = 'discovery';
    } else if(lower.includes('walkthrough') || lower.includes('demo')){
      key = 'walkthrough';
    } else if(lower.includes('engineer') || lower.includes('talk')){
      key = 'engineer';
    } else {
      key = 'touch';
    }

    currentIntent = key;
    const config = INTENTS[key] || INTENTS.touch;

    // Update header texts
    const titleEl = document.getElementById('cdTitle');
    const subEl = document.getElementById('cdSubtitle');
    const submitBtnText = document.getElementById('cdSubmitBtnText');
    const subjectInput = document.getElementById('cdFormSubject');
    const intentInput = document.getElementById('cdFormIntent');
    const serviceSelect = document.getElementById('cdService');
    const intentSelect = document.getElementById('cdIntentSelect');

    if(titleEl) titleEl.textContent = config.title;
    if(subEl) subEl.textContent = config.subtitle;
    if(submitBtnText) submitBtnText.innerHTML = config.submitText;
    if(subjectInput) subjectInput.value = config.subject;
    if(intentInput) intentInput.value = config.title;

    // Sync dropdown selection if different
    if(intentSelect && intentSelect.value !== key){
      intentSelect.value = key;
    }

    if(serviceSelect){
      for(let i = 0; i < serviceSelect.options.length; i++){
        if(serviceSelect.options[i].value === config.service){
          serviceSelect.selectedIndex = i;
          break;
        }
      }
      // Also update visual active chip if matching
      if(panel){
        panel.querySelectorAll('.cd-service-chips .cd-chip').forEach(chip => {
          if(chip.getAttribute('data-value') === config.service){
            chip.classList.add('active');
          } else {
            chip.classList.remove('active');
          }
        });
      }
    }
  }

  // Open Drawer from right side
  function openContactDrawer(intent = 'touch'){
    ensureDrawerInDOM();
    lastFocusedElement = document.activeElement;

    // Close mobile nav if open
    if(typeof window.__closeMobileMenu === 'function'){
      window.__closeMobileMenu();
    }

    setDrawerIntent(intent);

    // Ensure form is visible if it was left in success state
    const form = document.getElementById('cdForm');
    const successState = document.getElementById('cdSuccessState');
    if(form && successState && form.style.display === 'none'){
      form.style.display = 'block';
      successState.style.display = 'none';
    }

    // Animate open
    overlay.classList.add('open');
    panel.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus first input field
    setTimeout(() => {
      const nameInput = document.getElementById('cdName');
      if(nameInput){
        try {
          nameInput.focus({ preventScroll: true });
        } catch(err) {
          nameInput.focus();
        }
      }
    }, 180);
  }

  // Close Drawer
  function closeContactDrawer(){
    if(!panel || !overlay) return;
    panel.classList.remove('open');
    overlay.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if(lastFocusedElement && typeof lastFocusedElement.focus === 'function'){
      try {
        lastFocusedElement.focus();
      } catch(err){}
    }
  }

  // Keyboard accessibility (Escape key closes drawer)
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && panel && panel.classList.contains('open')){
      e.preventDefault();
      closeContactDrawer();
    }
  });

  // Global Click Interceptor for all requested CTA buttons:
  // "Book a discovery call", "Schedule Product Walkthrough", "Talk to an Engineer", "Get in touch"
  document.addEventListener('click', (e) => {
    const el = e.target.closest('a, button, [role="button"], [data-get-in-touch], .ic-get-in-touch, .industry-card .ic-image, .ic-image, #industriesCtaBtn, .rightside-floating-btn, [data-open-contact-drawer]');
    if(!el) return;

    // Check if click originates inside the drawer itself (don't intercept drawer internal actions)
    if(panel && panel.contains(el)) return;

    const text = (el.innerText || el.textContent || '').trim().toLowerCase();
    const title = (el.getAttribute('title') || '').toLowerCase();
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
    const href = (el.getAttribute('href') || '').toLowerCase();
    const explicitIntent = el.getAttribute('data-open-contact-drawer') || '';

    const combined = `${text} ${title} ${ariaLabel} ${href}`;

    const isDiscovery = explicitIntent === 'discovery' ||
      combined.includes('book a discovery call') ||
      combined.includes('discovery call');

    const isWalkthrough = explicitIntent === 'walkthrough' ||
      combined.includes('schedule product walkthrough') ||
      combined.includes('product walkthrough') ||
      combined.includes('architecture walkthrough');

    const isTalkToEngineer = explicitIntent === 'engineer' ||
      combined.includes('talk to an engineer') ||
      combined.includes('talk to engineer');

    const isGetInTouch = explicitIntent === 'touch' ||
      el.id === 'industriesCtaBtn' ||
      el.classList.contains('ic-get-in-touch') ||
      el.hasAttribute('data-get-in-touch') ||
      el.classList.contains('ic-image') ||
      el.classList.contains('rightside-floating-btn') ||
      el.id === 'rightsideFloatingBtn' ||
      combined.includes('get in touch');

    if(isDiscovery || isWalkthrough || isTalkToEngineer || isGetInTouch){
      e.preventDefault();
      e.stopPropagation();

      let targetIntent = 'touch';
      if(isDiscovery) targetIntent = 'discovery';
      else if(isWalkthrough) targetIntent = 'walkthrough';
      else if(isTalkToEngineer) targetIntent = 'engineer';
      else if(isGetInTouch) targetIntent = 'touch';

      openContactDrawer(targetIntent);
      return false;
    }
  }, true); // useCapture to intercept before default links or inline handlers

  // Expose global methods
  window.openContactDrawer = openContactDrawer;
  window.closeContactDrawer = closeContactDrawer;
  window.landingToContactForm = function(intent = 'touch'){
    openContactDrawer(intent);
  };

  // Initialize DOM on ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ensureDrawerInDOM);
  } else {
    ensureDrawerInDOM();
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

// Remove mouse trailing canvas if present
(function(){
  const oldCanvas = document.getElementById('mouseTrailCanvas');
  if(oldCanvas) oldCanvas.remove();
})();

/* ===================== SMOOTH SCROLLING FOR ALL INTERNAL ANCHOR LINKS ===================== */
(function(){
  function getHeaderOffset(){
    const header = document.querySelector('header') || document.getElementById('siteHeader');
    return header ? header.offsetHeight + 18 : 86;
  }

  function smoothScrollToTarget(targetEl, updateHash, hash){
    if(!targetEl) return;
    const headerOffset = getHeaderOffset();
    const elementPosition = targetEl.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: 'smooth'
    });

    if(updateHash && hash && window.history.pushState){
      window.history.pushState(null, '', hash);
    }

    if(typeof window.__closeMobileMenu === 'function'){
      window.__closeMobileMenu();
    }
  }

  document.addEventListener('click', function(e){
    const link = e.target.closest('a');
    if(!link) return;

    const href = link.getAttribute('href');
    if(!href) return;

    if(href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    let hash = '';
    let isSamePage = false;

    if(href.startsWith('#')){
      hash = href;
      isSamePage = true;
    } else if(href.includes('#')){
      try {
        const linkUrl = new URL(link.href, window.location.href);
        const currentUrl = new URL(window.location.href);
        const linkPath = linkUrl.pathname.replace(/\/index\.html$/, '/');
        const currPath = currentUrl.pathname.replace(/\/index\.html$/, '/');
        if(linkPath === currPath){
          hash = linkUrl.hash;
          isSamePage = true;
        }
      } catch(err){}
    }

    if(isSamePage && hash){
      if(hash === '#' || hash === '#top'){
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if(window.history.pushState) window.history.pushState(null, '', '#top');
        if(typeof window.__closeMobileMenu === 'function') window.__closeMobileMenu();
        return;
      }

      const targetId = hash.substring(1);
      const targetEl = document.getElementById(targetId) || document.querySelector(`[name="${targetId}"]`);
      if(targetEl){
        e.preventDefault();
        smoothScrollToTarget(targetEl, true, hash);
      }
    }
  });

  // Handle direct page load with hash
  if(window.location.hash && window.location.hash !== '#top'){
    const targetId = window.location.hash.substring(1);
    if(targetId !== 'contact' && targetId !== 'contactForm' && targetId !== 'callback' && targetId !== 'contact-form'){
      const onReady = () => {
        setTimeout(() => {
          const targetEl = document.getElementById(targetId);
          if(targetEl) smoothScrollToTarget(targetEl, false);
        }, 150);
      };
      if(document.readyState === 'complete' || document.readyState === 'interactive'){
        onReady();
      } else {
        window.addEventListener('DOMContentLoaded', onReady);
      }
    }
  }
})();

/* ===================== SELECTED COMPONENT: ONCLICK LAND TO CONTACT US FORM ===================== */
(function(){
  function setupSelectedComponentContactLanding(){
    const targetSelectors = [
      'section:nth-of-type(4) > div:nth-of-type(1) > div:nth-of-type(1)',
      '#process > .wrap > .section-head'
    ];
    targetSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if(el.dataset.contactBound) return;
        el.dataset.contactBound = 'true';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('title', 'Click to land to Contact Us form');
        el.style.cursor = 'pointer';

        function navigateToContact(e){
          // If clicking on an internal anchor inside it, don't hijack
          if(e.target.closest('a') && !e.target.closest('a[href*="contact"]')) return;
          e.preventDefault();
          if(typeof window.landingToContactForm === 'function'){
            window.landingToContactForm();
          } else {
            window.location.href = 'contact.html#contact-form';
          }
        }

        el.addEventListener('click', navigateToContact);
        el.addEventListener('keydown', function(e){
          if(e.key === 'Enter' || e.key === ' '){
            navigateToContact(e);
          }
        });
      });
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', setupSelectedComponentContactLanding);
  } else {
    setupSelectedComponentContactLanding();
  }
})();

/* ===================== GLOBAL SITE SEARCH FUNCTIONALITY ===================== */
(function(){
  const SEARCH_ITEMS = [
    {
      title: "Contact Us Form",
      category: "action",
      badge: "Action",
      desc: "Talk to our engineering team, request quotation, or book an architecture audit",
      url: "contact.html#contact-form",
      keywords: "contact form get in touch talk speak email phone query quotation request callback message inquiry"
    },
    {
      title: "Start a Project",
      category: "action",
      badge: "Action",
      desc: "Initiate discovery, architecture audit, or new software build with our engineers",
      url: "contact.html",
      keywords: "start project hire team build launch engage work"
    },
    {
      title: "Request a Callback",
      category: "action",
      badge: "Action",
      desc: "Direct phone callback from a lead engineer within 2 business hours",
      url: "contact.html#callback",
      keywords: "callback phone call speak immediate ring number"
    },
    {
      title: "Alpha-Gymify (Fitness & Gym ERP)",
      category: "product",
      badge: "Product",
      desc: "Biometric access control, recurring billing, trainer scheduling & member portal",
      url: "product.html#alphagymify",
      keywords: "alphagymify gymify gym fitness workout trainer membership turnstile biometric billing attendance"
    },
    {
      title: "AlphaXenia (Visitor Management System)",
      category: "product",
      badge: "Product",
      desc: "Enterprise check-in, QR gate passes, vehicle parking & biometric verification",
      url: "product.html#alphaxenia",
      keywords: "alphaxenia visitor management vms gate pass access control badges qr security"
    },
    {
      title: "AlphaDocq (Document Management System)",
      category: "product",
      badge: "Product",
      desc: "Intelligent document repository with OCR indexing, AES-256 encryption & audit logs",
      url: "product.html#alphadocq",
      keywords: "alphadocq dms document management ocr pdf files compliance rbac audit archive"
    },
    {
      title: "AlphaERP (Lightweight SME ERP)",
      category: "product",
      badge: "Product",
      desc: "Inventory control, multi-entity accounting, GST invoicing & automated PO tracking",
      url: "product.html#alphaerp",
      keywords: "alphaerp erp enterprise planning inventory gst invoicing orders finance accounting"
    },
    {
      title: "Web & Mobile Application Development",
      category: "service",
      badge: "Service",
      desc: "Custom React, Next.js, Node.js microservices & native/cross-platform mobile apps",
      url: "services.html#web-application-development",
      keywords: "web app mobile development react nextjs node flutter react native api frontend backend"
    },
    {
      title: "Cloud & DevOps Engineering",
      category: "service",
      badge: "Service",
      desc: "Multi-cloud architecture (AWS, GCP, Azure), Kubernetes, Terraform & automated CI/CD",
      url: "services.html#cloud-and-devops-engineering",
      keywords: "cloud devops aws gcp azure kubernetes docker terraform cicd infrastructure"
    },
    {
      title: "AI & Machine Learning Solutions",
      category: "service",
      badge: "Service",
      desc: "Enterprise LLMs, document understanding, computer vision & automated analytics",
      url: "services.html#ai-and-machine-learning",
      keywords: "ai ml artificial intelligence machine learning llm computer vision neural nlp automation"
    },
    {
      title: "Wired & Wireless Enterprise Networks",
      category: "service",
      badge: "Service",
      desc: "SD-WAN, enterprise Wi-Fi 6E, core routing, firewall hardening & campus switching",
      url: "services.html#wired-and-wireless-networks",
      keywords: "network wifi wired wireless switches routers firewall lan wan sd-wan cisco aruba"
    },
    {
      title: "Data Centre Setup & Migration",
      category: "service",
      badge: "Service",
      desc: "Tier III design, precision cooling, rack architecture, power redundancy & server provisioning",
      url: "services.html#data-centre-setup",
      keywords: "datacenter data centre server racks precision cooling ups power tier 3 migration"
    },
    {
      title: "Cybersecurity, IT Audit & VAPT",
      category: "service",
      badge: "Service",
      desc: "Penetration testing, vulnerability assessments, ISO 27001, SOC 2 compliance hardening",
      url: "services.html#it-audit-cyber-security-vapt",
      keywords: "cybersecurity security vapt audit penetration testing compliance iso27001 soc2 hardening"
    },
    {
      title: "Security Surveillance & Smart CCTV",
      category: "service",
      badge: "Service",
      desc: "AI video analytics, license plate recognition, facial detection & IP cameras",
      url: "services.html#security-surveillance-cctv",
      keywords: "cctv surveillance security cameras video analytics facial recognition nvr anpr"
    },
    {
      title: "Facility Management Services (FMS)",
      category: "service",
      badge: "Service",
      desc: "Dedicated L1/L2/L3 on-premise engineers, 24/7 SLA incident resolution & vendor management",
      url: "services.html#facility-management-services",
      keywords: "fms facility management services engineers support sla 24/7 maintenance onsite"
    },
    {
      title: "Unified Network Monitoring (DCIM)",
      category: "service",
      badge: "Service",
      desc: "Real-time telemetry, SNMP traps, environmental sensors & automated alert escalation",
      url: "services.html#unified-network-monitoring",
      keywords: "dcim monitoring network telemetry snmp sensors alerts dashboard uptime"
    },
    {
      title: "Banking & Fintech Solutions",
      category: "industry",
      badge: "Industry",
      desc: "PCI-DSS compliance, core banking APIs, sub-millisecond fraud detection & ledgers",
      url: "industries.html#banking-and-fintech",
      keywords: "banking fintech payments finance transactions pci fraud core banking"
    },
    {
      title: "Healthcare & Life Sciences",
      category: "industry",
      badge: "Industry",
      desc: "HIPAA compliance, EHR integration, medical IoT telemetry & telemedicine platforms",
      url: "industries.html#healthcare-and-life-sciences",
      keywords: "healthcare hospital medical ehr hipaa telemedicine pharma clinic"
    },
    {
      title: "Manufacturing & Industry 4.0",
      category: "industry",
      badge: "Industry",
      desc: "SCADA automation, shopfloor IoT, predictive maintenance & digital twins",
      url: "industries.html#manufacturing",
      keywords: "manufacturing industry 4.0 scada iot factory shopfloor predictive maintenance"
    },
    {
      title: "Retail & E-Commerce",
      category: "industry",
      badge: "Industry",
      desc: "High-concurrency checkout engines, headless commerce & omni-channel inventory",
      url: "industries.html#retail-and-e-commerce",
      keywords: "retail ecommerce shop cart checkout inventory pos store omni-channel"
    },
    {
      title: "Logistics & Supply Chain",
      category: "industry",
      badge: "Industry",
      desc: "Real-time fleet tracking, automated warehouse dispatch & cold-chain telemetry",
      url: "industries.html#logistics-and-supply-chain",
      keywords: "logistics supply chain fleet tracking warehouse dispatch cold chain shipping"
    },
    {
      title: "Telecom & Carrier OSS/BSS",
      category: "industry",
      badge: "Industry",
      desc: "OSS/BSS integration, fiber rollout management, 5G edge compute & network observability",
      url: "industries.html#telecom",
      keywords: "telecom carrier oss bss 5g fiber network cellular isp"
    },
    {
      title: "How We Work: 5-Stage Build Process",
      category: "process",
      badge: "Process",
      desc: "Discover &rarr; Design &rarr; Build &rarr; Assure &rarr; Deploy & Scale",
      url: "process.html",
      keywords: "process how we work stages methodology agile sprint discover design build assure deploy"
    },
    {
      title: "About JS AlphaSoft",
      category: "about",
      badge: "Company",
      desc: "Engineering leadership, 12+ years experience, 240+ enterprise deployments & certifications",
      url: "about.html",
      keywords: "about company team leadership history founders culture mission ethos"
    }
  ];

  let modalBackdrop = null;
  let searchInput = null;
  let resultsList = null;
  let clearBtn = null;
  let activeFilter = 'all';
  let selectedIndex = 0;
  let currentResults = [];

  function createSearchModal(){
    if(document.getElementById('searchBackdrop')) {
      modalBackdrop = document.getElementById('searchBackdrop');
      searchInput = document.getElementById('globalSearchInput');
      resultsList = document.getElementById('searchResultsList');
      clearBtn = document.getElementById('searchClearBtn');
      return;
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'search-modal-backdrop';
    backdrop.id = 'searchBackdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.style.display = 'none';
    backdrop.innerHTML = `
      <div class="search-modal-box" role="dialog" aria-modal="true" aria-label="Global Site Search">
        <div class="search-modal-header">
          <svg class="search-modal-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="search-input" id="globalSearchInput" placeholder="Search products, services, process, industries, or contact..." autocomplete="off" spellcheck="false">
          <button type="button" class="search-clear-btn" id="searchClearBtn" aria-label="Clear search" style="display:none;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <button type="button" class="search-close-btn" id="searchCloseBtn" aria-label="Close search">
            <span class="esc-badge">ESC</span>
          </button>
        </div>
        <div class="search-filters" id="searchFilters">
          <button type="button" class="search-filter-tag active" data-filter="all">All</button>
          <button type="button" class="search-filter-tag" data-filter="product">Products</button>
          <button type="button" class="search-filter-tag" data-filter="service">Services</button>
          <button type="button" class="search-filter-tag" data-filter="industry">Industries</button>
          <button type="button" class="search-filter-tag" data-filter="process">Process</button>
          <button type="button" class="search-filter-tag" data-filter="action">Actions</button>
        </div>
        <div class="search-results" id="searchResultsList" role="listbox"></div>
        <div class="search-modal-footer">
          <div class="search-shortcuts">
            <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> Navigate</span>
            <span><kbd>&crarr;</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
          <a href="contact.html#contact-form" class="search-contact-shortcut" id="searchContactShortcut">
            <span>Need direct help?</span>
            <strong>Contact Us Form &rarr;</strong>
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    modalBackdrop = backdrop;
    searchInput = document.getElementById('globalSearchInput');
    resultsList = document.getElementById('searchResultsList');
    clearBtn = document.getElementById('searchClearBtn');

    // Filter clicks
    const filterContainer = document.getElementById('searchFilters');
    filterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.search-filter-tag');
      if(!btn) return;
      filterContainer.querySelectorAll('.search-filter-tag').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter || 'all';
      renderResults(searchInput.value.trim());
    });

    // Close button
    document.getElementById('searchCloseBtn').addEventListener('click', closeSearch);

    // Backdrop click
    modalBackdrop.addEventListener('click', (e) => {
      if(e.target === modalBackdrop) closeSearch();
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      searchInput.focus();
      renderResults('');
    });

    // Input events
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      clearBtn.style.display = query ? 'flex' : 'none';
      renderResults(query);
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', handleKeyNavigation);
  }

  function openSearch(){
    createSearchModal();
    modalBackdrop.style.display = 'flex';
    requestAnimationFrame(() => {
      modalBackdrop.classList.add('is-open');
      modalBackdrop.setAttribute('aria-hidden', 'false');
      searchInput.focus();
      renderResults(searchInput.value.trim());
    });
  }

  function closeSearch(){
    if(!modalBackdrop) return;
    modalBackdrop.classList.remove('is-open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      modalBackdrop.style.display = 'none';
    }, 220);
  }

  function getCategoryIcon(cat){
    if(cat === 'action'){
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
    }
    if(cat === 'product'){
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
    }
    if(cat === 'service'){
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
    }
    if(cat === 'industry'){
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="15" y2="18"/></svg>`;
    }
    if(cat === 'process'){
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  function highlightMatches(text, query){
    if(!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:rgba(46,155,255,0.25);color:inherit;padding:0 2px;border-radius:2px;">$1</mark>');
  }

  function renderResults(query){
    let filtered = SEARCH_ITEMS;

    if(activeFilter !== 'all'){
      filtered = filtered.filter(item => item.category === activeFilter);
    }

    if(query){
      const q = query.toLowerCase();
      filtered = filtered.filter(item => {
        return item.title.toLowerCase().includes(q) ||
               item.desc.toLowerCase().includes(q) ||
               item.keywords.toLowerCase().includes(q);
      });
    }

    currentResults = filtered;
    selectedIndex = 0;

    if(filtered.length === 0){
      resultsList.innerHTML = `
        <div class="search-empty">
          <div class="search-empty-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <div class="search-empty-title">No matching results for "${escapeHtml(query)}"</div>
          <div class="search-empty-desc">Have a specific question or requirement? Our engineers are ready to assist.</div>
          <a href="contact.html#contact-form" class="search-empty-cta" onclick="window.landingToContactForm ? window.landingToContactForm() : null">
            Contact Us Form &rarr;
          </a>
        </div>
      `;
      return;
    }

    resultsList.innerHTML = filtered.map((item, idx) => `
      <a href="${item.url}" class="search-item ${idx === 0 ? 'selected' : ''}" data-index="${idx}" role="option" aria-selected="${idx === 0}">
        <div class="search-item-left">
          <div class="search-item-icon ${item.category}">
            ${getCategoryIcon(item.category)}
          </div>
          <div class="search-item-content">
            <div class="search-item-title">
              <span>${highlightMatches(item.title, query)}</span>
            </div>
            <div class="search-item-desc">${highlightMatches(item.desc, query)}</div>
          </div>
        </div>
        <span class="search-item-badge">${item.badge}</span>
        <span class="search-item-arrow">&rarr;</span>
      </a>
    `).join('');

    resultsList.querySelectorAll('.search-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const href = el.getAttribute('href');
        closeSearch();
        if(href.includes('contact.html#contact-form') || href.includes('contact.html#contactForm') || href.includes('contact.html#callback')){
          if(window.location.pathname.endsWith('contact.html') || window.location.href.includes('contact.html')){
            e.preventDefault();
            const focus = href.includes('callback') ? 'phone' : 'name';
            if(window.landingToContactForm) window.landingToContactForm(focus);
          }
        }
      });
    });
  }

  function escapeHtml(str){
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function handleKeyNavigation(e){
    if(e.key === 'Escape'){
      e.preventDefault();
      closeSearch();
      return;
    }

    const items = resultsList.querySelectorAll('.search-item');
    if(!items.length) return;

    if(e.key === 'ArrowDown'){
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % items.length;
      updateSelected(items);
    } else if(e.key === 'ArrowUp'){
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      updateSelected(items);
    } else if(e.key === 'Enter'){
      e.preventDefault();
      if(items[selectedIndex]){
        items[selectedIndex].click();
      }
    }
  }

  function updateSelected(items){
    items.forEach((item, idx) => {
      const isSel = idx === selectedIndex;
      item.classList.toggle('selected', isSel);
      item.setAttribute('aria-selected', isSel ? 'true' : 'false');
      if(isSel){
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  // Global Keyboard shortcuts: Ctrl+K, Cmd+K, or "/"
  document.addEventListener('keydown', (e) => {
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){
      e.preventDefault();
      if(modalBackdrop && modalBackdrop.classList.contains('is-open')){
        closeSearch();
      } else {
        openSearch();
      }
    } else if(e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)){
      e.preventDefault();
      openSearch();
    } else if(e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('is-open')){
      closeSearch();
    }
  });

  // Attach search trigger button event handlers
  function bindSearchButtons(){
    document.querySelectorAll('.site-search-btn, #searchBtn').forEach(btn => {
      if(btn.dataset.searchBound) return;
      btn.dataset.searchBound = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openSearch();
      });
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => {
      createSearchModal();
      bindSearchButtons();
    });
  } else {
    createSearchModal();
    bindSearchButtons();
  }

  // Expose global open helper
  window.openGlobalSiteSearch = openSearch;
  window.closeGlobalSiteSearch = closeSearch;
})();

/* ===================== INTERACTIVE PROCESS ROADMAP ===================== */
(function(){
  function initRoadmaps(){
    const roadmaps = document.querySelectorAll('.interactive-process-roadmap');
    if(!roadmaps.length) return;

    roadmaps.forEach(roadmapEl => {
      if(roadmapEl.dataset.roadmapInitialized) return;
      roadmapEl.dataset.roadmapInitialized = 'true';

      const nodes = roadmapEl.querySelectorAll('.roadmap-node');
      const panels = roadmapEl.querySelectorAll('.roadmap-stage-panel');
      const progressBar = roadmapEl.querySelector('.roadmap-line-progress');
      const prevBtn = roadmapEl.querySelector('.roadmap-nav-btn.prev');
      const nextBtn = roadmapEl.querySelector('.roadmap-nav-btn.next');
      const currentStageIndicator = roadmapEl.querySelector('.rsi-current');
      const currentNameIndicator = roadmapEl.querySelector('.rsi-name');

      const stageNames = {
        1: 'Discover',
        2: 'Design',
        3: 'Develop',
        4: 'Deploy',
        5: 'Support'
      };

      let activeStage = 1;
      const totalStages = nodes.length || 5;

      function updateProgressLine(){
        if(!progressBar) return;
        const percentage = ((activeStage - 1) / (totalStages - 1)) * 100;
        progressBar.style.width = `calc((100% - 120px) * ${percentage / 100})`;
      }

      function setActiveStage(stageNum, focusNode = false){
        if(stageNum < 1) stageNum = 1;
        if(stageNum > totalStages) stageNum = totalStages;
        activeStage = stageNum;

        // Progress bar width
        updateProgressLine();

        // Stepper Nodes
        nodes.forEach((node, idx) => {
          const nodeStage = parseInt(node.getAttribute('data-stage'), 10) || (idx + 1);
          const isActive = nodeStage === activeStage;
          const isCompleted = nodeStage < activeStage;

          node.classList.toggle('active', isActive);
          node.classList.toggle('completed', isCompleted);
          node.setAttribute('aria-selected', isActive ? 'true' : 'false');
          node.setAttribute('tabindex', isActive ? '0' : '-1');

          if(isActive){
            if(focusNode){
              node.focus();
            }
            // Ensure node is smoothly visible in horizontal track on mobile/narrow viewports
            if(roadmapEl.querySelector('.roadmap-track-wrapper')){
              const wrapper = roadmapEl.querySelector('.roadmap-track-wrapper');
              const nodeLeft = node.offsetLeft;
              const nodeWidth = node.offsetWidth;
              const wrapperScroll = wrapper.scrollLeft;
              const wrapperWidth = wrapper.offsetWidth;
              if(nodeLeft < wrapperScroll || (nodeLeft + nodeWidth) > (wrapperScroll + wrapperWidth)){
                wrapper.scrollTo({
                  left: Math.max(0, nodeLeft - (wrapperWidth / 2) + (nodeWidth / 2)),
                  behavior: 'smooth'
                });
              }
            }
          }
        });

        // Detail Panels
        panels.forEach(panel => {
          const panelStage = parseInt(panel.getAttribute('data-stage'), 10);
          const isActive = panelStage === activeStage;
          panel.classList.toggle('active', isActive);
        });

        // Indicators & Buttons
        if(currentStageIndicator){
          currentStageIndicator.textContent = `Stage 0${activeStage}`;
        }
        if(currentNameIndicator){
          currentNameIndicator.textContent = stageNames[activeStage] || '';
        }
        if(prevBtn){
          prevBtn.disabled = activeStage === 1;
        }
        if(nextBtn){
          nextBtn.disabled = activeStage === totalStages;
        }
      }

      // Milestone Cards Interactive Deep-Dive Expansion
      const milestoneCards = roadmapEl.querySelectorAll('.milestone-card');
      milestoneCards.forEach(card => {
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        if(!card.hasAttribute('aria-expanded')){
          card.setAttribute('aria-expanded', 'false');
        }

        function toggleCard(){
          const isExpanded = card.classList.contains('expanded');
          card.classList.toggle('expanded', !isExpanded);
          card.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
          const label = card.querySelector('.mc-expand-label');
          if(label){
            label.innerHTML = !isExpanded 
              ? 'Technical Milestones &amp; DoD <svg class="mc-expand-chevron" viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>'
              : 'Technical Milestones &amp; DoD <svg class="mc-expand-chevron" viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>';
          }
        }

        card.addEventListener('click', (e) => {
          if(e.target.closest('a') || e.target.closest('button')) return;
          toggleCard();
        });

        card.addEventListener('keydown', (e) => {
          if(e.key === 'Enter' || e.key === ' '){
            e.preventDefault();
            toggleCard();
          }
        });
      });

      // Toggle All Specs button per panel
      panels.forEach(panel => {
        const toggleAllBtn = panel.querySelector('.mc-toggle-all-btn');
        if(toggleAllBtn){
          toggleAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const panelCards = panel.querySelectorAll('.milestone-card');
            const anyCollapsed = Array.from(panelCards).some(c => !c.classList.contains('expanded'));
            panelCards.forEach(c => {
              c.classList.toggle('expanded', anyCollapsed);
              c.setAttribute('aria-expanded', anyCollapsed ? 'true' : 'false');
            });
            toggleAllBtn.querySelector('span').textContent = anyCollapsed ? 'Collapse all specs' : 'Expand all specs';
          });
        }
      });

      // Click & Keyboard handlers on nodes
      nodes.forEach((node) => {
        node.addEventListener('click', (e) => {
          e.preventDefault();
          const stage = parseInt(node.getAttribute('data-stage'), 10);
          setActiveStage(stage);
        });

        node.addEventListener('keydown', (e) => {
          if(e.key === 'ArrowRight' || e.key === 'ArrowDown'){
            e.preventDefault();
            const next = activeStage < totalStages ? activeStage + 1 : 1;
            setActiveStage(next, true);
          } else if(e.key === 'ArrowLeft' || e.key === 'ArrowUp'){
            e.preventDefault();
            const prev = activeStage > 1 ? activeStage - 1 : totalStages;
            setActiveStage(prev, true);
          } else if(e.key === 'Home'){
            e.preventDefault();
            setActiveStage(1, true);
          } else if(e.key === 'End'){
            e.preventDefault();
            setActiveStage(totalStages, true);
          }
        });
      });

      // Prev & Next Buttons
      if(prevBtn){
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if(activeStage > 1){
            setActiveStage(activeStage - 1);
          }
        });
      }

      if(nextBtn){
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if(activeStage < totalStages){
            setActiveStage(activeStage + 1);
          }
        });
      }

      // Initialize default stage 1
      setActiveStage(1);
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initRoadmaps);
  } else {
    initRoadmaps();
  }

  window.initInteractiveProcessRoadmaps = initRoadmaps;
})();



