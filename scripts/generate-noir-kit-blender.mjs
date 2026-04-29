import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const scriptPath = path.join(root, "scripts", "blender", "noir_kit.py");
const outDir = path.join(root, "public", "models", "noir-kit");
const args = process.argv.slice(2);
const checkOnly = args.includes("--check");

function blenderCandidates() {
  return [
    process.env.BLENDER_EXE,
    "blender",
    "C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe",
    "C:\\Program Files\\Blender Foundation\\Blender 4.5 LTS\\blender.exe",
    "C:\\Program Files\\Blender Foundation\\Blender\\blender.exe",
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "Programs", "Blender Foundation", "Blender 4.5", "blender.exe")
      : null,
  ].filter(Boolean);
}

function canRun(command) {
  const result = spawnSync(command, ["--version"], {
    encoding: "utf8",
    windowsHide: true,
  });
  return result.status === 0;
}

function findBlender() {
  for (const candidate of blenderCandidates()) {
    if (candidate.includes("\\") || candidate.includes("/")) {
      if (!fs.existsSync(candidate)) continue;
      if (canRun(candidate)) return candidate;
      continue;
    }

    if (canRun(candidate)) return candidate;
  }

  throw new Error(
    [
      "Blender 4.5 LTS was not found.",
      "Install Blender 4.5 LTS or set BLENDER_EXE to blender.exe before running this script.",
    ].join(" "),
  );
}

if (!fs.existsSync(scriptPath)) {
  throw new Error(`Missing Blender script: ${path.relative(root, scriptPath)}`);
}

const blender = findBlender();

if (checkOnly) {
  const version = spawnSync(blender, ["--version"], {
    encoding: "utf8",
    windowsHide: true,
  });
  process.stdout.write(version.stdout);
  process.stderr.write(version.stderr);
  process.exit(version.status ?? 0);
}

fs.mkdirSync(outDir, { recursive: true });

console.log(`Using Blender: ${blender}`);

const result = spawnSync(
  blender,
  ["--background", "--factory-startup", "--python", scriptPath, "--", "--out", outDir],
  {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
