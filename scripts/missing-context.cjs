// One-off audit helper: print usage context for every t() key missing from en.ts.
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

const enSrc = fs.readFileSync("src/lib/i18n/en.ts", "utf8");
const enKeys = new Set([...enSrc.matchAll(/"([a-z0-9_.-]+)":/g)].map((m) => m[1]));
const fb = JSON.parse(fs.readFileSync("scripts/fallbacks.json", "utf8"));

const byFile = new Map();
for (const f of walk("src")) {
  if (f.includes("i18n")) continue;
  const lines = fs.readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/\bt\(\s*"([a-z0-9_.-]+)"/g)) {
      const k = m[1];
      if (enKeys.has(k)) continue;
      if (fb[k] !== undefined && Object.values(fb).includes(fb[k]) && fb[k] && k in fb) {
        // has harvested fallback — still show briefly? skip to save space
        continue;
      }
      if (!byFile.has(f)) byFile.set(f, []);
      byFile.get(f).push([i + 1, line.trim(), k]);
    }
  });
}
for (const [f, entries] of byFile) {
  console.log("\n########## " + f);
  const seen = new Set();
  for (const [ln, line, k] of entries) {
    if (seen.has(k)) continue;
    seen.add(k);
    console.log(`L${ln} [${k}]`);
    console.log("   " + line.slice(0, 240));
  }
}
