# Terminal Presentation Deck

This project is a hacker‑aesthetic slide deck framework implemented entirely in **HTML**, **CSS** and **JavaScript**.  While it was originally built for a talk on self‑modifying binaries, the framework itself is generic.  Use it to deliver any technical presentation where a controlled, terminal‑like interface fits the mood.  Slides behave like console output rather than traditional pages, providing a focused and precise presentation surface.

## Features

* **Fixed top navigation bar** with an animated RGB strip along its bottom border.
* **Dropdown slide selector** populated from a JSON deck definition.
* **Keyboard navigation** using ← and → arrows.
* **URL hash routing** allowing direct linking to specific slides (`#slide1`, `#slide2`, etc.).
* **Markdown slide loading** with support for headings, lists, inline formatting and fenced code blocks.
* **Terminal‑style rendering surface** that persists across slides.  Only the inner content changes.
* **Figure and image support** via raw HTML `<figure>`, `<img>` or `<svg>` tags within markdown.
* **Full‑page butterfly hex background** with a dark overlay for readability.
* **Terminal‑styled code listings** with a dark inset background, monospace font and horizontal scrolling.
* **Offline fallback**: all slides, figures and images are embedded in the HTML file to allow offline viewing.  When the network is available, resources are loaded from the filesystem; otherwise the embedded data is used.
* **Build script** to compile everything into a single standalone `dist/index.html` without external dependencies.

## Project Structure

```
index.html        Entry point for development mode
theme.css         Stylesheet defining the look and feel
app.js            JavaScript controlling slide loading and navigation
deck.json         JSON describing the order and titles of slides
slides/
  slide1.md       Overview of the framework
  slide2.md       Explains the deck structure (JSON + Markdown)
  slide3.md       Details navigation and rendering features
  slide4.md       Covers theming and customisation
  slide5.md       Describes development vs build workflows
  slide6.md       Offers troubleshooting tips
assets/
  butterfly_hex.png  Background image
  test_image.svg     Example figure used in slide 2
build/
  build.js         Node script to generate the dist build
dist/
  index.html       Single‑file distribution (generated)
README.md          This file
```

## Running in Development Mode

1. Ensure you have a recent version of **Node.js** installed.  No external libraries are required.
2. Serve the project directory via a local web server or open `index.html` directly in your browser.  When the browser can fetch local files, slides and images load from the filesystem.  If resources cannot be fetched (e.g. when opening via `file://`), the embedded fallback data is used automatically.
3. Use the dropdown or arrow keys (← / →) to navigate between slides.  The URL hash updates to reflect the current slide.

## Building the Standalone Distribution

Run the build script from the project root:

```sh
node build/build.js
```

This command reads the CSS, JavaScript, JSON, markdown slides and images, converts images to base64, and emits a single self‑contained `dist/index.html`.  Open this file via `file://` or deploy it to any static host.  No external assets are required.

## Adding Slides

1. Create a new markdown file in the `slides/` directory (e.g. `slide3.md`).  Use headings (`#`, `##`), lists (`-`, `*`, `1.`) and fenced code blocks (```...```).  Raw HTML tags such as `<figure>`, `<img>` or `<svg>` are passed through unchanged and can be used for images and diagrams.
2. Update `deck.json` by adding an entry with the slide's title and relative file path.  The order of entries defines the presentation order.
3. (Optional) Add any new images or SVGs to the `assets/` directory and reference them with relative paths (`assets/my_image.png`) in your markdown.  During the build, images are embedded as base64 data URIs.
4. Re‑run `node build/build.js` to regenerate `dist/index.html`.

### Figure and Image Notes

* Use raw HTML `<figure>` elements inside your markdown when including diagrams or illustrations.  Ensure that the `<img>` element has an appropriate `alt` attribute and that a `<figcaption>` describes the image.
* Images are automatically scaled to a maximum width of 100% and maximum height of **52 vh** to maintain readability within the terminal container.
* When offline, image paths are replaced with embedded base64 data URIs provided by the build script.

## Customising Your Deck

You can adapt this template for any subject by editing a few files:

* **Change the deck title:** Edit the `title` field in `deck.json`.  The
  value you provide appears in the browser tab and in the nav bar.  No
  HTML modifications are needed.

* **Add or remove slides:** Create new markdown files in `slides/` and add
  entries to the `slides` array in `deck.json`.  The `title` field is used
  for the dropdown label; the `file` field points to your `.md` file.  To
  remove a slide, delete its entry from `deck.json`.

* **Adjust the look and feel:** Modify `theme.css` to change fonts, colours,
  borders and spacing.  To swap the background, replace
  `assets/butterfly_hex.png` with your own image or update the CSS to
  reference a different asset.

* **Write your own demo slide:** The included `slide3.md` demonstrates how
  to customise the deck.  Use it as a template for your own instructions
  or remove it entirely.


## Troubleshooting

* **Slides not loading?**  Check the browser console for errors.  Ensure that
  `deck.json` lists the correct file names and that those files exist in
  the `slides/` directory.  When running in dev or dist mode, serve the
  folder via a local web server (e.g. `python3 -m http.server`).  Opening
  via `file://` may block fetch requests; use the standalone build for
  offline viewing.

* **Images not appearing?**  Confirm that image files are located in the
  `assets/` directory and that the paths in your markdown match.  In dev
  and dist mode the files must exist on disk; in the standalone build
  they are embedded automatically after running the build script.

* **Navigation issues?**  Make sure your browser supports the History API
  and that no other scripts are intercepting the arrow keys.  The arrow
  keys are intercepted globally; pressing them inside a form or select
  will still change slides.  Use the dropdown if keyboard navigation
  conflicts with other inputs.

* **Stale content or caching problems?**  Browsers can cache JSON and
  markdown aggressively.  If your updates do not appear, perform a hard
  refresh (Ctrl/Command + Shift + R), disable caching in your browser’s
  developer tools or append a query string (e.g. `?v=2`) to the URL to
  force the browser to fetch fresh files.  You can also add a version
  query to your script tag (e.g. `<script src="app.js?v=123" defer></script>`) to
  ensure the latest JavaScript loads.

Enjoy presenting your work with a clean, cyberpunk‑inspired terminal aesthetic!