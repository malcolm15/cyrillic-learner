//
// Standalone pre-rendered pages.
//
// A standalone page is a real indexable URL that is NOT an article: it never
// appears in ARTICLES, ARTICLE_ORDER, ARTICLE_META, article-heads.ts, the
// article index cards, the related cards or the prev/next loop. It is emitted
// by scripts/pre-render.js from the same index.html template the articles use,
// so it inherits the nav, the pre-paint theme snippet, the footer and the three
// core scripts, and nothing else.
//
// This file is BUILD TIME ONLY. It is never served (_redirects answers
// /scripts/* with 404) and it is never loaded by a browser, so the page copy
// adds no bytes to any runtime download. js/articles.js stays articles only.
//
// `bodyHtml` is the contents of the emitted <main>, starting at the card. The
// router is not involved on these pages: every link is a plain href, so nothing
// here may call navTo, navToArticle, showPage or showArticle. See CLAUDE.md,
// "Standalone pages".
//
// `published` and `modified` are the local date of the commit that adds or
// changes the page, and the build asserts that `modified` matches both the
// JSON-LD dateModified and the page's sitemap lastmod.
//
// Optional fields. Every one defaults to the behaviour /teachers has always had,
// so an entry that leaves them out is emitted exactly as before.
//   lang                 <html lang>. Default 'en'.
//   schema               { inLanguage, audience, aboutName, aboutDescription } for
//                        the WebPage block. Defaults: 'en', true (a teacher
//                        audience), 'Russian alphabet', 'The 33 letters of the
//                        Russian Cyrillic alphabet'.
//   breadcrumbHomeName   Name of breadcrumb step 1. Default 'Home'.
//   chrome               Replaces the inherited English chrome: { logoHref,
//                        navItems, themeLabel, menuLabel, footerHtml }. Default:
//                        the English nav and footer from index.html.
//   quizPage             { answers, strings }, serialised into the head as
//                        window.QUIZ_PAGE, which js/core.js reads (see the
//                        localisation seam there). This is the ONLY place a page's
//                        answer table and runtime strings live.
//   groupTitles          The six study-group titles the page shows, in order.
//                        Required with quizPage; the build checks the cards.
//   inbound              'footer' (default): linked from the English footer and
//                        the About page. 'language': for a page in another
//                        language, linked from the footer of every English
//                        document (footerLabel) and once from the homepage, as a
//                        link shown only to browsers whose primary language
//                        matches (inboundLabel).
//   allowedOnclick       Exact onclick attribute values allowed inside <main>.
//                        Default none. Router calls stay banned regardless.
//   inboundLabel         With inbound 'language': the text of the homepage
//                        link, <p class="lang-suggest"><a href="/<slug>"
//                        hreflang="<lang>" lang="<lang>">label</a></p>.
//   footerLabel          With inbound 'language': the text of the footer link,
//                        <a href="/<slug>" hreflang="<lang>" lang="<lang>">label</a>.
//   alternates           [{ hreflang, href }]. Emitted as <link rel="alternate">
//                        after the canonical. The homepage's copy of the same tags
//                        is added by netlify/edge-functions/head-rewrite.ts, and
//                        the build asserts the two agree.
//   settingsPanel        true: the page carries its own <details id="quiz-settings">
//                        with the five quiz toggles from index.html's Settings
//                        page (same ids and onchange values, so core.js syncs
//                        them and localStorage is shared). Allows exactly those
//                        five onchange values inside <main>. Default false.

// The Spanish quiz's runtime strings and answer table. Constants, so the chrome
// below reuses the theme label instead of keeping a second copy of it.
const ES_STRINGS = {
    score: 'Aciertos: {correct}/{total}',
    progress: 'Pregunta {n}',
    correct: '✓ ¡Correcto!',
    wrong: '✗ Incorrecto. Respuesta: {answer}',
    skip: 'Respuesta: {answer}',
    themeToDark: 'Cambiar al tema oscuro',
    themeToLight: 'Cambiar al tema claro',
};

// Only letters that differ from English appear here. `show` replaces the
// displayed romanization; `accept` adds answers. Every other letter keeps
// exactly its English display and single answer. The curly quotes for Ъ and Ь
// are not listed: every page accepts them through ANSWER_VARIANTS in
// js/core.js, and the build fails if a page repeats them.
const ES_ANSWERS = {
    'Х': { show: 'j', accept: ['kh'] },
    'Щ': { accept: ['sch'] },
};

// Translation guards for the Spanish prose. A page translator (Chrome's, or
// translate.goog) rewrites Cyrillic letters and short romanizations as if they
// were words, so "e" can come back as "and" and Х as "Kh". ru() marks a Russian
// letter and rom() a romanization or quoted sign; both render as the bare text,
// so the visible copy is unchanged. scripts/pre-render.js asserts every Cyrillic
// letter in the page's <main> sits inside one of these or a quiz element that
// carries translate="no".
const ru = ch => '<span lang="ru" translate="no" class="notranslate">' + ch + '</span>';
const rom = text => '<span translate="no" class="notranslate">' + text + '</span>';

module.exports = [
    {
        slug: 'teachers',
        title: 'Teach the Russian Alphabet: A Free Classroom Tool | Cyrilica',
        description: 'A free, no-sign-up way to teach the Russian alphabet: a quick letter quiz, an audio chart and a printable chart for your classroom.',
        h1: 'Cyrilica for Teachers',
        // Asserted present exactly once in the emitted raw HTML, so the body
        // copy cannot silently disappear behind a template change.
        keySentence: 'A student sees a letter, types how it sounds in Latin letters, and gets an answer straight away.',
        published: '2026-10-19',
        modified: '2026-10-20',
        breadcrumbName: 'For Teachers',
        bodyHtml: `                    <div class="card">
                        <h1>Cyrilica for Teachers</h1>

                        <div class="content-text">
                            <p>Cyrilica is a free tool for learning and practising the 33 letters of the Russian alphabet. A student sees a letter, types how it sounds in Latin letters, and gets an answer straight away.</p>
                        </div>

                        <h2>See Cyrilica in action</h2>
                        <figure class="demo-figure" id="quiz-demo">
                            <video id="quiz-demo-wide" class="demo-video demo-video-wide" width="988" height="654" src="/media/teachers/quiz-demo-wide-v1.mp4" poster="/media/teachers/quiz-demo-wide-poster-v1.webp" muted loop playsinline preload="none" aria-describedby="quiz-demo-caption"></video>
                            <video id="quiz-demo-phone" class="demo-video demo-video-phone" width="480" height="718" src="/media/teachers/quiz-demo-phone-v1.mp4" poster="/media/teachers/quiz-demo-phone-poster-v1.webp" muted loop playsinline preload="none" aria-describedby="quiz-demo-caption"></video>
                            <button type="button" class="btn demo-toggle" id="quiz-demo-toggle">Play the demo</button>
                            <figcaption id="quiz-demo-caption">A short silent loop: Vowels 1 is selected and Begin Learning is pressed, then three questions. A correct answer shows a green tick and confetti; a wrong answer shows the right romanization in red.</figcaption>
                        </figure>

                        <h2>Try it in your next lesson</h2>
                        <div class="content-text">
                            <ol>
                                <li>Open the quiz and choose the first group, Vowels 1 (А Е И О У).</li>
                                <li>Play those sounds from the alphabet chart as a class.</li>
                                <li>Have students drill the group for five minutes on their own devices.</li>
                                <li>In the next lesson, add the next group and mix in the ones they already know.</li>
                            </ol>
                        </div>

                        <div class="tool-cta-banner">
                            <div class="tool-cta-content">
                                <p><strong>Everything you need for the lesson</strong></p>
                                <div class="standalone-actions">
                                    <a class="btn tool-cta-btn" href="/">Start the quiz</a>
                                    <a class="btn tool-cta-btn" href="/articles/russian-alphabet-chart">Russian alphabet chart with audio</a>
                                    <a class="btn tool-cta-btn" href="/articles/russian-alphabet-chart#print-controls">Printable alphabet chart</a>
                                </div>
                            </div>
                        </div>

                        <h2>Who it's for</h2>
                        <div class="content-text">
                            <ul>
                                <li>Introductory university Russian courses</li>
                                <li>Middle and high school language programs</li>
                                <li>Adult education and evening classes</li>
                                <li>Any student who needs extra practice with the alphabet</li>
                            </ul>
                        </div>

                        <h2>Why it works in a classroom</h2>
                        <div class="content-text">
                            <ul>
                                <li>No accounts, no sign-up, nothing to install. Share the link and students can start.</li>
                                <li>Teach the alphabet in stages. Letters come in six groups: two sets of vowels, then four sets of consonants. Students can drill one group or any mix.</li>
                                <li>Audio examples across all 33 letters, so students hear the sounds as they learn the shapes.</li>
                                <li>A printable chart of all 33 letters, with optional example words, for the wall or as a handout. It can also be saved as a PDF.</li>
                                <li>Works in any modern web browser, on laptops, tablets and phones.</li>
                            </ul>
                        </div>

                        <h2>What it is, and what it isn't</h2>
                        <div class="content-text">
                            <p>Cyrilica teaches and drills the alphabet. It isn't a full Russian course, and it works best alongside the textbook or course you already use.</p>
                        </div>

                        <h2>Settings worth knowing</h2>
                        <div class="content-text">
                            <p>You can turn on lowercase letters, play the sound automatically when an answer is correct, or submit answers without pressing Enter. Settings are saved in each browser, so set them on every device students use.</p>
                        </div>

                        <h2>Privacy</h2>
                        <div class="content-text">
                            <p>No account is required, and students don't need to provide their names or email addresses to use Cyrilica. The site uses Google Analytics and cookies to understand how it's used. See our <a href="/privacy">privacy policy</a> for details.</p>
                        </div>

                        <h2>Beyond Russian</h2>
                        <div class="content-text">
                            <p>The quiz covers the Russian alphabet. There are also guides to the <a href="/articles/ukrainian-alphabet">Ukrainian</a>, <a href="/articles/belarusian-alphabet">Belarusian</a>, <a href="/articles/serbian-cyrillic-vs-latin">Serbian</a> and <a href="/articles/bulgarian-alphabet">Bulgarian</a> alphabets.</p>
                        </div>

                        <div class="content-text">
                            <p>I built Cyrilica to make learning the Cyrillic alphabet a little easier. If you're teaching Russian and have suggestions for how it could work better in a classroom, I'd love to hear from you. <a href="/contact">Get in touch</a>.</p>
                        </div>
                    </div>
                    <script>
                    // The demo clips. There are two video elements, one per
                    // width, and the CSS media query in css/styles.css decides
                    // which one is shown. THAT QUERY IS THE ONLY PLACE THE
                    // BREAKPOINT EXISTS: this script asks the layout which clip
                    // is on screen (offsetParent is null for a display:none
                    // element) rather than keeping a second copy of the number,
                    // which could then drift from the CSS.
                    //
                    // Neither element carries an autoplay attribute. Autoplay in
                    // the markup starts the download before anything can decide,
                    // and prefers-reduced-motion cannot stop it. Both carry
                    // preload="none", so a clip is fetched only at the moment
                    // this script chooses to play it, and never at all for a
                    // visitor who asked for reduced motion.
                    (function () {
                        var figure = document.getElementById('quiz-demo');
                        var button = document.getElementById('quiz-demo-toggle');
                        if (!figure || !button) return;
                        var videos = [].slice.call(figure.getElementsByTagName('video'));
                        var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
                        var inView = {};
                        var pausedByVisitor = false;

                        function visible() {
                            var shown = videos.filter(function (v) { return v.offsetParent !== null; });
                            return shown.length ? shown[0] : null;
                        }
                        function label() {
                            var v = visible();
                            button.textContent = (v && !v.paused) ? 'Pause the demo' : 'Play the demo';
                        }
                        function start(v) {
                            v.preload = 'auto';
                            var p = v.play();
                            if (p && p.catch) p.catch(function () {});
                        }
                        // The single decision point. Called whenever anything
                        // that feeds it changes: visibility, viewport width, the
                        // reduced-motion setting, or the button.
                        function apply() {
                            var current = visible();
                            videos.forEach(function (v) {
                                if (v !== current && !v.paused) v.pause();
                            });
                            if (current) {
                                var wanted = !pausedByVisitor && !motion.matches && inView[current.id] === true;
                                if (wanted && current.paused) start(current);
                                else if (!wanted && !current.paused) current.pause();
                            }
                            label();
                        }

                        button.addEventListener('click', function () {
                            var current = visible();
                            if (!current) return;
                            if (current.paused) {
                                // An explicit Play overrides both an earlier
                                // pause and the reduced-motion default.
                                pausedByVisitor = false;
                                start(current);
                            } else {
                                // Remembered for the whole figure, not per clip,
                                // so scrolling away and back, or resizing across
                                // the breakpoint, cannot restart it.
                                pausedByVisitor = true;
                                current.pause();
                            }
                            label();
                        });
                        videos.forEach(function (v) {
                            v.addEventListener('play', label);
                            v.addEventListener('pause', label);
                        });

                        if (window.IntersectionObserver) {
                            var io = new IntersectionObserver(function (entries) {
                                entries.forEach(function (e) {
                                    inView[e.target.id] = e.isIntersecting && e.intersectionRatio >= 0.4;
                                });
                                apply();
                            }, { threshold: [0, 0.4, 0.75] });
                            videos.forEach(function (v) { io.observe(v); });
                        }
                        // A resize can swap which clip is shown without moving
                        // anything into or out of view, so the observer alone is
                        // not enough to keep the button pointed at the right one.
                        window.addEventListener('resize', apply);
                        if (motion.addEventListener) motion.addEventListener('change', apply);
                        label();
                    })();
                    </script>`,
    },
    {
        slug: 'es',
        lang: 'es',
        title: 'Alfabeto ruso: practica las 33 letras con audio | Cyrilica',
        description: 'Aprende el alfabeto ruso, también llamado abecedario ruso: 33 letras cirílicas, audio y ejercicios interactivos gratis. Sin registro.',
        h1: 'Alfabeto ruso: aprende las 33 letras',
        keySentence: 'El alfabeto ruso, también llamado abecedario ruso, tiene 33 letras y se escribe con el alfabeto cirílico.',
        published: '2026-10-20',
        modified: '2026-10-21',
        breadcrumbName: 'Alfabeto ruso',
        breadcrumbHomeName: 'Cyrilica',
        schema: {
            inLanguage: 'es',
            audience: false,
            aboutName: 'Alfabeto ruso',
            aboutDescription: 'Las 33 letras del alfabeto cirílico ruso',
        },
        inbound: 'language',
        inboundLabel: 'Practicar en español',
        footerLabel: 'Quiz en español',
        alternates: [
            { hreflang: 'en', href: 'https://cyrilica.com/' },
            { hreflang: 'es', href: 'https://cyrilica.com/es' },
            { hreflang: 'x-default', href: 'https://cyrilica.com/' },
        ],
        allowedOnclick: ['selectAllGroups()', 'clearAllGroups()', 'checkAnswer()', 'burstConfetti(event, this)'],
        settingsPanel: true,
        groupTitles: ['Vocales 1', 'Vocales 2', 'Consonantes 1', 'Consonantes 2', 'Consonantes 3', 'Consonantes 4'],
        quizPage: { answers: ES_ANSWERS, strings: ES_STRINGS },
        chrome: {
            logoHref: '/es',
            navItems:
                '                <li><a href="/es" class="active" aria-current="page">Inicio</a></li>\n' +
                '                <li><a href="/articles">Artículos (en inglés)</a></li>\n' +
                '                <li><a href="/" hreflang="en" lang="en">English</a></li>',
            themeLabel: ES_STRINGS.themeToDark,
            menuLabel: 'Menú',
            footerHtml:
                '        <div class="footer-content">\n' +
                '            <p>© 2026 Cyrilica. Todos los derechos reservados.</p>\n' +
                '            <div class="footer-links">\n' +
                '                <span class="footer-label">En inglés:</span>\n' +
                '                <a href="/privacy">Privacidad</a>\n' +
                '                <a href="/terms">Términos</a>\n' +
                '                <a href="/about">Acerca de</a>\n' +
                '                <a href="/teachers">Para docentes</a>\n' +
                '                <a href="/contact">Contacto</a>\n' +
                '            </div>\n' +
                '        </div>',
        },
        bodyHtml: `                    <header>
                        <div class="logo-display notranslate" translate="no">CYRI<span class="letter-l" lang="ru" onclick="burstConfetti(event, this)">Л<span class="confetti-burst"></span></span>ICA</div>
                        <h1 class="subtitle">Alfabeto ruso: aprende las 33 letras</h1>
                        <p class="site-description">El alfabeto ruso, también llamado abecedario ruso, tiene 33 letras y se escribe con el alfabeto cirílico.</p>
                    </header>

                    <div class="card char-reference">
                        <div class="selection-header">
                            <h2>Elige las letras que quieres practicar</h2>
                            <div class="selection-controls">
                                <button class="btn btn-control" onclick="selectAllGroups()">Seleccionar todo</button>
                                <button class="btn btn-control" onclick="clearAllGroups()">Quitar todo</button>
                            </div>
                        </div>
                        <p class="content-text" style="margin-bottom: 14px; font-size: 0.9rem;">Toca o haz clic en un grupo para elegirlo. Los grupos elegidos se marcan en rojo. ¿Quieres ver antes todas las letras con su sonido? Consulta la <a href="/articles/russian-alphabet-chart" class="reference-link">tabla del alfabeto ruso</a> (en inglés).</p>
                        <div id="reference-container">
                            <div class="reference-section" data-group="vowels_1">
                                <div class="section-title">Vocales 1</div>
                                <div class="reference-grid notranslate" translate="no">
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">А</span><span class="char-ref-roman">a</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Е</span><span class="char-ref-roman">ye</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">И</span><span class="char-ref-roman">i</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">О</span><span class="char-ref-roman">o</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">У</span><span class="char-ref-roman">u</span></div>
                                </div>
                            </div>
                            <div class="reference-section" data-group="vowels_2">
                                <div class="section-title">Vocales 2</div>
                                <div class="reference-grid notranslate" translate="no">
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Ё</span><span class="char-ref-roman">yo</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Ы</span><span class="char-ref-roman">y</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Э</span><span class="char-ref-roman">e</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Ю</span><span class="char-ref-roman">yu</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Я</span><span class="char-ref-roman">ya</span></div>
                                </div>
                            </div>
                            <div class="reference-section" data-group="consonants_1">
                                <div class="section-title">Consonantes 1</div>
                                <div class="reference-grid notranslate" translate="no">
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Б</span><span class="char-ref-roman">b</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">В</span><span class="char-ref-roman">v</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Г</span><span class="char-ref-roman">g</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Д</span><span class="char-ref-roman">d</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Ж</span><span class="char-ref-roman">zh</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">З</span><span class="char-ref-roman">z</span></div>
                                </div>
                            </div>
                            <div class="reference-section" data-group="consonants_2">
                                <div class="section-title">Consonantes 2</div>
                                <div class="reference-grid notranslate" translate="no">
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">К</span><span class="char-ref-roman">k</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Л</span><span class="char-ref-roman">l</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">М</span><span class="char-ref-roman">m</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Н</span><span class="char-ref-roman">n</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">П</span><span class="char-ref-roman">p</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Р</span><span class="char-ref-roman">r</span></div>
                                </div>
                            </div>
                            <div class="reference-section" data-group="consonants_3">
                                <div class="section-title">Consonantes 3</div>
                                <div class="reference-grid notranslate" translate="no">
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">С</span><span class="char-ref-roman">s</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Т</span><span class="char-ref-roman">t</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Ф</span><span class="char-ref-roman">f</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Х</span><span class="char-ref-roman">j</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Ц</span><span class="char-ref-roman">ts</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Ч</span><span class="char-ref-roman">ch</span></div>
                                </div>
                            </div>
                            <div class="reference-section" data-group="consonants_4">
                                <div class="section-title">Consonantes 4</div>
                                <div class="reference-grid notranslate" translate="no">
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Ш</span><span class="char-ref-roman">sh</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Щ</span><span class="char-ref-roman">shch</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Ъ</span><span class="char-ref-roman">"</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Ь</span><span class="char-ref-roman">'</span></div>
                                    <div class="char-ref-item"><span class="char-ref-cyrillic">Й</span><span class="char-ref-roman">y</span></div>
                                </div>
                            </div>
                        </div>
                        <button class="start-btn" id="start-btn" disabled>Empezar</button>
                    </div>

                    <details class="quiz-settings" id="quiz-settings">
                        <summary class="btn btn-settings">⚙️ Ajustes</summary>
                        <div class="card quiz-settings-body">
                            <p class="quiz-settings-intro">Los ajustes se guardan en este navegador y también se aplican a la versión en inglés.</p>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label" id="autosubmit-label">Envío automático</div>
                                    <div class="setting-desc" id="autosubmit-desc">La respuesta se envía sola en cuanto es correcta.</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="autosubmit-toggle" onchange="toggleAutoSubmit()" aria-labelledby="autosubmit-label" aria-describedby="autosubmit-desc">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label" id="autoaudio-label">Sonido automático</div>
                                    <div class="setting-desc" id="autoaudio-desc">Reproduce la pronunciación al acertar.</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="autoaudio-toggle" onchange="toggleAutoAudio()" aria-labelledby="autoaudio-label" aria-describedby="autoaudio-desc">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label" id="lowercase-label">Mostrar minúsculas</div>
                                    <div class="setting-desc" id="lowercase-desc">Muestra la letra minúscula junto a la mayúscula.</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="lowercase-toggle" onchange="toggleLowercase()" aria-labelledby="lowercase-label" aria-describedby="lowercase-desc">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label" id="repeat-label">Repetir las que fallas</div>
                                    <div class="setting-desc" id="repeat-desc">Las letras que fallas aparecen más a menudo.</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="repeat-toggle" onchange="toggleRepeat()" aria-labelledby="repeat-label" aria-describedby="repeat-desc">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label" id="continuous-label">Puntuación continua</div>
                                    <div class="setting-desc" id="continuous-desc">La puntuación se mantiene al empezar una nueva sesión.</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="continuous-toggle" onchange="toggleContinuous()" aria-labelledby="continuous-label" aria-describedby="continuous-desc">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </details>

                    <div id="quiz-container">
                        <div class="card">
                            <div class="quiz-header">
                                <div class="score" id="score">Aciertos: 0/0</div>
                                <div class="progress" id="progress">Pregunta 1</div>
                            </div>

                            <div class="character-display">
                                <span class="cyrillic-char notranslate" id="current-char" translate="no">А</span>
                                <span class="cyrillic-char cyrillic-char-lowercase notranslate" id="current-char-lower" translate="no" style="display: none;">а</span>
                                <button class="audio-btn" id="audio-btn" style="display: none;" title="Escuchar la pronunciación" aria-label="Escuchar la pronunciación">🔊</button>
                            </div>

                            <div class="input-section">
                                <label for="answer-input" class="sr-only">Escribe esta letra en letras latinas</label>
                                <div class="input-wrapper">
                                    <input 
                                        type="text" 
                                        id="answer-input" 
                                        placeholder="Escribe en letras latinas..."
                                        autocomplete="off"
                                        autocorrect="off"
                                        autocapitalize="none"
                                        spellcheck="false"
                                    />
                                    <button class="btn btn-submit" id="submit-btn" onclick="checkAnswer()">Comprobar</button>
                                </div>
                                <div class="feedback" id="feedback" aria-live="polite"></div>
                            </div>

                            <div class="action-buttons">
                                <button class="btn" id="skip-btn">Saltar</button>
                                <button class="btn" id="reset-btn">Reiniciar</button>
                                <button class="btn" id="home-btn">Cambiar grupos</button>
                            </div>

                            <div class="stats">
                                <div class="stat-item">
                                    <span class="stat-value" id="correct-count">0</span>
                                    <span class="stat-label">Correctas</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value" id="incorrect-count">0</span>
                                    <span class="stat-label">Incorrectas</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value" id="streak-count">0</span>
                                    <span class="stat-label">Racha</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <h2>Cómo funciona</h2>
                        <div class="content-text">
                            <p>Elige uno o varios grupos y pulsa Empezar. Verás una letra rusa: escribe cómo se transcribe en letras latinas y pulsa Comprobar para saber al instante si es correcta. Si fallas, verás la respuesta correcta y pasarás a la siguiente letra. Con el botón 🔊 puedes escuchar el audio de cada letra. Es gratis y no hace falta registrarse.</p>
                        </div>

                        <h2>¿Cuántas letras tiene el alfabeto ruso?</h2>
                        <div class="content-text">
                            <p>Tiene 33: 10 vocales, 21 consonantes y dos signos sin sonido propio, el signo duro (${ru('Ъ')}) y el signo blando (${ru('Ь')}). Algunas se parecen a letras latinas, pero no se transcriben igual: ${ru('В')} es ${rom('v')}, ${ru('Н')} es ${rom('n')}, ${ru('Р')} es ${rom('r')} y ${ru('С')} es ${rom('s')}.</p>
                        </div>

                        <h2>Sobre la transcripción</h2>
                        <div class="content-text">
                            <p>Para practicar usamos una transcripción sencilla, letra por letra, que se puede escribir con cualquier teclado. No sigue al pie de la letra ninguna norma oficial. ${ru('Х')} se escribe ${rom('j')} (también se acepta ${rom('kh')}) y ${ru('Щ')} se escribe ${rom('shch')} (también se acepta ${rom('sch')}). ${ru('Е')} se escribe ${rom('ye')} y ${ru('Э')} se escribe ${rom('e')}, para distinguirlas. Los signos duro y blando se escriben con comillas: ${rom('"')} para ${ru('Ъ')} y ${rom("'")} para ${ru('Ь')}.</p>
                        </div>
                    </div>`,
    },
];
