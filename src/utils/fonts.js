/**
 * Font management and utility module for booklet generation engine.
 * Ensures configured fonts are reliably loaded before rendering/printing
 * and reports missing or fallback fonts during preflight inspection.
 */

// Canonical list of fonts supported and configured in theme editor options and defaults
export const CONFIGURED_FONTS = {
  'Cinzel': {
    family: 'Cinzel',
    googleFontQuery: 'Cinzel:wght@600;700;800',
    fallback: 'serif'
  },
  'Merriweather': {
    family: 'Merriweather',
    googleFontQuery: 'Merriweather:ital,wght@0,400;0,700;1,400',
    fallback: 'serif'
  },
  'Open Sans': {
    family: 'Open Sans',
    googleFontQuery: 'Open Sans:ital,wght@0,400;0,600;0,700;1,400',
    fallback: 'sans-serif'
  },
  'Roboto': {
    family: 'Roboto',
    googleFontQuery: 'Roboto:wght@400;500;700',
    fallback: 'sans-serif'
  }
};

/**
 * Parses a CSS font-family string (e.g. "'Cinzel', serif" or "Open Sans, sans-serif")
 * into an array of individual cleaned font family names.
 *
 * @param {string} fontString - Raw font family string from CSS or inline style.
 * @returns {string[]} Array of font family names.
 */
export function extractFontFamilies(fontString) {
  if (!fontString || typeof fontString !== 'string') return [];

  return fontString
    .split(',')
    .map((f) => f.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

/**
 * Extracts all unique font family names required by a booklet state
 * (including main body font, theme title font, and any inline content fonts).
 *
 * @param {Object} booklet - Booklet state object.
 * @returns {string[]} Array of unique font family names required.
 */
export function getUsedFonts(booklet) {
  const fontSet = new Set();

  // 1. Default system body font
  fontSet.add('Open Sans');

  // 2. Theme title font
  const titleFontSpec = booklet?.theme?.titleFont;
  if (titleFontSpec) {
    const parsed = extractFontFamilies(titleFontSpec);
    parsed.forEach((f) => {
      if (f !== 'serif' && f !== 'sans-serif' && f !== 'monospace' && f !== 'cursive' && f !== 'fantasy') {
        fontSet.add(f);
      }
    });
  } else {
    fontSet.add('Cinzel');
  }

  // 3. Scan custom pages and blocks for inline font-family declarations
  const pages = booklet?.pages || [];
  pages.forEach((page) => {
    // Custom HTML content
    if (page.content && typeof page.content === 'string') {
      const inlineMatches = page.content.match(/font-family\s*:\s*([^;"]+)/gi);
      if (inlineMatches) {
        inlineMatches.forEach((match) => {
          const parts = match.split(':');
          if (parts[1]) {
            const families = extractFontFamilies(parts[1]);
            families.forEach((f) => {
              if (f !== 'serif' && f !== 'sans-serif' && f !== 'monospace' && f !== 'cursive' && f !== 'fantasy') {
                fontSet.add(f);
              }
            });
          }
        });
      }
    }

    // Content blocks
    (page.blocks || []).forEach((block) => {
      if (block.fontFamily) {
        const families = extractFontFamilies(block.fontFamily);
        families.forEach((f) => {
          if (f !== 'serif' && f !== 'sans-serif' && f !== 'monospace' && f !== 'cursive' && f !== 'fantasy') {
            fontSet.add(f);
          }
        });
      }
    });
  });

  return Array.from(fontSet);
}

/**
 * Checks if a specific font family is loaded and available in the current document context.
 *
 * @param {string} fontFamily - The font family name to check.
 * @param {Object} [options] - Options object containing optional document override.
 * @returns {boolean} True if loaded or verifiable; false if fallback/unloaded.
 */
export function isFontLoaded(fontFamily, options = {}) {
  const docFonts = options.document?.fonts || (typeof document !== 'undefined' ? document.fonts : null);
  if (!docFonts || typeof docFonts.check !== 'function') {
    // In non-browser environments (e.g. Node tests), assume available
    return true;
  }

  try {
    // Check multiple weights/sizes
    return (
      docFonts.check(`16px "${fontFamily}"`) ||
      docFonts.check(`bold 16px "${fontFamily}"`) ||
      docFonts.check(`10pt "${fontFamily}"`)
    );
  } catch (e) {
    return false;
  }
}

/**
 * Ensures Google Font stylesheet links exist in document `<head>` and waits
 * for `document.fonts.load()` to resolve for all required fonts.
 *
 * @param {string[]} fontFamilies - Array of font family names to load.
 * @param {Object} [options] - Options including timeout and optional document override.
 * @returns {Promise<{ loaded: string[], failed: string[] }>} Result object.
 */
export async function loadFonts(fontFamilies = [], options = {}) {
  const doc = options.document || (typeof document !== 'undefined' ? document : null);
  const timeoutMs = options.timeout || 3000;

  if (!doc) {
    return { loaded: fontFamilies, failed: [] };
  }

  // 1. Identify missing Google Fonts link tags and build/inject missing link tag
  const missingQueries = [];
  fontFamilies.forEach((family) => {
    const config = CONFIGURED_FONTS[family];
    if (config) {
      missingQueries.push(config.googleFontQuery);
    }
  });

  if (missingQueries.length > 0 && doc.head) {
    const fontHref = `https://fonts.googleapis.com/css2?${missingQueries.map((q) => `family=${q}`).join('&')}&display=swap`;
    const existingLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
    const linkExists = existingLinks.some((link) => link.href && link.href.includes(fontHref));

    if (!linkExists) {
      const link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontHref;
      doc.head.appendChild(link);
    }
  }

  // 2. Trigger document.fonts.load() for each required font family
  const docFonts = doc.fonts;
  if (!docFonts || typeof docFonts.load !== 'function') {
    return { loaded: fontFamilies, failed: [] };
  }

  const loaded = [];
  const failed = [];

  const loadPromises = fontFamilies.map(async (family) => {
    try {
      const loadTask = Promise.all([
        docFonts.load(`16px "${family}"`),
        docFonts.load(`bold 16px "${family}"`)
      ]);

      const timeoutTask = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Font load timeout')), timeoutMs)
      );

      await Promise.race([loadTask, timeoutTask]);

      if (isFontLoaded(family, { document: doc })) {
        loaded.push(family);
      } else {
        failed.push(family);
      }
    } catch (err) {
      failed.push(family);
    }
  });

  await Promise.allSettled(loadPromises);

  // Wait for document.fonts.ready as final confirmation
  if (docFonts.ready) {
    try {
      await Promise.race([
        docFonts.ready,
        new Promise((resolve) => setTimeout(resolve, 500))
      ]);
    } catch (e) {
      // ignore
    }
  }

  return { loaded, failed };
}
