# Development & Build Workflow

There are two primary workflows when working with the terminal deck:

1. **Development mode:**
   * Serve the project root with a local web server (`python3 -m http.server`).
   * Open `http://localhost:8080/` in your browser.
   * Edit markdown files and refresh to see changes immediately.  Use a
     cache‑busting query string (e.g. `?v=1`) or disable the browser
     cache if updates don’t appear.

2. **Build mode:**
   * Run `node build/build.js` from the project root.
   * This generates a single file at `docs/index.html` that contains
     embedded slides, images, CSS and JavaScript.
   * Open the generated file via `file://` or host it on any static server.

Build mode is ideal for distribution and offline use, while development
mode is convenient for editing and previewing your presentation.
