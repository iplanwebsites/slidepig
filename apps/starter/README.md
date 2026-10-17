# Presentations

Built with [slidepig](https://slidepig.com): every deck is
one page that reads like a document and presents like a slideshow.

See the [getting started guide](https://slidepig.com/guide) and
[API reference](https://www.npmjs.com/package/slidepig). Use Node.js 22.12+
for the tooling and React 19+.

```sh
npm install
npm run dev              # http://localhost:5173, server-rendered like production
npm run new -- my-pitch  # creates src/decks/my-pitch.ts, served at /my-pitch/
npm run build            # optimize images, prerender every deck, validate
npm run preview          # the built site through the Worker
npm run deploy           # to Cloudflare (set "name" in wrangler.jsonc first)
```

- `src/decks/*.ts` or `*.tsx`: one file per deck. The file name is the URL.
  A `.tsx` deck can bring its own components, layouts and CSS.
- `src/site.ts`: site title, home page, robots policy.
- `public/`: images. Reference them as `/file.jpg`.

In the browser on localhost, press **D** on any slide for the visual tuner:
try backgrounds, themes and colors, then copy the settings back into the deck.

## Coding agents

If you created this site with `--skill`, the bundled skill is already in
`.agents/skills/slidepig/`. Ask your agent to read its `SKILL.md`.

Otherwise, after `npm install`, install the bundled slidepig skill for Codex from this
project's root:

```sh
mkdir -p .agents/skills
cp -R node_modules/slidepig/skills/slidepig .agents/skills/
```

Then ask: `Use $slidepig to create a pitch deck in this project.` If the skill
does not appear, restart Codex. For other agents, copy the folder into their
documented skill directory, or ask them to read
`node_modules/slidepig/skills/slidepig/SKILL.md` directly. Repeat the copy after
upgrading slidepig to refresh the skill; review any local edits first.

slidepig is licensed under the Business Source License 1.1: use it freely for
your own and your clients' presentations, but not to offer a
presentation-making product or service to others.
