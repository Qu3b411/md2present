# Customising the Look

The appearance of the deck is controlled by **CSS**.  The provided
`theme.css` defines colours, fonts, borders and spacing.  Here are some
ways to personalise your presentation:

* **Change the accent colour:** Modify the CSS variable `--accent-colour`
  at the top of `theme.css` to any valid hex colour.  This affects
  headings, the RGB strip and other highlights.

* **Swap the background:** Replace `assets/butterfly_hex.png` with your own
  image or update the `background` property in `theme.css` to reference a
  different file.  The dark overlay ensures text remains readable.

* **Tweak spacing and fonts:** Adjust padding and margin values in
  `.terminal`, `.terminal-content` and other selectors.  Change the
  font‑family if you prefer a different monospace typeface.

* **Style code blocks:** The CSS defines a dark inset background and
  border for fenced code.  Modify these styles to suit your preference or
  add a fake prompt to simulate a shell.

Because everything is HTML and CSS, you have full control over the look
and feel.  Experiment and make the deck your own.