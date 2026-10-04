import path from "node:path";
import process from "node:process";
import { findConfigFile, loadConfigFile } from "./loader";
import { formatStats, runAssetPipeline } from "./run";

type Flags = {
  config?: string;
  cwd: string;
  force: boolean;
  check: boolean;
  help: boolean;
};

function parseArgs(argv: string[]): Flags {
  const flags: Flags = {
    cwd: process.cwd(),
    force: false,
    check: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];

    if (arg === "--force" || arg === "-f") flags.force = true;
    else if (arg === "--check") flags.check = true;
    else if (arg === "--help" || arg === "-h") flags.help = true;
    else if (arg === "--config" || arg === "-c") flags.config = argv[++index];
    else if (arg === "--cwd") flags.cwd = path.resolve(argv[++index] ?? ".");
    else if (arg?.startsWith("--config=")) flags.config = arg.slice(9);
    else if (arg?.startsWith("--cwd=")) flags.cwd = path.resolve(arg.slice(6));
  }

  return flags;
}

const USAGE = `
slidepig assets — build optimized image derivatives for a deck

  slidepig assets [options]

Options
  -c, --config <file>  Config file (default: assets.config.ts in --cwd)
      --cwd <dir>      Directory the config paths resolve against
  -f, --force          Re-encode everything, ignoring the cache
      --check          Report out-of-date assets and exit non-zero, write nothing
  -h, --help           Show this message
`;

export async function runAssetsCommand(argv: string[]): Promise<void> {
  const flags = parseArgs(argv);

  if (flags.help) {
    console.log(USAGE.trim());
    return;
  }

  const configFile = flags.config
    ? path.resolve(flags.cwd, flags.config)
    : findConfigFile(flags.cwd);

  if (!configFile) {
    console.error(
      `[slidepig assets] no assets.config.ts found in ${flags.cwd}. See --help.`,
    );
    process.exitCode = 1;
    return;
  }

  const options = await loadConfigFile(configFile);
  const result = await runAssetPipeline(options, {
    cwd: path.dirname(configFile),
    force: flags.force,
    check: flags.check,
  });

  if (flags.check && result.outdated.length > 0) {
    console.error(
      `[slidepig assets] ${result.outdated.length} asset(s) out of date:\n` +
        result.outdated.map((source) => `  - ${source}`).join("\n") +
        `\nRun "slidepig assets" and commit the manifest.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`[slidepig assets] ${formatStats(result.stats)}`);

  if (result.stats.failed > 0) process.exitCode = 1;
}
