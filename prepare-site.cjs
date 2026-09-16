const fs = require('node:fs/promises');
const path = require('node:path');

async function main() {
  const keys=['floor','vanity','bathWall','door','towel','chair','ceiling','mirror'];
  const files = ['index.html','styles.css','panorama.css','app.js','raster-masks.js','panorama.js',
    'assets/bathroom-panorama.png','assets/three.min.js',
    ...keys.map(key=>`assets/masks/${key}.png`),
    ...keys.map(key=>`assets/variants/${key}-original-thumb.jpg`),
    ...[...keys,'room'].flatMap(key=>['classic','modern'].flatMap(style=>[`assets/variants/${key}-${style}.png`,`assets/variants/${key}-${style}-thumb.jpg`]))];
  // Check inputs before replacing the previous deployment output.
  await Promise.all(files.map(file => fs.access(path.join(__dirname, file))));
  await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
  for (const file of files) {
    const destination=path.join(__dirname,'dist',file);
    await fs.mkdir(path.dirname(destination),{recursive:true});
    await fs.copyFile(path.join(__dirname,file),destination);
  }
  console.log(`Prepared ${files.length} public files.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
