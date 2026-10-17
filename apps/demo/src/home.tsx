import type { DeckIndexProps } from "slidepig";
import { startPrompt } from "./start-prompt";

const repo = "https://github.com/iplanwebsites/slidepig";
const examples: Record<string, { label: string; description: string }> = {
  "/tour": {
    label: "Meet the pig",
    description:
      "The full tour. Media, layouts, live tuning, and a deck explaining itself.",
  },
  "/minimal": {
    label: "Start small",
    description:
      "Three slides. No backgrounds, no media, no fuss. See how little you need.",
  },
  "/mix": {
    label: "Go whole hog",
    description:
      "Custom React components, layouts, and CSS. Make the stage your own.",
  },
  "/guide": {
    label: "Make your first deck",
    description:
      "Install, write, tune, and ship. A practical guide, itself made with slidepig.",
  },
};

/** Brand belongs to this app; the library stays a generic presentation tool. */
export function Home({ decks }: DeckIndexProps) {
  return (
    <div className="sp-home">
      <a className="sp-home-skip" href="#main">
        Skip to content
      </a>
      <header className="sp-home-nav">
        <a className="sp-home-wordmark" href="/" aria-label="slidepig home">
          <span aria-hidden="true">🐷</span> slidepig
          <span className="sp-home-dot">.</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#examples">Examples</a>
          <a href="/guide">Get started</a>
          <a href={repo} target="_blank" rel="noopener noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      <main id="main">
        <section className="sp-home-hero" aria-labelledby="hero-title">
          <div>
            <h1 id="hero-title">
              Make a deck.
              <br />
              <em>Keep it simple.</em>
            </h1>
            <p className="sp-home-lead">Decks that are web pages.</p>
            <p className="sp-home-summary">
              A lightweight React library for presentations. Ask your coding
              agent to make a deck, or write it yourself. Simple slide files,
              ready-made layouts, and one link to read or present.
            </p>
            <div className="sp-home-actions">
              <button className="sp-home-button" type="button" data-copy-prompt>
                Copy starter prompt <span aria-hidden="true">↗</span>
              </button>
              <a className="sp-home-text-link" href="/tour">
                View example <span aria-hidden="true">↗</span>
              </a>
            </div>
            <p
              className="sp-home-copy-status"
              id="sp-copy-status"
              role="status"
            >
              Paste into your coding agent. It installs slidepig and its skill,
              then creates your first deck.
            </p>
            <details className="sp-home-prompt">
              <summary>View prompt</summary>
              <label htmlFor="sp-start-prompt">
                Copy this into your coding agent
              </label>
              <textarea
                id="sp-start-prompt"
                readOnly
                rows={12}
                defaultValue={startPrompt}
              />
            </details>
          </div>
          <div
            className="sp-home-modes"
            role="group"
            aria-label="One page, two modes"
          >
            <a href="/tour">
              <span className="sp-home-mode-title">Read it.</span>
              <span>A page to scroll, on any screen.</span>
              <span aria-hidden="true">↗</span>
            </a>
            <a href="/tour#hello">
              <span className="sp-home-mode-title">Present it.</span>
              <span>The same page, ready for the room.</span>
              <span aria-hidden="true">↗</span>
            </a>
            <p>One page. One link. Both ways.</p>
          </div>
        </section>
        <section className="sp-home-section" aria-labelledby="why-title">
          <h2 id="why-title">
            Easy to make.
            <br />
            Easy to make yours.
          </h2>
          <div className="sp-home-features">
            <article>
              <h3>Start with your agent.</h3>
              <p>
                Give your coding agent a brief, your content, and a visual
                direction. The bundled skill helps it build a deck with
                slidepig’s layouts and check the result.
              </p>
            </article>
            <article>
              <h3>Change a little at a time.</h3>
              <p>
                Ask for a shorter intro or a different layout. Or open the slide
                file and edit a title yourself. Your content stays in ordinary
                code you can read and keep.
              </p>
            </article>
            <article>
              <h3>Send it. Present it.</h3>
              <p>
                Publish a responsive page people can read on their phones. Press{" "}
                <kbd>F</kbd> to present the same page as slides. Share
                <code> /pitch#plan</code> to link to one idea.
              </p>
            </article>
          </div>
        </section>
        <section
          id="start"
          className="sp-home-section sp-home-start"
          aria-labelledby="start-title"
        >
          <div>
            <h2 id="start-title">
              A few commands.
              <br />A simple slide file.
            </h2>
            <p>
              Copy the prompt above into your coding agent, or scaffold an
              example yourself. The package copies a working site and its skill
              into your project. Node.js 22.12+; React 19+.
            </p>
            <pre className="sp-home-command">
              <code>{`npx slidepig@latest create my-decks --skill\ncd my-decks\nnpm install\nnpm run dev`}</code>
            </pre>
            <p className="sp-home-small">
              The skill is installed in <code>.agents/skills/slidepig/</code>.
              Ask your agent to read <code>SKILL.md</code> there and make your
              first deck. No agent? Edit <code>src/decks/welcome.ts</code>{" "}
              yourself.
            </p>
            <p className="sp-home-small">
              Already have a React app? <code>npm i slidepig</code>, import the
              styles, and render <code>{"<Deck deck={deck} />"}</code>.
            </p>
            <a className="sp-home-text-link" href="/guide">
              Read the getting started guide <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="sp-home-code">
            <div>
              <span>src/decks/hello.ts</span>
            </div>
            <pre>
              <code>{`import { defineDeck } from "slidepig";

export default defineDeck({
  title: "Our next project",
  slides: [
    {
      id: "hello",
      layout: "hero",
      title: "Here is the idea.",
      body: ["A short introduction to what we are building."],
    },
    {
      id: "next",
      title: "Here's what happens next.",
    },
  ],
});`}</code>
            </pre>
          </div>
        </section>
        <section className="sp-home-section" aria-labelledby="small-title">
          <h2 id="small-title">Small library. Room for your ideas.</h2>
          <div className="sp-home-features">
            <article>
              <h3>Light on the page.</h3>
              <p>
                Zero runtime dependencies; React is a peer. About 15 KB gzipped
                for the deck component plus 8 KB of CSS. Images preload before
                you advance; optional image tooling keeps media light too.
              </p>
            </article>
            <article>
              <h3>Your own look.</h3>
              <p>
                Bring your colors, screenshots, and illustrations. Generate art
                with your preferred image tool, save it in the project, and ask
                your agent to fit it into the deck.
              </p>
            </article>
            <article>
              <h3>It’s React.</h3>
              <p>
                Add a chart, an interactive demo, or a component from your app.
                Use your own CSS and connect services through your code.{" "}
                <a href="/mix">See custom components ↗</a>
              </p>
            </article>
          </div>
        </section>
        <section
          id="examples"
          className="sp-home-section"
          aria-labelledby="examples-title"
        >
          <h2 id="examples-title">Take one for a slide.</h2>
          <p>
            These are real slidepig pages. Scroll to read, or open one and press{" "}
            <kbd>F</kbd>.
          </p>
          <ul className="sp-home-examples">
            {decks.map(({ href, deck }) => (
              <li key={href}>
                <a href={href}>
                  <h3>{examples[href]?.label ?? deck.title}</h3>
                  <p>{examples[href]?.description ?? deck.description}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
        <aside className="sp-home-license" aria-label="License">
          <p>
            Source available under BSL 1.1. Free for your own and your clients’
            presentations. Offering a presentation-making product or service
            requires another arrangement. Each release becomes MPL-2.0 after
            four years.{" "}
            <a
              href={`${repo}/blob/main/LICENSE`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the license ↗
            </a>
          </p>
        </aside>
      </main>
      <footer className="sp-home-footer">
        <a className="sp-home-wordmark" href="/">
          🐷 slidepig.
        </a>
        <p>Oink. Now go make something worth presenting.</p>
        <nav aria-label="Footer navigation">
          <a href="/guide">Docs</a>
          <a
            href="https://www.npmjs.com/package/slidepig"
            target="_blank"
            rel="noopener noreferrer"
          >
            npm
          </a>
          <a href={repo} target="_blank" rel="noopener noreferrer">
            Source
          </a>
        </nav>
      </footer>
    </div>
  );
}
