const { spawn } = require('child_process');
const fs = require('fs');

async function inspectBackup() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debugPort = 9247;
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=' + debugPort,
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);
  
  await new Promise(r => setTimeout(r, 1200));
  const res = await fetch('http://127.0.0.1:' + debugPort + '/json/list');
  const tabs = await res.json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  
  const files = [
    'hero-desktop-master.png',
    'hero-desktop-1280.webp',
    'hero-desktop-1920.webp',
    'hero-desktop-2560.webp',
    'hero-mobile-master.png',
    'hero-mobile-750.webp',
    'hero-mobile-1080.webp'
  ];
  
  for (const f of files) {
    const p = 'c:/Users/Knauf/Documents/GitHub/crowdbeats-v2/apps/web/public/landing/v3/backup_original/' + f;
    const mime = f.endsWith('.png') ? 'image/png' : 'image/webp';
    const b64 = fs.readFileSync(p).toString('base64');
    const expr = `new Promise(r => { const img = new Image(); img.onload = () => r({w: img.naturalWidth, h: img.naturalHeight}); img.src = 'data:${mime};base64,${b64}'; })`;
    const evalMsg = { id: 1, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true, returnByValue: true } };
    ws.send(JSON.stringify(evalMsg));
    const resp = await new Promise(r => ws.onmessage = e => r(JSON.parse(e.data)));
    console.log(f, resp.result?.result?.value);
  }
  chrome.kill();
}
inspectBackup();
