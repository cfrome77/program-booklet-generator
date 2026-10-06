import { calculateImpositionSheets } from './imposition.js';
import { getUnusedAssets, getBrokenImageReferences, resolveAssetUrl } from './assets.js';

/**
 * Valid page types allowed in the booklet system.
 */
export const VALID_PAGE_TYPES = new Set([
  'cover',
  'backCover',
  'schedule',
  'leadership',
  'keynote',
  'awards',
  'vigilIntro',
  'roster',
  'custom'
]);

/**
 * Runs a comprehensive preflight inspection on the booklet state.
 *
 * @param {Object} booklet - The full booklet state object (containing title, theme, pages).
 * @param {Object} [options] - Optional options, e.g. document object for font checks.
 * @returns {Object} Preflight result object containing status, stats, issues, and counts.
 */
export function runPreflight(booklet, options = {}) {
  const issues = [];
  const pages = booklet?.pages || [];
  const theme = booklet?.theme || {};

  // Helper to add issue
  const addIssue = ({ severity, category, message, pageIndex = null, pageNum = null, blockIndex = null }) => {
    issues.push({
      id: `issue-${issues.length + 1}`,
      severity, // 'ERROR' | 'WARNING' | 'INFO'
      category, // 'Page Structure' | 'Content' | 'Layout' | 'Typography' | 'Imposition'
      message,
      pageIndex,
      pageNum: pageNum !== null ? pageNum : (pageIndex !== null ? pageIndex + 1 : null),
      blockIndex
    });
  };

  // --------------------------------------------------------------------------
  // 1. PAGE STRUCTURE CHECKS
  // --------------------------------------------------------------------------
  const rawPageCount = pages.length;

  if (rawPageCount === 0) {
    addIssue({
      severity: 'ERROR',
      category: 'Page Structure',
      message: 'Booklet contains no pages. Add at least one page before printing.'
    });
  }

  // Duplicate or missing page IDs
  const seenIds = new Map();
  pages.forEach((p, idx) => {
    if (!p.id) {
      addIssue({
        severity: 'WARNING',
        category: 'Page Structure',
        message: `Page ${idx + 1} is missing a unique ID property.`,
        pageIndex: idx
      });
    } else if (seenIds.has(p.id)) {
      addIssue({
        severity: 'ERROR',
        category: 'Page Structure',
        message: `Duplicate page ID "${p.id}" detected on Page ${idx + 1} (first seen on Page ${seenIds.get(p.id) + 1}).`,
        pageIndex: idx
      });
    } else {
      seenIds.set(p.id, idx);
    }

    // Invalid page types
    if (p.type && !VALID_PAGE_TYPES.has(p.type)) {
      addIssue({
        severity: 'ERROR',
        category: 'Page Structure',
        message: `Page ${idx + 1} has an unrecognized or invalid page type "${p.type}".`,
        pageIndex: idx
      });
    }

    // Empty required pages / sections
    if (p.type === 'cover') {
      if (!p.title && !p.subtitle) {
        addIssue({
          severity: 'WARNING',
          category: 'Page Structure',
          message: `Page ${idx + 1} (Cover) has an empty title and subtitle.`,
          pageIndex: idx
        });
      }
    } else if (p.type === 'schedule') {
      if (!p.items || p.items.length === 0) {
        addIssue({
          severity: 'WARNING',
          category: 'Page Structure',
          message: `Page ${idx + 1} (Schedule) has no schedule items defined.`,
          pageIndex: idx
        });
      }
    } else if (p.type === 'leadership') {
      if (!p.leaders || p.leaders.length === 0) {
        addIssue({
          severity: 'WARNING',
          category: 'Page Structure',
          message: `Page ${idx + 1} (Leadership) has no leadership entries.`,
          pageIndex: idx
        });
      }
    } else if (p.type === 'keynote') {
      if (!p.speakerName) {
        addIssue({
          severity: 'WARNING',
          category: 'Page Structure',
          message: `Page ${idx + 1} (Keynote) is missing the speaker name.`,
          pageIndex: idx
        });
      }
    } else if (p.type === 'roster') {
      if (!p.members || p.members.length === 0) {
        addIssue({
          severity: 'WARNING',
          category: 'Page Structure',
          message: `Page ${idx + 1} (Roster) has no roster members.`,
          pageIndex: idx
        });
      }
    } else if (p.type === 'custom') {
      if ((!p.content || !p.content.trim()) && (!p.blocks || p.blocks.length === 0)) {
        addIssue({
          severity: 'WARNING',
          category: 'Page Structure',
          message: `Page ${idx + 1} (Custom) has no main HTML content or content blocks.`,
          pageIndex: idx
        });
      }
    }
  });

  // Imposition calculation & page count divisibility check
  const imposition = calculateImpositionSheets(pages);
  const paddedPageCount = imposition.totalPages;
  const paddingAdded = imposition.paddingAdded;
  const totalSheets = imposition.totalSheets;

  if (rawPageCount > 0) {
    if (paddingAdded > 0) {
      addIssue({
        severity: 'INFO',
        category: 'Page Structure',
        message: `Page count (${rawPageCount}) is not divisible by 4. ${paddingAdded} blank notes page${paddingAdded > 1 ? 's' : ''} will be added automatically to make ${paddedPageCount} pages (${totalSheets} sheet${totalSheets > 1 ? 's' : ''}).`
      });
    } else {
      addIssue({
        severity: 'INFO',
        category: 'Page Structure',
        message: `Page count (${rawPageCount}) perfectly matches saddle-stitch 4-page multiples (${totalSheets} sheet${totalSheets > 1 ? 's' : ''}).`
      });
    }
  }

  // --------------------------------------------------------------------------
  // 2. CONTENT CHECKS
  // --------------------------------------------------------------------------
  const isValidUrlOrData = (ref) => {
    if (!ref || typeof ref !== 'string') return false;
    const trimmed = ref.trim();
    if (!trimmed) return false;
    const resolved = resolveAssetUrl(booklet, trimmed);
    if (!resolved) return false;
    return (
      resolved.startsWith('data:') ||
      resolved.startsWith('http://') ||
      resolved.startsWith('https://') ||
      resolved.startsWith('/') ||
      resolved.startsWith('./') ||
      resolved.startsWith('../')
    );
  };

  // Asset Manager Checks (Unused Assets & Broken Images)
  const unusedAssets = getUnusedAssets(booklet);
  unusedAssets.forEach((asset) => {
    addIssue({
      severity: 'INFO',
      category: 'Content',
      message: `Unused image asset "${asset.name || asset.filename || asset.id}" is stored in the asset library.`
    });
  });

  const brokenRefs = getBrokenImageReferences(booklet);
  brokenRefs.forEach((broken) => {
    addIssue({
      severity: 'ERROR',
      category: 'Content',
      message: broken.message,
      pageIndex: broken.pageIndex !== undefined ? broken.pageIndex : null,
      blockIndex: broken.blockIndex !== undefined ? broken.blockIndex : null
    });
  });

  pages.forEach((p, idx) => {
    // Images in cover / back cover
    if (p.type === 'cover') {
      if (!p.emblemImg && !p.emblemText) {
        addIssue({
          severity: 'WARNING',
          category: 'Content',
          message: `Page ${idx + 1} (Cover) has neither an emblem image nor emblem text.`,
          pageIndex: idx
        });
      } else if (p.emblemImg && !isValidUrlOrData(p.emblemImg)) {
        addIssue({
          severity: 'ERROR',
          category: 'Content',
          message: `Page ${idx + 1} (Cover) contains an invalid emblem image URL reference.`,
          pageIndex: idx
        });
      }
    }

    if (p.type === 'backCover') {
      if (!p.qrImg) {
        addIssue({
          severity: 'INFO',
          category: 'Content',
          message: `Page ${idx + 1} (Back Cover) has no custom QR code image uploaded (using fallback placeholder).`,
          pageIndex: idx
        });
      } else if (!isValidUrlOrData(p.qrImg)) {
        addIssue({
          severity: 'ERROR',
          category: 'Content',
          message: `Page ${idx + 1} (Back Cover) contains an invalid QR code image URL reference.`,
          pageIndex: idx
        });
      }
    }

    if (p.bgImage && !isValidUrlOrData(p.bgImage)) {
      addIssue({
        severity: 'ERROR',
        category: 'Content',
        message: `Page ${idx + 1} contains an invalid background image URL reference.`,
        pageIndex: idx
      });
    }

    // Content blocks checks
    (p.blocks || []).forEach((b, bIdx) => {
      if (b.type === 'image') {
        if (!b.url) {
          addIssue({
            severity: 'WARNING',
            category: 'Content',
            message: `Page ${idx + 1}, Block ${bIdx + 1} (Image) has no image URL or file selected.`,
            pageIndex: idx,
            blockIndex: bIdx
          });
        } else if (!isValidUrlOrData(b.url)) {
          addIssue({
            severity: 'ERROR',
            category: 'Content',
            message: `Page ${idx + 1}, Block ${bIdx + 1} (Image) has an invalid or malformed image URL.`,
            pageIndex: idx,
            blockIndex: bIdx
          });
        }
      }

      if (b.type === 'heading' || b.type === 'paragraph') {
        if (!b.text || !b.text.trim()) {
          addIssue({
            severity: 'WARNING',
            category: 'Content',
            message: `Page ${idx + 1}, Block ${bIdx + 1} (${b.type}) is empty.`,
            pageIndex: idx,
            blockIndex: bIdx
          });
        } else if (b.text.length > 2500) {
          addIssue({
            severity: 'WARNING',
            category: 'Content',
            message: `Page ${idx + 1}, Block ${bIdx + 1} contains suspiciously large text (${b.text.length} characters) which may cause page overflow.`,
            pageIndex: idx,
            blockIndex: bIdx
          });
        }
      }
    });

    // Custom HTML length overflow check
    if (p.type === 'custom' && p.content && p.content.length > 3500) {
      addIssue({
        severity: 'WARNING',
        category: 'Content',
        message: `Page ${idx + 1} content is suspiciously long (${p.content.length} characters) and may exceed physical 5.5 × 8.5 in page boundaries.`,
        pageIndex: idx
      });
    }
  });

  // --------------------------------------------------------------------------
  // 3. LAYOUT CHECKS & OVERFLOW DETECTION
  // --------------------------------------------------------------------------
  const doc = options.document || (typeof document !== 'undefined' ? document : null);

  pages.forEach((p, idx) => {
    const pageNum = idx + 1;
    let detectedOverflowInches = null;
    let overflowDirection = 'below';

    // A. Query DOM measurements if document context is available
    if (doc) {
      const pageEl = doc.querySelector(`[data-page-index="${idx}"]`) ||
                     doc.querySelector(`#spread-page-${idx}`);
      if (pageEl) {
        const hasAttrOverflow = pageEl.getAttribute('data-has-overflow') === 'true';
        const attrInches = pageEl.getAttribute('data-overflow-inches');
        if (hasAttrOverflow && attrInches && parseFloat(attrInches) > 0) {
          detectedOverflowInches = parseFloat(attrInches).toFixed(2);
        } else {
          const scrollDiff = pageEl.scrollHeight - pageEl.clientHeight;
          if (scrollDiff > 2) {
            detectedOverflowInches = (scrollDiff / 96).toFixed(2);
          } else {
            const pageRect = pageEl.getBoundingClientRect();
            if (pageRect.height > 0) {
              const children = pageEl.querySelectorAll('*');
              let maxDiff = 0;
              children.forEach((child) => {
                if (
                  child.classList.contains('editor-guide') ||
                  child.classList.contains('overflow-warning-banner') ||
                  child.classList.contains('overflow-indicator')
                ) return;
                const rect = child.getBoundingClientRect();
                const diff = rect.bottom - pageRect.bottom;
                if (diff > maxDiff) maxDiff = diff;
              });
              if (maxDiff > 2) {
                detectedOverflowInches = (maxDiff / 96).toFixed(2);
              }
            }
          }
        }
      }
    }

    // B. Static layout estimation fallback
    if (!detectedOverflowInches) {
      (p.blocks || []).forEach((b) => {
        const offsetY = b.offsetY || 0;
        const blockH = b.height || (b.type === 'image' ? 200 : b.type === 'paragraph' ? 100 : 40);
        if (offsetY > 180) {
          const estOverflowPx = offsetY + blockH - 250;
          if (estOverflowPx > 0) {
            detectedOverflowInches = (estOverflowPx / 96).toFixed(2);
          }
        }
      });

      if (!detectedOverflowInches) {
        if (p.type === 'custom' && p.content && p.content.length > 2500) {
          const overChars = p.content.length - 2000;
          detectedOverflowInches = Math.max(0.1, (overChars / 500 * 0.15)).toFixed(2);
        } else if (p.type === 'schedule' && p.items && p.items.length > 8) {
          detectedOverflowInches = ((p.items.length - 8) * 0.22).toFixed(2);
        } else if (p.type === 'leadership' && p.leaders && p.leaders.length > 6) {
          detectedOverflowInches = ((p.leaders.length - 6) * 0.30).toFixed(2);
        } else if (p.type === 'roster' && p.members && p.members.length > 18) {
          detectedOverflowInches = ((p.members.length - 18) * 0.18).toFixed(2);
        }
      }
    }

    if (detectedOverflowInches && parseFloat(detectedOverflowInches) > 0) {
      addIssue({
        severity: 'ERROR',
        category: 'Layout',
        message: `Page ${pageNum}: Content extends ${detectedOverflowInches} inches ${overflowDirection} the page.`,
        pageIndex: idx,
        pageNum
      });
    }

    // Check coordinate validity & overflow
    const checkCoords = (prefix, label) => {
      const offsetX = p[`${prefix}OffsetX`];
      const offsetY = p[`${prefix}OffsetY`];
      const width = p[`${prefix}Width`];
      const height = p[`${prefix}Height`];

      if (offsetX !== undefined && (isNaN(offsetX) || typeof offsetX !== 'number')) {
        addIssue({
          severity: 'ERROR',
          category: 'Layout',
          message: `Page ${idx + 1} ${label} has invalid non-numeric X offset (${offsetX}).`,
          pageIndex: idx
        });
      }
      if (offsetY !== undefined && (isNaN(offsetY) || typeof offsetY !== 'number')) {
        addIssue({
          severity: 'ERROR',
          category: 'Layout',
          message: `Page ${idx + 1} ${label} has invalid non-numeric Y offset (${offsetY}).`,
          pageIndex: idx
        });
      }

      if (width !== undefined) {
        if (isNaN(width) || typeof width !== 'number' || width <= 0) {
          addIssue({
            severity: 'ERROR',
            category: 'Layout',
            message: `Page ${idx + 1} ${label} has invalid width dimension (${width}).`,
            pageIndex: idx
          });
        } else if (width > 550) {
          addIssue({
            severity: 'WARNING',
            category: 'Layout',
            message: `Page ${idx + 1} ${label} width (${width}px) exceeds normal 5.5 in page print bounds.`,
            pageIndex: idx
          });
        }
      }

      if (height !== undefined) {
        if (isNaN(height) || typeof height !== 'number' || height <= 0) {
          addIssue({
            severity: 'ERROR',
            category: 'Layout',
            message: `Page ${idx + 1} ${label} has invalid height dimension (${height}).`,
            pageIndex: idx
          });
        } else if (height > 850) {
          addIssue({
            severity: 'WARNING',
            category: 'Layout',
            message: `Page ${idx + 1} ${label} height (${height}px) exceeds normal 8.5 in page print bounds.`,
            pageIndex: idx
          });
        }
      }

      // Check boundary extensions / safe area offset
      if (typeof offsetX === 'number' && Math.abs(offsetX) > 180) {
        addIssue({
          severity: 'WARNING',
          category: 'Layout',
          message: `Page ${idx + 1} ${label} is shifted far horizontally (X: ${offsetX}px) and may extend beyond printable safe area.`,
          pageIndex: idx
        });
      }
      if (typeof offsetY === 'number' && Math.abs(offsetY) > 280) {
        addIssue({
          severity: 'WARNING',
          category: 'Layout',
          message: `Page ${idx + 1} ${label} is shifted far vertically (Y: ${offsetY}px) and may extend beyond printable safe area.`,
          pageIndex: idx
        });
      }
    };

    if (p.type === 'cover') {
      checkCoords('emblem', 'Emblem element');
      checkCoords('titleGroup', 'Title group');
      checkCoords('tagline', 'Tagline element');
    } else if (p.type === 'backCover') {
      checkCoords('headerGroup', 'Header group');
      checkCoords('qrGroup', 'QR Code group');
    } else {
      checkCoords('pageTitle', 'Page Title');
      if (p.type === 'custom') {
        checkCoords('mainContent', 'Main Content area');
      }
    }

    // Check block layout properties
    (p.blocks || []).forEach((b, bIdx) => {
      if (b.offsetX !== undefined && (isNaN(b.offsetX) || typeof b.offsetX !== 'number')) {
        addIssue({
          severity: 'ERROR',
          category: 'Layout',
          message: `Page ${idx + 1}, Block ${bIdx + 1} has an invalid non-numeric X offset.`,
          pageIndex: idx,
          blockIndex: bIdx
        });
      }
      if (b.offsetY !== undefined && (isNaN(b.offsetY) || typeof b.offsetY !== 'number')) {
        addIssue({
          severity: 'ERROR',
          category: 'Layout',
          message: `Page ${idx + 1}, Block ${bIdx + 1} has an invalid non-numeric Y offset.`,
          pageIndex: idx,
          blockIndex: bIdx
        });
      }

      if (b.width !== undefined && (isNaN(b.width) || typeof b.width !== 'number' || b.width <= 0)) {
        addIssue({
          severity: 'ERROR',
          category: 'Layout',
          message: `Page ${idx + 1}, Block ${bIdx + 1} has invalid width (${b.width}).`,
          pageIndex: idx,
          blockIndex: bIdx
        });
      }

      if (b.height !== undefined && b.height !== null && (isNaN(b.height) || typeof b.height !== 'number' || b.height <= 0)) {
        addIssue({
          severity: 'ERROR',
          category: 'Layout',
          message: `Page ${idx + 1}, Block ${bIdx + 1} has invalid height (${b.height}).`,
          pageIndex: idx,
          blockIndex: bIdx
        });
      }

      // Obvious clipping / tiny height for text blocks
      if ((b.type === 'heading' || b.type === 'paragraph') && b.height !== undefined && b.height !== null && b.height < 14) {
        addIssue({
          severity: 'WARNING',
          category: 'Layout',
          message: `Page ${idx + 1}, Block ${bIdx + 1} (${b.type}) height is constrained to ${b.height}px causing potential text clipping.`,
          pageIndex: idx,
          blockIndex: bIdx
        });
      }

      if (typeof b.offsetX === 'number' && Math.abs(b.offsetX) > 200) {
        addIssue({
          severity: 'WARNING',
          category: 'Layout',
          message: `Page ${idx + 1}, Block ${bIdx + 1} is shifted far horizontally (${b.offsetX}px) outside standard margins.`,
          pageIndex: idx,
          blockIndex: bIdx
        });
      }
    });
  });

  // --------------------------------------------------------------------------
  // 4. TYPOGRAPHY CHECKS
  // --------------------------------------------------------------------------
  const titleFont = theme?.titleFont || "'Cinzel', serif";
  if (!titleFont || typeof titleFont !== 'string') {
    addIssue({
      severity: 'WARNING',
      category: 'Typography',
      message: 'Theme title font is undefined or invalid.'
    });
  }

  // If document.fonts is available (browser context), perform font availability check
  const docFonts = options.document?.fonts || (typeof document !== 'undefined' ? document.fonts : null);
  if (docFonts && typeof docFonts.check === 'function') {
    try {
      const isLoaded = docFonts.check(`16px ${titleFont}`);
      if (!isLoaded) {
        addIssue({
          severity: 'INFO',
          category: 'Typography',
          message: `Font family ${titleFont} is currently loading or using fallback system serif font.`
        });
      }
    } catch (e) {
      // Ignore font check errors
    }
  }

  // Detect suspiciously small text in HTML or block settings
  pages.forEach((p, idx) => {
    if (p.content && typeof p.content === 'string') {
      const tinyFontMatch = p.content.match(/font-size\s*:\s*([0-9.]+)(px|pt)/gi);
      if (tinyFontMatch) {
        tinyFontMatch.forEach((match) => {
          const parts = match.match(/([0-9.]+)(px|pt)/i);
          if (parts) {
            const val = parseFloat(parts[1]);
            const unit = parts[2].toLowerCase();
            if ((unit === 'pt' && val < 6) || (unit === 'px' && val < 8)) {
              addIssue({
                severity: 'WARNING',
                category: 'Typography',
                message: `Page ${idx + 1} content includes suspiciously small font-size inline styling (${val}${unit}) which may be unreadable when printed.`,
                pageIndex: idx
              });
            }
          }
        });
      }
    }
  });

  // --------------------------------------------------------------------------
  // 5. IMPOSITION CHECKS
  // --------------------------------------------------------------------------
  if (rawPageCount > 0) {
    const sheets = imposition.sheets || [];
    const expectedTotalPadded = imposition.totalPages;
    const accountedPages = new Set();
    let hasDuplicateInImposition = false;

    sheets.forEach((sheet) => {
      // Check front and back pairs
      const frontLeft = sheet.front?.leftPageNum;
      const frontRight = sheet.front?.rightPageNum;
      const backLeft = sheet.back?.leftPageNum;
      const backRight = sheet.back?.rightPageNum;

      [frontLeft, frontRight, backLeft, backRight].forEach((num) => {
        if (num !== undefined && num !== null) {
          if (accountedPages.has(num)) {
            hasDuplicateInImposition = true;
          }
          accountedPages.add(num);
        }
      });
    });

    if (hasDuplicateInImposition) {
      addIssue({
        severity: 'ERROR',
        category: 'Imposition',
        message: 'Duplicate page detected within imposed sheet layout.'
      });
    }

    if (accountedPages.size !== expectedTotalPadded) {
      addIssue({
        severity: 'ERROR',
        category: 'Imposition',
        message: `Imposition page mismatch: ${accountedPages.size} pages accounted for out of expected ${expectedTotalPadded}.`
      });
    }

    // Verify correct front/back saddle stitch pairing formula: Page N + Page 1 = TotalPadded + 1
    sheets.forEach((sheet, sheetIdx) => {
      const fl = sheet.front?.leftPageNum;
      const fr = sheet.front?.rightPageNum;
      const bl = sheet.back?.leftPageNum;
      const br = sheet.back?.rightPageNum;

      if (fl && fr && (fl + fr !== expectedTotalPadded + 1)) {
        addIssue({
          severity: 'ERROR',
          category: 'Imposition',
          message: `Sheet ${sheetIdx + 1} front side pairing (${fl}, ${fr}) does not equal expected saddle-stitch sum (${expectedTotalPadded + 1}).`
        });
      }

      if (bl && br && (bl + br !== expectedTotalPadded + 1)) {
        addIssue({
          severity: 'ERROR',
          category: 'Imposition',
          message: `Sheet ${sheetIdx + 1} back side pairing (${bl}, ${br}) does not equal expected saddle-stitch sum (${expectedTotalPadded + 1}).`
        });
      }
    });
  }

  // --------------------------------------------------------------------------
  // SUMMARY CALCULATIONS
  // --------------------------------------------------------------------------
  const errors = issues.filter((i) => i.severity === 'ERROR');
  const warnings = issues.filter((i) => i.severity === 'WARNING');
  const info = issues.filter((i) => i.severity === 'INFO');

  const errorCount = errors.length;
  const warningCount = warnings.length;
  const infoCount = info.length;

  const status = errorCount > 0 ? 'PRINT BLOCKED' : 'READY TO PRINT';

  return {
    status, // 'READY TO PRINT' | 'PRINT BLOCKED'
    isReady: errorCount === 0,
    summaryText: `${status}\n${errorCount} error${errorCount !== 1 ? 's' : ''}\n${warningCount} warning${warningCount !== 1 ? 's' : ''}\n${rawPageCount} page${rawPageCount !== 1 ? 's' : ''}${paddingAdded > 0 ? ` (${paddedPageCount} padded)` : ''}\n${totalSheets} sheet${totalSheets !== 1 ? 's' : ''}\n5.5 × 8.5 inch pages\n8.5 × 11 inch paper\nSaddle stitch`,
    specs: {
      rawPageCount,
      paddedPageCount,
      paddingAdded,
      totalSheets,
      pageSize: '5.5 × 8.5 inch pages',
      paperSize: '8.5 × 11 inch paper',
      bindingMethod: 'Saddle stitch'
    },
    counts: {
      errors: errorCount,
      warnings: warningCount,
      info: infoCount,
      total: issues.length
    },
    issues,
    errors,
    warnings,
    info
  };
}
