# CLAUDE.md

slidepig: decks that are web pages. pnpm workspace; see README.md for the map.

## Commands

```bash
pnpm install
pnpm dev     # builds packages, then apps/demo with SSR on :4900
pnpm check   # everything CI runs: format, typecheck, tests, build + validation, size, scaffold
```

## Rules

- `packages/slidepig` must keep **zero runtime dependencies**. React is a
  peer. No UI kits (Base UI, Radix, shadcn), no icon packages: icons are
  inline SVG in `src/deck/icons.tsx`. `pnpm --filter slidepig size` enforces
  this and the gzip budgets.
- One published package, `slidepig`. Heavy tools (vite, sharp,
  html-validate, linkedom, tsx) are optional peers, loaded only by the Node
  entries (`slidepig/site/vite`, `slidepig/site/build`, `slidepig/assets`,
  the CLI). Browser entries must never import them.
- `_internal/` is private deployment config and is gitignored: never commit it.
- Deck files are data: `import { defineDeck } from "slidepig"` and nothing
  else. A new layout or visual belongs in the library, not in a deck.
- CSS classes are prefixed `sp-` (`sp-ui-` for controls); tokens live on
  `.sp-deck`. Nothing may style the host page.
- `apps/starter` is the `slidepig create` template: keep it minimal and
  consuming `dist/` (no `slidepig-source` condition).

## New presentation

- In a site: `pnpm --filter <app> new <slug>` (runs `slidepig new`), edit `src/decks/<slug>.ts`.
  The file name is the URL; nothing to register.
- `vite build` fails on deck errors (`validateDeck`) and invalid pages.
