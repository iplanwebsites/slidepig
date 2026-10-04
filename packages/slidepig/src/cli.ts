#!/usr/bin/env node
// The single `slidepig` command. Each subcommand loads only what it needs,
// so `slidepig new` works without sharp installed.
const USAGE = `
slidepig <command>

Commands
  create [dir]     start a presentation site in dir (default: my-presentations)
  new <slug>       add src/decks/<slug>.ts to the current site
  assets           build optimized image derivatives (needs sharp)

Run "slidepig <command> --help" for options.
`;

const [command, ...rest] = process.argv.slice(2);

try {
  switch (command) {
    case "create":
      await (await import("./create")).runCreateCommand(rest);
      break;
    case "new":
      await (await import("./site/new")).runNewCommand(rest);
      break;
    case "assets":
      await (await import("./assets/cli")).runAssetsCommand(rest);
      break;
    default:
      console.log(USAGE.trim());
      process.exitCode = command && command !== "--help" ? 1 : 0;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

export {};
