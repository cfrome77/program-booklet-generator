import test from 'node:test';
import assert from 'node:assert/strict';
import { extractFontFamilies, getUsedFonts, isFontLoaded, loadFonts, CONFIGURED_FONTS } from '../src/utils/fonts.js';
import { runPreflight } from '../src/utils/preflight.js';

test('Font Management & Utility Tests', async (t) => {
  await t.test('extractFontFamilies cleanly parses font family CSS strings', () => {
    assert.deepEqual(extractFontFamilies("'Cinzel', serif"), ['Cinzel', 'serif']);
    assert.deepEqual(extractFontFamilies('"Open Sans", sans-serif'), ['Open Sans', 'sans-serif']);
    assert.deepEqual(extractFontFamilies('Roboto, "Merriweather", serif'), ['Roboto', 'Merriweather', 'serif']);
    assert.deepEqual(extractFontFamilies(''), []);
    assert.deepEqual(extractFontFamilies(null), []);
  });

  await t.test('getUsedFonts extracts unique fonts from theme and page content', () => {
    const booklet = {
      theme: { titleFont: "'Merriweather', serif" },
      pages: [
        {
          id: 'p1',
          type: 'custom',
          content: '<div style="font-family: Roboto;">Hello</div>',
          blocks: [
            { type: 'heading', fontFamily: "'Cinzel', serif" }
          ]
        }
      ]
    };

    const usedFonts = getUsedFonts(booklet);
    assert.ok(usedFonts.includes('Open Sans'), 'Should include main font Open Sans');
    assert.ok(usedFonts.includes('Merriweather'), 'Should include theme title font Merriweather');
    assert.ok(usedFonts.includes('Roboto'), 'Should include inline content font Roboto');
    assert.ok(usedFonts.includes('Cinzel'), 'Should include block font Cinzel');
    assert.ok(!usedFonts.includes('serif'), 'Should filter out generic fallback serif');
  });

  await t.test('isFontLoaded handles non-browser and mock document font checks', () => {
    // Non-browser fallback
    assert.equal(isFontLoaded('Open Sans'), true);

    // Mock document.fonts check
    const mockDocTrue = {
      fonts: {
        check: (fontSpec) => fontSpec.includes('Open Sans')
      }
    };
    assert.equal(isFontLoaded('Open Sans', { document: mockDocTrue }), true);
    assert.equal(isFontLoaded('Unknown Font', { document: mockDocTrue }), false);
  });

  await t.test('loadFonts injects Google Fonts link and loads requested fonts in browser context', async () => {
    let injectedHref = null;
    const addedLinks = [];

    const mockDoc = {
      head: {
        appendChild: (node) => {
          if (node.rel === 'stylesheet') {
            injectedHref = node.href;
            addedLinks.push(node);
          }
        }
      },
      querySelectorAll: (selector) => {
        if (selector === 'link[rel="stylesheet"]') {
          return addedLinks;
        }
        return [];
      },
      createElement: (tag) => {
        if (tag === 'link') {
          return { rel: '', href: '' };
        }
        return {};
      },
      fonts: {
        load: async () => [],
        check: () => true,
        ready: Promise.resolve()
      }
    };

    const result = await loadFonts(['Cinzel', 'Roboto'], { document: mockDoc });
    assert.ok(injectedHref && injectedHref.includes('Cinzel') && injectedHref.includes('Roboto'), 'Should inject Google Fonts link');
    assert.deepEqual(result.loaded, ['Cinzel', 'Roboto']);
    assert.deepEqual(result.failed, []);
  });

  await t.test('runPreflight warns if any used font is unavailable in document font registry', () => {
    const booklet = {
      theme: { titleFont: "'Cinzel', serif" },
      pages: [
        { id: 'p1', type: 'cover', title: 'Cover Title' }
      ]
    };

    const mockDocMissingFont = {
      fonts: {
        check: (spec) => !spec.includes('Cinzel') // Cinzel fails to load
      }
    };

    const result = runPreflight(booklet, { document: mockDocMissingFont });
    const fontWarn = result.warnings.find((w) => w.category === 'Typography' && w.message.includes('Cinzel') && w.message.includes('unavailable'));
    assert.ok(fontWarn, 'Preflight should issue warning for missing Cinzel font');
  });
});
