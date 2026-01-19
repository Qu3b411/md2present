# Troubleshooting & Tips

Here are some common issues and how to resolve them:

* **Slides don’t load:**
  * Ensure the file names in `deck.json` match the markdown files in the
    `slides/` directory.
  * When running in development mode, serve the directory via a local
    web server.  Opening `index.html` directly via `file://` may block
    `fetch()` requests.

* **Changes not visible:**
  * Browsers cache JSON and markdown aggressively.  Perform a hard
    refresh (Ctrl/Command + Shift + R), disable the cache in dev tools
    or append a query string (`?v=2`) to the URL to force fresh loads.

* **Images missing:**
  * Confirm images are stored in the `assets/` directory and referenced
    with the correct relative path (e.g. `assets/my_image.png`).  Rebuild
    the deck after adding new assets to embed them into the standalone.

* **Navigation conflicts:**
  * The left/right arrow keys are captured globally.  Use the dropdown
    if keyboard navigation interferes with other inputs such as forms.

Following these guidelines will help you get the most out of the
framework and ensure a smooth presentation experience.