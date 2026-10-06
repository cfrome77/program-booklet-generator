/**
 * HTML Sanitizer module for Booklet Generator.
 * Uses an allowlist of safe HTML tags and attributes to sanitize user-supplied / imported HTML.
 * Prevents arbitrary scripts, XSS vectors, unsafe attributes, and malicious protocols.
 */

const ALLOWED_TAGS = new Set([
  'a', 'b', 'blockquote', 'br', 'caption', 'code', 'col', 'colgroup',
  'dd', 'div', 'dl', 'dt', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 's', 'span', 'strong',
  'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr',
  'u', 'ul'
]);

const STRIP_CONTENT_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'applet', 'form',
  'input', 'button', 'textarea', 'select', 'option', 'link', 'meta',
  'base', 'head', 'title', 'svg', 'math', 'template'
]);

const ALLOWED_ATTRS = new Set([
  'class', 'style', 'title', 'id', 'alt', 'src', 'href', 'target',
  'rel', 'width', 'height', 'align', 'valign', 'colspan', 'rowspan'
]);

const VOID_TAGS = new Set([
  'br', 'hr', 'img', 'col'
]);

/**
 * Checks if a URL is safe for href attribute.
 */
function isSafeHref(url) {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  // Reject javascript:, vbscript:, data: (for links)
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('vbscript:') || trimmed.startsWith('data:')) {
    return false;
  }
  return true;
}

/**
 * Checks if a URL is safe for src attribute.
 */
function isSafeSrc(url) {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('vbscript:')) {
    return false;
  }
  // Allow safe data URIs for images
  if (trimmed.startsWith('data:')) {
    return /^data:image\/(?:png|jpeg|jpg|gif|webp|svg\+xml);base64,/i.test(trimmed);
  }
  return true;
}

/**
 * Sanitizes inline style strings to strip expressions, scripts, and unsafe directives.
 */
function sanitizeStyle(styleString) {
  if (!styleString) return '';
  let clean = styleString;
  // Remove CSS expressions, behaviors, bindings, and javascript/vbscript URLs
  clean = clean.replace(/expression\s*\(.*?\)/gi, '');
  clean = clean.replace(/behavior\s*:\s*[^;"]+/gi, '');
  clean = clean.replace(/-moz-binding\s*:\s*[^;"]+/gi, '');
  clean = clean.replace(/url\s*\(\s*["']?\s*(?:javascript|vbscript):[^)]+\)/gi, '');
  clean = clean.replace(/@import/gi, '');
  return clean.trim();
}

/**
 * Browser DOMParser sanitization implementation.
 */
function sanitizeWithDOMParser(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function walk(node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === 1) { // Element node
        const tagName = child.tagName.toLowerCase();

        if (STRIP_CONTENT_TAGS.has(tagName)) {
          child.remove();
          continue;
        }

        // Recurse down children first to sanitize nested contents
        walk(child);

        if (!ALLOWED_TAGS.has(tagName)) {
          // Unwrap child node: insert its children before child, then remove child
          while (child.firstChild) {
            node.insertBefore(child.firstChild, child);
          }
          child.remove();
          continue;
        }

        // Sanitize attributes
        const attrs = Array.from(child.attributes);
        for (const attr of attrs) {
          const attrName = attr.name.toLowerCase();

          // Strip event handlers (on*)
          if (attrName.startsWith('on')) {
            child.removeAttribute(attr.name);
            continue;
          }

          if (!ALLOWED_ATTRS.has(attrName)) {
            child.removeAttribute(attr.name);
            continue;
          }

          if (attrName === 'href' && !isSafeHref(attr.value)) {
            child.removeAttribute(attr.name);
            continue;
          }

          if (attrName === 'src' && !isSafeSrc(attr.value)) {
            child.removeAttribute(attr.name);
            continue;
          }

          if (attrName === 'style') {
            const cleanStyle = sanitizeStyle(attr.value);
            if (cleanStyle) {
              child.setAttribute('style', cleanStyle);
            } else {
              child.removeAttribute('style');
            }
          }
        }

        // Handle target="_blank" on <a>
        if (tagName === 'a' && child.getAttribute('target') === '_blank') {
          child.setAttribute('rel', 'noopener noreferrer');
        }
      } else if (child.nodeType === 8) { // Comment node
        child.remove();
      }
    }
  }

  walk(doc.body);
  return doc.body.innerHTML;
}

/**
 * Node/Fallback regex-tokenizer sanitization implementation.
 */
function sanitizeWithFallback(html) {
  let clean = html;

  // 1. Remove comments
  clean = clean.replace(/<!--[\s\S]*?-->/g, '');

  // 2. Remove script, style, iframe, object, embed, etc. tags AND their content
  STRIP_CONTENT_TAGS.forEach((tag) => {
    const regex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    clean = clean.replace(regex, '');
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    clean = clean.replace(selfClosingRegex, '');
  });

  // 3. Process remaining tags
  clean = clean.replace(/<(\/?)(([a-z0-9]+)\b)([^>]*)>/gi, (match, isClosing, fullTag, tagName, attrs) => {
    const tag = tagName.toLowerCase();

    // If tag is not allowed, strip tag wrapper
    if (!ALLOWED_TAGS.has(tag)) {
      return '';
    }

    if (isClosing) {
      return `</${tag}>`;
    }

    // Sanitize attributes
    let cleanAttrs = '';
    const attrRegex = /([a-z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/gi;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrVal = attrMatch[2] !== undefined ? attrMatch[2] : (attrMatch[3] !== undefined ? attrMatch[3] : (attrMatch[4] || ''));

      // Strip on* handlers
      if (attrName.startsWith('on')) continue;

      // Allowlist check
      if (!ALLOWED_ATTRS.has(attrName)) continue;

      if (attrName === 'href' && !isSafeHref(attrVal)) continue;
      if (attrName === 'src' && !isSafeSrc(attrVal)) continue;

      if (attrName === 'style') {
        const sanitizedCss = sanitizeStyle(attrVal);
        if (sanitizedCss) {
          cleanAttrs += ` style="${sanitizedCss.replace(/"/g, '&quot;')}"`;
        }
        continue;
      }

      const escapedVal = attrVal.replace(/"/g, '&quot;');
      cleanAttrs += ` ${attrName}="${escapedVal}"`;
    }

    if (tag === 'a' && /\btarget\s*=\s*["']?_blank["']?/i.test(attrs)) {
      if (!/\brel\s*=/i.test(cleanAttrs)) {
        cleanAttrs += ' rel="noopener noreferrer"';
      }
    }

    const isSelfClosing = match.endsWith('/>') || VOID_TAGS.has(tag);
    return `<${tag}${cleanAttrs}${isSelfClosing ? '/' : ''}>`;
  });

  return clean;
}

/**
 * Main export: Sanitizes imported / user-supplied HTML content.
 * @param {string} html - HTML string to sanitize.
 * @returns {string} Sanitized HTML string safe for dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  if (typeof DOMParser !== 'undefined') {
    try {
      return sanitizeWithDOMParser(html);
    } catch {
      return sanitizeWithFallback(html);
    }
  }

  return sanitizeWithFallback(html);
}
