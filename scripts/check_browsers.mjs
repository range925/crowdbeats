import fs from 'fs';
import { execSync } from 'child_process';

const candidates = [
  { name: 'Google Chrome', path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
  { name: 'Microsoft Edge', path: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
  { name: 'Mozilla Firefox (Program Files)', path: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe' },
  { name: 'Mozilla Firefox (x86)', path: 'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe' },
  { name: 'Mozilla Firefox (WindowsApps)', path: 'C:\\Users\\Knauf\\AppData\\Local\\Microsoft\\WindowsApps\\firefox.exe' },
];

console.log("=== BROWSER AVAILABILITY AUDIT ===");
for (const c of candidates) {
  const exists = fs.existsSync(c.path);
  console.log(`${c.name}: ${exists ? "FOUND" : "NOT FOUND"} (${c.path})`);
}
