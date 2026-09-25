# Cyrilica

[cyrilica.com](https://cyrilica.com) is a free web app for learning to read Cyrillic:
an interactive letter quiz with audio, plus 27 articles grouped as Getting Started,
Alphabet Variants, History & Culture, and Learning Tools & Resources.

## Stack

- Vanilla JavaScript, HTML and CSS. No framework and no package.json.
- Path-based routing with the History API (for example `/articles/getting-started`).
  `_redirects` serves `index.html` for every path that is not a file.
- Hosted on Netlify. The build command in `netlify.toml` runs
  `scripts/generate-article-heads.js` (writes `netlify/lib/article-heads.ts`), then
  `scripts/pre-render.js` (writes the 27 article pages to `articles/`, gitignored).
- One edge function, `netlify/edge-functions/head-rewrite.ts`, rewrites the head of
  each page (canonical, robots, title, description) for crawlers that read raw HTML.

## Layout

- `index.html`: the app shell and every static page
- `js/core.js`: routing, settings, article metadata and order
- `js/articles.js`: the 27 articles
- `js/article-scripts.js`: quizzes, the copy-paste tool, per-article features
- `css/styles.css`: all styles, including dark mode
- `scripts/`, `netlify/`: build scripts, edge function, generated heads
- `images/`, `audio/`: article images and letter audio
- `scripts/images/make_*_image.py`: Pillow scripts for four of the comparison
  images, run by hand, not by the build

## Running locally

No install step. Serve the folder, for example `python3 -m http.server 8000`, and
open http://localhost:8000. Deep links depend on the Netlify `_redirects` rule, so
start at the home page and navigate from there. To regenerate the build output, run
`node scripts/generate-article-heads.js && node scripts/pre-render.js`.

## Working on it

Conventions, checks and editorial rules are in `CLAUDE.md`. Read it before changing
content.

© 2026 Cyrilica. All rights reserved. Content, images and code are not licensed for
reuse without permission.
