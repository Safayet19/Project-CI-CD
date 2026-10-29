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
                <div>
                  <button type="button" data-bot-topic="projects">Explore Projects</button>
                  <button type="button" data-bot-topic="learning">Learning Hub</button>
                  <button type="button" data-bot-topic="research">Research Papers</button>
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
  let isWaiting = false;
  let previousScrollPosition = 0;

  const topicReplies = {
    projects: {
      question: 'What projects has Safayet worked on?'
    },
    learning: {
      question: 'What is in the Learning Hub?'
    },
    research: {
      question: 'What research papers has Safayet published?'
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

  function renderBotMarkdown(container, text) {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const pathLabels = new Map([
      ['/', 'Home'],
      ['/about', 'About'],
      ['/projects', 'Projects'],
      ['/projects/eventflow', 'EventFlow'],
      ['/projects/student-excuse', 'Student Excuse Generator'],
      ['/projects/hospital-management', 'Hospital Management System'],
      ['/projects/plant-disease', 'Plant Disease Recognition'],
      ['/projects/ovijog', 'Ovijog'],
      ['/learning', 'Learning Hub'],
      ['/learning/dvwa', 'DVWA Practical Security Lab'],
      ['/learning/devops', 'Spring Boot Deployment Workflow'],
      ['/learning/devops/deployment-workflow', 'From Git Push to HTTPS'],
      ['/learning/backend', 'Spring Boot MVC Notes'],
      ['/learning/backend/mvc-thymeleaf', 'Spring MVC and Thymeleaf'],
      ['/research', 'Research'],
      ['/academic-journey', 'Academic Journey'],
      ['/journey', 'Academic Journey'],
      ['/training-certifications', 'Training & Certifications']
    ]);
    const doiLinks = new Set([
      'https://doi.org/10.1109/TENSYMP68909.2026.11704048',
      'https://doi.org/10.18034/apjee.v9i2.765'
    ]);
    const routePattern = /\/(?:about|projects(?:\/(?:eventflow|student-excuse|hospital-management|plant-disease|ovijog))?|learning(?:\/(?:dvwa|devops(?:\/deployment-workflow)?|backend(?:\/mvc-thymeleaf)?))?|research|academic-journey|journey|training-certifications)(?=$|[\s.,!?;:)])/g;

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
          const path = match[5];
          const linkLabel = pathLabels.get(path);
          if (linkLabel || doiLinks.has(path)) {
            const anchor = document.createElement('a');
            anchor.href = path;
            if (linkLabel && (label === path || label === '/')) {
              anchor.textContent = linkLabel;
            } else if (!linkLabel && label === path) {
              anchor.textContent = 'DOI';
            } else {
              appendInline(anchor, label);
            }
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
      let position = 0;
      let match;
      routePattern.lastIndex = 0;

      while ((match = routePattern.exec(value)) !== null) {
        parent.append(document.createTextNode(value.slice(position, match.index)));
        const label = pathLabels.get(match[0]);
        if (label) {
          const anchor = document.createElement('a');
          anchor.href = match[0];
          anchor.textContent = label;
          parent.append(anchor);
        } else {
          parent.append(document.createTextNode(match[0]));
        }
        position = routePattern.lastIndex;
      }

      parent.append(document.createTextNode(value.slice(position)));
    }

    function isListLine(line) {
      return /^\s*(?:[-*+]|\d+\.)\s+/.test(line);
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
        while (index < lines.length && isListLine(lines[index])
            && /^\s*\d+\.\s+/.test(lines[index]) === ordered) {
          const item = document.createElement('li');
          appendInline(item, lines[index].replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''));
          list.append(item);
          index++;
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
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: conversationHistory.slice(-16) }),
        signal: controller.signal
      });

      if (response.status === 429) {
        const data = await response.json().catch(() => null);
        const friendlyErrors = [
          'Too many messages. Please wait a minute before trying again.',
          'Safayet Bot is temporarily at capacity. Please try again shortly.'
        ];
        addMessage(friendlyErrors.includes(data?.error)
          ? data.error
          : 'Safayet Bot is temporarily busy. Please wait a minute and try again.', 'bot');
        return;
      }

      if (response.status === 400) {
        addMessage('Please keep your message to 500 characters or fewer and try again.', 'bot');
        return;
      }

      if (!response.ok) throw new Error('Chat request failed');

      const data = await response.json();
      if (typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error('Chat response did not contain a reply');
      }

      conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: data.reply.slice(0, 4000) }
      );
      if (conversationHistory.length > 16) conversationHistory.splice(0, conversationHistory.length - 16);
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
