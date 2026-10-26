import fs from 'fs';

const content = fs.readFileSync('c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx', 'utf8');
let fixed = content.replace(/\uFEFF/g, '').replace(/\s+/g, '');

// Test regex with negative lookbehind
const regex = /(?:^|(?<![a-zA-Z0-9_]))(import|const|let|var|function|return|if|for|while|switch|new|from|as)(?=[a-zA-Z0-9_{])/g;
const fixed1 = fixed.replace(regex, (match, p1) => p1 + ' ');
console.log('Fixed:', fixed1.slice(0, 300));