import { CURRENT_SCHEMA_VERSION, CURRENT_GENERATOR_VERSION } from './schemaValidator.js';
import { createAssetObject, calculateBase64Size, detectMimeType } from './assets.js';

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

  // Ensure assets array exists and assets are normalized
  const rawAssets = Array.isArray(booklet.assets) ? booklet.assets : [];
  const assetsMap = new Map();

  booklet.assets = rawAssets.map((asset, idx) => {
    if (!asset || typeof asset !== 'object') return null;
    const norm = createAssetObject({
      id: asset.id || `asset-${idx + 1}`,
      name: asset.name || asset.filename || `Asset ${idx + 1}`,
      mimeType: asset.mimeType || detectMimeType(asset.src || asset.url),
      width: asset.width,
      height: asset.height,
      size: asset.size !== undefined ? asset.size : asset.fileSize,
      src: asset.src || asset.url || asset.data || ''
    });

    if (norm.src) {
      assetsMap.set(norm.src, norm.id);
    }
    assetsMap.set(norm.id, norm.id);
    return norm;
  }).filter(Boolean);

  // Helper to migrate embedded base64 data URIs into asset registry
  const migrateImageField = (val, defaultName = 'Migrated Image') => {
    if (typeof val !== 'string' || !val.trim()) return val;
    const trimmed = val.trim();

    if (assetsMap.has(trimmed)) {
      return assetsMap.get(trimmed);
    }

    if (trimmed.startsWith('asset-') || trimmed.startsWith('asset:')) {
      return trimmed;
    }

    // Direct Data URI -> Convert to Asset
    if (trimmed.startsWith('data:')) {
      const mimeType = detectMimeType(trimmed);
      const size = calculateBase64Size(trimmed);
      const newAsset = createAssetObject({
        name: `${defaultName} ${booklet.assets.length + 1}`,
        mimeType,
        size,
        width: 0,
        height: 0,
        src: trimmed
      });

      booklet.assets.push(newAsset);
      assetsMap.set(trimmed, newAsset.id);
      assetsMap.set(newAsset.id, newAsset.id);
      return newAsset.id;
    }

    return trimmed;
  };

  if (!booklet.theme || typeof booklet.theme !== 'object' || Array.isArray(booklet.theme)) {
    booklet.theme = {
      bgCream: "#f4eedb",
      navyDark: "#122230",
      tealAccent: "#005f73",
      charcoal: "#2b2b2b",
      bgImage: "",
      titleFont: "'Cinzel', serif"
    };
  } else if (booklet.theme.bgImage) {
    booklet.theme.bgImage = migrateImageField(booklet.theme.bgImage, 'Theme Background Image');
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

    // Migrate page embedded images
    ['bgImage', 'emblemImg', 'qrImg', 'speakerImg', 'honoreePhoto'].forEach((assetKey) => {
      if (cleanPage[assetKey]) {
        cleanPage[assetKey] = migrateImageField(cleanPage[assetKey], `Page ${idx + 1} ${assetKey}`);
      }
    });

    if (Array.isArray(cleanPage.leaders)) {
      cleanPage.leaders = cleanPage.leaders.map((l, lIdx) => {
        if (!l || typeof l !== 'object') return l;
        if (l.img) {
          return { ...l, img: migrateImageField(l.img, `Page ${idx + 1} Leader ${lIdx + 1}`) };
        }
        return l;
      });
    }

    if (Array.isArray(cleanPage.featuredAwards)) {
      cleanPage.featuredAwards = cleanPage.featuredAwards.map((f, fIdx) => {
        if (!f || typeof f !== 'object') return f;
        if (f.medallionImg) {
          return { ...f, medallionImg: migrateImageField(f.medallionImg, `Page ${idx + 1} Award ${fIdx + 1}`) };
        }
        return f;
      });
    }

    if (Array.isArray(cleanPage.members)) {
      cleanPage.members = cleanPage.members.map((m, mIdx) => {
        if (!m || typeof m !== 'object') return m;
        if (m.photo) {
          return { ...m, photo: migrateImageField(m.photo, `Page ${idx + 1} Member ${mIdx + 1}`) };
        }
        return m;
      });
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

        if (cleanBlock.type === 'image' && cleanBlock.url) {
          cleanBlock.url = migrateImageField(cleanBlock.url, `Page ${idx + 1} Block ${bIdx + 1} Image`);
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
