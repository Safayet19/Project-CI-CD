/* Safayet navigation: accessible mobile menu and no theme switching. */
(() => {
  'use strict';

  const button = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('primary-navigation');
  const mobileBreakpoint = window.matchMedia('(max-width: 1180px)');

  function closeMenu(focusButton = false) {
    if (!button || !navigation) return;
    navigation.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation menu');
    document.body.classList.remove('navigation-open');
    if (focusButton) button.focus();
  }

  if (button && navigation) {
    button.addEventListener('click', () => {
      const opened = !navigation.classList.contains('is-open');
      navigation.classList.toggle('is-open', opened);
      button.setAttribute('aria-expanded', String(opened));
      button.setAttribute('aria-label', opened ? 'Close navigation menu' : 'Open navigation menu');
      document.body.classList.toggle('navigation-open', opened && mobileBreakpoint.matches);
      if (opened) navigation.querySelector('a')?.focus();
    });

    navigation.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeMenu());
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
        closeMenu(true);
      }
      if (event.key !== 'Tab' || !navigation.classList.contains('is-open')) return;
      const focusables = [...navigation.querySelectorAll('a[href]')];
      if (!focusables.length) return;
      if (event.shiftKey && document.activeElement === focusables[0]) {
        event.preventDefault();
        focusables[focusables.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusables[focusables.length - 1]) {
        event.preventDefault();
        focusables[0].focus();
      }
    });

    document.addEventListener('click', event => {
      if (!button.contains(event.target) && !navigation.contains(event.target)) closeMenu();
    });

    mobileBreakpoint.addEventListener('change', () => closeMenu());
  }

  // Supports the original standalone tutorial search where present.
  const search = document.querySelector('[data-filter-input]');
  if (!search) return;
  const container = document.getElementById(search.dataset.filterInput);
  const cards = container ? [...container.querySelectorAll('[data-search]')] : [];
  const empty = document.getElementById('search-empty');
  const apply = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const show = (card.dataset.search || '').toLowerCase().includes(query);
      card.hidden = !show;
      if (show) visible++;
    });
    if (empty) empty.hidden = visible > 0;
  };
  search.addEventListener('input', apply);
})();

/* Structured catalog filtering, documentation code copying, evidence lightbox. */
(() => {
  'use strict';
  document.querySelectorAll('[data-filter-root]').forEach(toolbar => {
    const list = document.getElementById(toolbar.dataset.filterRoot);
    if (!list) return;
    const cards = [...list.querySelectorAll('[data-category][data-search]')];
    const search = toolbar.querySelector('[data-course-search]');
    const chips = [...toolbar.querySelectorAll('[data-category]')];
    const empty = document.getElementById(list.id === 'pj-grid' ? 'project-empty' : 'course-empty');
    let category = 'all';
    const refresh = () => {
      const query = (search?.value || '').trim().toLocaleLowerCase();
      let count = 0;
      cards.forEach(card => {
        const match = (category === 'all' || card.dataset.category === category) &&
          (!query || (card.dataset.search || '').toLocaleLowerCase().includes(query));
        card.hidden = !match;
        if (match) count++;
      });
      if (empty) empty.hidden = count > 0;
    };
    chips.forEach(chip => chip.addEventListener('click', () => {
      category = chip.dataset.category;
      chips.forEach(c => { const active = c === chip; c.classList.toggle('is-active', active); c.setAttribute('aria-pressed', String(active)); });
      refresh();
    }));
    search?.addEventListener('input', refresh);
    empty?.querySelector('[data-reset-filters]')?.addEventListener('click', () => {
      if (search) search.value = '';
      chips.find(chip => chip.dataset.category === 'all')?.click();
      search?.focus();
    });
    refresh();
  });

  document.querySelectorAll('.lp-copy').forEach(button => {
    button.addEventListener('click', async () => {
      const text = button.closest('.lp-code-panel')?.querySelector('code')?.textContent || '';
      if (!text) return;
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
        else {
          const source = document.createElement('textarea');
          source.value = text; source.style.position = 'fixed'; source.style.left = '-9999px';
          document.body.append(source); source.select();
          if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
          source.remove();
        }
        button.textContent = 'Copied';
        setTimeout(() => { button.textContent = 'Copy'; }, 1700);
      } catch (_) { button.textContent = 'Select to copy'; }
    });
  });

  const dialog = document.querySelector('.lp-lightbox');
  if (dialog && typeof dialog.showModal === 'function') {
    const image = dialog.querySelector('img');
    const caption = dialog.querySelector('p');
    document.querySelectorAll('.lp-evidence-trigger[data-full]').forEach(trigger => {
      trigger.addEventListener('click', () => {
        image.src = trigger.dataset.full;
        image.alt = trigger.getAttribute('aria-label') || 'Expanded evidence';
        caption.textContent = trigger.dataset.caption || '';
        dialog.showModal();
      });
    });
    dialog.querySelector('.lp-lightbox-close')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  }

  const mobileNavigation = document.querySelector('[data-mobile-collapsible]');
  if (mobileNavigation) {
    const media = matchMedia('(max-width: 760px)');
    const update = () => { if (media.matches) mobileNavigation.open = false; else mobileNavigation.open = true; };
    update();
    media.addEventListener('change', update);
  }
})();
