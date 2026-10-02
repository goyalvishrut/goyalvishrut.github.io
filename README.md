# Vishrut Goyal — Portfolio

A dependency-free, responsive portfolio covering mobile product engineering and developer platforms. Designed for GitHub Pages, with an optional Flask entry point serving the same pages.

## Local preview

With Node.js 18 or newer:

```sh
node tools/preview.mjs
```

Open `http://127.0.0.1:4173`. An alternate port can be passed as the first argument. The preview binds only to localhost and serves an explicit list of public assets; it does not expose repository metadata or environments.

## Checks

```sh
node --check static/assets/js/portfolio.js
node --test tests/portfolio.test.mjs
```

Also verify desktop and mobile layouts, keyboard navigation, filter buttons, expandable work summaries, reduced motion, and the resume print layout in a browser.

For the optional Flask routes, use a repository-local virtual environment. The existing environment was created on Windows; do not overwrite it. The legacy Flask/Werkzeug pins do not support Python 3.14. On macOS/Linux, use Python 3.11 and create `.venv-portfolio311` if a working `.venv` is unavailable:

```sh
python3.11 -m venv .venv-portfolio311
.venv-portfolio311/bin/python -m pip install -r requirements.txt
.venv-portfolio311/bin/python -m unittest discover -s tests
```

## Content and styling

- `index.html`: canonical portfolio content, including work, experience, personal projects, education, skills, and contact links.
- `resume.html`: text-first resume with Print / Save PDF support. Keep its dates and experience in sync with the portfolio.
- `static/assets/css/portfolio.css`: design tokens, responsive layouts, and reduced-motion behavior.
- `static/assets/css/resume.css`: resume screen and A4 print styles.
- `static/assets/js/portfolio.js`: progressive enhancements for navigation, filters, one-time entrance motion, and printing.
- `app.py`: optional Flask routes for the canonical portfolio and resume. Historical templates and vendor assets are retained but are not loaded by the current site.

No frontend build step, remote fonts, analytics, or external script dependencies are required. Core content and expandable details remain usable without JavaScript.

Professional work is summarized without internal links or confidential project details. Experiments are distinguished from delivered work. Do not add benchmark speedups, savings, or deployment claims without supporting evidence. External project links are retained from the original portfolio and may depend on third-party availability.

For a PDF, open the resume, choose **Print / Save PDF**, select A4, and disable browser headers and footers. The browser generates the PDF locally; nothing is uploaded.
