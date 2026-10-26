import fs from 'fs';

// Read the original file
const content = fs.readFileSync('c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx', 'utf8');

// Step 1: Remove BOM
let fixed = content.replace(/\uFEFF/g, '');

// Step 2: Remove all spaces between alphanumeric characters
// The regex ([a-zA-Z0-9])\s+([a-zA-Z0-9]) should match any alphanumeric
// followed by one or more spaces followed by another alphanumeric
// Replace with just the two characters concatenated
fixed = fixed.replace(/([a-zA-Z0-9])\s+([a-zA-Z0-9])/g, '$1$2');

// Step 3: Add necessary spaces between keywords and their arguments
// Specific patterns that need spaces:
const keywordSpaces = [
  { pattern: /import\{/g, replacement: 'import {' },
  { pattern: /const\{/g, replacement: 'const {' },
  { pattern: /function\(/g, replacement: 'function (' },
  { pattern: /let\(/g, replacement: 'let (' },  // unlikely but just in case
  { pattern: /return\(/g, replacement: 'return (' },
  { pattern: /if\(/g, replacement: 'if (' },
  { pattern: /for\(/g, replacement: 'for (' },
  { pattern: /while\(/g, replacement: 'while (' },
  { pattern: /switch\(/g, replacement: 'switch (' },
  { pattern: /new\(/g, replacement: 'new (' },
  { pattern: /from"/g, replacement: 'from "' },
  { pattern: /as"/g, replacement: 'as "' },
];

for (const fix of keywordSpaces) {
  fixed = fixed.replace(fix.pattern, fix.replacement);
}

// Step 4: Add proper newlines and indentation
// Add newline before {
fixed = fixed.replace(/([^\n])\{/g, '$1\n{');
// Add newline after ;
fixed = fixed.replace(/;/g, ';\n');
// Add newline after }
fixed = fixed.replace(/\}(?!\s*\})/g, '}\n');

// Add indentation (2 spaces per level)
let indent = 0;
fixed = fixed.split('\n').map(line => {
  const indentStr = '  '.repeat(Math.max(0, indent - 1));
  const trimmed = line.trim();
  // Count braces in the line
  const openBraces = (line.match(/{/g) || []).length;
  const closeBraces = (line.match(/}/g) || []).length;
  indent += openBraces - closeBraces;
  return indentStr + trimmed;
}).join('\n');

// Step 5: Write the fixed file
const outputPath = 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader_fixed.jsx';
fs.writeFileSync(outputPath, fixed, 'utf8');

console.log('Fixed file written to:', outputPath);
console.log('Original length:', content.length);
console.log('Fixed length:', fixed.length);
console.log('');
console.log('First 2000 chars of fixed content:');
console.log(fixed.substring(0, 2000));