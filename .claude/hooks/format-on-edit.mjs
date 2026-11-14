// .claude/hooks/format-on-edit.mjs
// Runs Prettier on the file Claude Code just edited or created.
// Called by the PostToolUse hook in .claude/settings.json.
// Formatting must never block Claude's work, so this script always exits with 0.

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";

const FORMATTABLE = new Set([
  ".astro", ".ts", ".tsx", ".js", ".mjs", ".cjs",
  ".json", ".css", ".md", ".mdx", ".yml", ".yaml", ".html",
]);

try {
  // Claude Code passes the tool call as JSON on stdin
  const input = JSON.parse(readFileSync(0, "utf8"));
  const file = input?.tool_input?.file_path;

  if (!file || !existsSync(file)) process.exit(0);
  if (!FORMATTABLE.has(extname(file).toLowerCase())) process.exit(0);
  if (/(^|[\\/])\.env(\.|$)/.test(file)) process.exit(0); // never touch secret files

  // Call Prettier's own script with Node directly: works on Windows without a shell
  const prettier = join(process.cwd(), "node_modules", "prettier", "bin", "prettier.cjs");
  if (!existsSync(prettier)) process.exit(0);

  execFileSync(process.execPath, [prettier, "--write", "--log-level", "warn", file], {
    stdio: "inherit",
  });
} catch {
  // ignore: a formatting problem must not stop the edit
}
process.exit(0);
