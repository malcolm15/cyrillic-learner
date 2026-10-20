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
        modified: '2026-10-19',
        breadcrumbName: 'For Teachers',
        bodyHtml: `                    <div class="card">
                        <h1>Cyrilica for Teachers</h1>

                        <div class="content-text">
                            <p>Cyrilica is a free tool for learning and practising the 33 letters of the Russian alphabet. A student sees a letter, types how it sounds in Latin letters, and gets an answer straight away.</p>
                        </div>

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
                    </div>`,
    },
];
