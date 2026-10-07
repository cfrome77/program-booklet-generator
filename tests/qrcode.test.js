import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateQrContent,
  generateQrMatrix,
  generateQrSvg,
  ERROR_CORRECTION_LEVELS
} from '../src/utils/qrcode.js';

test('QR Code Utility - validateQrContent', async (t) => {
  await t.test('accepts valid URLs and text strings', () => {
    const res1 = validateQrContent('https://example.com/event');
    assert.strictEqual(res1.valid, true);
    assert.strictEqual(res1.sanitizedContent, 'https://example.com/event');

    const res2 = validateQrContent('  Scan for agenda  ');
    assert.strictEqual(res2.valid, true);
    assert.strictEqual(res2.sanitizedContent, 'Scan for agenda');
  });

  await t.test('rejects empty, null, or whitespace-only content', () => {
    assert.strictEqual(validateQrContent(null).valid, false);
    assert.strictEqual(validateQrContent(undefined).valid, false);
    assert.strictEqual(validateQrContent('').valid, false);
    assert.strictEqual(validateQrContent('   ').valid, false);
  });

  await t.test('rejects excessively long content over 1000 characters', () => {
    const longStr = 'a'.repeat(1001);
    const res = validateQrContent(longStr);
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /exceeds maximum/i);
  });

  await t.test('rejects invalid http/https URL structures', () => {
    const res = validateQrContent('http://');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /invalid URL/i);
  });
});

test('QR Code Utility - generateQrMatrix', async (t) => {
  await t.test('generates valid binary matrix for standard inputs across all ECLs', () => {
    ['L', 'M', 'Q', 'H'].forEach((ecl) => {
      const matrix = generateQrMatrix('https://example.com', ecl);
      assert.ok(Array.isArray(matrix));
      assert.ok(matrix.length >= 21); // Version 1 is 21x21
      matrix.forEach((row) => {
        assert.strictEqual(row.length, matrix.length);
        row.forEach((cell) => {
          assert.ok(cell === 0 || cell === 1);
        });
      });
    });
  });

  await t.test('throws error when generating matrix for invalid content', () => {
    assert.throws(() => {
      generateQrMatrix('');
    });
  });
});

test('QR Code Utility - generateQrSvg', async (t) => {
  await t.test('generates crisp SVG string with size, background, path, and label options', () => {
    const result = generateQrSvg('https://example.com', {
      errorCorrectionLevel: 'H',
      size: 120,
      label: 'Scan for Schedule'
    });

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.label, 'Scan for Schedule');
    assert.ok(typeof result.svg === 'string');
    assert.ok(result.svg.includes('<svg'));
    assert.ok(result.svg.includes('width="120"'));
    assert.ok(result.svg.includes('height="120"'));
    assert.ok(result.svg.includes('<path'));
  });

  await t.test('gracefully returns error object when content validation fails', () => {
    const result = generateQrSvg('');
    assert.strictEqual(result.valid, false);
    assert.ok(typeof result.error === 'string');
    assert.strictEqual(result.svg, undefined);
  });
});
