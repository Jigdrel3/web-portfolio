# Web

Static site projects — no build step, no dependencies to install.

## portfolio.html

A single-page photography portfolio with a WebGL hero background and a
Three.js 3D category picker for the gallery (falls back to a static grid on
touch devices or where WebGL isn't available).

Gallery content is driven entirely by the `MANIFEST` object inside
`portfolio.html` (search for `EDIT ME`) — add or remove categories and
images there, nothing is hardcoded in the markup. Images live under
`images/`.

To preview locally, serve the folder over HTTP (opening the file directly
won't load the images manifest correctly in all browsers):

```bash
python -m http.server 5501
```

Then open `http://localhost:5501/portfolio.html`. This matches the
`portfolio-static` launch config in `.claude/launch.json`.

## bcmd/

A separate static site for the Bhutan Centre for Media and Democracy
(`bcmd/index.html`), with its own content in `bcmd/content.json` and
images in `bcmd/images/`.

## TDJ icons/

Design reference material — a Claude Code design brief template and an
HTML mockup.
