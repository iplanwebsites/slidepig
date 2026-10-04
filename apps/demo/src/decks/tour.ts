import { defineDeck } from "slidepig";

/**
 * A tour of slidepig, written the way any deck is: as data, with a single
 * import. Read it top to bottom and you have read the presentation.
 */
export default defineDeck({
  title: "slidepig: decks that are web pages",
  description:
    "A tour of slidepig: one page that reads like a document and presents like a slideshow.",
  lang: "en",
  accentColor: "#c2185b",
  intro: {
    greeting: "This page is a slide deck.",
    context:
      "Scroll it like an article, or press F (or Present, bottom left) to give it as a talk. Same page, same URL, same content.",
    invitation:
      "It is built with slidepig, and it explains what slidepig is for.",
  },

  backgrounds: {
    night: {
      src: "/art/night-stack.jpg",
      position: "70% center",
      overlay: { color: "#120d14", opacity: 0.35 },
    },
    paper: {
      src: "/art/paper-lines.jpg",
      overlay: { color: "#ffffff", opacity: 0.35 },
    },
    modes: {
      src: "/art/two-modes.jpg",
      position: "right center",
      overlay: { color: "#ffffff", opacity: 0.2 },
    },
    stage: {
      src: "/art/stage-light.jpg",
      overlay: { color: "#0f1218", opacity: 0.3 },
    },
    sunrise: {
      src: "/art/sunrise.jpg",
      overlay: { color: "#ffffff", opacity: 0.25 },
    },
  },

  themes: {
    pig: {
      overlay: { color: "#ffe3ee", opacity: 0.3 },
      accentColor: "#c2185b",
    },
    plum: {
      overlay: { color: "#efe6ff", opacity: 0.3 },
      accentColor: "#6c3fb5",
    },
    ink: {
      overlay: { color: "#0f1218", opacity: 0.45 },
      accentColor: "#ff8fb8",
    },
  },

  media: {
    "art-night": {
      kind: "image",
      title: "Night stack",
      src: "/art/night-stack.jpg",
      alt: "Three cards stacked at an angle under a pink glow",
      caption: "Backgrounds: one source JPEG each, served as AVIF or WebP",
      width: 2400,
      height: 1500,
    },
    "art-modes": {
      kind: "image",
      title: "Two modes",
      src: "/art/two-modes.jpg",
      alt: "A document column next to a projected slide",
      caption: "Reading and presenting share one DOM",
      width: 2400,
      height: 1500,
    },
    "art-stage": {
      kind: "image",
      title: "Stage light",
      src: "/art/stage-light.jpg",
      alt: "A dark stage lit by a soft pink spotlight",
      caption: "Dark tones flip the palette automatically",
      width: 2400,
      height: 1500,
    },
    "art-sunrise": {
      kind: "image",
      title: "Sunrise",
      src: "/art/sunrise.jpg",
      alt: "A warm peach and pink gradient over a faint grid",
      caption: "Blurred placeholders paint before the image decodes",
      width: 2400,
      height: 1500,
    },
    "talk-recording": {
      kind: "video",
      title: "Recording of a talk",
      description:
        "Drop a src here when you have one. Until then the deck shows this honest placeholder instead of a broken player.",
    },
  },

  slides: [
    {
      id: "hello",
      nav: "One page, two modes",
      eyebrow: "slidepig",
      title: "Write a deck once. Read it, or present it.",
      layout: "hero",
      tone: "dark",
      background: "night",
      body: [
        "slidepig is a small React library that turns typed slide data into a single web page. Visitors scroll it like an article. Presenters press F and the same page becomes a full-screen slideshow.",
        "No export step, no PDF, no second copy that drifts out of date. The link you send before the meeting is the deck you present in it.",
      ],
    },
    {
      id: "why",
      nav: "Why not slides?",
      eyebrow: "The problem",
      title: "Slide files are bad web pages. Web pages are bad slides.",
      layout: "story",
      tone: "paper",
      background: "paper",
      backgroundOptions: ["paper", "modes", "sunrise"],
      body: [
        "A pitch usually lives twice: as slides for the meeting and as a PDF or doc for everyone who missed it. The PDF cannot play a video, cannot be read on a phone, and nobody can link to page seven.",
        "A web page fixes all of that, until you try to present it. Scrolling in front of an audience is clumsy, and nothing tells you where one idea ends.",
        "slidepig keeps the page and adds the missing mode. Every slide is a section with its own URL, and presenting is just a different way of showing the same sections.",
      ],
      media: ["art-modes"],
    },
    {
      id: "how",
      nav: "How it works",
      eyebrow: "The model",
      title: "Your deck is data. The library is the stage.",
      layout: "story",
      body: [
        "You describe slides as plain objects: an id, a title, some paragraphs, a layout, and the media they show. `defineDeck` infers every media id, theme and background name, so a typo is a type error instead of a blank square on stage.",
        "`<Deck>` renders them. Layouts cover the shapes a pitch needs: hero, story, rows, timeline, metric, case, groups, statement and closing. Code listings like this one are built in. When nothing fits, pass any React node as a slide's `visual`, or take over the slide entirely with `render`.",
      ],
      code: {
        filename: "deck.ts",
        source: `import { defineDeck } from "slidepig";

export default defineDeck({
  title: "Our seed round",
  backgrounds: {
    night: { src: "/art/night.jpg" },
  },
  slides: [
    {
      id: "hello",
      layout: "hero",
      tone: "dark",
      background: "night",
      title: "Write it once.",
      body: ["Read it, or present it."],
    },
  ],
});`,
      },
    },
    {
      id: "numbers",
      nav: "In numbers",
      eyebrow: "Proof, not promises",
      title: "Extracted from decks that already shipped.",
      layout: "metric",
      theme: "plum",
      background: "paper",
      body: [
        "slidepig did not start as a framework. It is the part two real pitch decks turned out to share, pulled out once the second deck proved which parts were mechanics and which were content.",
      ],
      stats: [
        { value: "2", label: "pitch decks it was extracted from" },
        {
          value: "−89%",
          label: "image weight on the first deck after the asset pipeline",
        },
        { value: "0", label: "runtime dependencies beyond React" },
      ],
      details: [
        {
          title: "Why the image number matters",
          text: "Pitch decks are image-heavy and get opened on hotel Wi-Fi. The asset pipeline turned 29 MB of source art into 3.2 MB delivered to a modern browser, without anyone resizing a file by hand.",
        },
      ],
    },
    {
      id: "benefits",
      nav: "Who it helps",
      eyebrow: "Benefits",
      title: "Better for everyone in the room, and everyone who wasn't.",
      layout: "groups",
      tone: "paper",
      body: [
        "The same page serves three people: the reader who opens the link alone, the presenter on stage, and the author who has to change slide six an hour before the meeting.",
      ],
      itemGroups: [
        {
          title: "For the audience",
          items: [
            {
              icon: "link",
              title: "Every slide has a link",
              text: "Share #numbers and it opens on that slide, in either mode.",
            },
            {
              icon: "phone",
              title: "Reads on a phone",
              text: "Reading mode is a responsive article, not a shrunken slide.",
            },
            {
              icon: "accessibility",
              title: "Accessible by default",
              text: "Real headings, skip link, focus management, labelled controls, reduced motion.",
            },
          ],
        },
        {
          title: "For the presenter",
          items: [
            {
              icon: "keyboard",
              title: "Keyboard first",
              text: "F presents, ↑ ↓ change slides, Esc returns to reading.",
            },
            {
              icon: "play",
              title: "Media that cooperates",
              text: "← → drive the active carousel; Space plays the slide's video.",
            },
            {
              icon: "zap",
              title: "Next slide is ready",
              text: "Images for the next slide are fetched and decoded before you advance.",
            },
          ],
        },
        {
          title: "For the author",
          items: [
            {
              icon: "code",
              title: "Typed content",
              text: "Slides are data with inferred names, checked at build time.",
            },
            {
              icon: "sliders",
              title: "Live visual tuner",
              text: "Adjust backgrounds and colors in the browser, copy the result back to code.",
            },
            {
              icon: "image",
              title: "Optimized images",
              text: "AVIF and WebP derivatives, blur placeholders, preload hints.",
            },
          ],
        },
      ],
    },
    {
      id: "media",
      nav: "Media",
      eyebrow: "Media that behaves",
      title: "Carousels, lightboxes and video, wired to the presenter.",
      layout: "story",
      tone: "dark",
      background: "stage",
      theme: "ink",
      body: [
        "Name media once in a registry and reference it by id from any slide. Images open in a lightbox; groups become a carousel the arrow keys control while presenting.",
        "Missing files are not errors. A media entry without a src renders a labelled placeholder, so a draft deck never looks broken, it just looks unfinished.",
      ],
      media: ["art-night", "art-modes", "art-stage", "art-sunrise"],
      mediaDisplay: { mode: "carousel", intervalMs: 4500 },
      details: [
        {
          title: "What a missing file looks like",
          text: "The entry below has a title and a description but no src yet. It renders as a labelled slot, so reviewers see what is planned rather than a broken player.",
          media: ["talk-recording"],
        },
      ],
    },
    {
      id: "tuner",
      nav: "Visual tuner",
      eyebrow: "Design in the browser",
      title: "Tune the look live, then hand the result to your editor.",
      layout: "story",
      background: "sunrise",
      theme: "pig",
      backgroundOptions: ["sunrise", "paper", "modes", "night", "stage"],
      body: [
        "Press D to open the tuner on every slide. Swap backgrounds, pick a theme, drag the overlay opacity, try accent colors, and see them applied as you go.",
        "Copy the settings and you get a ready-to-paste snippet that names the slide, which also makes a precise prompt for a coding agent. The tuner never writes files, and by default it only exists on localhost.",
      ],
    },
    {
      id: "boundary",
      nav: "What stays yours",
      eyebrow: "Package boundary",
      title: "slidepig owns the mechanics. You own the deck.",
      layout: "case",
      tone: "paper",
      itemsTitle: "What lives where",
      body: [
        "The library never scans your DOM or guesses at your content. It handles navigation, presenting, preloading, media behavior and the chrome around slides. Everything that makes a deck yours stays in your repository.",
      ],
      items: [
        {
          title: "slidepig",
          text: "Hash navigation, keyboard and fullscreen, preloading, controls, layouts, lightbox and carousel, the tuner. No dependencies.",
        },
        {
          title: "slidepig/site and slidepig/assets",
          text: "Optional build tooling in the same package: prerendered sites, validation, a Worker, and AVIF/WebP derivatives.",
        },
        {
          title: "Your deck",
          text: "Copy, media registry, themes and backgrounds, custom visuals, and any CSS you want to override.",
        },
      ],
      details: [
        {
          title: "Use only the parts you need",
          text: "One package, imported by path. `slidepig/react` exports the headless `useSlideshow` hook and `SlideshowControls` for a fully custom renderer. `slidepig/core` has the framework-free navigation and preload helpers. Build tools such as sharp are optional peers, so a page that embeds one deck installs nothing else.",
        },
      ],
    },
    {
      id: "start",
      nav: "Get started",
      eyebrow: "Three steps",
      title: "From an empty folder to a deck you can present.",
      layout: "timeline",
      body: [
        "slidepig works in any React app: Vite, Next.js, TanStack Start, Remix. Every slide is in the rendered HTML, so server rendering and static export work without extra setup.",
      ],
      items: [
        {
          label: "01 · Install",
          title: "npm i slidepig",
          text: "Import `slidepig/styles.css` once. React 18 or 19 is the only peer dependency.",
        },
        {
          label: "02 · Write",
          title: "defineDeck({ … })",
          text: "Slides, media and themes as typed data, in one file you can review in a pull request.",
        },
        {
          label: "03 · Render",
          title: "<Deck deck={deck} />",
          text: "Deploy it like any page. Press F when it is your turn to speak.",
        },
      ],
    },
    {
      id: "thanks",
      nav: "Thank you",
      eyebrow: "That was the demo",
      title: "You just read a deck. Now press F and present it.",
      layout: "closing",
      background: "sunrise",
      theme: "pig",
      body: [
        "Everything on this page came from one data file and one component. Open the source of this demo next to it, and change a title, to see how little stands between an idea and a deck.",
      ],
      links: [
        {
          label: "Read the README",
          href: "https://www.npmjs.com/package/slidepig",
          note: "Install, API and recipes",
        },
        {
          label: "Start a site",
          href: "https://www.npmjs.com/package/slidepig#a-new-presentation",
          note: "npx slidepig create my-decks",
        },
      ],
    },
  ],
});
