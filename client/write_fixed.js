import fs from 'fs';

// Read the original minified file
const content = fs.readFileSync('c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx', 'utf8');

// Remove BOM
let fixed = content.replace(/\uFEFF/g, '');

// Remove all spaces between characters
fixed = fixed.replace(/\s+/g, '');

// Now add proper formatting with spaces and semicolons
// This is a manual reconstruction based on the minified content

// Add spaces between keywords and their arguments
fixed = fixed.replace(/\b(import|const|let|var|function|return|if|for|while|switch|new|from|as)\{/g, (match) => {
  return match[0] + ' ' + match[1];
});

// Add space after keywords
fixed = fixed.replace(/(import|const|let|var|function|return|if|for|while|switch|new|from|as)(?=\w)/g, (match) => {
  return match + ' ';
});

// Add proper newlines and indentation
fixed = fixed.replace(/([^\n])\{/g, '$1\n{');
fixed = fixed.replace(/\}(?!\s*\})/g, '}\n');
fixed = fixed.replace(/;/g, ';\n');

// Add indentation (2 spaces per level)
let indent = 0;
fixed = fixed.split('\n').map(line => {
  const indentStr = '  '.repeat(Math.max(0, indent - 1));
  const trimmed = line.trim();
  const openBraces = (line.match(/{/g) || []).length;
  const closeBraces = (line.match(/}/g) || []).length;
  indent += openBraces - closeBraces;
  return indentStr + trimmed;
}).join('\n');

// Write the fixed file
const outputPath = 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader_fixed.jsx';
fs.writeFileSync(outputPath, fixed, 'utf8');

console.log('Fixed file written to:', outputPath);
console.log('Original length:', content.length);
console.log('Fixed length:', fixed.length);
console.log('First 2000 chars of fixed content:');
console.log(fixed.substring(0, 2000));