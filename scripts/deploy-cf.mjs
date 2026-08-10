import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const skip = new Set([
  ".git",
  ".gitignore",
  ".agents",
  ".codex",
  ".wrangler",
  "node_modules",
  "dist",
  "src",
  "scripts",
  "wrangler.jsonc",
  "wrangler.toml",
  "README.md",
  "supabase-timeline.sql"
]);

function copy(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copy(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of fs.readdirSync(root)) {
  if (skip.has(entry)) continue;
  copy(path.join(root, entry), path.join(dist, entry));
}

console.log("Cloudflare dist ready:", dist);
