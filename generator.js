/* Shared browser / Node logic. No network requests or runtime dependencies. */
(function (root) {
    "use strict";

    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const HASH_LENGTHS = Object.freeze({ MD5: 32, "SHA-1": 40, "SHA-256": 64, "SHA-384": 96, "SHA-512": 128 });
    const CLASSIC_LEET = { a: "4", e: "3", t: "7", s: "5", g: "9", o: "0", l: "1" };
    const RANDOM_LEET = {
        a: ["4", "@"], b: ["8", "|3"], e: ["3", "[-"], g: ["9", "6"],
        i: ["1", "!"], l: ["1", "|"], o: ["0", "()"], s: ["5", "$"],
        t: ["7", "+"], z: ["2", "7_"]
    };

    function secureRandomInt(max) {
        if (!Number.isInteger(max) || max < 1 || max > 0x100000000) {
            throw new RangeError("batas acak tidak valid");
        }
        if (!root.crypto?.getRandomValues) {
            throw new Error("Browser ini tidak mendukung pengacakan aman. Gunakan browser modern.");
        }
        // Rejection sampling avoids modulo bias for alphabets such as 62 characters.
        const limit = Math.floor(0x100000000 / max) * max;
        const bytes = new Uint32Array(1);
        do { root.crypto.getRandomValues(bytes); } while (bytes[0] >= limit);
        return bytes[0] % max;
    }

    function clampLength(value) {
        const length = Number.parseInt(value, 10);
        return Number.isNaN(length) ? 16 : Math.max(6, Math.min(100, length));
    }

    function generateRandomBody(length, randomInt = secureRandomInt) {
        return Array.from({ length: clampLength(length) }, () => CHARSET[randomInt(CHARSET.length)]).join("");
    }

    function formatFlag(body, prefix, wrap = true) {
        const cleanPrefix = prefix.trim();
        return wrap || cleanPrefix ? (cleanPrefix || "FLAG") + "{" + body + "}" : body;
    }

    function toLeet(text, { random = true, randomCase = false } = {}, randomInt = secureRandomInt) {
        return Array.from(text, character => {
            if (/\s/u.test(character)) return "_";
            const lower = character.toLowerCase();
            const choices = RANDOM_LEET[lower];
            let converted = random
                ? (choices ? choices[randomInt(choices.length)] : character)
                : (CLASSIC_LEET[lower] || character);
            if (randomCase) {
                converted = converted.replace(/[a-z]/gi, letter => randomInt(2) ? letter.toUpperCase() : letter.toLowerCase());
            }
            return converted;
        }).join("");
    }

    // MD5 from RFC 1321, section 3. CTF compatibility only; SHA uses native Web Crypto.
    // https://www.rfc-editor.org/rfc/rfc1321
    function md5(bytes) {
        const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
        const padded = new Uint8Array(paddedLength);
        padded.set(bytes);
        padded[bytes.length] = 0x80;
        const view = new DataView(padded.buffer);
        view.setUint32(paddedLength - 8, (bytes.length * 8) >>> 0, true);
        view.setUint32(paddedLength - 4, Math.floor(bytes.length / 0x20000000), true);
        const shifts = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
        const constants = Array.from({ length: 64 }, (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000));
        const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
        for (let offset = 0; offset < paddedLength; offset += 64) {
            let [a, b, c, d] = state;
            for (let step = 0; step < 64; step++) {
                const round = Math.floor(step / 16);
                let mixed, word;
                if (round === 0) { mixed = (b & c) | (~b & d); word = step; }
                else if (round === 1) { mixed = (b & d) | (c & ~d); word = (5 * step + 1) % 16; }
                else if (round === 2) { mixed = b ^ c ^ d; word = (3 * step + 5) % 16; }
                else { mixed = c ^ (b | ~d); word = (7 * step) % 16; }
                const sum = (a + mixed + constants[step] + view.getUint32(offset + word * 4, true)) | 0;
                const shift = shifts[round * 4 + step % 4];
                const rotated = (sum << shift) | (sum >>> (32 - shift));
                [a, b, c, d] = [d, (b + rotated) | 0, b, c];
            }
            [a, b, c, d].forEach((value, index) => { state[index] = (state[index] + value) | 0; });
        }
        const digest = new Uint8Array(16);
        const output = new DataView(digest.buffer);
        state.forEach((value, index) => output.setUint32(index * 4, value, true));
        return toHex(digest);
    }

    function toHex(bytes) {
        return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    }

    async function hashText(text, algorithm) {
        if (!Object.hasOwn(HASH_LENGTHS, algorithm)) throw new Error("Algoritma hash tidak didukung.");
        const bytes = new TextEncoder().encode(text);
        if (algorithm === "MD5") return md5(bytes);
        if (!root.crypto?.subtle) {
            throw new Error("Hash SHA memerlukan HTTPS atau localhost. Buka situs lewat koneksi aman.");
        }
        return toHex(new Uint8Array(await root.crypto.subtle.digest(algorithm, bytes)));
    }

    const api = { HASH_LENGTHS, secureRandomInt, clampLength, generateRandomBody, formatFlag, toLeet, hashText };
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    else root.FlagGenerator = Object.freeze(api);
})(globalThis);
