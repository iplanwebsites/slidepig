# Contributing to slidepig

slidepig is a pnpm workspace with one published package and four small apps.
Start with the [workspace map](README.md#workspace-map) and the repository's
[agent instructions](agents.md).

## Run locally

Use Node.js 22.12+ and the pnpm version in `package.json`.

```sh
pnpm install
pnpm dev
```

The demo runs at <http://localhost:4900> with server rendering. It resolves
slidepig's TypeScript source so library edits hot-reload. The starter and
host-page examples consume `dist/`, as an npm consumer would.

```sh
pnpm build:lib                         # rebuild the published entries
pnpm --filter slidepig test            # library tests
pnpm --filter slidepig-demo build      # build and validate the public site
pnpm --filter slidepig-demo preview    # serve through the real Worker on :4901
pnpm check                            # required before every push
```

`pnpm check` checks formatting, types, tests, every app build and its generated
pages, browser bundle sizes, and a freshly scaffolded consumer project. There
is no CI, so run the full check locally. Run `pnpm format` to fix formatting.

## Where a change belongs

- Shared navigation, presentation mechanics, and broadly useful layouts belong
  in `packages/slidepig`.
- Public website branding and examples belong in `apps/demo`. Its homepage is
  `src/home.tsx`, its scoped styles are `public/brand.css`, and its public guide
  is `src/decks/guide.ts`.
- The scaffold in `apps/starter` stays minimal and consumes the built package.
- Deck-specific components, layouts, and CSS stay alongside that deck.

Keep runtime dependencies at zero. React is a peer; heavy build tools are
optional peers and only Node entries may load them. All CSS classes use `sp-`
(`sp-ui-` for controls), and library styles must stay scoped to the deck.
Include a meaningful regression test when changing shared behavior.

## Documentation

The root README introduces the project. The package README is the published
API reference; `packages/slidepig/docs/` covers site and asset tooling. Update
examples and documentation together when behavior changes. Keep the
[brand voice](docs/brand.md) playful in introductions and clear in instructions.

## Release and deployment

```sh
pnpm check
cd packages/slidepig
pnpm publish
```

The package's prepack step copies `apps/starter` into the published template.
The public website targets <https://slidepig.com>; deployment configuration
is private in `_internal/`. Never commit that directory. Maintainers run the
private deployment script after a successful `pnpm check`; contributors can
build and preview everything locally without it.
