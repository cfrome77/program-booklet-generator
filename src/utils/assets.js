/**
 * Utility module for booklet image asset management.
 */

/**
 * Creates a normalized asset object with full metadata.
 */
export function createAssetObject({
  id,
  name,
  filename,
  mimeType,
  width = 0,
  height = 0,
  size = 0,
  fileSize,
  src,
  url,
  data
} = {}) {
  const assetId = id || `asset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const assetName = name || filename || 'Untitled Asset';
  const assetMime = mimeType || 'image/png';
  const assetSize = typeof size === 'number' && size >= 0 ? size : (typeof fileSize === 'number' && fileSize >= 0 ? fileSize : 0);
  const assetSrc = src || url || data || '';

  return {
    id: String(assetId),
    name: String(assetName),
    filename: String(assetName),
    mimeType: String(assetMime),
    width: Number(width) || 0,
    height: Number(height) || 0,
    size: Number(assetSize) || 0,
    fileSize: Number(assetSize) || 0,
    src: String(assetSrc),
    createdAt: new Date().toISOString()
  };
}

/**
 * Helper to estimate byte size from base64/data URI string
 */
export function calculateBase64Size(dataUri) {
  if (!dataUri || typeof dataUri !== 'string') return 0;
  if (!dataUri.startsWith('data:')) return dataUri.length;
  const commaIdx = dataUri.indexOf(',');
  if (commaIdx === -1) return dataUri.length;
  const base64Str = dataUri.substring(commaIdx + 1);
  const padding = (base64Str.match(/=/g) || []).length;
  return Math.max(0, Math.floor((base64Str.length * 3) / 4) - padding);
}

/**
 * Extracts mime type from data URI or filename
 */
export function detectMimeType(dataUriOrFilename) {
  if (!dataUriOrFilename || typeof dataUriOrFilename !== 'string') return 'image/png';
  if (dataUriOrFilename.startsWith('data:')) {
    const match = dataUriOrFilename.match(/^data:([^;]+);/);
    if (match) return match[1];
  }
  const lower = dataUriOrFilename.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'image/png';
}

/**
 * Process a browser File object into an Asset Object asynchronously
 */
export function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('FileReader did not return a string.'));
        return;
      }

      // Read dimensions if in browser context
      if (typeof Image !== 'undefined') {
        const img = new Image();
        img.onload = () => {
          resolve(
            createAssetObject({
              name: file.name,
              mimeType: file.type || detectMimeType(file.name),
              size: file.size,
              width: img.naturalWidth || 0,
              height: img.naturalHeight || 0,
              src: dataUrl
            })
          );
        };
        img.onerror = () => {
          // Fallback if image fails to decode dimensions
          resolve(
            createAssetObject({
              name: file.name,
              mimeType: file.type || detectMimeType(file.name),
              size: file.size,
              width: 0,
              height: 0,
              src: dataUrl
            })
          );
        };
        img.src = dataUrl;
      } else {
        // Fallback for non-browser/node environment
        resolve(
          createAssetObject({
            name: file.name,
            mimeType: file.type || detectMimeType(file.name),
            size: file.size,
            width: 0,
            height: 0,
            src: dataUrl
          })
        );
      }
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Resolves a reference (asset ID or direct URL/data URI) to the underlying image source URL/data URI.
 * @param {Object|Array} bookletOrAssets - Booklet state or assets array
 * @param {string} ref - Asset ID or direct image URL / data URI
 * @returns {string} The resolved image URL or data URI
 */
export function resolveAssetUrl(bookletOrAssets, ref) {
  if (!ref || typeof ref !== 'string') return '';
  const trimmed = ref.trim();
  if (!trimmed) return '';

  const assets = Array.isArray(bookletOrAssets)
    ? bookletOrAssets
    : Array.isArray(bookletOrAssets?.assets)
    ? bookletOrAssets.assets
    : [];

  const rawId = trimmed.startsWith('asset:') ? trimmed.substring(6) : trimmed;

  const found = assets.find((a) => a && (a.id === trimmed || a.id === rawId));
  if (found && found.src) {
    return found.src;
  }

  return trimmed;
}

/**
 * Resolves metadata for an asset ID or reference.
 */
export function resolveAssetMeta(bookletOrAssets, ref) {
  if (!ref || typeof ref !== 'string') return null;
  const trimmed = ref.trim();
  if (!trimmed) return null;

  const assets = Array.isArray(bookletOrAssets)
    ? bookletOrAssets
    : Array.isArray(bookletOrAssets?.assets)
    ? bookletOrAssets.assets
    : [];

  const rawId = trimmed.startsWith('asset:') ? trimmed.substring(6) : trimmed;
  return assets.find((a) => a && (a.id === trimmed || a.id === rawId)) || null;
}

/**
 * Collects all image references across global theme, page fields, and content blocks.
 * @param {Object} booklet
 * @returns {Set<string>} Set of image references (asset IDs or URLs)
 */
export function getAllReferencedImageRefs(booklet) {
  const refs = new Set();
  if (!booklet || typeof booklet !== 'object') return refs;

  // 1. Theme background image
  if (booklet.theme?.bgImage) {
    refs.add(booklet.theme.bgImage.trim());
  }

  // 2. Page image fields
  const pages = Array.isArray(booklet.pages) ? booklet.pages : [];
  pages.forEach((page) => {
    if (!page || typeof page !== 'object') return;

    ['bgImage', 'emblemImg', 'qrImg', 'speakerImg', 'honoreePhoto'].forEach((field) => {
      if (page[field] && typeof page[field] === 'string' && page[field].trim()) {
        refs.add(page[field].trim());
      }
    });

    // Page items / sub-arrays
    if (Array.isArray(page.leaders)) {
      page.leaders.forEach((l) => {
        if (l?.img && typeof l.img === 'string' && l.img.trim()) {
          refs.add(l.img.trim());
        }
      });
    }

    if (Array.isArray(page.featuredAwards)) {
      page.featuredAwards.forEach((f) => {
        if (f?.medallionImg && typeof f.medallionImg === 'string' && f.medallionImg.trim()) {
          refs.add(f.medallionImg.trim());
        }
      });
    }

    if (Array.isArray(page.members)) {
      page.members.forEach((m) => {
        if (m?.photo && typeof m.photo === 'string' && m.photo.trim()) {
          refs.add(m.photo.trim());
        }
      });
    }

    // Content blocks
    if (Array.isArray(page.blocks)) {
      page.blocks.forEach((block) => {
        if (block?.type === 'image' && block.url && typeof block.url === 'string' && block.url.trim()) {
          refs.add(block.url.trim());
        }
      });
    }
  });

  return refs;
}

/**
 * Returns list of asset objects in `booklet.assets` that are not referenced anywhere.
 */
export function getUnusedAssets(booklet) {
  const assets = Array.isArray(booklet?.assets) ? booklet.assets : [];
  if (assets.length === 0) return [];

  const referencedRefs = getAllReferencedImageRefs(booklet);

  return assets.filter((asset) => {
    if (!asset || !asset.id) return false;
    const rawId = asset.id;
    const prefId = `asset:${asset.id}`;

    return !referencedRefs.has(rawId) && !referencedRefs.has(prefId);
  });
}

/**
 * Returns detailed analysis of broken image references across the project.
 */
export function getBrokenImageReferences(booklet) {
  const broken = [];
  if (!booklet || typeof booklet !== 'object') return broken;

  const assets = Array.isArray(booklet.assets) ? booklet.assets : [];
  const assetMap = new Map();
  assets.forEach((a) => {
    if (a?.id) assetMap.set(a.id, a);
  });

  // Check assets for missing or empty source
  assets.forEach((asset, idx) => {
    if (!asset || typeof asset !== 'object') {
      broken.push({
        type: 'asset',
        location: `assets[${idx}]`,
        message: 'Invalid or null asset object in asset manager.'
      });
      return;
    }

    if (!asset.src || typeof asset.src !== 'string' || !asset.src.trim()) {
      broken.push({
        type: 'asset',
        assetId: asset.id,
        name: asset.name,
        location: `Asset Library (${asset.name || asset.id})`,
        message: `Asset "${asset.name || asset.id}" is missing image source data.`
      });
    }
  });

  // Check referenced image fields in booklet
  const checkRef = (ref, location, pageIndex = null, blockIndex = null) => {
    if (!ref || typeof ref !== 'string') return;
    const trimmed = ref.trim();
    if (!trimmed) return;

    const isAssetRef = trimmed.startsWith('asset-') || trimmed.startsWith('asset:');
    if (isAssetRef) {
      const rawId = trimmed.startsWith('asset:') ? trimmed.substring(6) : trimmed;
      const targetAsset = assetMap.get(rawId) || assetMap.get(trimmed);

      if (!targetAsset) {
        broken.push({
          type: 'reference',
          ref: trimmed,
          location,
          pageIndex,
          blockIndex,
          message: `Referenced image asset "${trimmed}" does not exist in asset library.`
        });
      } else if (!targetAsset.src || !targetAsset.src.trim()) {
        broken.push({
          type: 'reference',
          ref: trimmed,
          assetId: targetAsset.id,
          location,
          pageIndex,
          blockIndex,
          message: `Referenced asset "${targetAsset.name || targetAsset.id}" has empty or missing image data.`
        });
      }
    } else {
      // Validate direct URL / data URI format
      const isValid =
        trimmed.startsWith('data:') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('/') ||
        trimmed.startsWith('./') ||
        trimmed.startsWith('../');

      if (!isValid) {
        broken.push({
          type: 'reference',
          ref: trimmed,
          location,
          pageIndex,
          blockIndex,
          message: `Invalid or malformed image URL reference "${trimmed}".`
        });
      }
    }
  };

  if (booklet.theme?.bgImage) {
    checkRef(booklet.theme.bgImage, 'Global Theme Background');
  }

  const pages = Array.isArray(booklet.pages) ? booklet.pages : [];
  pages.forEach((p, pIdx) => {
    if (!p || typeof p !== 'object') return;
    const pLabel = `Page ${pIdx + 1}`;

    if (p.bgImage) checkRef(p.bgImage, `${pLabel} Background Image`, pIdx);
    if (p.emblemImg) checkRef(p.emblemImg, `${pLabel} Cover Emblem Image`, pIdx);
    if (p.qrImg) checkRef(p.qrImg, `${pLabel} Back Cover QR Image`, pIdx);
    if (p.speakerImg) checkRef(p.speakerImg, `${pLabel} Keynote Speaker Image`, pIdx);
    if (p.honoreePhoto) checkRef(p.honoreePhoto, `${pLabel} Vigil Honoree Photo`, pIdx);

    if (Array.isArray(p.leaders)) {
      p.leaders.forEach((l, lIdx) => {
        if (l?.img) checkRef(l.img, `${pLabel} Leader ${lIdx + 1} Image`, pIdx);
      });
    }

    if (Array.isArray(p.featuredAwards)) {
      p.featuredAwards.forEach((f, fIdx) => {
        if (f?.medallionImg) checkRef(f.medallionImg, `${pLabel} Featured Award ${fIdx + 1} Medallion`, pIdx);
      });
    }

    if (Array.isArray(p.members)) {
      p.members.forEach((m, mIdx) => {
        if (m?.photo) checkRef(m.photo, `${pLabel} Roster Member ${mIdx + 1} Photo`, pIdx);
      });
    }

    if (Array.isArray(p.blocks)) {
      p.blocks.forEach((b, bIdx) => {
        if (b?.type === 'image' && b.url) {
          checkRef(b.url, `${pLabel} Content Block ${bIdx + 1} (Image)`, pIdx, bIdx);
        }
      });
    }
  });

  return broken;
}
