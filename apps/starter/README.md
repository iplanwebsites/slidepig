# Presentations

Built with [slidepig](https://www.npmjs.com/package/slidepig): every deck is
one page that reads like a document and presents like a slideshow.

```sh
npm install
npm run dev              # http://localhost:5173, server-rendered like production
npm run new -- my-pitch  # creates src/decks/my-pitch.ts, served at /my-pitch/
npm run build            # optimize images, prerender every deck, validate
npm run preview          # the built site through the Worker
npm run deploy           # to Cloudflare (set "name" in wrangler.jsonc first)
```

- `src/decks/*.ts`: one file per deck. The file name is the URL.
- `src/site.ts`: site title, home page, robots policy.
- `public/`: images. Reference them as `/file.jpg`.

In the browser on localhost, press **D** on any slide for the visual tuner:
try backgrounds, themes and colors, then copy the settings back into the deck.

slidepig is licensed under the Business Source License 1.1: use it freely for
your own and your clients' presentations, but not to offer a
presentation-making product or service to others.
