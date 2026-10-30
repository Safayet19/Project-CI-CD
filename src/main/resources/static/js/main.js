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

/* Shared frontend-only Safayet Bot widget. */
(() => {
  'use strict';

  if (document.querySelector('[data-safayet-bot]')) return;

  const widget = document.createElement('aside');
  widget.className = 'safayet-bot';
  widget.dataset.safayetBot = '';
  widget.setAttribute('aria-label', 'Safayet Bot website guide');
  widget.innerHTML = `
    <section class="safayet-bot-panel" id="safayet-bot-panel" role="dialog" aria-modal="true"
             aria-labelledby="safayet-bot-title" hidden>
      <div class="safayet-bot-shell">
        <header class="safayet-bot-header">
          <div class="safayet-bot-avatar" aria-hidden="true">
            <img src="/images/safayet-bot.png" alt="">
          </div>
          <div class="safayet-bot-heading">
            <h2 id="safayet-bot-title">Safayet Bot</h2>
            <p>Your website guide</p>
          </div>
          <button class="safayet-bot-close" type="button" aria-label="Close Safayet Bot chat">&times;</button>
        </header>

        <div class="safayet-bot-conversation">
          <div class="safayet-bot-conversation-inner">
            <section class="safayet-bot-welcome" aria-labelledby="safayet-bot-welcome-title">
              <div class="safayet-bot-welcome-avatar safayet-bot-avatar" aria-hidden="true">
                <img src="/images/safayet-bot.png" alt="">
              </div>
              <p class="safayet-bot-welcome-greeting">Hey there! 👋</p>
              <h2 id="safayet-bot-welcome-title">I'm Safayet Bot</h2>
              <p class="safayet-bot-welcome-description">
                I can help you explore Safayet's projects, research, and practical learning resources.
              </p>
              <div class="safayet-bot-suggestions" aria-label="Suggested questions">
                <p>What would you like to explore?</p>
                <div class="safayet-bot-suggestion-grid">
                  <button type="button" class="safayet-bot-suggestion-card" data-bot-topic="projects">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M8 9h8M8 13h5"></path></svg>
                    <span class="safayet-bot-suggestion-title">Projects</span>
                    <span class="safayet-bot-suggestion-subtitle">What has Safayet built?</span>
                  </button>
                  <button type="button" class="safayet-bot-suggestion-card" data-bot-topic="learning">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z"></path><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M8 7h8"></path></svg>
                    <span class="safayet-bot-suggestion-title">Learning Hub</span>
                    <span class="safayet-bot-suggestion-subtitle">Explore practical tutorials</span>
                  </button>
                  <button type="button" class="safayet-bot-suggestion-card" data-bot-topic="research">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"></path><path d="M14 3.5V8h4M8 12h8M8 16h8"></path></svg>
                    <span class="safayet-bot-suggestion-title">Research</span>
                    <span class="safayet-bot-suggestion-subtitle">Discover research papers</span>
                  </button>
                  <button type="button" class="safayet-bot-suggestion-card" data-bot-topic="about">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 20a7 7 0 0 1 14 0M19 5v4M17 7h4"></path></svg>
                    <span class="safayet-bot-suggestion-title">About Safayet</span>
                    <span class="safayet-bot-suggestion-subtitle">Skills and experience</span>
                  </button>
                </div>
              </div>
            </section>

            <div class="safayet-bot-messages" role="log" aria-live="polite" aria-relevant="additions" hidden></div>
          </div>
        </div>

        <form class="safayet-bot-form">
          <label class="safayet-bot-visually-hidden" for="safayet-bot-input">Message Safayet Bot</label>
          <input id="safayet-bot-input" name="message" type="text" autocomplete="off"
                 placeholder="Ask about this website&hellip;" maxlength="500">
          <button type="submit">Send</button>
        </form>
      </div>
    </section>

    <div class="safayet-bot-launcher">
      <button class="safayet-bot-label" type="button" aria-controls="safayet-bot-panel"
              aria-expanded="false">Chat with Safayet Bot</button>
      <button class="safayet-bot-toggle" type="button" aria-controls="safayet-bot-panel"
              aria-expanded="false" aria-label="Open Safayet Bot chat">
        <img src="/images/safayet-bot.png" alt="">
      </button>
    </div>
  `;
  document.body.append(widget);

  const panel = widget.querySelector('.safayet-bot-panel');
  const toggle = widget.querySelector('.safayet-bot-toggle');
  const label = widget.querySelector('.safayet-bot-label');
  const close = widget.querySelector('.safayet-bot-close');
  const form = widget.querySelector('.safayet-bot-form');
  const conversation = widget.querySelector('.safayet-bot-conversation');
  const input = widget.querySelector('#safayet-bot-input');
  const welcome = widget.querySelector('.safayet-bot-welcome');
  const messages = widget.querySelector('.safayet-bot-messages');
  const sendButton = form.querySelector('button[type="submit"]');
  const topicButtons = [...widget.querySelectorAll('[data-bot-topic]')];
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'safayet-bot-message is-bot';
  typingIndicator.setAttribute('role', 'status');
  typingIndicator.setAttribute('aria-live', 'polite');
  const typingText = document.createElement('p');
  typingText.textContent = 'Safayet Bot is typing...';
  typingIndicator.append(typingText);
  const conversationHistory = [];
  const pageSnapshotCache = new Map();
  let verifiedLinkLabels = new Map();
  let verifiedLinkUrls = new Set();
  const maxSitePages = 7;
  const maxSiteContentLength = 14000;
  const knowledgeHubPaths = [
    '/', '/about', '/academic-journey', '/projects', '/research', '/learning',
    '/training-certifications'
  ];
  const searchStopWords = new Set([
    'about', 'and', 'are', 'does', 'for', 'from', 'have', 'him', 'his', 'how', 'is', 'me',
    'more', 'safayet', 'tell', 'that', 'the', 'this', 'ullah', 'what', 'which', 'who', 'with'
  ]);
  let isWaiting = false;
  let previousScrollPosition = 0;

  const topicReplies = {
    projects: {
      question: 'What has Safayet built?'
    },
    learning: {
      question: 'What practical tutorials are available in the Learning Hub?'
    },
    research: {
      question: 'Discover research papers by Safayet Ullah.'
    },
    about: {
      question: 'What skills and experience does Safayet share on his About page?'
    }
  };

  function setOpen(open) {
    if (open === !panel.hidden) return;

    if (open) {
      previousScrollPosition = window.scrollY;
      document.body.style.setProperty('--safayet-bot-scroll-top', `${-previousScrollPosition}px`);
    } else {
      document.body.style.removeProperty('--safayet-bot-scroll-top');
    }
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    label.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close Safayet Bot chat' : 'Open Safayet Bot chat');
    widget.classList.toggle('is-open', open);
    document.body.classList.toggle('safayet-bot-open', open);

    if (open) {
      updateChatViewport();
      input.focus();
      return;
    }

    const scrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, previousScrollPosition);
    toggle.focus();
    requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = scrollBehavior;
    });
  }

  function updateChatViewport() {
    if (panel.hidden || window.innerWidth > 560) return;

    const viewport = window.visualViewport;
    widget.style.setProperty('--safayet-bot-viewport-top', `${viewport ? viewport.offsetTop : 0}px`);
    widget.style.setProperty(
      '--safayet-bot-viewport-height',
      `${viewport ? viewport.height : window.innerHeight}px`
    );
    requestAnimationFrame(() => {
      if (!panel.hidden) conversation.scrollTop = conversation.scrollHeight;
    });
  }

  window.addEventListener('resize', updateChatViewport);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateChatViewport);
    window.visualViewport.addEventListener('scroll', updateChatViewport);
  }

  function addMessage(text, sender, link, linkText) {
    const message = document.createElement('div');
    message.className = `safayet-bot-message is-${sender}`;

    if (sender === 'bot') {
      renderBotMarkdown(message, text);
    } else {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      message.append(paragraph);
    }

    if (link && linkText) {
      const anchor = document.createElement('a');
      anchor.href = link;
      anchor.textContent = linkText;
      message.append(anchor);
    }

    messages.append(message);
    conversation.scrollTop = conversation.scrollHeight;
  }

  function pageText(documentToRead) {
    const main = documentToRead.querySelector('main') || documentToRead.body;
    if (!main) return '';
    const content = main.cloneNode(true);
    content.querySelectorAll('script, style, nav, footer, header, form, button, [hidden], [aria-hidden="true"]')
      .forEach(element => element.remove());
    const output = [];
    const walker = documentToRead.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (text) output.push(text);
    }
    return output.join(' ').replace(/\s+/g, ' ').trim().slice(0, maxSiteContentLength);
  }

  function pageLinks(documentToRead, sourcePath) {
    const discovered = [];
    documentToRead.querySelectorAll('a[href]').forEach(anchor => {
      try {
        const url = new URL(anchor.getAttribute('href'), new URL(sourcePath, window.location.origin));
        const label = (anchor.textContent || anchor.getAttribute('title')
          || anchor.getAttribute('aria-label') || url.pathname).trim().slice(0, 200);
        if (url.origin === window.location.origin && /^\/(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]*$/.test(url.pathname)) {
          discovered.push({ label: label || url.pathname, url: url.pathname });
        } else if (url.origin === 'https://doi.org'
            && /^\/10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(url.pathname)) {
          discovered.push({ label: label || 'DOI', url: url.href });
        } else if (anchor.closest('.socials, .footer-contacts')) {
          discovered.push({ label: label || 'Contact', url: url.href });
        }
      } catch (error) {
        console.warn('Skipping an invalid link on a public page', sourcePath, error);
      }
    });
    return discovered;
  }

  function relevantKnowledgePaths(message) {
    const followUp = /\b(?:he|him|his|it|its|that|those|them|more)\b/i.test(message);
    const recentConversation = followUp
      ? conversationHistory.slice(-2).map(turn => turn.content).join(' ')
      : '';
    const question = `${recentConversation} ${message}`.toLowerCase()
      .replace(/\b(?:safate|safayte)\b/g, 'safayet');
    const paths = new Set([window.location.pathname]);
    const includes = pattern => pattern.test(question);
    const broadProfile = includes(/\b(?:who\s+is|tell\s+me\s+(?:more\s+)?about|about)\s+(?:safayet(?:\s+ullah)?|him|he)\b|\bpersonal\s+(?:background|profile)\b/);

    if (broadProfile) {
      ['/', '/about', '/academic-journey', '/projects', '/research', '/training-certifications']
        .forEach(path => paths.add(path));
    }
    if (includes(/\b(?:education|academic|qualification|university|degree|bsc|cgpa|gpa|batch|hsc|ssc|college|school)\b/)) {
      paths.add('/about');
      paths.add('/academic-journey');
    }
    if (includes(/\b(?:skill|technology|technologies|language|framework|database|spring|java|python|docker|aws|devops|cloud|linux|kubernetes|terraform|jenkins|github)\b/)) {
      paths.add('/about');
      paths.add('/projects');
    }
    if (includes(/\b(?:project|built|build|software|application|development|experience)\b/)) {
      paths.add('/projects');
    }
    if (includes(/\b(?:research|paper|publication|published|accepted|pending|review|machine learning|ai\/ml|artificial intelligence)\b/)) {
      paths.add('/research');
    }
    if (includes(/\b(?:learn|learning|lesson|tutorial|guide|course|module|lab)\b/)) {
      paths.add('/learning');
    }
    if (includes(/\b(?:training|certificate|certification|credential|penetration testing|cpte)\b/)) {
      paths.add('/training-certifications');
    }
    if (includes(/\b(?:website|portfolio|purpose|share|document)\b/)) {
      paths.add('/');
    }
    return [...paths].slice(0, maxSitePages);
  }

  function normalizedSearchText(value) {
    return value.toLowerCase()
      .replace(/\b(?:safate|safayte)\b/g, 'safayet')
      .replace(/[^a-z0-9+#./-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function queryTerms(message) {
    return [...new Set(normalizedSearchText(message).split(' ')
      .filter(term => term.length >= 3 && !searchStopWords.has(term)))];
  }

  function pageRelevance(snapshot, terms) {
    const title = normalizedSearchText(snapshot.page.title);
    const content = normalizedSearchText(snapshot.page.content);
    return terms.reduce((score, term) => score
      + (title.includes(term) ? 4 : 0)
      + (content.includes(term) ? 1 : 0), 0);
  }

  function relevantPageExcerpt(content, terms, maxLength) {
    if (content.length <= maxLength) return content;
    const chunks = [];
    content.split(/(?<=[.!?])\s+|\s*[|•]\s*/).forEach(sentence => {
      let remaining = sentence.trim();
      while (remaining.length > 420) {
        let boundary = remaining.lastIndexOf(' ', 420);
        if (boundary < 180) boundary = 420;
        chunks.push(remaining.slice(0, boundary).trim());
        remaining = remaining.slice(boundary).trim();
      }
      if (remaining) chunks.push(remaining);
    });
    if (!chunks.length) return content.slice(0, maxLength);

    const ranked = chunks.map((chunk, index) => ({
      chunk,
      index,
      score: queryTerms(chunk).reduce((score, term) => score
        + (terms.includes(term) ? 1 : 0), 0)
    })).sort((left, right) => right.score - left.score || left.index - right.index);
    const selected = new Set([0]);
    let used = chunks[0].length;
    for (const candidate of ranked) {
      if (candidate.score === 0 || selected.has(candidate.index)) continue;
      const additionalLength = candidate.chunk.length + (used ? 1 : 0);
      if (used + additionalLength > maxLength) continue;
      selected.add(candidate.index);
      used += additionalLength;
    }
    if (used > maxLength) return chunks[0].slice(0, maxLength);
    return [...selected].sort((left, right) => left - right)
      .map(index => chunks[index]).join(' ');
  }

  async function fetchPageSnapshot(path) {
    if (path === window.location.pathname) {
      const content = pageText(document);
      return content ? {
        page: { path, title: document.title || path, content },
        links: pageLinks(document, path)
      } : null;
    }
    if (pageSnapshotCache.has(path)) return pageSnapshotCache.get(path);

    const pending = (async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 2500);
      try {
        const response = await fetch(path, {
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { Accept: 'text/html' },
          signal: controller.signal
        });
        if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return null;
        const responseUrl = new URL(response.url, window.location.origin);
        if (responseUrl.origin !== window.location.origin) return null;
        const pageDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
        const content = pageText(pageDocument);
        if (!content) return null;
        return {
          page: { path: responseUrl.pathname, title: (pageDocument.title || path).slice(0, 300), content },
          links: pageLinks(pageDocument, responseUrl.pathname)
        };
      } catch (error) {
        console.warn('Unable to load a relevant public page for Safayet Bot', path, error);
        return null;
      } finally {
        window.clearTimeout(timeout);
      }
    })();
    pageSnapshotCache.set(path, pending);
    return pending;
  }

  async function loadSiteContext(message) {
    const currentPath = window.location.pathname;
    const routedPaths = relevantKnowledgePaths(message);
    const catalogPaths = [...new Set([...knowledgeHubPaths, ...routedPaths])];
    const catalog = (await Promise.all(catalogPaths.map(fetchPageSnapshot))).filter(Boolean);
    const currentSnapshot = catalog.find(snapshot => snapshot.page.path === currentPath)
      || await fetchPageSnapshot(currentPath);
    if (!currentSnapshot) {
      return { pagePath: null, pages: null, links: [] };
    }

    const selected = new Map([[currentSnapshot.page.path, currentSnapshot]]);
    const addSnapshot = snapshot => {
      if (snapshot && selected.size < maxSitePages) selected.set(snapshot.page.path, snapshot);
    };
    routedPaths.forEach(path => addSnapshot(catalog.find(snapshot => snapshot.page.path === path)));

    const normalizedQuestion = normalizedSearchText([
      ...conversationHistory.slice(-2).map(turn => turn.content),
      message
    ].join(' '));
    const matchingDetailPaths = catalog.flatMap(snapshot => snapshot.links)
      .filter(link => link.url.startsWith('/') && !selected.has(link.url))
      .filter(link => {
        const label = normalizedSearchText(link.label);
        return label.length >= 4 && !/^(?:view details|learn more|read more)$/.test(label)
          && normalizedQuestion.includes(label);
      })
      .map(link => link.url)
      .filter((path, index, paths) => paths.indexOf(path) === index)
      .slice(0, 2);
    const detailSnapshots = await Promise.all(matchingDetailPaths.map(fetchPageSnapshot));
    detailSnapshots.forEach(addSnapshot);

    const terms = queryTerms(normalizedQuestion);
    catalog.filter(snapshot => !selected.has(snapshot.page.path))
      .map(snapshot => ({ snapshot, score: pageRelevance(snapshot, terms) }))
      .filter(match => match.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, maxSitePages - selected.size)
      .forEach(match => addSnapshot(match.snapshot));
    const snapshots = [...selected.values()];

    const verified = new Map();
    const externalLinks = new Map();
    snapshots.forEach(snapshot => {
      verified.set(snapshot.page.path, snapshot.page.title);
      snapshot.links.forEach(link => {
        if (link.url.startsWith('/')) {
          if (!verified.has(link.url)) verified.set(link.url, link.label);
        } else {
          externalLinks.set(link.url, link.label);
        }
      });
    });

    const contextPages = [];
    let totalLength = 0;
    for (const { page } of snapshots) {
      const room = maxSiteContentLength - totalLength;
      if (room <= page.title.length + 100) break;
      const slotsRemaining = snapshots.length - contextPages.length;
      const excerptLimit = Math.min(maxSiteContentLength,
        Math.max(0, Math.floor((room - page.title.length) / slotsRemaining)));
      const content = relevantPageExcerpt(page.content, terms, excerptLimit);
      contextPages.push({ ...page, content });
      totalLength += page.path.length + page.title.length + content.length;
    }
    const links = [
      ...[...verified.entries()].map(([url, label]) => ({ label, url })),
      ...[...externalLinks.entries()].map(([url, label]) => ({ label, url }))
    ].slice(0, 60);
    verifiedLinkLabels = new Map(links.map(link => [link.url, link.label]));
    verifiedLinkUrls = new Set(links.map(link => link.url));
    return { pagePath: currentPath, pages: contextPages, links };
  }

  function renderBotMarkdown(container, text) {
    const lines = text.replace(/<br\s*\/?>/gi, '\n').replace(/\r\n?/g, '\n').split('\n');

    function appendInline(parent, value) {
      const pattern = /\*\*(.+?)\*\*|__(.+?)__|`([^`\n]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*([^*\n]+)\*/g;
      let position = 0;
      let match;

      while ((match = pattern.exec(value)) !== null) {
        appendPlainText(parent, value.slice(position, match.index));

        if (match[1] !== undefined || match[2] !== undefined) {
          const strong = document.createElement('strong');
          appendInline(strong, match[1] ?? match[2]);
          parent.append(strong);
        } else if (match[3] !== undefined) {
          const code = document.createElement('code');
          code.textContent = match[3];
          parent.append(code);
        } else if (match[4] !== undefined) {
          const label = match[4];
          const url = match[5];
          if (verifiedLinkUrls.has(url)) {
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.textContent = label === url ? (verifiedLinkLabels.get(url) || label) : label;
            parent.append(anchor);
          } else {
            appendInline(parent, label);
          }
        } else {
          const emphasis = document.createElement('em');
          appendInline(emphasis, match[6]);
          parent.append(emphasis);
        }
        position = pattern.lastIndex;
      }

      appendPlainText(parent, value.slice(position));
    }

    function appendPlainText(parent, value) {
      parent.append(document.createTextNode(value));
    }

    function isListLine(line) {
      return /^\s*(?:[-*+]|\d+\.)\s+\S/.test(line);
    }

    function expandIsolatedListMarker(index) {
      const marker = lines[index]?.match(/^\s*(\d+)\.\s*$/);
      if (!marker) return;
      let contentIndex = index + 1;
      while (contentIndex < lines.length && !lines[contentIndex].trim()) contentIndex++;
      if (contentIndex >= lines.length
          || /^\s*(?:```|#{1,6}\s|[-*+]\s+)/.test(lines[contentIndex])) return;
      lines[index] = `${marker[1]}. ${lines[contentIndex].trim()}`;
      lines.splice(index + 1, contentIndex - index);
    }

    function tableCells(line) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
      return trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
    }

    function isTableSeparator(line) {
      const cells = tableCells(line);
      return cells !== null && cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
    }

    function renderTable(headerLine, bodyLines) {
      const headers = tableCells(headerLine).map(header => header.toLowerCase());
      const rows = bodyLines.map(tableCells).filter(cells => cells && cells.length === headers.length);
      const titleIndex = headers.findIndex(header => header.includes('title') || header.includes('paper'));
      const statusIndex = headers.findIndex(header => header.includes('status'));
      const researchTable = titleIndex !== -1 && statusIndex !== -1;
      const groups = [];

      rows.forEach(cells => {
        const status = statusIndex === -1 ? '' : cells[statusIndex];
        const groupName = researchTable
          ? (/published/i.test(status) ? 'Published' : /accepted/i.test(status)
            ? 'Accepted' : /under review/i.test(status) ? 'Under Review' : 'Other')
          : '';
        let group = groups.find(item => item.name === groupName);
        if (!group) {
          group = { name: groupName, rows: [] };
          groups.push(group);
        }
        group.rows.push(cells);
      });

      groups.forEach(group => {
        if (group.name) {
          const heading = document.createElement('h3');
          heading.textContent = group.name;
          container.append(heading);
        }
        const list = document.createElement('ol');
        group.rows.forEach(cells => {
          const item = document.createElement('li');
          cells.forEach((value, cellIndex) => {
            if (!value) return;
            if (cellIndex === titleIndex) {
              const title = document.createElement('strong');
              appendInline(title, value);
              item.append(title);
            } else {
              item.append(document.createElement('br'));
              const label = headers[cellIndex]
                .replace(/\b\w/g, character => character.toUpperCase())
                .replace(/Safayet Ullah'S/i, "Safayet Ullah's");
              const labelNode = document.createElement('strong');
              labelNode.textContent = `${label}: `;
              item.append(labelNode);
              appendInline(item, value);
            }
          });
          list.append(item);
        });
        container.append(list);
      });
    }

    for (let index = 0; index < lines.length;) {
      expandIsolatedListMarker(index);
      const line = lines[index];
      if (!line.trim()) {
        index++;
        continue;
      }

      if (index + 1 < lines.length && tableCells(line) && tableCells(lines[index + 1])) {
        const rows = [];
        const hasSeparator = isTableSeparator(lines[index + 1]);
        index += hasSeparator ? 2 : 1;
        while (index < lines.length && tableCells(lines[index])) {
          rows.push(lines[index++]);
        }
        renderTable(line, rows);
        continue;
      }

      if (/^\s*```/.test(line)) {
        const codeLines = [];
        index++;
        while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
          codeLines.push(lines[index++]);
        }
        if (index < lines.length) index++;
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = codeLines.join('\n');
        pre.append(code);
        container.append(pre);
        continue;
      }

      const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (heading) {
        const element = document.createElement(`h${Math.min(heading[1].length + 2, 6)}`);
        appendInline(element, heading[2]);
        container.append(element);
        index++;
        continue;
      }

      if (isListLine(line)) {
        const ordered = /^\s*\d+\.\s+/.test(line);
        const list = document.createElement(ordered ? 'ol' : 'ul');
        if (ordered) list.start = Number(line.match(/^\s*(\d+)\./)[1]);
        while (index < lines.length && isListLine(lines[index])
            && /^\s*\d+\.\s+/.test(lines[index]) === ordered) {
          const item = document.createElement('li');
          appendInline(item, lines[index].replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''));
          index++;
          while (index < lines.length && lines[index].trim()) {
            expandIsolatedListMarker(index);
            if (isListLine(lines[index]) || /^\s*(?:```|#{1,6}\s)/.test(lines[index])) break;
            item.append(document.createElement('br'));
            appendInline(item, lines[index++].trim());
          }
          list.append(item);
        }
        container.append(list);
        continue;
      }

      const paragraph = document.createElement('p');
      appendInline(paragraph, lines[index++]);
      while (index < lines.length && lines[index].trim()
          && !/^\s{0,3}#{1,6}\s+/.test(lines[index]) && !isListLine(lines[index])) {
        paragraph.append(document.createElement('br'));
        appendInline(paragraph, lines[index++]);
      }
      container.append(paragraph);
    }
  }

  function setWaiting(waiting) {
    isWaiting = waiting;
    input.disabled = waiting;
    sendButton.disabled = waiting;
    topicButtons.forEach(button => {
      button.disabled = waiting;
    });

    if (waiting) {
      messages.append(typingIndicator);
      conversation.scrollTop = conversation.scrollHeight;
    } else {
      typingIndicator.remove();
    }
  }

  function startConversation() {
    welcome.hidden = true;
    messages.hidden = false;
  }

  async function sendMessage(message) {
    if (isWaiting || !message) return;

    startConversation();
    addMessage(message, 'user');
    input.value = '';
    setWaiting(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 40000);
    try {
      const siteContext = await loadSiteContext(message);
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: conversationHistory.slice(-6),
          pagePath: siteContext.pagePath,
          pages: siteContext.pages,
          links: siteContext.links
        }),
        signal: controller.signal
      });

      if (response.status === 429) {
        const data = await response.json().catch(() => null);
        const friendlyErrors = [
          'Messages are arriving too quickly. Please wait a few seconds and try again.',
          'Safayet Bot is temporarily at capacity. Please try again shortly.'
        ];
        addMessage(friendlyErrors.includes(data?.error)
          ? data.error
          : 'Safayet Bot is temporarily busy. Please wait a few seconds and try again.', 'bot');
        return;
      }

      if (response.status === 400) {
        const data = await response.json().catch(() => null);
        addMessage(data?.error === 'Invalid website context'
          ? 'Safayet Bot could not verify the website content. Please reload and try again.'
          : (data?.error || 'Please keep your message to 500 characters or fewer and try again.'), 'bot');
        return;
      }

      if (response.status === 503) {
        const data = await response.json().catch(() => null);
        addMessage(data?.error || 'Safayet Bot is temporarily unavailable. Please try again shortly.', 'bot');
        return;
      }

      if (!response.ok) throw new Error('Chat request failed');

      const data = await response.json();
      if (typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error('Chat response did not contain a reply');
      }

      conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: data.reply }
      );
      if (conversationHistory.length > 6) conversationHistory.splice(0, conversationHistory.length - 6);
      addMessage(data.reply, 'bot');
    } catch (error) {
      const reply = error.name === 'AbortError'
        ? "Safayet Bot is taking longer than usual to respond. Please try again."
        : "Sorry, Safayet Bot is temporarily unavailable. Please try again in a moment.";
      addMessage(reply, 'bot');
    } finally {
      window.clearTimeout(timeoutId);
      setWaiting(false);
      if (!panel.hidden) input.focus();
    }
  }

  toggle.addEventListener('click', () => setOpen(panel.hidden));
  label.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));

  widget.querySelectorAll('[data-bot-topic]').forEach(button => {
    button.addEventListener('click', () => {
      const topic = topicReplies[button.dataset.botTopic];
      if (!topic || isWaiting) return;
      sendMessage(topic.question);
    });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (isWaiting) return;
    const message = input.value.trim();
    if (!message) {
      input.focus();
      return;
    }

    sendMessage(message);
  });

  document.addEventListener('keydown', event => {
    if (panel.hidden) return;
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll('button, input, a[href]')]
      .filter(element => !element.disabled && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();
