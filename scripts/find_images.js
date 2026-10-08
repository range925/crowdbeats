const fs = require('fs');

function checkFile(p) {
  const content = fs.readFileSync(p, 'utf8');
  const regex = /["'][^"']*\.(?:jpg|jpeg|png|webp|svg)["']/gi;
  const matches = content.match(regex);
  if (matches) {
    console.log(p, Array.from(new Set(matches)));
  }
}

checkFile('apps/web/components/landing/MillionDollarLanding.tsx');
checkFile('apps/web/components/landing/CrowdbeatsWebLanding.tsx');
checkFile('apps/web/components/landing/HowItWorksPhones.tsx');
