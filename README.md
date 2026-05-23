# Cyrilica

**Free interactive Cyrillic alphabet learning app**  
[cyrilica.com](https://cyrilica.com)

Cyrilica helps beginners learn to read Cyrillic — the script used by Russian, Ukrainian, Bulgarian, Serbian, and a dozen other languages. It's built as a fast, no-account-required web app with educational articles, an interactive quiz, and audio pronunciation.

---

## Features

- **27+ articles** covering Cyrillic from every angle — alphabet guides, history, regional variants, writing, and learning tips
- **Interactive quiz** — 33-question adaptive quiz with skip, retry, and progress tracking
- **Audio pronunciation** — hear each letter spoken aloud
- **Mini quizzes** embedded within articles (alphabet charts, memory tricks, and more)
- **Alphabet comparison charts** — Ukrainian, Bulgarian, Belarusian, and Serbian Cyrillic versus Russian
- **Copy-paste tool** — build Cyrillic text with a click-to-insert character keyboard
- **Dark mode** and font size preferences, persisted via localStorage
- **Related articles** and prev/next navigation between all articles
- No accounts, no paywalls, no ads (yet)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla JavaScript (no frameworks, no build tools) |
| Routing | Hash-based SPA with Netlify `_redirects` fallback |
| Hosting | Netlify (custom domain via Cloudflare DNS) |
| Images | Python + Pillow (2× retina PNGs generated via scripts in repo root) |
| SEO | JSON-LD structured data, dynamic meta tags, sitemap with image entries |
| Analytics | Google Analytics 4 |

---

## Project Structure

```
cyrillic-learner/
├── index.html              # Main app shell (also serves as SPA entry point)
├── 404.html                # Mirror of index.html — handles direct URL access
├── _redirects              # Netlify SPA routing rule
├── sitemap.xml             # Sitemap with image entries
├── CNAME                   # Custom domain config
├── css/
│   └── styles.css          # ~2,800 lines — all styles including dark mode
├── js/
│   ├── core.js             # Navigation, routing, structured data, article metadata
│   ├── articles.js         # All 27+ articles as JS objects with HTML content
│   └── article-scripts.js  # Quiz engine, copy-paste tool, interactive features
├── images/                 # Article images (PNGs, SVGs, JPGs)
├── audio/                  # Pronunciation audio files
└── make_*_image.py         # Pillow scripts that generated each article image
```

---

## Running Locally

No build step required. Just serve the files from any local server:

**Option 1 — Python (built-in):**
```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

**Option 2 — VS Code Live Server:**  
Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer), right-click `index.html`, and choose "Open with Live Server."

**Option 3 — Node.js:**
```bash
npx serve .
```

> Note: because of the SPA routing setup, navigating directly to a deep URL like `/articles/history-of-cyrillic` won't work on a plain file server. Use the in-app navigation instead, or run through the Netlify CLI for full routing support.

---

## Deployment

The site deploys automatically to [Netlify](https://netlify.com) on every push to `main`. A `_redirects` file routes all paths to `index.html` for SPA support.

Custom domain `cyrilica.com` is managed via Cloudflare DNS.

---

## Contributing

This is a personal project and not actively seeking contributors. That said, if you spot a factual error about Cyrillic or linguistics, feel free to [open an issue](https://github.com/malcolm15/cyrillic-learner/issues).

---

## Feedback

Found a bug or have a suggestion? Use the [contact form on the site](https://cyrilica.com/contact) or open a GitHub issue.

---

## License

© 2026 Cyrilica. All rights reserved.  
Article content, images, and code are not licensed for reuse without permission.
