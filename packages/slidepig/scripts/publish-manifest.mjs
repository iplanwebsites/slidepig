// prepack strips the workspace-only "slidepig-source" condition (it points
// at src/, which is not published) and postpack restores package.json.
import { copyFile, readFile, rm, writeFile } from "node:fs/promises";

const backup = "package.json.workspace";

if (process.argv[2] === "restore") {
  await copyFile(backup, "package.json");
  await rm(backup);
} else {
  await copyFile("package.json", backup);
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  for (const entry of Object.values(pkg.exports))
    if (entry && typeof entry === "object") delete entry["slidepig-source"];
  // Only the build tooling uses them, and their scripts/ are not published.
  delete pkg.scripts;
  await writeFile("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
}
