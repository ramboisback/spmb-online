import fs from 'fs';
const code = fs.readFileSync('src/App.tsx', 'utf8');

let braceCount = 0;
let parenCount = 0;
let angleCount = 0;

let stack = [];
let lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '{') {
      stack.push({ char, line: i + 1, col: j + 1 });
    } else if (char === '}') {
      if (stack.length === 0 || stack[stack.length - 1].char !== '{') {
        console.log(`Unmatched } at line ${i + 1}:${j + 1}`);
      } else {
        stack.pop();
      }
    } else if (char === '(') {
      stack.push({ char, line: i + 1, col: j + 1 });
    } else if (char === ')') {
      if (stack.length === 0 || stack[stack.length - 1].char !== '(') {
        console.log(`Unmatched ) at line ${i + 1}:${j + 1}`);
      } else {
        stack.pop();
      }
    }
  }
}

console.log('Bracket stack at end (unmatched open brackets):');
stack.forEach(item => {
  console.log(`Open ${item.char} at line ${item.line}:${item.col}`);
});
