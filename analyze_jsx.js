import fs from 'fs';
const code = fs.readFileSync('src/App.tsx', 'utf8');

let stack = [];
let lines = code.split('\n');

let inCurly = 0;
let inComment = false;
let inString = null; // '"', "'", '`'

let parsedJSX = '';

// Walk char by char to strip out curly brace expressions, leaving only raw JSX
for (let i = 0; i < code.length; i++) {
  const char = code[i];
  const next = code[i + 1] || '';

  if (inComment) {
    if (char === '*' && next === '/') {
      inComment = false;
      i++;
    }
    continue;
  }

  // Check for block comments
  if (char === '/' && next === '*') {
    inComment = true;
    i++;
    continue;
  }

  // Handle strings inside raw code/JSX
  if (inString) {
    if (char === inString) {
      inString = null;
    }
    continue;
  }

  if (char === '"' || char === "'" || char === '`') {
    inString = char;
    continue;
  }

  // Check curly brace nesting
  if (char === '{') {
    inCurly++;
    continue;
  }

  if (char === '}') {
    inCurly--;
    continue;
  }

  // Only keep structure if NOT inside curly braces
  if (inCurly === 0) {
    parsedJSX += char;
  }
}

// Now parse the tags in the parsed JSX
const tagRegex = /<(\/?[a-zA-Z0-9_\-]+)(?:\s+[^>]*?)?(\/?)>/g;
let match;
while ((match = tagRegex.exec(parsedJSX)) !== null) {
  const tagName = match[1];
  const isClosing = tagName.startsWith('/');
  const cleanName = isClosing ? tagName.slice(1) : tagName;
  const isSelfClosing = match[2] === '/' || ['img', 'input', 'br', 'hr', 'link', 'meta'].includes(cleanName.toLowerCase());

  if (isSelfClosing) {
    continue;
  }

  if (isClosing) {
    if (stack.length === 0) {
      console.log(`Unmatched closing tag: </${cleanName}>`);
    } else {
      const last = stack.pop();
      if (last.name !== cleanName) {
        console.log(`Tag mismatch: opened <${last.name}> but closed with </${cleanName}>`);
        // Recover
        stack.push(last);
      }
    }
  } else {
    stack.push({ name: cleanName });
  }
}

console.log('--- Unmatched open tag stack ---');
stack.forEach(t => {
  console.log(`Tag <${t.name}> was never closed`);
});
