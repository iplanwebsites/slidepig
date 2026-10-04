// Strategy 2: a deck as one component on a page the host site owns. The host
// keeps its header, <main> and <h1>; `embedded` makes the deck a region
// inside them. React comes from the host; slidepig adds no dependencies.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Deck } from "slidepig";
import "slidepig/styles.css";
import deck from "./deck";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <header className="site-header">
      <a href="/">Acme</a>
      <nav>
        <a href="/presentation/" aria-current="page">
          Presentation
        </a>
      </nav>
    </header>
    <main className="site-main site-main-wide">
      <h1>Our 2026 plan</h1>
      <p>Read it here, or press F to present it full screen.</p>
      <Deck deck={deck} embedded />
    </main>
  </StrictMode>,
);
