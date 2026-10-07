import { VALID_PAGE_TYPES } from './preflight.js';

export const CURRENT_SCHEMA_VERSION = '1.0.0';
export const CURRENT_GENERATOR_VERSION = '0.1.0';

export const VALID_BLOCK_TYPES = new Set([
  'heading',
  'paragraph',
  'richText',
  'list',
  'table',
  'quote',
  'image',
  'imageText',
  'twoColumn',
  'threeColumn',
  'divider',
  'spacer',
  'qrCode',
  'logo',
  'photoGrid',
  'caption',
  'emblem',
  'custom'
]);

function isFiniteNumber(val) {
  return typeof val === 'number' && Number.isFinite(val);
}

export function isValidAssetUrl(url, assets = []) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return true; // empty strings are allowed placeholders

  const isAssetRef = trimmed.startsWith('asset-') || trimmed.startsWith('asset:');
  if (isAssetRef) return true;

  if (Array.isArray(assets)) {
    const rawId = trimmed.startsWith('asset:') ? trimmed.substring(6) : trimmed;
    if (assets.some((a) => a && (a.id === trimmed || a.id === rawId))) {
      return true;
    }
  }

  return (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  );
}

/**
 * Validates a booklet project object against the schema.
 * @param {any} data
 * @returns {{ valid: boolean, errors: Array<{ path: string, message: string }> }}
 */
export function validateProject(data) {
  const errors = [];

  const addErr = (path, message) => {
    errors.push({ path, message });
  };

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    addErr('root', 'Project data must be a non-null object.');
    return { valid: false, errors };
  }

  // 1. Validate Metadata
  if (data.schemaVersion === undefined || data.schemaVersion === null) {
    addErr('schemaVersion', 'Missing required metadata field "schemaVersion".');
  } else if (typeof data.schemaVersion !== 'string' || !/^\d+\.\d+\.\d+/.test(data.schemaVersion)) {
    addErr('schemaVersion', `Invalid "schemaVersion" format: expected semver string (e.g. "1.0.0"), received ${JSON.stringify(data.schemaVersion)}.`);
  }

  if (data.generatorVersion !== undefined && data.generatorVersion !== null) {
    if (typeof data.generatorVersion !== 'string') {
      addErr('generatorVersion', 'Metadata field "generatorVersion" must be a string.');
    }
  }

  if (data.createdAt !== undefined && data.createdAt !== null) {
    if (typeof data.createdAt !== 'string' && typeof data.createdAt !== 'number') {
      addErr('createdAt', 'Metadata field "createdAt" must be an ISO string or timestamp.');
    } else if (typeof data.createdAt === 'string' && isNaN(Date.parse(data.createdAt))) {
      addErr('createdAt', `Invalid ISO date string in "createdAt": "${data.createdAt}".`);
    }
  }

  if (data.updatedAt !== undefined && data.updatedAt !== null) {
    if (typeof data.updatedAt !== 'string' && typeof data.updatedAt !== 'number') {
      addErr('updatedAt', 'Metadata field "updatedAt" must be an ISO string or timestamp.');
    } else if (typeof data.updatedAt === 'string' && isNaN(Date.parse(data.updatedAt))) {
      addErr('updatedAt', `Invalid ISO date string in "updatedAt": "${data.updatedAt}".`);
    }
  }

  // 2. Validate Assets Registry
  const assetsList = data.assets;
  if (assetsList !== undefined && assetsList !== null) {
    if (!Array.isArray(assetsList)) {
      addErr('assets', 'Field "assets" must be an array.');
    } else {
      assetsList.forEach((asset, aIdx) => {
        const aPath = `assets[${aIdx}]`;
        if (!asset || typeof asset !== 'object' || Array.isArray(asset)) {
          addErr(aPath, `Asset at index ${aIdx} must be an object.`);
          return;
        }

        if (!asset.id || typeof asset.id !== 'string') {
          addErr(`${aPath}.id`, `Asset at index ${aIdx} must have a valid string "id".`);
        }

        const nameVal = asset.name || asset.filename;
        if (!nameVal || typeof nameVal !== 'string') {
          addErr(`${aPath}.name`, `Asset at index ${aIdx} must have a string "name" or "filename".`);
        }

        if (asset.mimeType !== undefined && asset.mimeType !== null && typeof asset.mimeType !== 'string') {
          addErr(`${aPath}.mimeType`, `Asset at index ${aIdx} "mimeType" must be a string.`);
        }

        if (asset.width !== undefined && asset.width !== null && !isFiniteNumber(asset.width)) {
          addErr(`${aPath}.width`, `Asset at index ${aIdx} "width" must be a finite number.`);
        }

        if (asset.height !== undefined && asset.height !== null && !isFiniteNumber(asset.height)) {
          addErr(`${aPath}.height`, `Asset at index ${aIdx} "height" must be a finite number.`);
        }

        const sizeVal = asset.size !== undefined ? asset.size : asset.fileSize;
        if (sizeVal !== undefined && sizeVal !== null && !isFiniteNumber(sizeVal)) {
          addErr(`${aPath}.size`, `Asset at index ${aIdx} "size" must be a finite number.`);
        }

        const srcVal = asset.src || asset.url || asset.data;
        if (srcVal === undefined || srcVal === null || typeof srcVal !== 'string') {
          addErr(`${aPath}.src`, `Asset at index ${aIdx} must have a valid string "src" or "url".`);
        }
      });
    }
  }

  // 3. Validate Project Structure & Title
  if (data.title === undefined || data.title === null) {
    addErr('title', 'Missing required field "title".');
  } else if (typeof data.title !== 'string') {
    addErr('title', 'Field "title" must be a string.');
  }

  if (data.theme !== undefined && data.theme !== null) {
    if (typeof data.theme !== 'object' || Array.isArray(data.theme)) {
      addErr('theme', 'Field "theme" must be an object.');
    } else {
      // Validate theme assets & fonts
      if (data.theme.bgImage && !isValidAssetUrl(data.theme.bgImage, assetsList)) {
        addErr('theme.bgImage', 'Theme "bgImage" is not a valid asset URL or data URI.');
      }
      if (data.theme.titleFont && typeof data.theme.titleFont !== 'string') {
        addErr('theme.titleFont', 'Theme "titleFont" must be a string.');
      }
      if (data.theme.bgImageOpacity !== undefined && !isFiniteNumber(data.theme.bgImageOpacity)) {
        addErr('theme.bgImageOpacity', 'Theme "bgImageOpacity" must be a finite number.');
      }
    }
  }

  // 4. Validate Pages
  if (!Array.isArray(data.pages)) {
    addErr('pages', 'Field "pages" must be an array of page objects.');
    return { valid: errors.length === 0, errors };
  }

  if (data.pages.length === 0) {
    addErr('pages', 'Project must contain at least one page.');
  }

  data.pages.forEach((page, pIdx) => {
    const pPath = `pages[${pIdx}]`;

    if (!page || typeof page !== 'object' || Array.isArray(page)) {
      addErr(pPath, `Page at index ${pIdx} must be a valid page object.`);
      return;
    }

    if (!page.id || (typeof page.id !== 'string' && typeof page.id !== 'number')) {
      addErr(`${pPath}.id`, `Page ${pIdx + 1} is missing a valid string or numeric "id".`);
    }

    if (!page.type || typeof page.type !== 'string') {
      addErr(`${pPath}.type`, `Page ${pIdx + 1} is missing a string "type".`);
    } else if (!VALID_PAGE_TYPES.has(page.type)) {
      addErr(`${pPath}.type`, `Page ${pIdx + 1} has unrecognized page type "${page.type}". Valid types are: ${Array.from(VALID_PAGE_TYPES).join(', ')}.`);
    }

    if (page.title !== undefined && page.title !== null && typeof page.title !== 'string') {
      addErr(`${pPath}.title`, `Page ${pIdx + 1} "title" must be a string.`);
    }

    // Page assets check
    ['bgImage', 'emblemImg', 'speakerImg', 'qrImg', 'honoreePhoto'].forEach((assetKey) => {
      if (page[assetKey] !== undefined && page[assetKey] !== null) {
        if (!isValidAssetUrl(page[assetKey], assetsList)) {
          addErr(`${pPath}.${assetKey}`, `Page ${pIdx + 1} asset "${assetKey}" is not a valid URL or data URI.`);
        }
      }
    });

    // Page-specific structures
    if (page.type === 'schedule' && page.items !== undefined) {
      if (!Array.isArray(page.items)) {
        addErr(`${pPath}.items`, `Schedule page ${pIdx + 1} "items" must be an array.`);
      } else {
        page.items.forEach((item, iIdx) => {
          if (!item || typeof item !== 'object') {
            addErr(`${pPath}.items[${iIdx}]`, `Schedule item ${iIdx + 1} on page ${pIdx + 1} must be an object.`);
          }
        });
      }
    }

    if (page.type === 'leadership' && page.leaders !== undefined) {
      if (!Array.isArray(page.leaders)) {
        addErr(`${pPath}.leaders`, `Leadership page ${pIdx + 1} "leaders" must be an array.`);
      } else {
        page.leaders.forEach((leader, lIdx) => {
          if (!leader || typeof leader !== 'object') {
            addErr(`${pPath}.leaders[${lIdx}]`, `Leader item ${lIdx + 1} on page ${pIdx + 1} must be an object.`);
          } else if (leader.img && !isValidAssetUrl(leader.img, assetsList)) {
            addErr(`${pPath}.leaders[${lIdx}].img`, `Leader ${lIdx + 1} image on page ${pIdx + 1} is an invalid asset URL.`);
          }
        });
      }
    }

    if (page.type === 'roster' && page.members !== undefined) {
      if (!Array.isArray(page.members)) {
        addErr(`${pPath}.members`, `Roster page ${pIdx + 1} "members" must be an array.`);
      }
    }

    if (page.type === 'awards') {
      if (page.awards !== undefined && !Array.isArray(page.awards)) {
        addErr(`${pPath}.awards`, `Awards page ${pIdx + 1} "awards" must be an array.`);
      }
      if (page.featuredAwards !== undefined && !Array.isArray(page.featuredAwards)) {
        addErr(`${pPath}.featuredAwards`, `Awards page ${pIdx + 1} "featuredAwards" must be an array.`);
      }
    }

    // Page Layout values checks
    const numericLayoutKeys = [
      'emblemOffsetX', 'emblemOffsetY', 'emblemWidth', 'emblemHeight', 'emblemOpacity',
      'titleGroupOffsetX', 'titleGroupOffsetY', 'taglineOffsetX', 'taglineOffsetY',
      'headerGroupOffsetX', 'headerGroupOffsetY', 'qrGroupOffsetX', 'qrGroupOffsetY',
      'pageTitleOffsetX', 'pageTitleOffsetY', 'mainContentOffsetX', 'mainContentOffsetY',
      'bgImageOpacity'
    ];

    numericLayoutKeys.forEach((key) => {
      if (page[key] !== undefined && page[key] !== null && !isFiniteNumber(page[key])) {
        addErr(`${pPath}.${key}`, `Page ${pIdx + 1} layout value "${key}" must be a finite number, received ${JSON.stringify(page[key])}.`);
      }
    });

    // 5. Validate Blocks
    if (page.blocks !== undefined && page.blocks !== null) {
      if (!Array.isArray(page.blocks)) {
        addErr(`${pPath}.blocks`, `Page ${pIdx + 1} "blocks" must be an array.`);
      } else {
        page.blocks.forEach((block, bIdx) => {
          const bPath = `${pPath}.blocks[${bIdx}]`;

          if (!block || typeof block !== 'object' || Array.isArray(block)) {
            addErr(bPath, `Block ${bIdx + 1} on page ${pIdx + 1} must be an object.`);
            return;
          }

          if (!block.type || typeof block.type !== 'string') {
            addErr(`${bPath}.type`, `Block ${bIdx + 1} on page ${pIdx + 1} is missing a string "type".`);
          } else if (!VALID_BLOCK_TYPES.has(block.type)) {
            addErr(`${bPath}.type`, `Block ${bIdx + 1} on page ${pIdx + 1} has invalid block type "${block.type}".`);
          }

          if (block.id !== undefined && block.id !== null && typeof block.id !== 'string' && typeof block.id !== 'number') {
            addErr(`${bPath}.id`, `Block ${bIdx + 1} on page ${pIdx + 1} "id" must be a string or number.`);
          }

          if (block.text !== undefined && block.text !== null && typeof block.text !== 'string') {
            addErr(`${bPath}.text`, `Block ${bIdx + 1} on page ${pIdx + 1} "text" must be a string.`);
          }

          if (block.url !== undefined && block.url !== null) {
            if (!isValidAssetUrl(block.url, assetsList)) {
              addErr(`${bPath}.url`, `Block ${bIdx + 1} on page ${pIdx + 1} "url" is not a valid asset URL or data URI.`);
            }
          }

          if (block.qrUrl !== undefined && block.qrUrl !== null) {
            if (typeof block.qrUrl !== 'string') {
              addErr(`${bPath}.qrUrl`, `Block ${bIdx + 1} on page ${pIdx + 1} "qrUrl" must be a string.`);
            }
          }

          if (block.items !== undefined && block.items !== null) {
            if (!Array.isArray(block.items)) {
              addErr(`${bPath}.items`, `Block ${bIdx + 1} on page ${pIdx + 1} "items" must be an array.`);
            }
          }

          if (block.images !== undefined && block.images !== null) {
            if (!Array.isArray(block.images)) {
              addErr(`${bPath}.images`, `Block ${bIdx + 1} on page ${pIdx + 1} "images" must be an array.`);
            } else {
              block.images.forEach((imgUrl, imgIdx) => {
                if (imgUrl && !isValidAssetUrl(imgUrl, assetsList)) {
                  addErr(`${bPath}.images[${imgIdx}]`, `Block ${bIdx + 1} on page ${pIdx + 1} photo grid image ${imgIdx + 1} is an invalid asset URL.`);
                }
              });
            }
          }

          if (block.columns !== undefined && block.columns !== null && block.type !== 'photoGrid') {
            if (!Array.isArray(block.columns)) {
              addErr(`${bPath}.columns`, `Block ${bIdx + 1} on page ${pIdx + 1} "columns" must be an array.`);
            }
          }

          // Block layout values check
          ['offsetX', 'offsetY', 'width', 'height', 'zIndex', 'scale', 'rotation'].forEach((bKey) => {
            if (block[bKey] !== undefined && block[bKey] !== null && !isFiniteNumber(block[bKey])) {
              addErr(`${bPath}.${bKey}`, `Block ${bIdx + 1} on page ${pIdx + 1} layout property "${bKey}" must be a finite number.`);
            }
          });
        });
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
