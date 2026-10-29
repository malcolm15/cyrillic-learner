# Cyrilica

[cyrilica.com](https://cyrilica.com) is a free site for learning to read Cyrillic: an interactive letter quiz with audio, articles on Russian and the other Cyrillic alphabets, and a Russian cursive reference with stroke animations and printable worksheets.

## How it's built

- Vanilla JavaScript, HTML and CSS. No framework and no package dependencies; a few hand-run tools need Pillow or Google Chrome.
- Static hosting on Netlify. Articles are pre-rendered at build time, and one edge function sets the head of the pages served by the app shell, for crawlers that read raw HTML.
- The build checks its own output and fails closed: article structure, metadata, links, generated data and served files are asserted on every deploy.

Built by [Malcolm](https://github.com/malcolm15), directing Claude Code through audited, gated batches.

## Running locally

No install step. From the repo root, run `python3 -m http.server 8000` and open http://localhost:8000. Deep links rely on Netlify's redirect rules, so start at the home page and navigate from there. To regenerate the build output, run `node scripts/generate-article-heads.js && node scripts/pre-render.js`.

## Working on it

Conventions, checks and editorial rules are in `CLAUDE.md`. Read it before changing anything.

## Rights

© 2026 Cyrilica. All rights reserved: content, images and code are not licensed for reuse without permission, except material credited to others. Two article photos are used under Creative Commons BY-SA licences and credited on their pages. The Russian cursive letterforms come from a public-domain chart on Wikimedia Commons; provenance is in `scripts/cursive/source/source.txt`.
