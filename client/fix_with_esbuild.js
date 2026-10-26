import esbuild from 'esbuild';
import fs from 'fs';

async function fixFile() {
  const filePath = 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx';

  try {
    const result = await esbuild.build({
      entryPoints: [filePath],
      outfile: 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader_fixed.jsx',
      loader: { '.jsx': 'jsx' },
      write: false,
      minify: false,
      sourcemap: false,
    });

    console.log('Build result:', JSON.stringify(result, null, 2).substring(0, 500));

    // Write the fixed file
    fs.writeFileSync('c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader_fixed.jsx', result.outputFiles[0].text, 'utf8');
    console.log('Fixed file written');
  } catch (err) {
    console.log('Error:', err.message);
    console.log('Details:', err.stack);
  }
}

fixFile();