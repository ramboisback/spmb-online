import fs from 'fs';

const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const start = 1973;
const end = 2545;

console.log('--- Analyzing divs within lines 1973 to 2545 ---');

let divOpenLines = [];

for (let i = start - 1; i < end; i++) {
  const lineNo = i + 1;
  const lineText = lines[i];

  let pos = 0;
  while (true) {
    const openIdx = lineText.indexOf('<div', pos);
    const closeIdx = lineText.indexOf('</div', pos);

    if (openIdx === -1 && closeIdx === -1) {
      break;
    }

    if (openIdx !== -1 && (closeIdx === -1 || openIdx < closeIdx)) {
      const after = lineText.charAt(openIdx + 4);
      if (after === ' ' || after === '>' || after === '\r' || after === '\n') {
        divOpenLines.push(lineNo);
      }
      pos = openIdx + 4;
    } else {
      if (divOpenLines.length === 0) {
        console.log(`EXTRA CLOSING div tag at line ${lineNo}`);
      } else {
        divOpenLines.pop();
      }
      pos = closeIdx + 5;
    }
  }
}

console.log(`Remaining open divs inside: ${divOpenLines.length}`);
console.log('Opened on lines:', divOpenLines);
