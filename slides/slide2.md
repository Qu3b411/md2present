# Deck Structure

The framework separates **structure** from **content** using JSON and
Markdown:

* `deck.json` — defines the presentation title and the list of slides in
  order.  Each entry has a `title` for the dropdown and a `file` path
  pointing into the `slides/` directory.

* `slides/` — contains one Markdown file per slide.  Use headings (`#`,
  `##`), lists, paragraphs and fenced code blocks to author your content.
  Raw HTML tags such as <code>&lt;figure&gt;</code>, <code>&lt;img&gt;</code> or <code>&lt;svg&gt;</code> are passed through,
  enabling diagrams and figures.

<figure><img src='assets/test_image.svg'><figcaption>test</figcaption></figure>
Organising your presentation this way makes it easy to reorder slides,
collaborate via version control and extend the deck without touching
JavaScript or HTML.
