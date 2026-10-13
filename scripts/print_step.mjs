import fs from 'fs';
import readline from 'readline';

async function printStep() {
  const fileStream = fs.createReadStream('C:/Users/Knauf/.gemini/antigravity/brain/3aae0d40-c867-400e-88e1-e301f2bc0ae0/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('"step_index":5730')) {
      const obj = JSON.parse(line);
      console.log(obj.content);
      break;
    }
  }
}
printStep();
