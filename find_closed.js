import fs from 'fs';
const code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\)\}/g;
let lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes(')}')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
}
