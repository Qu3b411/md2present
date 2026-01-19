# Navigation & Rendering

Once your slides are defined, the framework takes care of rendering
and navigation:

* **Terminal container:** A persistent frame displays each slide like
  console output.  Only the inner content updates.  The frame includes a
  title bar, border, padding and a blinking caret when idle.

* **Top navigation bar:** Shows the deck title and a dropdown listing
  numbered slides.  The animated RGB strip along the bottom edge adds a
  cyberpunk accent.

* **Keyboard controls:** Press the ← and → keys to move between slides.
  The dropdown highlights your current position.

* **URL hash routing:** Each slide can be linked directly via `#slide1`,
  `#slide2`, etc.  Changing the hash updates the slide without reloading
  the page, enabling deep linking and browser history.

These features combine to create a presentation experience that feels
like stepping through a command‑line demonstration rather than flipping
through static pages.