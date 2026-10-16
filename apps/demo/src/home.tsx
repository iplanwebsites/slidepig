import type { DeckIndexProps } from "slidepig";

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
              Small pig.
              <br />
              <em>Big ideas.</em>
            </h1>
            <p className="sp-home-lead">Decks that are web pages.</p>
            <p className="sp-home-summary">
              A small React library. Scroll to read, press <kbd>F</kbd> to
              present. One page, one link, for everyone in the room and everyone
              who missed it.
            </p>
            <div className="sp-home-actions">
              <a className="sp-home-button" href="/tour">
                Take it for a slide <span aria-hidden="true">↗</span>
              </a>
              <a className="sp-home-text-link" href="#start">
                Make a deck <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <a
            className="sp-home-poster"
            href="/tour"
            aria-label="Open the slidepig tour"
          >
            <span className="sp-home-pig" aria-hidden="true">
              🐷
            </span>
            <span className="sp-home-poster-title">
              Read it.
              <br />
              Present it.
            </span>
            <span className="sp-home-poster-bottom">
              One page. Two modes. <span aria-hidden="true">↗</span>
            </span>
          </a>
        </section>
        <section className="sp-home-section" aria-labelledby="why-title">
          <h2 id="why-title">
            A deck with a life
            <br />
            after the meeting.
          </h2>
          <div className="sp-home-features">
            <article>
              <h3>Made for the link.</h3>
              <p>
                A responsive page with real headings, playable media, and a link
                to every slide. Send <code>/pitch#plan</code> and land on the
                idea that matters.
              </p>
            </article>
            <article>
              <h3>Ready for the room.</h3>
              <p>
                Press <kbd>F</kbd> to present, <kbd>↑</kbd> <kbd>↓</kbd> to
                advance, and <kbd>Esc</kbd> to read again. The same content is
                always behind the controls.
              </p>
            </article>
            <article>
              <h3>No template ceiling.</h3>
              <p>
                Start with typed slide data and built-in layouts. Bring React
                components, custom layouts, and CSS when your idea needs more
                room.
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
              From a folder
              <br />
              to the floor.
            </h2>
            <p>
              Scaffold a site, write your slides, and open it in the browser.
              React 19 or newer. Your editor, your content, your hosting.
            </p>
            <pre className="sp-home-command">
              <code>{`npx slidepig create my-decks\ncd my-decks\nnpm install\nnpm run dev`}</code>
            </pre>
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
  title: "Something worth sharing",
  slides: [
    {
      id: "hello",
      layout: "hero",
      title: "This little piggy had an idea.",
      body: ["And put it on the web."],
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
        <section
          id="examples"
          className="sp-home-section"
          aria-labelledby="examples-title"
        >
          <h2 id="examples-title">The proof is in the pig.</h2>
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
