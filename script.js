/* UI only; generation functions live in generator.js. */
(() => {
    "use strict";
    const { HASH_LENGTHS, clampLength, generateRandomBody, formatFlag, toLeet, hashText } = window.FlagGenerator;
    const $ = id => document.getElementById(id);
    const tabs = Array.from(document.querySelectorAll(".mode-tab"));
    const results = { random: null, hash: null, leet: null };
    const history = [];
    let mode = "random";
    let busy = false;
    let toastTimer, copyTimer;

    function notify(message) {
        clearTimeout(toastTimer);
        $("toast").textContent = message;
        $("toast").classList.add("visible");
        toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 3000);
    }

    function clearError() {
        $("formError").hidden = true;
        $("leetInput").removeAttribute("aria-invalid");
    }

    function selectMode(nextMode) {
        mode = nextMode;
        tabs.forEach(tab => {
            const selected = tab.dataset.mode === mode;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
            $("panel-" + tab.dataset.mode).hidden = !selected;
        });
        clearError();
        $("generateButton").querySelector("use").setAttribute("href", "#i-" + ({ random: "shuffle", hash: "hash", leet: "code" }[mode]));
        renderResult();
    }

    function renderResult() {
        clearTimeout(copyTimer);
        $("copyLabel").textContent = "Salin hasil";
        const result = results[mode];
        $("generateLabel").textContent = mode === "leet" ? "Generate leet" : mode === "hash" ? "Generate hash" : "Generate flag";
        $("resultType").textContent = result?.kind || mode.toUpperCase();
        $("resultStage").classList.toggle("has-result", Boolean(result));
        document.querySelector(".result-panel").classList.toggle("has-result", Boolean(result));
        $("copyButton").disabled = !result;
        $("flagOutput").textContent = result ? result.value : "Belum ada hasil.";
        $("flagOutput").classList.toggle("output-placeholder", !result);
        $("resultStatus").textContent = result ? "Selesai" : "Menunggu input";
        $("characterCount").textContent = result ? Array.from(result.value).length + " karakter" : "— karakter";
        $("resultCaption").hidden = Boolean(result);
    }

    function syncLength(value) {
        const length = clampLength(value);
        $("lengthInput").value = length;
        $("lengthSlider").value = length;
    }

    function updateAlgorithmNote() {
        const algorithm = $("hashAlgorithm").value;
        $("algorithmNote").textContent = HASH_LENGTHS[algorithm] + " karakter heksadesimal";
    }

    async function generate(event) {
        event.preventDefault();
        if (busy) return;
        clearError();
        const requestedMode = mode;
        busy = true;
        $("generateButton").disabled = true;
        $("generatorForm").setAttribute("aria-busy", "true");
        $("generateLabel").textContent = "Memproses…";
        try {
            let value, kind;
            if (requestedMode === "random") {
                syncLength($("lengthInput").value);
                value = formatFlag(generateRandomBody(Number($("lengthInput").value)), $("prefixInput").value);
                kind = "RANDOM";
            } else if (requestedMode === "hash") {
                const algorithm = $("hashAlgorithm").value;
                const source = $("hashInput").value;
                const prefix = $("hashPrefixInput").value;
                const wrap = $("hashWrapToggle").checked;
                const digest = await hashText(source, algorithm);
                value = wrap ? formatFlag(digest, prefix) : digest;
                kind = algorithm;
            } else {
                const source = $("leetInput").value;
                if (!source) {
                    $("leetInput").setAttribute("aria-invalid", "true");
                    $("leetInput").focus();
                    throw new Error("Masukkan teks terlebih dahulu.");
                }
                const random = $("leetStyle").value === "random";
                const body = toLeet(source, { random, randomCase: $("randomCaseToggle").checked });
                if (!body) {
                    $("leetInput").setAttribute("aria-invalid", "true");
                    $("leetInput").focus();
                    throw new Error("Masukkan huruf, angka, spasi, atau _.");
                }
                value = formatFlag(body, $("leetPrefixInput").value, false);
                kind = random ? "LEET ACAK" : "LEET KLASIK";
            }
            const result = { value, kind };
            results[requestedMode] = result;
            history.unshift(result);
            history.splice(6);
            renderHistory();
        } catch (error) {
            $("formError").textContent = error.message || "Gagal membuat flag. Coba lagi.";
            $("formError").hidden = false;
        } finally {
            busy = false;
            $("generateButton").disabled = false;
            $("generatorForm").removeAttribute("aria-busy");
            renderResult();
        }
    }

    async function copy(text) {
        const focused = document.activeElement;
        let fallback;
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                fallback = document.createElement("textarea");
                fallback.value = text;
                fallback.className = "clipboard-fallback";
                fallback.setAttribute("readonly", "");
                document.body.append(fallback);
                fallback.select();
                if (!document.execCommand("copy")) throw new Error("Clipboard unavailable");
            }
            notify("Tersalin.");
            return true;
        } catch {
            notify("Gagal menyalin. Salin teks secara manual.");
            return false;
        } finally {
            fallback?.remove();
            focused?.focus({ preventScroll: true });
        }
    }

    function renderHistory() {
        $("historyList").replaceChildren();
        $("historyEmpty").hidden = history.length > 0;
        $("historyCount").textContent = history.length;
        $("clearHistory").disabled = history.length === 0;
        history.forEach(result => {
            const row = document.createElement("li");
            const badge = document.createElement("span");
            badge.className = "history-kind";
            badge.textContent = result.kind;
            const text = document.createElement("code");
            text.textContent = result.value;
            const button = document.createElement("button");
            button.type = "button";
            button.className = "icon-button";
            button.setAttribute("aria-label", "Salin hasil " + result.kind);
            const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            icon.classList.add("icon");
            icon.setAttribute("aria-hidden", "true");
            const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
            use.setAttribute("href", "#i-copy");
            icon.append(use);
            button.append(icon);
            button.addEventListener("click", () => copy(result.value));
            row.append(badge, text, button);
            $("historyList").append(row);
        });
    }

    function applyTheme(theme) {
        document.body.classList.toggle("light-theme", theme === "light");
        const label = theme === "light" ? "Aktifkan tema gelap" : "Aktifkan tema terang";
        $("themeToggle").setAttribute("aria-label", label);
        $("themeToggle").title = label;
        $("themeIcon").setAttribute("href", theme === "light" ? "#i-moon" : "#i-sun");
        // Storage may be blocked in private browsing or when opening local files.
        try { localStorage.setItem("flaggen-theme", theme); } catch { /* Theme still works for this session. */ }
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => selectMode(tab.dataset.mode));
        tab.addEventListener("keydown", event => {
            let next = index;
            if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
            else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = tabs.length - 1;
            else return;
            event.preventDefault();
            tabs[next].focus();
            selectMode(tabs[next].dataset.mode);
        });
    });
    $("generatorForm").addEventListener("submit", generate);
    $("generatorForm").addEventListener("input", clearError);
    $("lengthSlider").addEventListener("input", event => syncLength(event.target.value));
    $("lengthInput").addEventListener("input", event => {
        if (event.target.value !== "") $("lengthSlider").value = clampLength(event.target.value);
    });
    $("lengthInput").addEventListener("change", event => syncLength(event.target.value));
    $("hashAlgorithm").addEventListener("change", updateAlgorithmNote);
    $("hashWrapToggle").addEventListener("change", event => { $("hashPrefixInput").disabled = !event.target.checked; });
    $("hashExample").addEventListener("click", () => { $("hashInput").value = "you found the secret"; $("hashInput").focus(); });
    $("leetExample").addEventListener("click", () => { $("leetInput").value = "you found the secret"; $("leetInput").focus(); clearError(); });
    $("copyButton").addEventListener("click", async () => {
        const result = results[mode];
        if (result && await copy(result.value)) {
            $("copyLabel").textContent = "Tersalin";
            clearTimeout(copyTimer);
            copyTimer = setTimeout(() => { $("copyLabel").textContent = "Salin hasil"; }, 2000);
        }
    });
    $("clearHistory").addEventListener("click", () => { history.length = 0; renderHistory(); notify("Riwayat dihapus."); });
    document.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            $("generatorForm").requestSubmit();
        }
    });
    let savedTheme;
    try { savedTheme = localStorage.getItem("flaggen-theme"); } catch { /* Use system preference. */ }
    applyTheme(["light", "dark"].includes(savedTheme) ? savedTheme : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
    $("themeToggle").addEventListener("click", () => applyTheme(document.body.classList.contains("light-theme") ? "dark" : "light"));
    updateAlgorithmNote();
    syncLength($("lengthInput").value);
})();
