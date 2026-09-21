// One-off audit helper: harvest intended English strings from dead `t(key) || "fallback"` pairs.
const fs = require("fs");
const path = require("path");

function walk(d) {
  let r = [];
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) r = r.concat(walk(p));
    else if (/\.(tsx|ts)$/.test(f.name)) r.push(p);
  }
  return r;
}

const out = new Map();
const re = /\bt\(\s*"([a-z0-9_.-]+)"(?:\s*,\s*\w+)?\s*\)\s*\|\|\s*("(?:[^"\\]|\\.)*")/g;
for (const f of walk("src")) {
  if (f.includes("i18n")) continue;
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(re)) {
    if (!out.has(m[1])) out.set(m[1], JSON.parse(m[2]));
  }
}
fs.writeFileSync("scripts/fallbacks.json", JSON.stringify(Object.fromEntries([...out.entries()].sort()), null, 1));
console.log("harvested keys:", out.size);
