import fs from 'fs';

// Read the original file
const content = fs.readFileSync('c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx', 'utf8');

// Remove BOM
let fixed = content.replace(/\uFEFF/g, '');

// Remove ALL whitespace (spaces, tabs, newlines)
// This will give us the minified code without any spaces
fixed = fixed.replace(/\s+/g, '');

// Now add proper formatting
// Add space after keywords
fixed = fixed.replace(/\b(import|const|let|var|function|return|if|for|while|switch|new|from|as)\b/g, (match) => {
  // Check if next char is a non-space, non-punctuation
  const nextChar = fixed[fixed.indexOf(match) + match.length];
  if (nextChar && /[a-zA-Z0-9_{]/.test(nextChar)) {
    return match + ' ';
  }
  return match;
});

// Add space before { when it follows keywords
// match is "import{" - match[0]="import{", match[1]="import", match[2]="{"
fixed = fixed.replace(/(import|const|let|function|return)\{/g, (match) => {
  return match[0] + ' ';
});

// Add space after keywords
fixed = fixed.replace(/\b(import|const|let|var|function|return|if|for|while|switch|new|from|as)\b(?=\w)/g, (match) => {
  return match + ' ';
});

// Write the fixed file
const outputPath = 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader_fixed.jsx';
fs.writeFileSync(outputPath, fixed, 'utf8');

console.log('Fixed file written to:', outputPath);
console.log('Original length:', content.length);
console.log('Fixed length:', fixed.length);
console.log('First 2000 chars of fixed content:');
console.log(fixed.substring(0, 2000));