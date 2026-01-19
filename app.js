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
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${mdPath}`);
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
    // Bold (double asterisks or underscores)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
    // Italic (single asterisk or underscore)
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
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
