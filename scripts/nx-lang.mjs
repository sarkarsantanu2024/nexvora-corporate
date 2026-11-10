// Gives every demo the same top strip, and puts the Login / Sign up button
// and the language switch inside the demo's own header.
//
//   npm run nx:lang
//
// 1. Replaces the demo's own strip (demo-strip / strip / demobar /
//    demostrip) with the shared <div class="nx-strip">: black, "Sample
//    website by Nexvora Technologies" on the left, a grid icon on the right
//    that goes to /demos.
// 2. Inserts <span class="nx-lang"></span> just before the hamburger button
//    in the header; /nx/nx-lang.js fills it with the two controls.
// 3. Links /nx/nx-demo.css and /nx/nx-lang.js.
//
// Safe to run again: a demo that already has the shared strip is skipped.

import fs from "node:fs";
import path from "node:path";

const DEMO_DIR = path.join(process.cwd(), "public", "demo");
const STRIP = `<div class="nx-strip"><div class="nx-strip__wrap"><span class="nx-strip__text">Sample website by <a href="https://www.nexvoratechnologies.co.in/">Nexvora Technologies</a></span><a class="nx-strip__all" href="/demos" aria-label="See all sample websites" title="See all sample websites"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg><span>All samples</span></a></div></div>`;

function closingDivPos(html, openTagEnd) {
  let depth = 1;
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = openTagEnd + 1;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith("</")) depth--;
    else if (!m[0].endsWith("/>")) depth++;
    if (depth === 0) return m.index + m[0].length;
  }
  return -1;
}

const slugs = fs.readdirSync(DEMO_DIR).filter((s) => fs.existsSync(path.join(DEMO_DIR, s, "index.html"))).sort();
let changed = 0;
for (const slug of slugs) {
  const file = path.join(DEMO_DIR, slug, "index.html");
  let html = fs.readFileSync(file, "utf8");
  if (html.includes('class="nx-strip"')) continue;

  // Any earlier version of the language holder inside the old strip goes
  // away with the strip itself.
  const stripMatch = html.match(/<div class="(?:demo-strip|demostrip|demobar|strip)"[^>]*>/);
  if (!stripMatch) {
    console.warn(`${slug}: no demo strip, skipped`);
    continue;
  }
  const start = stripMatch.index;
  const end = closingDivPos(html, start + stripMatch[0].length - 1);
  if (end === -1) {
    console.warn(`${slug}: could not find end of strip, skipped`);
    continue;
  }
  html = html.slice(0, start) + STRIP + html.slice(end);
  html = html.replace(/<span class="nx-lang"><\/span>/g, "");

  const burger = html.indexOf('<button class="burger"');
  if (burger === -1) {
    console.warn(`${slug}: no hamburger button, language holder not placed`);
  } else {
    html = html.slice(0, burger) + '<span class="nx-lang"></span>\n    ' + html.slice(burger);
  }

  if (!html.includes("/nx/nx-demo.css")) {
    const headClose = html.lastIndexOf("</head>");
    html = html.slice(0, headClose) + '<link rel="stylesheet" href="/nx/nx-demo.css">\n' + html.slice(headClose);
  }
  if (!html.includes("/nx/nx-lang.js")) {
    const bodyClose = html.lastIndexOf("</body>");
    html = html.slice(0, bodyClose) + '<script src="/nx/nx-lang.js" defer></script>\n' + html.slice(bodyClose);
  }
  fs.writeFileSync(file, html);
  changed++;
}
console.log(`Shared strip and header controls added to ${changed} demos (${slugs.length} total).`);
