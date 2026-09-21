// One-off: recover original English for each t() key by diffing the current
// file against its pre-i18n version (commit 4d4cbdc) and pairing the removed
// literal with the added t("key") call on the aligned lines.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const REV = "4d4cbdc";

function walk(d) {
  let r = [];
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) r = r.concat(walk(p));
    else if (/\.(tsx|ts)$/.test(f.name)) r.push(p);
  }
  return r;
}

function oldVersion(rel) {
  try {
    return execSync(`git show ${REV}:${rel}`, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }).split("\n");
  } catch {
    return null;
  }
}

// Simple LCS line diff producing pairs of [removedLine, addedLine]
function alignPairs(a, b) {
  const n = a.length, m = b.length;
  // guard: too big for full DP? files are < 1000 lines, fine.
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const pairs = [];
  let i = 0, j = 0;
  let run = { rem: [], add: [] };
  const flush = () => {
    if (run.rem.length || run.add.length) pairs.push(run);
    run = { rem: [], add: [] };
  };
  while (i < n && j < m) {
    if (a[i] === b[j]) { flush(); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { run.rem.push(a[i]); i++; }
    else { run.add.push(b[j]); j++; }
  }
  while (i < n) run.rem.push(a[i++]);
  while (j < m) run.add.push(b[j++]);
  flush();
  return pairs;
}

function stringsOf(line) {
  const out = [];
  const re = /"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(line))) out.push(m[1]);
  return out;
}

const enSrc = fs.readFileSync("src/lib/i18n/en.ts", "utf8");
const enKeys = new Set([...enSrc.matchAll(/"([a-z0-9_.-]+)":/g)].map((m) => m[1]));
const fallbacks = JSON.parse(fs.readFileSync("scripts/fallbacks.json", "utf8"));
const recovered = {};
const unresolved = [];

for (const f of walk("src")) {
  if (f.includes("i18n")) continue;
  const rel = f.replace(/\\/g, "/");
  const cur = fs.readFileSync(f, "utf8").split("\n");
  const keyRe = /\bt\(\s*"([a-z0-9_.-]+)"/g;
  const keysInFile = new Set();
  for (const m of cur.join("\n").matchAll(keyRe)) keysInFile.add(m[1]);
  const missingHere = [...keysInFile].filter((k) => !enKeys.has(k) && !(k in fallbacks));
  if (missingHere.length === 0) continue;
  const old = oldVersion(rel);
  if (!old) { unresolved.push([rel, missingHere]); continue; }
  const pairs = alignPairs(old, cur);
  for (const p of pairs) {
    const addTxt = p.add.join("\n");
    const remTxt = p.rem.join("\n");
    const keys = [...addTxt.matchAll(/\bt\(\s*"([a-z0-9_.-]+)"/g)].map((m) => m[1]).filter((k) => missingHere.includes(k));
    if (keys.length === 0) continue;
    const lits = stringsOf(remTxt).filter((s) => /[A-Za-z]/.test(s) && !s.includes("useState") && s.length > 0);
    if (lits.length === 0) { for (const k of keys) if (!(k in recovered)) unresolved.push([rel, [k]]); continue; }
    // pair keys with literals in order
    keys.forEach((k, idx) => {
      if (k in recovered) return;
      const lit = lits[Math.min(idx, lits.length - 1)];
      if (lit) recovered[k] = lit;
      else unresolved.push([rel, [k]]);
    });
  }
}

fs.writeFileSync("scripts/recovered-en.json", JSON.stringify(recovered, null, 1));
console.log("recovered:", Object.keys(recovered).length);
const covered = new Set([...Object.keys(recovered), ...Object.keys(fallbacks)]);
const stillMissing = [...enKeysMissingAll()];
function* enKeysMissingAll() {}
// compute full missing list again
const all = new Set();
for (const f of walk("src")) {
  if (f.includes("i18n")) continue;
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/\bt\(\s*"([a-z0-9_.-]+)"/g)) all.add(m[1]);
}
const miss = [...all].filter((k) => !enKeys.has(k) && !covered.has(k)).sort();
console.log("still missing (no source):", miss.length);
console.log(miss.join("\n"));
