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
//   pageScripts          The page's own scripts, as root-relative paths to files
//                        directly in js/ (['/js/name.js']). Each is emitted as a
//                        plain classic <script src> tag, no async, defer or type,
//                        directly after /js/article-scripts.js on this page only.
//                        The build fails if a file is missing, sits outside js/,
//                        is a core script or is listed by two pages, or if its
//                        path appears in any other document. Default none.
//   guardedLetterTools   true: the page's own letter tools get the article
//                        letter-tool checks. Every Cyrillic letter in <main> must
//                        be guarded, as on a quiz page; BUTTON_LABELS entries
//                        that name the page (page: slug) are checked on its
//                        bodyHtml; and no aria-label there may carry Cyrillic.
//                        Default off.

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
// The span also takes the space in front of the token and the punctuation (and
// space) after it, e.g. igual:${ru(' В ')}es${rom(' v,')}: a translator drops a
// space or a closing bracket that sits just outside a guarded span, and keeps
// what is inside. The build fails if a guarded span here has a space just
// before it, or a space or punctuation just after it.
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
        bodyHtml: `                    <div id="ad-management-config-settings" data-blocklist-all="1"></div>
                    <div class="card">
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
        modified: '2026-10-22',
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
                '                <a href="/russian-keyboard">Teclado ruso</a>\n' +
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
                            <p>Tiene 33: 10 vocales, 21 consonantes y dos signos sin sonido propio, el signo duro (${ru('Ъ) ')}y el signo blando (${ru('Ь). ')}Algunas se parecen a letras latinas, pero no se transcriben igual:${ru(' В ')}es${rom(' v,')}${ru(' Н ')}es${rom(' n,')}${ru(' Р ')}es${rom(' r ')}y${ru(' С ')}es${rom(' s.')}</p>
                        </div>

                        <h2>Sobre la transcripción</h2>
                        <div class="content-text">
                            <p>Para practicar usamos una transcripción sencilla, letra por letra, que se puede escribir con cualquier teclado. No sigue al pie de la letra ninguna norma oficial.${ru(' Х ')}se escribe${rom(' j, ')}aunque también se acepta${rom(' kh.')}${ru(' Щ ')}se escribe${rom(' shch, ')}aunque también se acepta${rom(' sch.')}${ru(' Е ')}se escribe${rom(' ye ')}y${ru(' Э ')}se escribe${rom(' e, ')}para distinguirlas. Los signos duro y blando se escriben con comillas:${rom(' " ')}para${ru(' Ъ ')}y${rom(" ' ")}para${ru(' Ь.')}</p>
                        </div>
                    </div>`,
    },
    {
        slug: 'russian-keyboard',
        title: 'Russian Keyboard Online: Type Cyrillic Free | Cyrilica',
        description: 'Type Russian online with your own keyboard or the on-screen keys. Phonetic or standard ЙЦУКЕН layout, nothing to install. Copy your text in one click.',
        h1: 'Russian Keyboard Online',
        keySentence: 'Type Russian with the keyboard you already have.',
        published: '2026-11-08',
        modified: '2026-11-08',
        breadcrumbName: 'Russian Keyboard',
        schema: { audience: false },
        // The keyboard's own checks: every Cyrillic letter in <main> guarded, and
        // the key buttons named through BUTTON_LABELS (scripts/pre-render.js).
        guardedLetterTools: true,
        pageScripts: ['/js/keyboard.js'],
        // The blocklist div removes Journey's video player on desktop and mobile;
        // the other units stay. AD_BLOCKLIST_PAGES in scripts/pre-render.js pins it.
        bodyHtml: `                    <div id="ad-management-config-settings" data-blocklist-universal-player-desktop="1" data-blocklist-universal-player-mobile="1"></div>
                    <div class="card kb-card">
                        <h1>Russian Keyboard Online</h1>
                        <p class="kb-intro">Type Russian with the keyboard you already have. On the phonetic layout most keys give the Russian letter that sounds like them (A gives${ru(' А, ')}K gives${ru(' К), ')}or switch to${ru(' ЙЦУКЕН, ')}the standard Russian layout. Nothing to install: when you are done, copy your text and paste it anywhere.</p>

                        <div id="russian-keyboard-app" class="kb-app">
                            <div class="kb-controls">
                                <fieldset class="kb-layouts">
                                    <legend>Layout</legend>
                                    <label><input type="radio" name="kb-layout" value="phonetic" checked> Phonetic (AATSEEL)</label>
                                    <label><input type="radio" name="kb-layout" value="jcuken"> Standard Russian${ru(' (ЙЦУКЕН)')}</label>
                                </fieldset>
                                <div class="kb-toggle">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="kb-input" checked aria-labelledby="kb-input-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span class="kb-toggle-label" id="kb-input-label">Russian input</span>
                                </div>
                                <div class="kb-toggle">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="kb-sound" aria-labelledby="kb-sound-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span class="kb-toggle-label" id="kb-sound-label">Letter sounds</span>
                                </div>
                                <div class="kb-toggle kb-phone-toggle">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="kb-phone" aria-labelledby="kb-phone-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span class="kb-toggle-label" id="kb-phone-label">Use my phone keyboard</span>
                                </div>
                            </div>
                            <p id="kb-phone-hint" class="kb-phone-hint" hidden>Tap the text box to type.</p>

                            <label for="kb-text" class="kb-text-label">Your text</label>
                            <textarea id="kb-text" class="kb-text" lang="ru" inputmode="none" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" rows="3" aria-describedby="kb-help"></textarea>
                            <span id="kb-help" class="sr-only">Type with your keyboard or the Russian keys below. Esc turns Russian input off. On a phone, turn on Use my phone keyboard to type with your own.</span>
                            <p class="kb-privacy">Cyrilica's code doesn't save or send anything you type or paste here. This page also loads Google Analytics and Journey by Mediavine, which run their own code. <a href="/privacy">Privacy policy</a></p>

                            <div id="kb-keys" class="kb-keys">
                                <div class="kb-row">
                                    <button type="button" class="kb-key" data-code="Backquote" data-letter="ё" aria-labelledby="kb-l-Backquote"> <span class="kb-glyph notranslate" translate="no" lang="ru">ё</span> <span class="kb-hint" aria-hidden="true">&#96;</span> <span id="kb-l-Backquote" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> ё</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Digit1" data-letter="1" aria-labelledby="kb-l-Digit1"> <span class="kb-glyph notranslate" translate="no" lang="ru">1</span> <span class="kb-hint" aria-hidden="true">1</span> <span id="kb-l-Digit1" class="sr-only" aria-hidden="true">Type<span class="kb-name"> 1</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Digit2" data-letter="2" aria-labelledby="kb-l-Digit2"> <span class="kb-glyph notranslate" translate="no" lang="ru">2</span> <span class="kb-hint" aria-hidden="true">2</span> <span id="kb-l-Digit2" class="sr-only" aria-hidden="true">Type<span class="kb-name"> 2</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Digit3" data-letter="3" aria-labelledby="kb-l-Digit3"> <span class="kb-glyph notranslate" translate="no" lang="ru">3</span> <span class="kb-hint" aria-hidden="true">3</span> <span id="kb-l-Digit3" class="sr-only" aria-hidden="true">Type<span class="kb-name"> 3</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Digit4" data-letter="4" aria-labelledby="kb-l-Digit4"> <span class="kb-glyph notranslate" translate="no" lang="ru">4</span> <span class="kb-hint" aria-hidden="true">4</span> <span id="kb-l-Digit4" class="sr-only" aria-hidden="true">Type<span class="kb-name"> 4</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Digit5" data-letter="5" aria-labelledby="kb-l-Digit5"> <span class="kb-glyph notranslate" translate="no" lang="ru">5</span> <span class="kb-hint" aria-hidden="true">5</span> <span id="kb-l-Digit5" class="sr-only" aria-hidden="true">Type<span class="kb-name"> 5</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Digit6" data-letter="6" aria-labelledby="kb-l-Digit6"> <span class="kb-glyph notranslate" translate="no" lang="ru">6</span> <span class="kb-hint" aria-hidden="true">6</span> <span id="kb-l-Digit6" class="sr-only" aria-hidden="true">Type<span class="kb-name"> 6</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Digit7" data-letter="7" aria-labelledby="kb-l-Digit7"> <span class="kb-glyph notranslate" translate="no" lang="ru">7</span> <span class="kb-hint" aria-hidden="true">7</span> <span id="kb-l-Digit7" class="sr-only" aria-hidden="true">Type<span class="kb-name"> 7</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Digit8" data-letter="8" aria-labelledby="kb-l-Digit8"> <span class="kb-glyph notranslate" translate="no" lang="ru">8</span> <span class="kb-hint" aria-hidden="true">8</span> <span id="kb-l-Digit8" class="sr-only" aria-hidden="true">Type<span class="kb-name"> 8</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Digit9" data-letter="9" aria-labelledby="kb-l-Digit9"> <span class="kb-glyph notranslate" translate="no" lang="ru">9</span> <span class="kb-hint" aria-hidden="true">9</span> <span id="kb-l-Digit9" class="sr-only" aria-hidden="true">Type<span class="kb-name"> 9</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Digit0" data-letter="0" aria-labelledby="kb-l-Digit0"> <span class="kb-glyph notranslate" translate="no" lang="ru">0</span> <span class="kb-hint" aria-hidden="true">0</span> <span id="kb-l-Digit0" class="sr-only" aria-hidden="true">Type<span class="kb-name"> 0</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Minus" data-letter="-" aria-labelledby="kb-l-Minus"> <span class="kb-glyph notranslate" translate="no" lang="ru">-</span> <span class="kb-hint" aria-hidden="true">-</span> <span id="kb-l-Minus" class="sr-only" aria-hidden="true">Type<span class="kb-name"> hyphen</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Equal" data-letter="ъ" aria-labelledby="kb-l-Equal"> <span class="kb-glyph notranslate" translate="no" lang="ru">ъ</span> <span class="kb-hint" aria-hidden="true">=</span> <span id="kb-l-Equal" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> ъ</span></span> </button>
                                </div>
                                <div class="kb-row">
                                    <button type="button" class="kb-key" data-code="KeyQ" data-letter="я" aria-labelledby="kb-l-KeyQ"> <span class="kb-glyph notranslate" translate="no" lang="ru">я</span> <span class="kb-hint" aria-hidden="true">Q</span> <span id="kb-l-KeyQ" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> я</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyW" data-letter="ш" aria-labelledby="kb-l-KeyW"> <span class="kb-glyph notranslate" translate="no" lang="ru">ш</span> <span class="kb-hint" aria-hidden="true">W</span> <span id="kb-l-KeyW" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> ш</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyE" data-letter="е" aria-labelledby="kb-l-KeyE"> <span class="kb-glyph notranslate" translate="no" lang="ru">е</span> <span class="kb-hint" aria-hidden="true">E</span> <span id="kb-l-KeyE" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> е</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyR" data-letter="р" aria-labelledby="kb-l-KeyR"> <span class="kb-glyph notranslate" translate="no" lang="ru">р</span> <span class="kb-hint" aria-hidden="true">R</span> <span id="kb-l-KeyR" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> р</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyT" data-letter="т" aria-labelledby="kb-l-KeyT"> <span class="kb-glyph notranslate" translate="no" lang="ru">т</span> <span class="kb-hint" aria-hidden="true">T</span> <span id="kb-l-KeyT" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> т</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyY" data-letter="ы" aria-labelledby="kb-l-KeyY"> <span class="kb-glyph notranslate" translate="no" lang="ru">ы</span> <span class="kb-hint" aria-hidden="true">Y</span> <span id="kb-l-KeyY" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> ы</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyU" data-letter="у" aria-labelledby="kb-l-KeyU"> <span class="kb-glyph notranslate" translate="no" lang="ru">у</span> <span class="kb-hint" aria-hidden="true">U</span> <span id="kb-l-KeyU" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> у</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyI" data-letter="и" aria-labelledby="kb-l-KeyI"> <span class="kb-glyph notranslate" translate="no" lang="ru">и</span> <span class="kb-hint" aria-hidden="true">I</span> <span id="kb-l-KeyI" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> и</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyO" data-letter="о" aria-labelledby="kb-l-KeyO"> <span class="kb-glyph notranslate" translate="no" lang="ru">о</span> <span class="kb-hint" aria-hidden="true">O</span> <span id="kb-l-KeyO" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> о</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyP" data-letter="п" aria-labelledby="kb-l-KeyP"> <span class="kb-glyph notranslate" translate="no" lang="ru">п</span> <span class="kb-hint" aria-hidden="true">P</span> <span id="kb-l-KeyP" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> п</span></span> </button>
                                    <button type="button" class="kb-key" data-code="BracketLeft" data-letter="ю" aria-labelledby="kb-l-BracketLeft"> <span class="kb-glyph notranslate" translate="no" lang="ru">ю</span> <span class="kb-hint" aria-hidden="true">[</span> <span id="kb-l-BracketLeft" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> ю</span></span> </button>
                                    <button type="button" class="kb-key" data-code="BracketRight" data-letter="щ" aria-labelledby="kb-l-BracketRight"> <span class="kb-glyph notranslate" translate="no" lang="ru">щ</span> <span class="kb-hint" aria-hidden="true">]</span> <span id="kb-l-BracketRight" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> щ</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Backslash" data-letter="э" aria-labelledby="kb-l-Backslash"> <span class="kb-glyph notranslate" translate="no" lang="ru">э</span> <span class="kb-hint" aria-hidden="true">&#92;</span> <span id="kb-l-Backslash" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> э</span></span> </button>
                                </div>
                                <div class="kb-row">
                                    <button type="button" class="kb-key" data-code="KeyA" data-letter="а" aria-labelledby="kb-l-KeyA"> <span class="kb-glyph notranslate" translate="no" lang="ru">а</span> <span class="kb-hint" aria-hidden="true">A</span> <span id="kb-l-KeyA" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> а</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyS" data-letter="с" aria-labelledby="kb-l-KeyS"> <span class="kb-glyph notranslate" translate="no" lang="ru">с</span> <span class="kb-hint" aria-hidden="true">S</span> <span id="kb-l-KeyS" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> с</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyD" data-letter="д" aria-labelledby="kb-l-KeyD"> <span class="kb-glyph notranslate" translate="no" lang="ru">д</span> <span class="kb-hint" aria-hidden="true">D</span> <span id="kb-l-KeyD" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> д</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyF" data-letter="ф" aria-labelledby="kb-l-KeyF"> <span class="kb-glyph notranslate" translate="no" lang="ru">ф</span> <span class="kb-hint" aria-hidden="true">F</span> <span id="kb-l-KeyF" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> ф</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyG" data-letter="г" aria-labelledby="kb-l-KeyG"> <span class="kb-glyph notranslate" translate="no" lang="ru">г</span> <span class="kb-hint" aria-hidden="true">G</span> <span id="kb-l-KeyG" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> г</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyH" data-letter="ч" aria-labelledby="kb-l-KeyH"> <span class="kb-glyph notranslate" translate="no" lang="ru">ч</span> <span class="kb-hint" aria-hidden="true">H</span> <span id="kb-l-KeyH" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> ч</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyJ" data-letter="й" aria-labelledby="kb-l-KeyJ"> <span class="kb-glyph notranslate" translate="no" lang="ru">й</span> <span class="kb-hint" aria-hidden="true">J</span> <span id="kb-l-KeyJ" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> й</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyK" data-letter="к" aria-labelledby="kb-l-KeyK"> <span class="kb-glyph notranslate" translate="no" lang="ru">к</span> <span class="kb-hint" aria-hidden="true">K</span> <span id="kb-l-KeyK" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> к</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyL" data-letter="л" aria-labelledby="kb-l-KeyL"> <span class="kb-glyph notranslate" translate="no" lang="ru">л</span> <span class="kb-hint" aria-hidden="true">L</span> <span id="kb-l-KeyL" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> л</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Semicolon" data-letter="ь" aria-labelledby="kb-l-Semicolon"> <span class="kb-glyph notranslate" translate="no" lang="ru">ь</span> <span class="kb-hint" aria-hidden="true">;</span> <span id="kb-l-Semicolon" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> ь</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Quote" data-letter="ж" aria-labelledby="kb-l-Quote"> <span class="kb-glyph notranslate" translate="no" lang="ru">ж</span> <span class="kb-hint" aria-hidden="true">'</span> <span id="kb-l-Quote" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> ж</span></span> </button>
                                </div>
                                <div class="kb-row">
                                    <button type="button" class="kb-key" data-code="KeyZ" data-letter="з" aria-labelledby="kb-l-KeyZ"> <span class="kb-glyph notranslate" translate="no" lang="ru">з</span> <span class="kb-hint" aria-hidden="true">Z</span> <span id="kb-l-KeyZ" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> з</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyX" data-letter="х" aria-labelledby="kb-l-KeyX"> <span class="kb-glyph notranslate" translate="no" lang="ru">х</span> <span class="kb-hint" aria-hidden="true">X</span> <span id="kb-l-KeyX" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> х</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyC" data-letter="ц" aria-labelledby="kb-l-KeyC"> <span class="kb-glyph notranslate" translate="no" lang="ru">ц</span> <span class="kb-hint" aria-hidden="true">C</span> <span id="kb-l-KeyC" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> ц</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyV" data-letter="в" aria-labelledby="kb-l-KeyV"> <span class="kb-glyph notranslate" translate="no" lang="ru">в</span> <span class="kb-hint" aria-hidden="true">V</span> <span id="kb-l-KeyV" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> в</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyB" data-letter="б" aria-labelledby="kb-l-KeyB"> <span class="kb-glyph notranslate" translate="no" lang="ru">б</span> <span class="kb-hint" aria-hidden="true">B</span> <span id="kb-l-KeyB" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> б</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyN" data-letter="н" aria-labelledby="kb-l-KeyN"> <span class="kb-glyph notranslate" translate="no" lang="ru">н</span> <span class="kb-hint" aria-hidden="true">N</span> <span id="kb-l-KeyN" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> н</span></span> </button>
                                    <button type="button" class="kb-key" data-code="KeyM" data-letter="м" aria-labelledby="kb-l-KeyM"> <span class="kb-glyph notranslate" translate="no" lang="ru">м</span> <span class="kb-hint" aria-hidden="true">M</span> <span id="kb-l-KeyM" class="sr-only" aria-hidden="true">Type<span lang="ru" translate="no" class="notranslate"> м</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Comma" data-letter="," aria-labelledby="kb-l-Comma"> <span class="kb-glyph notranslate" translate="no" lang="ru">,</span> <span class="kb-hint" aria-hidden="true">,</span> <span id="kb-l-Comma" class="sr-only" aria-hidden="true">Type<span class="kb-name"> comma</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Period" data-letter="." aria-labelledby="kb-l-Period"> <span class="kb-glyph notranslate" translate="no" lang="ru">.</span> <span class="kb-hint" aria-hidden="true">.</span> <span id="kb-l-Period" class="sr-only" aria-hidden="true">Type<span class="kb-name"> period</span></span> </button>
                                    <button type="button" class="kb-key" data-code="Slash" data-letter="/" aria-labelledby="kb-l-Slash"> <span class="kb-glyph notranslate" translate="no" lang="ru">/</span> <span class="kb-hint" aria-hidden="true">/</span> <span id="kb-l-Slash" class="sr-only" aria-hidden="true">Type<span class="kb-name"> slash</span></span> </button>
                                </div>
                                <div class="kb-row kb-row-controls">
                                    <button type="button" class="kb-ctl" data-kb="shift" aria-pressed="false">Shift</button>
                                    <button type="button" class="kb-ctl" data-kb="caps" aria-pressed="false">Caps Lock</button>
                                    <button type="button" class="kb-ctl" data-kb="backspace">Backspace</button>
                                    <button type="button" class="kb-ctl" data-kb="delete">Delete</button>
                                    <button type="button" class="kb-ctl" data-kb="enter">Enter</button>
                                </div>
                                <div class="kb-row kb-row-space">
                                    <button type="button" class="kb-ctl" data-kb="space">Space</button>
                                </div>
                            </div>

                            <div class="kb-actions">
                                <button type="button" class="kb-action" data-kb="copy">Copy</button>
                                <button type="button" class="kb-action" data-kb="selectall" data-edit="1">Select All</button>
                                <button type="button" class="kb-action" data-kb="undo" data-edit="1">Undo</button>
                                <button type="button" class="kb-action" data-kb="redo" data-edit="1">Redo</button>
                                <button type="button" class="kb-action" data-kb="clear" data-edit="1">Clear</button>
                            </div>
                            <div id="kb-status" class="sr-only" role="status"></div>
                        </div>
                    </div>

                    <div class="card">
                        <h2>How the two layouts work</h2>
                        <div class="content-text">
                            <p>The phonetic layout puts most Russian letters on the Latin key that sounds like them: A types${ru(' а, ')}B types${ru(' б ')}and D types${ru(' д.')}</p>
                            <p>Letters with no Latin match go on nearby keys:${ru(' я ')}is on Q,${ru(' ш ')}on W,${ru(' ы ')}on Y,${ru(' ч ')}on H,${ru(' ж ')}on the apostrophe key and${ru(' ь ')}on the semicolon key. This is the AATSEEL student layout, named after the American Association of Teachers of Slavic and East European Languages.</p>
                            <p>${ru('ЙЦУКЕН ')}is the standard Russian layout, named after the first six letters of its top row. Its letters sit where they do on Russian keyboards, so what you learn here carries over to a real one.</p>
                        </div>

                        <h2>Using the keyboard</h2>
                        <div class="content-text">
                            <p>Type with your own keyboard, or click the keys on the screen. Each key shows the letter it types, with the key you would press in small print. Shift and Caps Lock work too.</p>
                            <p>Press Esc to turn Russian input off and type Latin letters, and turn it back on with the Russian input switch. Undo, Redo and your browser's own shortcuts work on everything you type.</p>
                            <p>On a phone, tap the keys on the screen, or turn on Use my phone keyboard to type with your phone's own Russian keyboard.</p>
                        </div>

                        <h2>Other ways to write Russian</h2>
                        <div class="content-text">
                            <p>Want Russian on your own computer or phone? Follow our <a href="/articles/how-to-type-cyrillic">Russian keyboard setup guide for Windows, Mac, iPhone and Android</a>.</p>
                            <p>Need a letter with a stress mark or a pre-reform letter? The <a href="/articles/cyrillic-copy-paste">Cyrillic copy and paste tool</a> has them.</p>
                        </div>
                    </div>`,
    },
];
