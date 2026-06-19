# Matrix Rain Effect

Removed from production in June 2026 when Matrix Mode was replaced with a plain
AMOLED dark theme. Preserved here verbatim for restoration if needed.

Note: by the time this was removed, the CSS token names had already been renamed
from --matrix-green / --matrix-green-dim to --dark-accent / --dark-accent-dim.
The code below reflects the file state at removal time. The original green values
were: --dark-accent #00cc33, --dark-accent-dim #009922.

## Start and stop call sites (in js/core.js)

loadSettings(): inside the `if (darkMode)` block, called with a 2-second delay on page load:

    setTimeout(() => startCyrillicRain(), 2000);

toggleDarkMode(): startCyrillicRain() called when enabling dark mode,
stopCyrillicRain() called when disabling.

No page-change hook -- rain ran continuously on whatever page was active.

## CSS (was in css/styles.css, around lines 103-146)

```css
/* Cyrillic Rain Effect */
.cyrillic-rain {
    position: fixed;
    top: -100px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 1.3rem;
    color: var(--dark-accent);
    pointer-events: none;
    z-index: 9998;
    line-height: 1.4;
    letter-spacing: 2px;
    animation: rainFall 2.5s linear forwards;
    filter: blur(0px);
}

.cyrillic-rain::after {
    content: attr(data-trail);
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    color: var(--dark-accent-dim);
    opacity: 0.3;
    white-space: pre-line;
}

@keyframes rainFall {
    0% {
        opacity: 0;
        transform: translateY(0);
        filter: blur(0px);
    }
    3% {
        opacity: 1;
    }
    97% {
        opacity: 0.9;
    }
    100% {
        opacity: 0;
        transform: translateY(100vh);
        filter: blur(1px);
    }
}
```

## JavaScript (was in js/core.js, around lines 152-237)

```js
// Cyrillic Rain Effect
let rainInterval = null;
const CYRILLIC_CHARS = ['А','Б','В','Г','Д','Е','Ё','Ж','З','И','Й','К','Л','М','Н','О','П','Р','С','Т','У','Ф','Х','Ц','Ч','Ш','Щ','Ъ','Ы','Ь','Э','Ю','Я'];

function createRainDrop() {
    const drop = document.createElement('div');
    drop.className = 'cyrillic-rain';

    const trailLength = 6 + Math.floor(Math.random() * 5);
    let chars = [];
    for (let i = 0; i < trailLength; i++) {
        chars.push(CYRILLIC_CHARS[Math.floor(Math.random() * CYRILLIC_CHARS.length)]);
    }

    const visibleChars = chars.slice(0, 3 + Math.floor(Math.random() * 2));
    drop.innerHTML = visibleChars.join('<br>');

    const trailChars = chars.slice(visibleChars.length);
    drop.setAttribute('data-trail', trailChars.join('\n'));

    const randomX = Math.random() * (window.innerWidth - 50);
    drop.style.left = randomX + 'px';

    document.body.appendChild(drop);

    let morphInterval = setInterval(() => {
        if (!document.body.contains(drop)) {
            clearInterval(morphInterval);
            return;
        }
        const numChanges = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numChanges; i++) {
            const charIndex = Math.floor(Math.random() * chars.length);
            chars[charIndex] = CYRILLIC_CHARS[Math.floor(Math.random() * CYRILLIC_CHARS.length)];
        }
        const newVisibleChars = chars.slice(0, visibleChars.length);
        const newTrailChars = chars.slice(visibleChars.length);
        drop.innerHTML = newVisibleChars.join('<br>');
        drop.setAttribute('data-trail', newTrailChars.join('\n'));
    }, 80);

    setTimeout(() => {
        clearInterval(morphInterval);
        drop.remove();
    }, 2500);
}

function startCyrillicRain() {
    if (rainInterval) return;

    setTimeout(createRainDrop, 2000);

    function scheduleNextDrop() {
        const delay = 8000 + Math.random() * 7000;
        rainInterval = setTimeout(() => {
            if (darkMode) {
                createRainDrop();
                scheduleNextDrop();
            }
        }, delay);
    }

    scheduleNextDrop();
}

function stopCyrillicRain() {
    if (rainInterval) {
        clearTimeout(rainInterval);
        rainInterval = null;
    }
    document.querySelectorAll('.cyrillic-rain').forEach(drop => drop.remove());
}
```
