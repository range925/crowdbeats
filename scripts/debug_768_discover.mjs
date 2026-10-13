import { spawn } from 'child_process';

const p = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--remote-debugging-port=9251', '--headless=new', '--user-data-dir=.chrome-temp-test-768'
]);
await new Promise(r => setTimeout(r, 1500));
const res = await fetch('http://localhost:9251/json/list');
const pages = await res.json();
const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 1;
const send = (method, params = {}) => new Promise(r => {
  const curId = id++;
  const handler = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id === curId) { ws.removeEventListener('message', handler); r(data.result); }
  };
  ws.addEventListener('message', handler);
  ws.send(JSON.stringify({ id: curId, method, params }));
});

await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:3000/discover' });
await new Promise(r => setTimeout(r, 1500));
const result = await send('Runtime.evaluate', {
  expression: `(() => {
    const elements = Array.from(document.querySelectorAll("*"));
    const docW = document.documentElement.clientWidth;
    const overflowing = [];
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > docW + 1) {
        overflowing.push({ tag: el.tagName, class: el.className, id: el.id, right: Math.round(rect.right), width: Math.round(rect.width), parent: el.parentElement?.className });
      }
    });
    return JSON.stringify(overflowing.slice(0, 10));
  })()`,
  returnByValue: true
});
console.log('OVERFLOW ELEMENTS:', result.result.value);
p.kill();
process.exit(0);
