import { defineDeck } from "slidepig";

export default defineDeck({
  title: "Our 2026 plan",
  accentColor: "#0f6fde",
  slides: [
    {
      id: "plan",
      layout: "hero",
      title: "Three bets for 2026.",
      body: ["A short, embeddable presentation on an ordinary page."],
    },
    {
      id: "bets",
      layout: "rows",
      title: "The bets",
      items: [
        { title: "Ship faster", text: "Weekly releases, smaller changes." },
        { title: "Listen harder", text: "A customer call every week." },
        { title: "Spend less", text: "One tool where we use three." },
      ],
    },
    { id: "ask", layout: "closing", title: "Questions welcome." },
  ],
});
