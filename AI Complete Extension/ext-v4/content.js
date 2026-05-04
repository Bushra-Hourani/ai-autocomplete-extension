// AI Autocomplete v4 - Works on normal sites + Google Docs inline
(function () {
  'use strict';

  let suggestion = '';
  let activeEl = null;
  let timer = null;
  let gdocsMode = false;
  let inlineSpan = null; // for Google Docs inline ghost

  // ── Detect Google Docs ─────────────────────────────────────────────────
  function isGoogleDocs() {
    return location.hostname === 'docs.google.com';
  }

  // ── Tooltip (for normal sites) ─────────────────────────────────────────
  let tip = null;
  function createTip() {
    if (tip) return;
    tip = document.createElement('div');
    tip.style.cssText = `
      position:fixed !important; z-index:2147483647 !important;
      background:rgba(30,30,40,0.93) !important; color:#a5b4fc !important;
      padding:5px 12px !important; border-radius:6px !important;
      font-size:13px !important; font-family:Arial,sans-serif !important;
      pointer-events:none !important; display:none !important;
      max-width:420px !important; white-space:nowrap !important;
      box-shadow:0 2px 10px rgba(0,0,0,0.4) !important;
      border:1px solid rgba(99,102,241,0.5) !important;
    `;
    document.documentElement.appendChild(tip);
  }

  function showTip(el, text) {
    createTip();
    const rect = el.getBoundingClientRect();
    tip.textContent = '✦ ' + text + '   ↹Tab';
    let top = rect.bottom + 5;
    if (top + 36 > window.innerHeight) top = rect.top - 38;
    tip.style.top = top + 'px';
    tip.style.left = rect.left + 'px';
    tip.style.display = 'block';
  }

  function hideTip() {
    if (tip) tip.style.display = 'none';
  }

  // ── Google Docs inline ghost text ─────────────────────────────────────
  function gdocsShowInline(text) {
    gdocsRemoveInline();

    // Find the cursor element in Google Docs
    const cursor = document.querySelector('.kix-cursor-caret');
    if (!cursor) return;

    inlineSpan = document.createElement('span');
    inlineSpan.id = 'ai-gdocs-ghost';
    inlineSpan.textContent = text;
    inlineSpan.style.cssText = `
      color: rgba(130,130,200,0.6) !important;
      font-style: italic !important;
      pointer-events: none !important;
      position: relative !important;
      z-index: 9999 !important;
    `;

    // Insert after cursor
    cursor.parentNode.insertBefore(inlineSpan, cursor.nextSibling);
  }

  function gdocsRemoveInline() {
    const old = document.getElementById('ai-gdocs-ghost');
    if (old) old.remove();
    inlineSpan = null;
  }

  // ── Get typed text from Google Docs ───────────────────────────────────
  function getGDocsText() {
    // Get text from the active line in Google Docs
    const lines = document.querySelectorAll('.kix-lineview-content');
    if (!lines.length) return '';

    // Find line with cursor
    const cursor = document.querySelector('.kix-cursor');
    if (!cursor) return '';

    // Walk up to find the line
    let el = cursor;
    while (el && !el.classList.contains('kix-lineview')) {
      el = el.parentElement;
    }
    if (!el) return '';

    // Get text content of that line
    const spans = el.querySelectorAll('.kix-wordhtmlgenerator-word-node');
    let text = '';
    spans.forEach(s => { text += s.textContent; });
    return text.trim();
  }

  // ── Accept suggestion in Google Docs ─────────────────────────────────
  function gdocsAccept(text) {
    gdocsRemoveInline();
    // Type suggestion into Google Docs using clipboard
    const activeDocEl = document.querySelector('.docs-texteventtarget-iframe');
    if (activeDocEl && activeDocEl.contentDocument) {
      activeDocEl.contentDocument.execCommand('insertText', false, text);
    } else {
      // Fallback: dispatch keyboard events
      const el = document.querySelector('[contenteditable]');
      if (el) {
        const ev = new InputEvent('textInput', { data: text, bubbles: true });
        el.dispatchEvent(ev);
      }
    }
  }

  // ── Normal textarea/input handling ────────────────────────────────────
  function attachNormal(el) {
    if (el._v4) return;
    el._v4 = true;

    el.addEventListener('input', () => {
      hideTip(); suggestion = ''; activeEl = el;
      clearTimeout(timer);
      const text = el.value.substring(0, el.selectionStart);
      if (!text || text.trim().length < 3) return;
      timer = setTimeout(() => askAI(text, (s) => {
        if (document.activeElement !== el) return;
        suggestion = s;
        showTip(el, s);
      }), 600);
    });

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault(); e.stopPropagation();
        const start = el.selectionStart;
        el.value = el.value.slice(0, start) + suggestion + el.value.slice(el.selectionEnd);
        el.selectionStart = el.selectionEnd = start + suggestion.length;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        hideTip(); suggestion = '';
      }
      if (e.key === 'Escape') { hideTip(); suggestion = ''; }
    });

    el.addEventListener('blur', () => setTimeout(() => { hideTip(); suggestion = ''; }, 200));
  }

  // ── Google Docs handling ──────────────────────────────────────────────
  function setupGDocs() {
    // Listen for keyup on the whole document
    document.addEventListener('keyup', (e) => {
      // Skip modifier keys
      if (['Tab','Escape','Shift','Control','Alt','Meta'].includes(e.key)) return;

      clearTimeout(timer);
      gdocsRemoveInline();
      hideTip();
      suggestion = '';

      const text = getGDocsText();
      if (!text || text.length < 3) return;

      timer = setTimeout(() => {
        askAI(text, (s) => {
          suggestion = s;
          // Show both: inline ghost + tooltip
          gdocsShowInline(s);
          // Also show tooltip as backup
          const cursor = document.querySelector('.kix-cursor-caret');
          if (cursor) {
            const rect = cursor.getBoundingClientRect();
            createTip();
            tip.textContent = '✦ ' + s + '   ↹Tab to accept';
            let top = rect.bottom + 5;
            tip.style.top = top + 'px';
            tip.style.left = rect.left + 'px';
            tip.style.display = 'block';
          }
        });
      }, 800);
    });

    // Tab to accept in Google Docs
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault(); e.stopPropagation();
        gdocsAccept(suggestion);
        hideTip();
        suggestion = '';
      }
      if (e.key === 'Escape') {
        gdocsRemoveInline();
        hideTip();
        suggestion = '';
      }
    }, true);
  }

  // ── Ask AI ─────────────────────────────────────────────────────────────
  function askAI(text, callback) {
    chrome.runtime.sendMessage({ type: 'COMPLETE', text }, (res) => {
      if (res?.text) callback(res.text);
    });
  }

  // ── Attach to normal inputs ────────────────────────────────────────────
  function attachAll() {
    document.querySelectorAll('textarea, input[type="text"], input[type="search"], input:not([type])')
      .forEach(attachNormal);
  }

  // ── Init ───────────────────────────────────────────────────────────────
  createTip();

  if (isGoogleDocs()) {
    gdocsMode = true;
    // Wait for Google Docs to fully load
    setTimeout(setupGDocs, 2000);
  }

  // Always attach to normal inputs too
  attachAll();
  new MutationObserver(attachAll).observe(document.documentElement, {
    childList: true, subtree: true
  });

})();
