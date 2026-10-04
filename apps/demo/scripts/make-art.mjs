// Renders the demo's background art. The output is committed, so this only
// runs when the art itself changes: `node scripts/make-art.mjs`.
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const W = 2400;
const H = 1500;

const grid = (color, step = 80) =>
  Array.from(
    { length: Math.ceil(W / step) },
    (_, i) =>
      `<line x1="${i * step}" y1="0" x2="${i * step}" y2="${H}" stroke="${color}" />`,
  ).join("") +
  Array.from(
    { length: Math.ceil(H / step) },
    (_, i) =>
      `<line x1="0" y1="${i * step}" x2="${W}" y2="${i * step}" stroke="${color}" />`,
  ).join("");

const glow = (cx, cy, r, color, opacity = 1) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}" filter="url(#blur)" />`;

const stack = (x, y, w, h, fills, offset = 46) =>
  fills
    .map(
      (fill, i) =>
        `<rect x="${x + i * offset}" y="${y - i * offset}" width="${w}" height="${h}" rx="28" fill="${fill}" stroke="#ffffff22" stroke-width="2" />`,
    )
    .reverse()
    .join("");

const art = {
  // Opening slide: a night sky of slides with a warm pink glow.
  "night-stack": `
    <rect width="100%" height="100%" fill="#120d14" />
    ${glow(1750, 380, 520, "#ff6fa8", 0.55)}
    ${glow(2150, 1150, 420, "#7a5cff", 0.4)}
    <g opacity="0.18">${grid("#ffffff")}</g>
    <g transform="rotate(-8 1700 800)">
      ${stack(1320, 640, 760, 460, ["#2a1f2e", "#3a2541", "#ff8fb8"], 52)}
    </g>`,
  // Light, quiet paper for copy-heavy slides.
  "paper-lines": `
    <rect width="100%" height="100%" fill="#fbf6f1" />
    ${glow(2000, 200, 520, "#ffd3e2", 0.8)}
    ${glow(300, 1400, 480, "#e6defc", 0.7)}
    <g opacity="0.5">${grid("#e9dfd6", 60)}</g>`,
  // Two modes: a document column beside a projected slide.
  "two-modes": `
    <rect width="100%" height="100%" fill="#f6f1fb" />
    ${glow(1900, 700, 600, "#ffc2d9", 0.7)}
    <g opacity="0.35">${grid("#ddd3ea", 70)}</g>
    <rect x="1350" y="250" width="420" height="1000" rx="22" fill="#ffffff" stroke="#d9cfe6" stroke-width="3" />
    ${Array.from({ length: 14 }, (_, i) => `<rect x="1400" y="${320 + i * 62}" width="${i % 4 === 0 ? 220 : 320}" height="${i % 4 === 0 ? 26 : 14}" rx="7" fill="${i % 4 === 0 ? "#2b2230" : "#cfc4dc"}" />`).join("")}
    <rect x="1860" y="430" width="520" height="330" rx="18" fill="#2b2230" />
    <rect x="1900" y="480" width="260" height="30" rx="8" fill="#ff8fb8" />
    <rect x="1900" y="540" width="400" height="16" rx="8" fill="#6c5a75" />
    <rect x="1900" y="574" width="340" height="16" rx="8" fill="#6c5a75" />`,
  // Dark slide for the "for the presenter" moment.
  "stage-light": `
    <rect width="100%" height="100%" fill="#0f1218" />
    <path d="M1500 0 L2400 0 L2400 1500 L900 1500 Z" fill="#ffe7f0" opacity="0.07" />
    ${glow(1900, 300, 380, "#ff7aae", 0.45)}
    ${glow(800, 1300, 360, "#5ac8fa", 0.25)}
    <g opacity="0.1">${grid("#ffffff", 100)}</g>`,
  // Closing: warm and open.
  sunrise: `
    <rect width="100%" height="100%" fill="#fff3ec" />
    ${glow(1700, 1400, 900, "#ff9fc2", 0.65)}
    ${glow(2300, 300, 500, "#ffd7a8", 0.6)}
    <g opacity="0.35">${grid("#f1dccf", 90)}</g>`,
};

await mkdir(new URL("../public/art/", import.meta.url), { recursive: true });
for (const [name, body] of Object.entries(art)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="120" /></filter></defs>
    ${body}
  </svg>`;
  const out = new URL(`../public/art/${name}.jpg`, import.meta.url);
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(out.pathname);
  console.log(`wrote public/art/${name}.jpg`);
}
