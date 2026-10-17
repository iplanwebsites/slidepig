// Runs `slidepig create` into a temporary directory and checks the result.
// Needs `pnpm build` first.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const parent = mkdtempSync(path.join(tmpdir(), "slidepig-create-"));
const target = path.join(parent, "Team Decks");
const cli = path.join(here, "../dist/cli.js");
const fail = (message) => {
  rmSync(parent, { recursive: true, force: true });
  console.error(`[slidepig] ${message}`);
  process.exit(1);
};

execFileSync("node", [cli, "create", target], { stdio: "pipe" });

for (const file of [
  ".gitignore",
  "package.json",
  "vite.config.ts",
  "src/site.ts",
  "src/decks/welcome.ts",
  "worker/index.ts",
  "wrangler.jsonc",
])
  if (!existsSync(path.join(target, file))) fail(`missing ${file}`);

const pkg = JSON.parse(readFileSync(path.join(target, "package.json"), "utf8"));
if (pkg.name !== "team-decks") fail(`package name is ${pkg.name}`);
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
for (const [name, range] of Object.entries(deps))
  if (String(range).startsWith("workspace:")) fail(`${name} is still ${range}`);
if (
  !readFileSync(path.join(target, "wrangler.jsonc"), "utf8").includes(
    '"team-decks"',
  )
)
  fail("wrangler.jsonc name was not set");

try {
  execFileSync("node", [cli, "create", target], { stdio: "pipe" });
  fail("a non-empty directory was overwritten");
} catch {
  // Expected: the creator refuses to write into a non-empty directory.
}

// The default stays minimal; agents opt in to copying the bundled skill.
if (existsSync(path.join(target, ".agents")))
  fail("default scaffold installed a skill");
const agentTarget = path.join(parent, "Agent Decks");
execFileSync("node", [cli, "create", "--skill", agentTarget], {
  stdio: "pipe",
});
const installedSkill = path.join(
  agentTarget,
  ".agents/skills/slidepig/SKILL.md",
);
const bundledSkill = path.join(here, "../skills/slidepig/SKILL.md");
if (readFileSync(installedSkill, "utf8") !== readFileSync(bundledSkill, "utf8"))
  fail("the scaffolded skill does not match the bundled skill");
if (!existsSync(path.join(agentTarget, "src/decks/welcome.ts")))
  fail("agent scaffold is missing the example deck");

const help = execFileSync("node", [cli, "create", "--help"], {
  cwd: parent,
  encoding: "utf8",
});
if (!help.includes("--skill")) fail("create help is missing the skill option");
if (existsSync(path.join(parent, "--help"))) fail("help created a directory");
for (const args of [["--unknown"], ["one", "two"]]) {
  let rejected = false;
  try {
    execFileSync("node", [cli, "create", ...args], {
      cwd: parent,
      stdio: "pipe",
    });
  } catch {
    rejected = true;
  }
  if (!rejected) fail(`unexpected create arguments were accepted: ${args}`);
}
if (
  existsSync(path.join(parent, "--unknown")) ||
  existsSync(path.join(parent, "one"))
)
  fail("invalid create arguments wrote files");

rmSync(parent, { recursive: true, force: true });
console.log("[slidepig] smoke test passed");
