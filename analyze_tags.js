import fs from 'fs';
const code = fs.readFileSync('src/App.tsx', 'utf8');

const allowedTags = new Set([
  'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'ul', 'li', 'ol', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'form', 'main', 'aside', 'nav', 'footer', 'header', 'label', 'input', 'select', 'option', 'textarea', 'strong', 'em', 'AdminSchoolMap', 'LayoutDashboard', 'School', 'Database', 'Sliders', 'Activity', 'Trash2', 'Shield', 'Clock', 'ArrowRight'
]);

// Read tags. Tag names must be in allowedTags
const tagRegex = /<(\/?[a-zA-Z0-9_\-]+)/g;

let stack = [];
let lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let match;
  while ((match = tagRegex.exec(line)) !== null) {
    const rawName = match[1];
    const isClosing = rawName.startsWith('/');
    const cleanName = isClosing ? rawName.slice(1) : rawName;

    if (!allowedTags.has(cleanName)) {
      continue;
    }

    // Try to determine if it is self-closing by looking at the line segment
    const rest = line.slice(match.index + match[0].length);
    
    // Find matching '>' of this tag. We must skip any '=>' since that is an arrow function.
    let firstClosingBracket = -1;
    for (let k = 0; k < rest.length; k++) {
      if (rest[k] === '>') {
        if (k > 0 && rest[k - 1] === '=') {
          // This is a '=>' arrow function, skip it!
          continue;
        }
        firstClosingBracket = k;
        break;
      }
    }

    if (firstClosingBracket === -1) {
      continue;
    }

    const tagContent = rest.slice(0, firstClosingBracket);
    const isSelfClosing = tagContent.endsWith('/') || ['input', 'br', 'hr', 'img', 'link', 'meta'].includes(cleanName.toLowerCase());

    if (isSelfClosing) {
      continue;
    }

    if (isClosing) {
      if (stack.length === 0) {
        console.log(`Unmatched closing tag: </${cleanName}> at line ${i + 1}`);
      } else {
        const last = stack.pop();
        if (last.name !== cleanName) {
          console.log(`Tag mismatch: opened <${last.name}> at line ${last.line} but closed with </${cleanName}> at line ${i + 1}`);
          // Put last back to try to recover
          stack.push(last);
        }
      }
    } else {
      stack.push({ name: cleanName, line: i + 1 });
    }
  }
}

console.log('--- Unmatched open tag stack ---');
stack.forEach(t => {
  console.log(`Tag <${t.name}> opened at line ${t.line} was never closed`);
});
