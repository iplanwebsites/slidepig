import { defineDeck } from "slidepig";
import type { DeckLayoutProps } from "slidepig";
import "./mix.css";

/**
 * A deck can mix anything per slide: built-in layouts, layouts of its own,
 * rich copy, components that react to the slide, and CSS. This one shows each.
 */

// A reusable layout: any slide can say `layout: "compare"`.
function Compare({ slide, parts }: DeckLayoutProps) {
  return (
    <div className="mix-compare">
      {parts.copy}
      <table>
        <thead>
          <tr>
            <th scope="col">Exported deck</th>
            <th scope="col">slidepig page</th>
          </tr>
        </thead>
        <tbody>
          {slide.items?.map((item, index) => (
            <tr key={index}>
              <td>{item.title}</td>
              <td>{item.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {parts.details}
    </div>
  );
}

// A component that receives the slide's live state.
function StageMeter({
  active,
  presenting,
}: {
  active: boolean;
  presenting: boolean;
}) {
  return (
    <div className="mix-meter" data-active={active}>
      <span>{presenting ? "Presenting" : "Reading"}</span>
      <strong>
        {active ? "This slide is on stage" : "Waiting in the wings"}
      </strong>
    </div>
  );
}

export default defineDeck({
  title: "Mix and match",
  description:
    "Every slide can bring its own layout, components and CSS. This deck shows how.",
  lang: "en",
  layouts: { compare: Compare },
  slides: [
    {
      id: "rich",
      title: "Copy can be more than text.",
      eyebrow: "Rich copy",
      body: [
        "A string is a paragraph, and `backticks` become code.",
        <p key="link">
          Anything else renders as given: a{" "}
          <a href="https://www.npmjs.com/package/slidepig">link</a>,{" "}
          <em>emphasis</em>, or a list.
        </p>,
        <ul key="list">
          <li>Items, captions and stats take the same.</li>
          <li>Titles stay plain text: they name the slide.</li>
        </ul>,
      ],
    },
    {
      id: "compare",
      title: "A layout of your own.",
      eyebrow: "Custom layout",
      layout: "compare",
      body: ["Defined once in the deck, used by any slide that names it."],
      items: [
        { title: "Two files to keep in sync", text: "One page and its URL" },
        { title: "Video becomes a still", text: "Video plays in place" },
        { title: "No link to slide seven", text: "Every slide has a hash" },
      ],
    },
    {
      id: "live",
      title: "Components that know the slide.",
      eyebrow: "Live visual",
      body: [
        "A visual can be a function of the slide's state. Press F and move between slides to watch it.",
      ],
      visual: ({ active, presenting }) => (
        <StageMeter active={active} presenting={presenting} />
      ),
    },
    {
      id: "styled",
      title: "CSS where you want it.",
      eyebrow: "Per-slide styling",
      className: "mix-spotlight",
      style: { "--mix-glow": "#ff8a3d" },
      tone: "dark",
      body: [
        "This slide has its own class and a CSS variable, so its stylesheet can target it alone.",
      ],
    },
    {
      id: "one-off",
      title: "Or write the whole slide.",
      eyebrow: "render",
      body: ["`render` gets the same parts as a layout, for a one-off."],
      render: ({ parts, index }) => (
        <div className="mix-one-off">
          <span className="mix-big-number" aria-hidden="true">
            {index + 1}
          </span>
          {parts.copy}
        </div>
      ),
    },
  ],
});
