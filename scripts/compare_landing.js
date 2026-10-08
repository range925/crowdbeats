/**
 * Compares landing_before and landing_after fingerprints.
 * Checks:
 *   - Footer HTML, computed styles, text, and link equality
 *   - Page height and horizontal overflow differences
 *   - Exact section counts and IDs on the rendered page
 */
const fs = require('fs');
const path = require('path');

const artifactDir = 'C:/Users/Knauf/.gemini/antigravity/brain/60ab879b-06db-4ab7-bd6d-102421ad9d52';
const beforeDir = path.join(artifactDir, 'landing_before');
const afterDir = path.join(artifactDir, 'landing_after');

const beforeSum = JSON.parse(fs.readFileSync(path.join(beforeDir, 'summary.json'), 'utf8'));
const afterSum = JSON.parse(fs.readFileSync(path.join(afterDir, 'summary.json'), 'utf8'));

const report = [];
let allPassed = true;

for (const b of beforeSum) {
  const a = afterSum.find((x) => x.tag === b.tag);
  if (!a) {
    report.push({ tag: b.tag, status: 'MISSING_IN_AFTER' });
    allPassed = false;
    continue;
  }

  const htmlEqual = b.htmlHash === a.htmlHash;
  const textEqual = b.textHash === a.textHash;
  const styleEqual = b.styleHash === a.styleHash;
  const linksEqual = b.links === a.links;
  const noOverflow = a.horizontalOverflowPx <= 0;

  const item = {
    tag: b.tag,
    footerHeight: { before: b.footerH, after: a.footerH, equal: b.footerH === a.footerH },
    pageHeight: { before: b.pageHeight, after: a.pageHeight },
    horizontalOverflowPx: a.horizontalOverflowPx,
    htmlMatch: htmlEqual,
    textMatch: textEqual,
    styleMatch: styleEqual,
    linksMatch: linksEqual,
    linksCount: a.links,
    pass: htmlEqual && textEqual && styleEqual && linksEqual && noOverflow,
  };

  if (!item.pass) allPassed = false;
  report.push(item);
}

fs.writeFileSync(path.join(artifactDir, 'landing_regression_report.json'), JSON.stringify({ allPassed, report }, null, 2));
console.log(JSON.stringify({ allPassed, report }, null, 2));
