import { CURRENT_SCHEMA_VERSION, CURRENT_GENERATOR_VERSION } from './schemaValidator.js';

/**
 * Migrates a booklet project data object from legacy formats or older schema versions
 * to the current schema version (1.0.0).
 *
 * @param {Object} inputData - Raw project data object
 * @returns {Object} Migrated project data object
 */
export function migrateProject(inputData) {
  if (!inputData || typeof inputData !== 'object' || Array.isArray(inputData)) {
    return inputData;
  }

  // Deep clone to avoid mutating input directly
  const booklet = JSON.parse(JSON.stringify(inputData));

  const now = new Date().toISOString();

  // Ensure top-level metadata
  booklet.schemaVersion = CURRENT_SCHEMA_VERSION;
  booklet.generatorVersion = booklet.generatorVersion || CURRENT_GENERATOR_VERSION;
  booklet.createdAt = booklet.createdAt || now;
  booklet.updatedAt = booklet.updatedAt || now;
  booklet.title = typeof booklet.title === 'string' && booklet.title.trim() ? booklet.title : 'Untitled Booklet';

  if (!booklet.theme || typeof booklet.theme !== 'object' || Array.isArray(booklet.theme)) {
    booklet.theme = {
      bgCream: "#f4eedb",
      navyDark: "#122230",
      tealAccent: "#005f73",
      charcoal: "#2b2b2b",
      bgImage: "",
      titleFont: "'Cinzel', serif"
    };
  }

  if (!Array.isArray(booklet.pages)) {
    booklet.pages = [];
  }

  // Migrate/clean pages
  booklet.pages = booklet.pages.map((page, idx) => {
    if (!page || typeof page !== 'object' || Array.isArray(page)) {
      return {
        id: `page-${idx + 1}`,
        type: 'custom',
        title: `Page ${idx + 1}`,
        content: '',
        blocks: []
      };
    }

    const cleanPage = { ...page };

    if (!cleanPage.id || (typeof cleanPage.id !== 'string' && typeof cleanPage.id !== 'number')) {
      cleanPage.id = `page-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`;
    } else {
      cleanPage.id = String(cleanPage.id);
    }

    if (!cleanPage.type || typeof cleanPage.type !== 'string') {
      cleanPage.type = 'custom';
    }

    if (!cleanPage.title) {
      cleanPage.title = cleanPage.type === 'cover' ? 'COVER PAGE' : `Page ${idx + 1}`;
    }

    if (!Array.isArray(cleanPage.blocks)) {
      cleanPage.blocks = [];
    } else {
      cleanPage.blocks = cleanPage.blocks.map((block, bIdx) => {
        if (!block || typeof block !== 'object' || Array.isArray(block)) {
          return {
            id: `b-${bIdx + 1}`,
            type: 'paragraph',
            text: ''
          };
        }

        const cleanBlock = { ...block };
        if (!cleanBlock.id) {
          cleanBlock.id = `b-${bIdx + 1}-${Math.random().toString(36).substring(2, 7)}`;
        }
        if (!cleanBlock.type || typeof cleanBlock.type !== 'string') {
          cleanBlock.type = 'paragraph';
        }

        // Fix non-finite layout numbers on block
        ['offsetX', 'offsetY', 'width', 'height', 'zIndex', 'scale', 'rotation'].forEach((key) => {
          if (cleanBlock[key] !== undefined && (typeof cleanBlock[key] !== 'number' || !Number.isFinite(cleanBlock[key]))) {
            delete cleanBlock[key];
          }
        });

        return cleanBlock;
      });
    }

    // Fix non-finite layout numbers on page
    const numericLayoutKeys = [
      'emblemOffsetX', 'emblemOffsetY', 'emblemWidth', 'emblemHeight', 'emblemOpacity',
      'titleGroupOffsetX', 'titleGroupOffsetY', 'taglineOffsetX', 'taglineOffsetY',
      'headerGroupOffsetX', 'headerGroupOffsetY', 'qrGroupOffsetX', 'qrGroupOffsetY',
      'pageTitleOffsetX', 'pageTitleOffsetY', 'mainContentOffsetX', 'mainContentOffsetY',
      'bgImageOpacity'
    ];

    numericLayoutKeys.forEach((key) => {
      if (cleanPage[key] !== undefined && (typeof cleanPage[key] !== 'number' || !Number.isFinite(cleanPage[key]))) {
        delete cleanPage[key];
      }
    });

    return cleanPage;
  });

  return booklet;
}
