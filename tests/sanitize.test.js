import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeHtml } from '../src/utils/sanitize.js';

describe('HTML Sanitizer Security Tests', () => {
  test('allows safe markup and preset content without stripping trusted elements', () => {
    const input = '<strong>Journey to Excellence Gold:</strong> Lodge 470 achieved Gold Standard recognition.<br/><br/><em>Looking Ahead:</em> Join us May 14–16.';
    const output = sanitizeHtml(input);
    assert.strictEqual(output, input);
  });

  test('preserves allowed style attributes and text formatting', () => {
    const input = '<div style="text-align:center;"><h3>75 Years of Brotherhood</h3><p style="margin-top:10px;">Thank you for celebrating with us!</p></div>';
    const output = sanitizeHtml(input);
    assert.strictEqual(output, input);
  });

  test('strips unsafe <script> tags and inner content', () => {
    const input = '<div>Hello</div><script>alert("xss")</script><p>World</p>';
    const output = sanitizeHtml(input);
    assert.ok(!output.includes('script'));
    assert.ok(!output.includes('alert'));
    assert.ok(output.includes('Hello'));
    assert.ok(output.includes('World'));
  });

  test('sanitizes nested elements inside unallowed tags when unwrapped', () => {
    const input = '<custom-tag><script>alert("xss")</script><img src="x" onerror="alert(1)"/>Hello</custom-tag>';
    const output = sanitizeHtml(input);
    assert.ok(!output.includes('custom-tag'));
    assert.ok(!output.includes('script'));
    assert.ok(!output.includes('onerror'));
    assert.ok(!output.includes('alert'));
    assert.ok(output.includes('Hello'));
  });

  test('strips inline on* event handlers (onerror, onload, onclick, etc.)', () => {
    const input = '<img src="valid.jpg" onerror="alert(1)" onload="doEvil()" onclick="steal()"/>';
    const output = sanitizeHtml(input);
    assert.ok(!output.includes('onerror'));
    assert.ok(!output.includes('onload'));
    assert.ok(!output.includes('onclick'));
    assert.ok(!output.includes('alert'));
    assert.ok(output.includes('src="valid.jpg"'));
  });

  test('strips unsafe javascript: and vbscript: URIs from href and src', () => {
    const linkInput = '<a href="javascript:alert(1)">Click Me</a>';
    const linkOutput = sanitizeHtml(linkInput);
    assert.ok(!linkOutput.includes('javascript:'));
    assert.ok(linkOutput.includes('Click Me'));

    const imgInput = '<img src="javascript:alert(1)"/>';
    assert.ok(!sanitizeHtml(imgInput).includes('javascript:'));
  });

  test('allows safe data URIs for images while blocking unsafe protocols', () => {
    const safeDataImg = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Dot"/>';
    const output = sanitizeHtml(safeDataImg);
    assert.ok(output.includes('data:image/png;base64'));

    const unsafeDataLink = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Bad Link</a>';
    const linkOutput = sanitizeHtml(unsafeDataLink);
    assert.ok(!linkOutput.includes('data:text/html'));
  });

  test('strips unsafe tags like <iframe>, <object>, <embed>, <form>', () => {
    const input = '<iframe src="https://evil.com"></iframe><p>Content</p><object data="evil.swf"></object>';
    const output = sanitizeHtml(input);
    assert.ok(!output.includes('iframe'));
    assert.ok(!output.includes('object'));
    assert.ok(!output.includes('evil.com'));
    assert.ok(output.includes('Content'));
  });

  test('sanitizes malicious CSS directives in style attributes', () => {
    const input = '<div style="background: url(javascript:alert(1)); width: expression(alert(1)); color: red;">Test</div>';
    const output = sanitizeHtml(input);
    assert.ok(!output.includes('javascript:'));
    assert.ok(!output.includes('expression'));
    assert.ok(output.includes('color: red'));
  });

  test('automatically adds rel="noopener noreferrer" for links with target="_blank"', () => {
    const input = '<a href="https://example.com" target="_blank">External Link</a>';
    const output = sanitizeHtml(input);
    assert.ok(output.includes('rel="noopener noreferrer"'));
  });

  test('gracefully handles null, undefined, or empty inputs', () => {
    assert.strictEqual(sanitizeHtml(''), '');
    assert.strictEqual(sanitizeHtml(null), '');
    assert.strictEqual(sanitizeHtml(undefined), '');
  });
});
