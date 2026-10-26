import fs from 'fs';
import { transformSync } from 'esbuild';

// Read the original file
const content = fs.readFileSync('c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx', 'utf8');

// Try to parse the file with esbuild
try {
  const result = transformSync(content, {
    loader: 'jsx',
    sourcemap: false
  });
  console.log('esbuild parsed successfully');
  console.log('Output length:', result.outputText.length);
} catch (e) {
  console.log('esbuild error:', e.message);
  console.log('Stack:', e.stack);
}

// Also try with spaces removed
const contentNoSpaces = content.replace(/\s+/g, '');
try {
  const result = transformSync(contentNoSpaces, {
    loader: 'jsx',
    sourcemap: false
  });
  console.log('esbuild parsed without spaces successfully');
} catch (e) {
  console.log('esbuild error without spaces:', e.message);
}