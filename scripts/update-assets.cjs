const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const root = resolve(__dirname, '..');
const versions = new Map(['style.css', 'generator.js', 'script.js'].map(asset => {
    const source = readFileSync(resolve(root, asset), 'utf8').replace(/\r\n/g, '\n');
    return [asset, createHash('sha256').update(source).digest('hex').slice(0, 12)];
}));
const index = resolve(root, 'index.html');
const html = readFileSync(index, 'utf8');
const updated = html.replace(/((?:src|href)=")([^"]+)(")/g, (match, start, url, end) => {
    const asset = url.split('?')[0];
    if (!versions.has(asset)) return match;
    const reference = new URL(url, 'https://flag-generator.invalid/');
    reference.searchParams.set('v', versions.get(asset));
    return start + asset + reference.search + end;
});
writeFileSync(index, updated);
console.log('Updated CSS and JavaScript asset versions.');
