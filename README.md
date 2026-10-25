# alexcorndop.com

Portfolio site for Alex Corn: director, cinematographer, producer.

- `site.json` holds everything that changes: the projects in each section (in display order), the About text and contact details.
- `src/` holds the styles and the small script for hover stills and the video player.
- `node build.mjs` regenerates the published site in `docs/`, which GitHub Pages serves.

Videos play from Vimeo. Most are limited to approved domains in Vimeo's embed settings, so any new domain that should play them needs adding there.
