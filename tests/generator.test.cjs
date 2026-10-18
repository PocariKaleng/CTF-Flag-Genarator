const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { hashText, toLeet, generateRandomBody, clampLength, formatFlag, secureRandomInt } = require('../generator.js');

for (const algorithm of ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']) {
    test(`${algorithm} matches independent known digests, including UTF-8 and block boundaries`, async () => {
        for (const input of ['', 'abc', 'hello world', '  flag\n', 'bendera 🔐 café', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'a'.repeat(1000)]) {
            const expected = createHash(algorithm.replace('-', '').toLowerCase()).update(input, 'utf8').digest('hex');
            assert.equal(await hashText(input, algorithm), expected);
        }
    });
}

test('hash rejects unsupported algorithms', async () => {
    await assert.rejects(hashText('abc', 'SHA-999'), /Algoritma/);
});

test('classic leet keeps the original mappings and whitespace behavior', () => {
    assert.equal(toLeet('A E T S G O L xyz', { random: false }), '4_3_7_5_9_0_1_xyz');
    assert.equal(toLeet('hello\nworld\t🔐', { random: false }), 'h3110_w0r1d_🔐');
});

test('random leet varies substitutions with controlled random choices', () => {
    assert.equal(toLeet('Aa Ee', { random: true }, () => 0), '44_33');
    assert.equal(toLeet('Aa Ee', { random: true }, max => max - 1), '@@_[-[-');
    assert.notEqual(toLeet('hello', { random: true }, () => 0), toLeet('hello', { random: true }, max => max - 1));
});

test('leet substitutions use printable ASCII for every mapping and case option', () => {
    const input = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 !@#$%^&*()[]{}-_=+;:,.?/';
    for (const random of [false, true]) {
        for (const randomCase of [false, true]) {
            for (const choose of [() => 0, max => max - 1]) {
                assert.match(toLeet(input, { random, randomCase }, choose), /^[\x20-\x7e]+$/);
            }
        }
    }
});

test('random case preserves symbols and can change untouched letters', () => {
    assert.equal(toLeet('xyz 123 🔐', { random: false, randomCase: true }, () => 0), 'xyz_123_🔐');
    assert.equal(toLeet('xyz 123 🔐', { random: false, randomCase: true }, () => 1), 'XYZ_123_🔐');
});

test('random flags respect length and the original alphanumeric charset', () => {
    for (const length of [6, 16, 100]) {
        const body = generateRandomBody(length);
        assert.equal(body.length, length);
        assert.match(body, /^[A-Za-z0-9]+$/);
    }
    assert.equal(generateRandomBody(6, () => 0), 'AAAAAA');
});

test('length normalization clamps invalid and out-of-range input', () => {
    for (const [input, expected] of [['', 16], ['abc', 16], [-2, 6], [101, 100], [20.8, 20]]) {
        assert.equal(clampLength(input), expected);
    }
});

test('prefix is trimmed and wrapping can be optional', () => {
    assert.equal(formatFlag('abc', ' CTF '), 'CTF{abc}');
    assert.equal(formatFlag('abc', ''), 'FLAG{abc}');
    assert.equal(formatFlag('abc', '', false), 'abc');
});

test('random integers stay inside their bounds and reject invalid bounds', () => {
    for (const max of [1, 3, 62]) {
        for (let index = 0; index < 100; index++) {
            const value = secureRandomInt(max);
            assert.ok(Number.isInteger(value) && value >= 0 && value < max);
        }
    }
    assert.throws(() => secureRandomInt(0), /batas/);
});
