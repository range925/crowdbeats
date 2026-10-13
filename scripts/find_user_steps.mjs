import fs from 'fs';
import readline from 'readline';

async function search() {
  const fileStream = fs.createReadStream('C:/Users/Knauf/.gemini/antigravity/brain/3aae0d40-c867-400e-88e1-e301f2bc0ae0/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('"source":"USER_EXPLICIT"')) {
      try {
        const obj = JSON.parse(line);
        if (obj.content) {
          console.log(`=== STEP ${obj.step_index} ===`);
          console.log(obj.content.slice(0, 300));
        }
      } catch {}
    }
  }
}
search();
