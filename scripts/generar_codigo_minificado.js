const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

const includeExtensions = new Set([
  '.html',
  '.css',
  '.scss',
  '.js',
  '.json',
  '.map'
]);

const excludedFiles = new Set([
  '.DS_Store'
]);

function minifyContent(content, ext) {
  const source = content.replace(/^\uFEFF/, '');
  switch (ext) {
    case '.html':
      return source
        .replace(/<!--([\s\S]*?)-->/g, '')
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();
    case '.css':
    case '.scss':
      return source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{};:,])\s*/g, '$1')
        .replace(/\s*!important/g, '!important')
        .trim();
    case '.js':
      return source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{};:,=()+\-*/<>])\s*/g, '$1')
        .trim();
    case '.json':
    case '.map':
      try {
        return JSON.stringify(JSON.parse(source));
      } catch (err) {
        return source.replace(/\s+/g, ' ').trim();
      }
    default:
      return source.replace(/\s+/g, ' ').trim();
  }
}

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return includeExtensions.has(ext);
}

function buildOutput() {
  const trackedFiles = execSync('git ls-files', {
    cwd: repoRoot,
    encoding: 'utf8'
  })
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);

  const outputs = [];

  trackedFiles
    .filter((file) => !excludedFiles.has(file))
    .filter((file) => isTextFile(file))
    .sort((a, b) => a.localeCompare(b))
    .forEach((file) => {
      const absolute = path.join(repoRoot, file);
      const ext = path.extname(file).toLowerCase();
      const raw = fs.readFileSync(absolute, 'utf8');
      const minified = minifyContent(raw, ext);
      outputs.push(`=== ${file} ===\n${minified}\n`);
    });

  const destination = path.join(repoRoot, 'codigo_minificado.txt');
  fs.writeFileSync(destination, outputs.join('\n'), 'utf8');
  return destination;
}

try {
  const outputPath = buildOutput();
  console.log(`Archivo generado: ${outputPath}`);
} catch (error) {
  console.error('Error al generar el archivo minificado:', error.message);
  process.exit(1);
}
