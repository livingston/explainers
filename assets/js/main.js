/* ============================================
   Explainers — Main JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Scroll-driven: Reading Progress + Back to Top (single listener) ---
  const progressBar = document.getElementById('readingProgress');
  const backToTop = document.getElementById('backToTop');
  if (progressBar || backToTop) {
    let cachedDocHeight = document.documentElement.scrollHeight - window.innerHeight;
    window.addEventListener('resize', () => {
      cachedDocHeight = document.documentElement.scrollHeight - window.innerHeight;
    }, { passive: true });
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (progressBar) {
        const pct = cachedDocHeight > 0 ? scrollY / cachedDocHeight : 0;
        progressBar.style.transform = 'scaleX(' + Math.min(pct, 1) + ')';
      }
      if (backToTop) {
        backToTop.classList.toggle('visible', scrollY > 600);
      }
    }, { passive: true });
    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // --- Tabs (with keyboard arrow navigation) ---
  document.querySelectorAll('.tabs').forEach(tabGroup => {
    const buttons = Array.from(tabGroup.querySelectorAll('.tab-btn'));

    function activateTab(btn) {
      buttons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); b.setAttribute('tabindex', '-1'); });
      tabGroup.parentElement.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      btn.setAttribute('tabindex', '0');
      btn.focus();
      const panel = document.getElementById(btn.dataset.tab);
      if (panel) panel.classList.add('active');
    }

    buttons.forEach((btn, i) => {
      btn.setAttribute('tabindex', btn.classList.contains('active') ? '0' : '-1');
      btn.addEventListener('click', () => activateTab(btn));
      btn.addEventListener('keydown', e => {
        let target;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          target = buttons[(i + 1) % buttons.length];
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          target = buttons[(i - 1 + buttons.length) % buttons.length];
        } else if (e.key === 'Home') {
          target = buttons[0];
        } else if (e.key === 'End') {
          target = buttons[buttons.length - 1];
        }
        if (target) {
          e.preventDefault();
          activateTab(target);
        }
      });
    });
  });

  // --- Smooth scroll for anchor links (with focus management) ---
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Move focus to target for keyboard users
        if (!target.getAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: true });
        history.pushState(null, '', id);
      }
    });
  });

  // --- Scroll-triggered reveals ---
  const revealEls = document.querySelectorAll('.reveal, .stagger-in');
  if (revealEls.length > 0 && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  }
});
