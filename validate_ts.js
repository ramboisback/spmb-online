import ts from 'typescript';
import fs from 'fs';

const code = fs.readFileSync('src/App.tsx', 'utf8');

const sourceFile = ts.createSourceFile(
  'src/App.tsx',
  code,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

// Print compiler errors (diagnostics)
const diagnostics = sourceFile.parseDiagnostics || [];

console.log(`Found ${diagnostics.length} syntactic diagnostics:`);
diagnostics.forEach((diag, index) => {
  const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, diag.start);
  console.log(`Diagnostic ${index + 1}: [Line ${line + 1}, Col ${character + 1}]`);
  console.log(`  Code: ${diag.code}`);
  console.log(`  Message: ${diag.messageText}`);
});
