/*
 * Application logic for the self‑modifying binaries slide deck.
 *
 * This script loads the deck definition and individual slides, parses
 * markdown into HTML, and wires up navigation via the dropdown, arrow
 * keys and URL hash. It also falls back to embedded data when fetching
 * resources fails (e.g. offline usage).
 */

(function() {
  // Cache DOM elements
  const slideSelect = document.getElementById('slide-select');
  const terminalContent = document.getElementById('terminal-content');
  const terminalTitle = document.getElementById('terminal-title');
  const deckTitleEl = document.getElementById('deck-title');

  let deck = null;
  let slides = [];

  /**
   * Load the deck definition from deck.json. When unavailable (offline), use
   * the embedded fallback found on window.EMBED_DATA.deck.
   */
  async function loadDeck() {
    try {
      const res = await fetch('deck.json');
      // If the fetch fails, report the file name correctly instead of referencing
      // an undefined mdPath variable. mdPath is only defined in loadSlide.
      if (!res.ok) throw new Error(`HTTP ${res.status} for deck.json`);
      deck = await res.json();
    } catch (e) {
      if (window.EMBED_DATA && window.EMBED_DATA.deck) {
        deck = window.EMBED_DATA.deck;
      } else {
        console.error('Failed to load deck.json and no fallback available.', e);
        deck = { slides: [] };
      }
    }
    // Apply deck title to the navbar and document title
    if (deck && deck.title) {
      document.title = deck.title;
      if (deckTitleEl) deckTitleEl.textContent = deck.title;
    }
    slides = deck.slides || [];
    buildSelect();
  }

  /**
   * Populate the dropdown with slide titles based on the loaded deck.
   */
  function buildSelect() {
    slideSelect.innerHTML = '';
    slides.forEach((s, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.textContent = `${index + 1}. ${s.title}`;
      slideSelect.appendChild(opt);
    });
  }

  /**
   * Load a single slide by index. It fetches the markdown from the file
   * specified in the deck, or falls back to the embedded data.
   *
   * @param {number} index The zero‑based index of the slide to load
   */
  async function loadSlide(index) {
    const slide = slides[index];
    if (!slide) return;
    const mdPath = slide.file;
    let mdText;
    try {
      const res = await fetch(mdPath);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${mdPath}`);
      mdText = await res.text();
    } catch (e) {
      // Fallback to embedded slides
      if (window.EMBED_DATA && window.EMBED_DATA.slides && window.EMBED_DATA.slides[mdPath]) {
        mdText = window.EMBED_DATA.slides[mdPath];
      } else {
        mdText = 'Unable to load slide.';
      }
    }
    const { title, html } = parseMarkdown(mdText || '');
    terminalTitle.textContent = title || slide.title || `Slide ${index + 1}`;
    // Replace relative image paths with embedded data URIs when offline
    let processedHtml = html.replace(/<img\s+[^>]*src=["'](.+?)["']/g, (match, src) => {
      if (window.EMBED_DATA && window.EMBED_DATA.assets && window.EMBED_DATA.assets[src]) {
        return match.replace(src, window.EMBED_DATA.assets[src]);
      }
      return match;
    });
    terminalContent.innerHTML = processedHtml;
    slideSelect.selectedIndex = index;
    // update URL hash
    history.replaceState(null, '', '#slide' + (index + 1));
  }

  /**
   * Parse a markdown string into HTML. Supports headings, ordered and
   * unordered lists, fenced code blocks and inline elements (bold, italic,
   * code). Raw HTML (figures, images, SVGs) passes through unchanged.
   *
   * @param {string} md The markdown content
   * @returns {{title:string, html:string}} Parsed title and HTML
   */
  function parseMarkdown(md) {
    // Normalize line endings
    md = md.replace(/\r/g, '');
    const lines = md.split('\n');
    let html = '';
    let title = '';
    let inCode = false;
    let codeBuffer = [];
    let listBuffer = [];
    let listType = '';

    /** Flush any accumulated list items into HTML */
    function flushList() {
      if (listBuffer.length > 0) {
        const tag = listType === 'ol' ? 'ol' : 'ul';
        html += `<${tag}>`;
        listBuffer.forEach(item => {
          html += `<li>${item}</li>`;
        });
        html += `</${tag}>`;
        listBuffer = [];
        listType = '';
      }
    }

    lines.forEach((rawLine) => {
      const line = rawLine;
      // Inside fenced code block
      if (inCode) {
        if (line.trim().startsWith('```')) {
          // End code block
          html += '<pre><code>' + escapeHtml(codeBuffer.join('\n')) + '</code></pre>';
          inCode = false;
          codeBuffer = [];
        } else {
          codeBuffer.push(line);
        }
        return;
      }
      // Start of code block
      if (line.trim().startsWith('```')) {
        flushList();
        inCode = true;
        codeBuffer = [];
        return;
      }
      // Raw HTML pass‑through for figures/images/SVGs
      const trimmed = line.trim();
      if (/^<(figure|img|svg|\/figure|figcaption)/i.test(trimmed)) {
        flushList();
        html += line + '\n';
        return;
      }
      // Heading detection (#, ##, ### ...)
      const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        if (!title) title = text;
        html += `<h${level}>${text}</h${level}>`;
        return;
      }
      // Unordered list detection (-, *, +)
      const ulMatch = line.match(/^\s*([-*+])\s+(.*)/);
      // Ordered list detection (numbers followed by dot)
      const olMatch = line.match(/^\s*(\d+)\.\s+(.*)/);
      if (ulMatch) {
        const item = ulMatch[2];
        if (listType && listType !== 'ul') {
          flushList();
        }
        listType = 'ul';
        listBuffer.push(processInline(item));
        return;
      }
      if (olMatch) {
        const item = olMatch[2];
        if (listType && listType !== 'ol') {
          flushList();
        }
        listType = 'ol';
        listBuffer.push(processInline(item));
        return;
      }
      // Blank line breaks lists and paragraphs
      if (trimmed === '') {
        flushList();
        return;
      }
      // Regular paragraph
      flushList();
      html += `<p>${processInline(line)}</p>`;
    });
    flushList();
    return { title, html };
  }

  /**
   * Escape HTML special characters in code blocks.
   */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Process inline markdown for bold, italic and inline code.
   */
  function processInline(text) {
    // --- Inline Markdown processing ---
    //
    // The order of operations here is important to ensure that
    // Markdown markers inside code spans or escaped characters
    // are not inadvertently interpreted as formatting. To achieve
    // this, we first unescape escaped characters, then temporarily
    // replace code spans with placeholders, apply bold/italic
    // formatting, and finally restore the code spans with HTML
    // escaping applied.

    // 1. Escape literal underscores and asterisks. Markdown allows
    //    backslash‑escaped characters (e.g. \_ or \*) to be treated
    //    literally rather than invoking formatting. Replace these
    //    sequences with HTML entities up front so that the
    //    subsequent formatting logic does not interpret them. We use
    //    &#95; for underscore and &#42; for asterisk. These will be
    //    interpreted by the browser as literal characters when
    //    rendered.
    text = text.replace(/\\_/g, '&#95;');
    text = text.replace(/\\\*/g, '&#42;');

    // 2. Extract inline code spans and replace them with
    //    placeholders. We store the captured code segments in
    //    an array so they can be restored after other formatting
    //    has been applied. This prevents Markdown patterns from
    //    running inside code spans.
    const codeSpans = [];
    text = text.replace(/`([^`]+)`/g, (match, p1) => {
      const placeholder = `__CODE_PLACEHOLDER_${codeSpans.length}__`;
      codeSpans.push(p1);
      return placeholder;
    });

    // 3. Apply bold formatting using double asterisks (**bold**).
    //    We deliberately avoid supporting bold with double underscores
    //    because double underscores are common in identifiers (e.g.
    //    __init__, __section_alignment__) and should not be
    //    interpreted as formatting. Users should use ** for bold.
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 4. Apply italic formatting using single asterisks (*italic*).
    //    We intentionally do not support underscore‑based italics to
    //    avoid collisions with identifiers containing underscores.
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 5. Restore inline code spans. When reinserting, escape any
    //    HTML special characters inside the code to prevent tag
    //    injection. The escapeHtml helper defined below is reused
    //    here for consistency.
    text = text.replace(/__CODE_PLACEHOLDER_(\d+)__/g, (match, idx) => {
      const codeText = codeSpans[parseInt(idx, 10)] || '';
      return `<code>${escapeHtml(codeText)}</code>`;
    });

    return text;
  }

  /**
   * Respond to arrow key presses for slide navigation.
   */
  document.addEventListener('keydown', (e) => {
    if (!slides || slides.length === 0) return;
    if (e.key === 'ArrowRight') {
      let idx = slideSelect.selectedIndex;
      idx = (idx + 1) % slides.length;
      loadSlide(idx);
    } else if (e.key === 'ArrowLeft') {
      let idx = slideSelect.selectedIndex;
      idx = (idx - 1 + slides.length) % slides.length;
      loadSlide(idx);
    }
  });

  // Update slide when dropdown changes
  slideSelect.addEventListener('change', () => {
    const idx = parseInt(slideSelect.value, 10);
    loadSlide(idx);
  });

  /**
   * Initialise the deck on DOMContentLoaded. Chooses the starting slide
   * based on the URL hash (#slideX).
   */
  async function init() {
    await loadDeck();
    let startIndex = 0;
    if (location.hash.startsWith('#slide')) {
      const n = parseInt(location.hash.replace('#slide', ''), 10);
      if (!isNaN(n) && n > 0 && n <= slides.length) {
        startIndex = n - 1;
      }
    }
    loadSlide(startIndex);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
