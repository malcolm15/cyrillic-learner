// The Russian keyboard on /russian-keyboard: a text box that types Russian from the visitor's own keyboard
// or the on-screen keys, in two layouts. Loaded by that page only (pageScripts in
// scripts/standalone-pages.js), after the three core scripts.
//
// Self-contained: it works inside the element with id "russian-keyboard-app" and reads nothing from the core
// scripts except, for letter sounds, the audio paths in window.CYRILLIC_DATA (js/core.js). It could move into
// a frame of its own unchanged.
//
// What the visitor types or pastes lives only in the text box, in a Copy they ask for, and, in fallback mode,
// in the in-memory undo history below, which is never stored, logged or sent and is gone when the page closes.
// Nothing here writes markup from text: every label and letter is set with textContent.
(function () {
    'use strict';

    // ---- the layout table: the one source of truth for both layouts ----
    // KB_KEYS: [code, US character, US character with Shift, on-screen row or null], in on-screen order. The
    // Latin hint on a key is its US character (a capital on a letter key). IntlBackslash, on ISO keyboards
    // only, is mapped for physical typing and has no on-screen key.
    // KB_LAYOUTS: per layout, code to [unshifted, shifted]. Phonetic is the AATSEEL student layout with
    // TypeIt's punctuation; jcuken is the Windows Russian layout (KBDRU). scripts/pre-render.js parses both
    // literals and checks them against the 33 letters and the static key markup on the page.
    var KB_KEYS = [
        ["Backquote", "`", "~", 0],
        ["Digit1", "1", "!", 0],
        ["Digit2", "2", "@", 0],
        ["Digit3", "3", "#", 0],
        ["Digit4", "4", "$", 0],
        ["Digit5", "5", "%", 0],
        ["Digit6", "6", "^", 0],
        ["Digit7", "7", "&", 0],
        ["Digit8", "8", "*", 0],
        ["Digit9", "9", "(", 0],
        ["Digit0", "0", ")", 0],
        ["Minus", "-", "_", 0],
        ["Equal", "=", "+", 0],
        ["KeyQ", "q", "Q", 1],
        ["KeyW", "w", "W", 1],
        ["KeyE", "e", "E", 1],
        ["KeyR", "r", "R", 1],
        ["KeyT", "t", "T", 1],
        ["KeyY", "y", "Y", 1],
        ["KeyU", "u", "U", 1],
        ["KeyI", "i", "I", 1],
        ["KeyO", "o", "O", 1],
        ["KeyP", "p", "P", 1],
        ["BracketLeft", "[", "{", 1],
        ["BracketRight", "]", "}", 1],
        ["Backslash", "\\", "|", 1],
        ["KeyA", "a", "A", 2],
        ["KeyS", "s", "S", 2],
        ["KeyD", "d", "D", 2],
        ["KeyF", "f", "F", 2],
        ["KeyG", "g", "G", 2],
        ["KeyH", "h", "H", 2],
        ["KeyJ", "j", "J", 2],
        ["KeyK", "k", "K", 2],
        ["KeyL", "l", "L", 2],
        ["Semicolon", ";", ":", 2],
        ["Quote", "'", "\"", 2],
        ["KeyZ", "z", "Z", 3],
        ["KeyX", "x", "X", 3],
        ["KeyC", "c", "C", 3],
        ["KeyV", "v", "V", 3],
        ["KeyB", "b", "B", 3],
        ["KeyN", "n", "N", 3],
        ["KeyM", "m", "M", 3],
        ["Comma", ",", "<", 3],
        ["Period", ".", ">", 3],
        ["Slash", "/", "?", 3],
        ["IntlBackslash", "\\", "|", null]
    ];
    var KB_LAYOUTS = {
        "phonetic": {
            "Backquote": ["ё", "Ё"],
            "Digit1": ["1", "!"],
            "Digit2": ["2", "@"],
            "Digit3": ["3", "#"],
            "Digit4": ["4", "$"],
            "Digit5": ["5", "%"],
            "Digit6": ["6", "^"],
            "Digit7": ["7", "&"],
            "Digit8": ["8", "*"],
            "Digit9": ["9", "("],
            "Digit0": ["0", ")"],
            "Minus": ["-", "_"],
            "Equal": ["ъ", "Ъ"],
            "KeyQ": ["я", "Я"],
            "KeyW": ["ш", "Ш"],
            "KeyE": ["е", "Е"],
            "KeyR": ["р", "Р"],
            "KeyT": ["т", "Т"],
            "KeyY": ["ы", "Ы"],
            "KeyU": ["у", "У"],
            "KeyI": ["и", "И"],
            "KeyO": ["о", "О"],
            "KeyP": ["п", "П"],
            "BracketLeft": ["ю", "Ю"],
            "BracketRight": ["щ", "Щ"],
            "Backslash": ["э", "Э"],
            "KeyA": ["а", "А"],
            "KeyS": ["с", "С"],
            "KeyD": ["д", "Д"],
            "KeyF": ["ф", "Ф"],
            "KeyG": ["г", "Г"],
            "KeyH": ["ч", "Ч"],
            "KeyJ": ["й", "Й"],
            "KeyK": ["к", "К"],
            "KeyL": ["л", "Л"],
            "Semicolon": ["ь", "Ь"],
            "Quote": ["ж", "Ж"],
            "KeyZ": ["з", "З"],
            "KeyX": ["х", "Х"],
            "KeyC": ["ц", "Ц"],
            "KeyV": ["в", "В"],
            "KeyB": ["б", "Б"],
            "KeyN": ["н", "Н"],
            "KeyM": ["м", "М"],
            "Comma": [",", ";"],
            "Period": [".", ":"],
            "Slash": ["/", "?"],
            "IntlBackslash": ["\\", "|"]
        },
        "jcuken": {
            "Backquote": ["ё", "Ё"],
            "Digit1": ["1", "!"],
            "Digit2": ["2", "\""],
            "Digit3": ["3", "№"],
            "Digit4": ["4", ";"],
            "Digit5": ["5", "%"],
            "Digit6": ["6", ":"],
            "Digit7": ["7", "?"],
            "Digit8": ["8", "*"],
            "Digit9": ["9", "("],
            "Digit0": ["0", ")"],
            "Minus": ["-", "_"],
            "Equal": ["=", "+"],
            "KeyQ": ["й", "Й"],
            "KeyW": ["ц", "Ц"],
            "KeyE": ["у", "У"],
            "KeyR": ["к", "К"],
            "KeyT": ["е", "Е"],
            "KeyY": ["н", "Н"],
            "KeyU": ["г", "Г"],
            "KeyI": ["ш", "Ш"],
            "KeyO": ["щ", "Щ"],
            "KeyP": ["з", "З"],
            "BracketLeft": ["х", "Х"],
            "BracketRight": ["ъ", "Ъ"],
            "Backslash": ["\\", "/"],
            "KeyA": ["ф", "Ф"],
            "KeyS": ["ы", "Ы"],
            "KeyD": ["в", "В"],
            "KeyF": ["а", "А"],
            "KeyG": ["п", "П"],
            "KeyH": ["р", "Р"],
            "KeyJ": ["о", "О"],
            "KeyK": ["л", "Л"],
            "KeyL": ["д", "Д"],
            "Semicolon": ["ж", "Ж"],
            "Quote": ["э", "Э"],
            "KeyZ": ["я", "Я"],
            "KeyX": ["ч", "Ч"],
            "KeyC": ["с", "С"],
            "KeyV": ["м", "М"],
            "KeyB": ["и", "И"],
            "KeyN": ["т", "Т"],
            "KeyM": ["ь", "Ь"],
            "Comma": ["б", "Б"],
            "Period": ["ю", "Ю"],
            "Slash": [".", ","],
            "IntlBackslash": ["\\", "/"]
        }
    };

    // ---- spoken key names ----
    // The name each on-screen key gives a screen reader when it shows a symbol, in either layout, unshifted or
    // shifted: "Type comma", never "Type ,". A letter is named by itself, guarded with lang ru; a digit is
    // named by itself as well. scripts/pre-render.js parses this literal and requires its keys to be exactly the
    // symbols KB_LAYOUTS puts on on-screen keys.
    var KB_KEY_NAMES = {
        "!": "exclamation mark",
        "\"": "quotation mark",
        "#": "number sign",
        "$": "dollar sign",
        "%": "percent",
        "&": "ampersand",
        "(": "left parenthesis",
        ")": "right parenthesis",
        "*": "asterisk",
        "+": "plus",
        ",": "comma",
        "-": "hyphen",
        ".": "period",
        "/": "slash",
        ":": "colon",
        ";": "semicolon",
        "=": "equals",
        "?": "question mark",
        "@": "at sign",
        "\\": "backslash",
        "^": "caret",
        "_": "underscore",
        "№": "numero sign"
    };

    // ---- analytics: one function, one allowlist ----
    // Every event the page may send, its parameter names, and every value each may take. scripts/pre-render.js
    // parses this literal and requires the one analytics call to sit inside kbTrack. No value is built from the
    // text box, a selection, the clipboard or a key, so nothing typed can reach analytics.
    var KB_EVENTS = {
        "setting_changed": {
            "setting_name": ["keyboard_layout", "keyboard_russian_input", "keyboard_sound"],
            "setting_value": ["phonetic", "jcuken", true, false],
            "setting_source": ["keyboard_page"]
        },
        "keyboard_copied": { "method": ["button", "browser"] },
        "keyboard_used": { "input_source": ["physical", "onscreen"] },
        "keyboard_audio_failed": { "error": ["NotAllowedError", "NotSupportedError", "AbortError", "Error"] }
    };
    function kbTrack(name, params) {
        var own = Object.prototype.hasOwnProperty;
        if (!own.call(KB_EVENTS, name) || typeof window.gtag !== 'function') return;
        var spec = KB_EVENTS[name];
        var keys = Object.keys(params);
        if (keys.length !== Object.keys(spec).length) return;
        for (var i = 0; i < keys.length; i++) {
            if (!own.call(spec, keys[i]) || spec[keys[i]].indexOf(params[keys[i]]) === -1) return;
        }
        window.gtag('event', name, params);
    }

    // ---- preferences: three keys, each read against its allowed values ----
    var PREFS = {
        kbLayout: ['phonetic', 'jcuken'],
        kbRussianInput: ['on', 'off'],
        kbSound: ['off', 'on']
    };
    function readPref(key) {
        try {
            var v = window.localStorage.getItem(key);
            return PREFS[key].indexOf(v) !== -1 ? v : PREFS[key][0];
        } catch (e) {
            return PREFS[key][0];
        }
    }
    function writePref(key, v) {
        if (PREFS[key].indexOf(v) === -1) return;
        try { window.localStorage.setItem(key, v); } catch (e) { /* storage unavailable: the choice lasts this visit */ }
    }

    // Ь plays slower, at the rate js/core.js uses for it; scripts/pre-render.js checks the two agree.
    var KB_SOFT_SIGN_RATE = 0.79;
    // How long the note under the action row stays up: a short confirmation, and the copy failure long enough to read.
    var KB_NOTE_MS = 1500;
    var KB_NOTE_FAIL_MS = 6000;

    function isCyrillic(ch) {
        if (typeof ch !== 'string' || ch.length !== 1) return false;
        var c = ch.charCodeAt(0);
        return c >= 0x0400 && c <= 0x04FF;
    }

    // ---- the load-time probe ----
    // The mode is decided here, once, before any listener is attached, and never changes. The probe types two
    // letters into an off-screen textarea with execCommand and undoes them, checking each step. Focus goes back
    // to whatever had it, with its selection, in the same task, so nothing is painted in between; preventScroll
    // and position: fixed keep the page still; inputmode="none" keeps a virtual keyboard closed. The undo runs
    // only after a verified insertion, so it undoes the probe's own step; if the box's value changes all the
    // same, the probe redoes at once and reports failure.
    function probe(box) {
        var doc = document;
        var prev = doc.activeElement;
        var sx = window.scrollX, sy = window.scrollY;
        var v = box.value, s = box.selectionStart, e = box.selectionEnd, d = box.selectionDirection;
        var ok = false;
        var t = doc.createElement('textarea');
        t.setAttribute('aria-hidden', 'true');
        t.setAttribute('tabindex', '-1');
        t.setAttribute('inputmode', 'none');
        t.setAttribute('autocomplete', 'off');
        t.setAttribute('spellcheck', 'false');
        t.style.cssText = 'position:fixed;top:0;left:-10000px;width:10px;height:10px;opacity:0;pointer-events:none;';
        doc.body.appendChild(t);
        try {
            t.focus({ preventScroll: true });
            if (doc.activeElement === t && doc.execCommand('insertText', false, 'жж') === true &&
                t.value === 'жж' && box.value === v) {
                ok = doc.execCommand('undo') === true && t.value === '' && box.value === v;
                if (box.value !== v) doc.execCommand('redo');
            }
        } catch (x) {
            ok = false;
        }
        try {
            if (prev && prev !== doc.body && typeof prev.focus === 'function') prev.focus({ preventScroll: true });
            else t.blur();
            if (prev === box) box.setSelectionRange(s, e, d);
        } catch (x) { /* nothing to give focus back to */ }
        t.parentNode.removeChild(t);
        if (window.scrollX !== sx || window.scrollY !== sy) window.scrollTo(sx, sy);
        return ok && box.value === v && box.selectionStart === s && box.selectionEnd === e;
    }

    function init(root) {
        var box = root.querySelector('#kb-text');
        var statusEl = root.querySelector('#kb-status');
        var inputSwitch = root.querySelector('#kb-input');
        var soundSwitch = root.querySelector('#kb-sound');
        var phoneSwitch = root.querySelector('#kb-phone');
        var phoneHint = root.querySelector('#kb-phone-hint');
        var keysBox = root.querySelector('#kb-keys');
        var shiftBtn = root.querySelector('[data-kb="shift"]');
        var capsBtn = root.querySelector('[data-kb="caps"]');
        var keyEls = Array.prototype.slice.call(root.querySelectorAll('.kb-key[data-code]'));
        var keyByCode = {};
        keyEls.forEach(function (el) { keyByCode[el.getAttribute('data-code')] = el; });

        // ---- lookups built from the table ----
        var US = {}, byLatin = {};
        KB_KEYS.forEach(function (k) {
            US[k[0]] = [k[1], k[2]];
            if (k[0].indexOf('Key') === 0) byLatin[k[1]] = k[0];
        });
        function isLetterKey(layout, code) { return isCyrillic(KB_LAYOUTS[layout][code][0]); }
        // A letter key follows Shift and Caps Lock, and Caps+Shift gives lowercase; any other key follows Shift.
        function outputFor(layout, code, shift, caps) {
            var pair = KB_LAYOUTS[layout][code];
            if (!pair) return null;
            return pair[(isLetterKey(layout, code) ? shift !== caps : shift) ? 1 : 0];
        }

        var state = {
            layout: readPref('kbLayout'),
            input: readPref('kbRussianInput') === 'on',
            sound: readPref('kbSound') === 'on',
            shiftOnce: false,
            caps: false,
            composing: false,
            phone: false
        };

        // On a Deploy Preview only, ?kbmode=fallback forces fallback mode so it can be tested. Production
        // ignores it.
        var forceFallback = /^deploy-preview-\d+--dapper-axolotl-1f65df\.netlify\.app$/.test(location.hostname) &&
            /(^|[?&])kbmode=fallback(&|$)/.test(location.search.slice(1));
        var mode = probe(box) && !forceFallback ? 'native' : 'fallback';
        root.setAttribute('data-kb-mode', mode);

        function announce(msg) { statusEl.textContent = msg; }
        function exec(cmd, arg) { try { return document.execCommand(cmd, false, arg); } catch (e) { return false; } }

        // keyboard_used goes once per page load, on the first character typed, and says only where it came from.
        var usedSent = false;
        function used(source) {
            if (usedSent) return;
            usedSent = true;
            kbTrack('keyboard_used', { input_source: source });
        }

        // ---- letter sounds ----
        // The clips are human recordings of the letters' sounds. Their paths come from window.CYRILLIC_DATA, the
        // one list of them. Turning sounds on loads every clip at once, so no request ever depends on what is
        // typed; a key then plays its letter's clip (the soft sign at KB_SOFT_SIGN_RATE), and a failure is silent
        // apart from one keyboard_audio_failed per page load.
        var clips = null;
        var audioFailed = false;
        function audioFailure(e) {
            if (audioFailed) return;
            audioFailed = true;
            var name = e && typeof e.name === 'string' && KB_EVENTS.keyboard_audio_failed.error.indexOf(e.name) !== -1 ? e.name : 'Error';
            kbTrack('keyboard_audio_failed', { error: name });
        }
        function loadClips() {
            if (clips) return;
            clips = {};
            var data = window.CYRILLIC_DATA || {};
            Object.keys(data).forEach(function (group) {
                var chars = (data[group] && data[group].chars) || {};
                Object.keys(chars).forEach(function (k) {
                    var c = chars[k];
                    if (!c || typeof c.audio !== 'string' || !isCyrillic(c.upper) || !isCyrillic(c.lower)) return;
                    var a = new Audio(c.audio);
                    a.preload = 'auto';
                    a.addEventListener('error', function () { audioFailure({ name: 'NotSupportedError' }); });
                    a.load();
                    clips[c.upper] = a;
                    clips[c.lower] = a;
                });
            });
        }
        function playLetter(ch) {
            if (!state.sound || !clips || !Object.prototype.hasOwnProperty.call(clips, ch)) return;
            var a = clips[ch];
            try {
                a.pause();
                a.currentTime = 0;
                a.playbackRate = ch === 'Ь' || ch === 'ь' ? KB_SOFT_SIGN_RATE : 1;
                var played = a.play();
                if (played && typeof played.catch === 'function') played.catch(audioFailure);
            } catch (e) {
                audioFailure(e);
            }
        }

        // ---- fallback mode: the engine keeps the only history the visitor can reach ----
        // Native edits (typing with Russian input off, unmapped keys, paste, cut, the Backspace key, an IME) still
        // happen natively and are recorded from input events; the engine's own edits use setRangeText. Every undo
        // and redo (keys, buttons, a cancelable beforeinput) is the engine's. If the browser's own undo or redo
        // acts anyway, the input handler puts the text back as the engine knows it and then does the engine's
        // undo or redo, so the browser's history never touches the visitor's text.
        var hist = { steps: [], idx: 0, cur: null, pending: null, compBefore: null, keyOp: false };
        function snap() { return { v: box.value, s: box.selectionStart, e: box.selectionEnd }; }
        hist.cur = snap();
        function record(before, after, kind) {
            if (before.v === after.v) { hist.cur = after; return; }
            hist.steps.length = hist.idx;
            var last = hist.steps[hist.idx - 1];
            if (kind === 'type' && last && last.kind === 'type' && last.after.v === before.v &&
                last.after.e === before.s && before.s === before.e) {
                last.after = after;
            } else {
                hist.steps.push({ before: before, after: after, kind: kind });
                hist.idx += 1;
            }
            hist.cur = after;
        }
        function restore(st) {
            box.setRangeText(st.v, 0, box.value.length, 'end');
            box.setSelectionRange(st.s, st.e);
            hist.cur = snap();
        }
        function fbUndo() {
            if (hist.idx === 0) return false;
            hist.idx -= 1;
            restore(hist.steps[hist.idx].before);
            return true;
        }
        function fbRedo() {
            if (hist.idx >= hist.steps.length) return false;
            restore(hist.steps[hist.idx].after);
            hist.idx += 1;
            return true;
        }
        function fbEdit(s, e, text, kind) {
            var now = snap();
            if (now.v !== hist.cur.v) record(hist.cur, now, 'other');
            var before = snap();
            box.setRangeText(text, s, e, 'end');
            record(before, snap(), kind);
            return true;
        }

        // ---- one insertion function per mode ----
        function insert(text, kind) {
            if (mode === 'fallback') return fbEdit(box.selectionStart, box.selectionEnd, text, kind);
            var v = box.value, s = box.selectionStart, e = box.selectionEnd;
            var expected = v.slice(0, s) + text + v.slice(e);
            if (exec('insertText', text) && box.value === expected) return true;
            // The mode stays, and nothing else writes to the box: a second write here would mix two histories.
            announce(box.value === v ? 'That key could not be typed here. Your text is unchanged.' :
                'That key could not be typed here.');
            return false;
        }
        function surrogateLow(ch) { var c = ch.charCodeAt(0); return c >= 0xDC00 && c <= 0xDFFF; }
        function surrogateHigh(ch) { var c = ch.charCodeAt(0); return c >= 0xD800 && c <= 0xDBFF; }
        function deleteBackward() {
            if (mode === 'native') return exec('delete');
            var s = box.selectionStart, e = box.selectionEnd;
            if (s !== e) return fbEdit(s, e, '', 'other');
            if (s === 0) return false;
            return fbEdit(s > 1 && surrogateLow(box.value.charAt(s - 1)) ? s - 2 : s - 1, s, '', 'other');
        }
        function deleteForward() {
            if (mode === 'native') return exec('forwardDelete');
            var s = box.selectionStart, e = box.selectionEnd;
            if (s !== e) return fbEdit(s, e, '', 'other');
            if (s >= box.value.length) return false;
            return fbEdit(s, surrogateHigh(box.value.charAt(s)) ? s + 2 : s + 1, '', 'other');
        }
        function clearAll() {
            if (box.value === '') return false;
            if (mode === 'native') { box.select(); return exec('delete'); }
            return fbEdit(0, box.value.length, '', 'other');
        }
        function undo() { return mode === 'native' ? exec('undo') : fbUndo(); }
        function redo() { return mode === 'native' ? exec('redo') : fbRedo(); }

        // ---- on-screen controls: focus the box, restore its selection, act, give focus back ----
        var saved = { s: 0, e: 0, d: 'none' };
        box.addEventListener('blur', function () {
            saved = { s: box.selectionStart, e: box.selectionEnd, d: box.selectionDirection };
        });
        function inBox(fn) {
            var back = null;
            if (document.activeElement !== box) {
                back = document.activeElement;
                box.focus({ preventScroll: true });
                box.setSelectionRange(saved.s, saved.e, saved.d);
            }
            try { return fn(); } finally {
                if (back && back !== document.body && typeof back.focus === 'function') back.focus({ preventScroll: true });
            }
        }
        // A pointer press on a key or an editing button keeps focus, and the selection, in the box. Keyboard
        // activation is unaffected. Both events, because on iOS only mousedown keeps focus.
        function keepFocus(ev) { if (document.activeElement === box) ev.preventDefault(); }
        Array.prototype.forEach.call(root.querySelectorAll('#kb-keys button, .kb-actions [data-edit]'), function (b) {
            b.addEventListener('pointerdown', keepFocus);
            b.addEventListener('mousedown', keepFocus);
        });

        // Each key shows, and is named by, the character it types now.
        function renderKeys() {
            keyEls.forEach(function (el) {
                var ch = outputFor(state.layout, el.getAttribute('data-code'), state.shiftOnce, state.caps);
                el.setAttribute('data-letter', ch);
                el.querySelector('.kb-glyph').textContent = ch;
                // The key's name: a letter guarded with its language, a digit or symbol by its spoken name.
                var name = document.getElementById(el.getAttribute('aria-labelledby')).lastChild;
                name.textContent = ' ' + (KB_KEY_NAMES[ch] || ch);
                if (isCyrillic(ch)) {
                    name.setAttribute('lang', 'ru');
                    name.setAttribute('translate', 'no');
                    name.setAttribute('class', 'notranslate');
                } else {
                    name.removeAttribute('lang');
                    name.removeAttribute('translate');
                    name.setAttribute('class', 'kb-name');
                }
            });
            shiftBtn.setAttribute('aria-pressed', state.shiftOnce ? 'true' : 'false');
            capsBtn.setAttribute('aria-pressed', state.caps ? 'true' : 'false');
        }
        function flash(el) {
            if (!el) return;
            el.classList.add('kb-pressed');
            setTimeout(function () { el.classList.remove('kb-pressed'); }, 140);
        }
        keyEls.forEach(function (el) {
            el.addEventListener('click', function () {
                var ch = outputFor(state.layout, el.getAttribute('data-code'), state.shiftOnce, state.caps);
                if (inBox(function () { return insert(ch, 'type'); })) { used('onscreen'); playLetter(ch); }
                if (state.shiftOnce) { state.shiftOnce = false; renderKeys(); }
            });
        });

        // Copy writes to the clipboard here, inside the Copy click, and nowhere else. The page never reads it.
        var copyingFromButton = false;
        // What Copy reports is announced once by the status region and shown in the note under the action row,
        // which is aria-hidden so a screen reader hears it once. Each message replaces the last and restarts the
        // timer, so an earlier timeout never hides a newer message.
        var copyNote = root.querySelector('#kb-copy-note');
        var copyNoteTimer = null;
        function copyMessage(msg, ms) {
            announce(msg);
            copyNote.textContent = msg;
            copyNote.hidden = false;
            clearTimeout(copyNoteTimer);
            copyNoteTimer = setTimeout(function () { copyNote.hidden = true; }, ms);
        }
        // Clipboard promises can settle out of order. Every click, an empty-box click included, takes the next
        // generation, and a result reports only while its generation is still the latest. A stale success is
        // still counted (it did copy) but reports nothing; a stale failure does not try the selection copy at all.
        var copyGeneration = 0;
        function copyAll() {
            var gen = ++copyGeneration;
            var current = function () { return gen === copyGeneration; };
            // An empty box: nothing is written to the clipboard and nothing is counted.
            if (box.value === '') { copyMessage('Nothing to copy', KB_NOTE_MS); return; }
            var copied = function () {
                kbTrack('keyboard_copied', { method: 'button' });
                if (current()) copyMessage('Copied', KB_NOTE_MS);
            };
            var viaSelection = function () {
                if (!current()) return;
                inBox(function () {
                    var s = box.selectionStart, e = box.selectionEnd, d = box.selectionDirection;
                    box.select();
                    copyingFromButton = true;
                    var ok = exec('copy');
                    copyingFromButton = false;
                    box.setSelectionRange(s, e, d);
                    if (ok) copied();
                    else copyMessage('Copy did not work here. Select the text and use your browser\'s copy.', KB_NOTE_FAIL_MS);
                });
            };
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText(box.value).then(copied, viaSelection);
            } else {
                viaSelection();
            }
        }
        // A copy made with the browser's own controls is counted, never read.
        box.addEventListener('copy', function () {
            if (!copyingFromButton) kbTrack('keyboard_copied', { method: 'browser' });
        });
        var actions = {
            space: function () { inBox(function () { insert(' ', 'type'); }); },
            enter: function () { inBox(function () { insert('\n', 'other'); }); },
            backspace: function () { inBox(deleteBackward); },
            'delete': function () { inBox(deleteForward); },
            clear: function () { if (inBox(clearAll)) announce('Cleared'); },
            undo: function () { inBox(undo); },
            redo: function () { inBox(redo); },
            selectall: function () { box.focus({ preventScroll: true }); box.select(); },
            copy: copyAll,
            shift: function () { state.shiftOnce = !state.shiftOnce; renderKeys(); },
            caps: function () { state.caps = !state.caps; renderKeys(); announce(state.caps ? 'Caps Lock on' : 'Caps Lock off'); }
        };
        Array.prototype.forEach.call(root.querySelectorAll('[data-kb]'), function (b) {
            b.addEventListener('click', function () { actions[b.getAttribute('data-kb')](); });
        });

        // ---- the switches and the layout choice ----
        function setInput(on) {
            state.input = on;
            inputSwitch.checked = on;
            writePref('kbRussianInput', on ? 'on' : 'off');
            announce(on ? 'Russian input on' : 'Russian input off');
            kbTrack('setting_changed', { setting_name: 'keyboard_russian_input', setting_value: on, setting_source: 'keyboard_page' });
        }
        // A change counts as pointer-made when a pointer event (pointerdown or pointerup) reached the control
        // within the last 1.5 s and no key was pressed on it since. Release counts, so a long press still counts;
        // mousedown alone does not, so an activation that arrives as mouse events with no pointer events is treated
        // as keyboard-made. After a pointer-made change the box takes focus again, so typing can go on; after a
        // keyboard-made one focus stays put.
        var pointerAt = -1;
        function byPointer() {
            var p = pointerAt >= 0 && performance.now() - pointerAt < 1500;
            pointerAt = -1;
            return p;
        }
        function backToBox() { if (byPointer() && !state.phone) box.focus({ preventScroll: true }); }
        [root.querySelector('.kb-layouts'), inputSwitch.closest('.kb-toggle'), soundSwitch.closest('.kb-toggle')].forEach(function (el) {
            el.addEventListener('pointerdown', function () { pointerAt = performance.now(); });
            el.addEventListener('pointerup', function () { pointerAt = performance.now(); });
            el.addEventListener('keydown', function () { pointerAt = -1; });
        });
        inputSwitch.checked = state.input;
        inputSwitch.addEventListener('change', function () { setInput(inputSwitch.checked); backToBox(); });
        Array.prototype.forEach.call(root.querySelectorAll('input[name="kb-layout"]'), function (r) {
            r.checked = r.value === state.layout;
            r.addEventListener('change', function () {
                if (!r.checked) return;
                state.layout = r.value;
                writePref('kbLayout', r.value);
                renderKeys();
                announce(r.value === 'phonetic' ? 'Phonetic layout' : 'Standard Russian layout');
                kbTrack('setting_changed', { setting_name: 'keyboard_layout', setting_value: r.value, setting_source: 'keyboard_page' });
                backToBox();
            });
        });
        soundSwitch.checked = state.sound;
        if (state.sound) loadClips();
        soundSwitch.addEventListener('change', function () {
            state.sound = soundSwitch.checked;
            writePref('kbSound', state.sound ? 'on' : 'off');
            if (state.sound) loadClips();
            announce(state.sound ? 'Letter sounds on' : 'Letter sounds off');
            kbTrack('setting_changed', { setting_name: 'keyboard_sound', setting_value: state.sound, setting_source: 'keyboard_page' });
            backToBox();
        });
        // "Use my phone keyboard": the system keyboard types as itself, no remapping, keys hidden. No attempt to
        // open it from here: a focus() from a change handler does not open it on iOS, so the box is left blurred
        // and the hint asks for one tap on it, which opens the system keyboard the ordinary way. The switch lives
        // in memory only and never touches the stored Russian input setting: while it is on, mappedKey leaves
        // every key to the system keyboard and the Russian input switch is disabled, keeping the visitor's own
        // value, which applies again unchanged when the switch goes off.
        phoneSwitch.addEventListener('change', function () {
            state.phone = phoneSwitch.checked;
            if (state.phone) {
                box.removeAttribute('inputmode');
                keysBox.hidden = true;
                inputSwitch.disabled = true;
                phoneHint.hidden = false;
                box.blur();
                announce('Phone keyboard on. Tap the text box to type.');
            } else {
                box.setAttribute('inputmode', 'none');
                keysBox.hidden = false;
                inputSwitch.disabled = false;
                phoneHint.hidden = true;
                // With inputmode="none" back, focusing the box opens no keyboard.
                box.focus({ preventScroll: true });
                announce('Phone keyboard off. On-screen keys shown.');
            }
        });

        // ---- physical keys ----
        // A key is the browser's alone, with no remapping and no flash, while Russian input is off, in phone mode,
        // during an IME composition or a dead key, and while Ctrl, Cmd or Alt is held (AltGr included).
        function leftAlone(e) {
            return !state.input || state.phone ||
                e.isComposing || state.composing || e.keyCode === 229 || e.key === 'Dead' || e.key === 'Unidentified' || e.key === 'Process' ||
                e.ctrlKey || e.metaKey || e.altKey;
        }
        // Returns the character a key types, or null to leave the key to the browser.
        function mappedKey(e) {
            if (leftAlone(e)) return null;
            // A Russian system layout already types Cyrillic: leave it alone.
            if (isCyrillic(e.key)) return null;
            // The on-screen Caps Lock is the visitor's choice and changes only when they click it. For a key
            // Cyrilica remaps, the hardware Caps Lock adds to it; Shift inverts either, so Caps+Shift gives
            // lowercase. A key the OS already types in Cyrillic returned above, untouched by either.
            var caps = state.caps || !!(e.getModifierState && e.getModifierState('CapsLock'));
            var code = null;
            if (state.layout === 'phonetic') {
                // Letters follow the letter printed on the key; a punctuation position is remapped only where
                // the phonetic output differs from the US key, so digits and symbols stay the visitor's own.
                if (typeof e.key === 'string' && /^[A-Za-z]$/.test(e.key)) {
                    code = byLatin[e.key.toLowerCase()];
                } else if (KB_LAYOUTS.phonetic[e.code] && e.code.indexOf('Key') !== 0 &&
                           outputFor('phonetic', e.code, e.shiftKey, caps) !== US[e.code][e.shiftKey ? 1 : 0]) {
                    code = e.code;
                }
            } else if (KB_LAYOUTS.jcuken[e.code]) {
                // Standard Russian is positional: the key's place decides, whatever the visitor's layout prints.
                code = e.code;
            }
            if (!code) return null;
            return { code: code, ch: outputFor(state.layout, code, e.shiftKey, caps) };
        }
        // A key left to the browser still lights an on-screen key or control, but only one showing exactly what the
        // browser types; this never prevents the key and never types. Space, Backspace, Delete and Enter light their
        // controls. A letter the OS already types in Cyrillic lights the key showing that letter, in either case. Any
        // other key lights the key at its position only if that key's current character equals event.key, so a digit
        // or symbol lights only when the on-screen Shift matches the physical one: with the on-screen Shift on, a
        // physical unshifted 1 types "1" while the key shows "!", and with it off, a physical Shift+1 types "!" while
        // the key shows "1", and neither lights. A UK Shift+2 (") or a German Minus (ß) never lights a key. Shift,
        // Caps Lock and every other key light nothing.
        var ctlByCode = { Space: 'space', Backspace: 'backspace', Delete: 'delete', Enter: 'enter', NumpadEnter: 'enter' };
        function flashThrough(e) {
            if (leftAlone(e)) return;
            var el = null;
            if (ctlByCode[e.code]) {
                el = root.querySelector('[data-kb="' + ctlByCode[e.code] + '"]');
            } else if (isCyrillic(e.key)) {
                var letter = e.key.toLowerCase();
                el = keyEls.filter(function (k) { return k.getAttribute('data-letter').toLowerCase() === letter; })[0] || null;
            } else if (keyByCode[e.code] && keyByCode[e.code].getAttribute('data-letter') === e.key) {
                el = keyByCode[e.code];
            }
            flash(el);
        }
        box.addEventListener('keydown', function (e) {
            if (mode === 'fallback' && (e.metaKey || e.ctrlKey) && !e.altKey) {
                // The letter decides, as the browser's own shortcut does: event.key when it is a Latin letter; the
                // key's place only when event.key is a letter of another script (an OS Russian layout types я on
                // the Z key); punctuation is never a shortcut here.
                var key = typeof e.key === 'string' && e.key.length === 1 ? e.key : '';
                var latin = /^[A-Za-z]$/.test(key);
                var letter = latin || key.toLowerCase() !== key.toUpperCase();
                var k = latin ? key.toLowerCase() : letter && e.code === 'KeyZ' ? 'z' : letter && e.code === 'KeyY' ? 'y' : '';
                var z = k === 'z', y = k === 'y';
                if (z || (y && e.ctrlKey && !e.shiftKey)) {
                    e.preventDefault();
                    hist.keyOp = true;
                    setTimeout(function () { hist.keyOp = false; }, 0);
                    if (z && !e.shiftKey) fbUndo(); else fbRedo();
                    return;
                }
            }
            // Esc turns Russian input off. With input off it is left to the browser; the switch turns input on.
            if (e.key === 'Escape' && state.input && !state.phone && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && !e.isComposing) {
                e.preventDefault();
                setInput(false);
                return;
            }
            var m = mappedKey(e);
            if (!m) { flashThrough(e); return; }
            e.preventDefault();
            flash(keyByCode[m.code]);
            if (insert(m.ch, 'type')) { used('physical'); playLetter(m.ch); }
        });
        box.addEventListener('compositionstart', function () {
            state.composing = true;
            if (mode === 'fallback') hist.compBefore = hist.pending || snap();
        });
        box.addEventListener('compositionend', function () {
            state.composing = false;
            if (mode !== 'fallback') return;
            var before = hist.compBefore || hist.cur;
            hist.compBefore = null;
            setTimeout(function () { record(before, snap(), 'other'); }, 0);
        });
        box.addEventListener('beforeinput', function (e) {
            if (mode !== 'fallback') return;
            if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') {
                if (e.cancelable) {
                    e.preventDefault();
                    if (!hist.keyOp) { if (e.inputType === 'historyUndo') fbUndo(); else fbRedo(); }
                }
                return;
            }
            if (!state.composing) hist.pending = snap();
        });
        box.addEventListener('input', function (e) {
            if (mode !== 'fallback') return;
            var t = e.inputType || '';
            if (t === 'historyUndo' || t === 'historyRedo') {
                restore(hist.cur);
                if (!hist.keyOp) { if (t === 'historyUndo') fbUndo(); else fbRedo(); }
                return;
            }
            if (state.composing || t === 'insertCompositionText') return;
            var before = hist.pending || hist.cur;
            hist.pending = null;
            record(before, snap(), t === 'insertText' ? 'type' : 'other');
        });
        document.addEventListener('selectionchange', function () {
            if (mode === 'fallback' && document.activeElement === box && box.value === hist.cur.v) hist.cur = snap();
        });

        renderKeys();
        // Desktop landing: the caret waits in the box. Only with a mouse and a physical keyboard, only when nothing
        // has focus yet, no #fragment was asked for, and the phone keyboard is off. A touch screen lands as it is.
        if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
            (document.activeElement === null || document.activeElement === document.body) && !location.hash && !state.phone) {
            box.focus({ preventScroll: true });
        }
    }

    var root = document.getElementById('russian-keyboard-app');
    if (root) init(root);
}());
