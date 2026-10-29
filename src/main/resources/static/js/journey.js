/* Accessible year tabs, semester accordions, and the optional memory viewer. */
(() => {
  'use strict';

  const journal = document.querySelector('[data-academic-journey]');
  if (!journal) return;

  const yearTabs = [...journal.querySelectorAll('[role="tab"][data-year-target]')];
  const yearPanels = [...journal.querySelectorAll('[role="tabpanel"]')];

  function selectYear(selectedTab, moveFocus = false) {
    yearTabs.forEach(tab => {
      const selected = tab === selectedTab;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    yearPanels.forEach(panel => {
      panel.hidden = panel.id !== selectedTab.dataset.yearTarget;
    });

    if (moveFocus) selectedTab.focus();
  }

  yearTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectYear(tab));
    tab.addEventListener('keydown', event => {
      let nextIndex;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (index + 1) % yearTabs.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (index - 1 + yearTabs.length) % yearTabs.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = yearTabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      selectYear(yearTabs[nextIndex], true);
    });
  });

  journal.querySelectorAll('.semester-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const panel = document.getElementById(toggle.getAttribute('aria-controls'));
      if (!panel) return;

      const shouldOpen = toggle.getAttribute('aria-expanded') !== 'true';
      const yearPanel = toggle.closest('.academic-year-panel');

      yearPanel?.querySelectorAll('.semester-toggle').forEach(otherToggle => {
        const otherPanel = document.getElementById(otherToggle.getAttribute('aria-controls'));
        otherToggle.setAttribute('aria-expanded', 'false');
        if (otherPanel) otherPanel.hidden = true;
      });

      toggle.setAttribute('aria-expanded', String(shouldOpen));
      panel.hidden = !shouldOpen;
    });
  });

  const memoryDialog = journal.querySelector('.memory-dialog');
  if (!memoryDialog || typeof memoryDialog.showModal !== 'function') return;

  const dialogImage = memoryDialog.querySelector('img');
  const dialogCaption = memoryDialog.querySelector('p');

  journal.querySelectorAll('.memory-button').forEach(button => {
    button.addEventListener('click', () => {
      dialogImage.src = button.dataset.memoryImage;
      dialogImage.alt = button.dataset.memoryAlt || '';
      dialogCaption.textContent = button.dataset.memoryCaption || '';
      memoryDialog.showModal();
    });
  });

  memoryDialog.querySelector('.memory-dialog-close')?.addEventListener('click', () => memoryDialog.close());
  memoryDialog.addEventListener('click', event => {
    if (event.target === memoryDialog) memoryDialog.close();
  });
})();
