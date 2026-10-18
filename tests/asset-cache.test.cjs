const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const root = resolve(__dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const references = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g), match => new URL(match[1], 'https://flag-generator.invalid/'));

for (const asset of ['style.css', 'generator.js', 'script.js']) {
    test(asset + ' uses a URL version matching its content so old cached code is bypassed', () => {
        const reference = references.find(url => url.pathname === '/' + asset);
        assert.ok(reference, asset + ' must be linked in index.html');
        const source = readFileSync(resolve(root, asset), 'utf8').replace(/\r\n/g, '\n');
        const expected = createHash('sha256').update(source).digest('hex').slice(0, 12);
        assert.equal(reference.searchParams.get('v'), expected, 'Run node scripts/update-assets.cjs after changing assets.');
    });
}
