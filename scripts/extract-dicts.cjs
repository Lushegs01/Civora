// One-off: parse update_dicts.js from git HEAD into three JSON key maps.
const { execSync } = require("child_process");
const fs = require("fs");

const src = execSync("git show HEAD:update_dicts.js", { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });

function extract(varName) {
  const start = src.indexOf(`const ${varName} = \``);
  if (start === -1) return null;
  const end = src.indexOf("`;", start);
  const block = src.slice(start, end);
  const map = {};
  for (const m of block.matchAll(/"([a-z0-9_.-]+)":\s*"((?:[^"\\]|\\.)*)"/g)) {
    map[m[1]] = JSON.parse('"' + m[2] + '"');
  }
  return map;
}

const names = [...src.matchAll(/const (\w+) = `/g)].map((m) => m[1]);
console.log("blocks found:", names.join(", "));
const out = {};
for (const n of names) {
  const m = extract(n);
  if (m && Object.keys(m).length) out[n] = m;
}
fs.writeFileSync("scripts/dict-blocks.json", JSON.stringify(out, null, 1));
for (const [n, m] of Object.entries(out)) console.log(n, Object.keys(m).length, "keys");
