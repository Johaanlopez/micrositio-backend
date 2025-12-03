const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'GoogleAuthSetup.module.css');

// Leer el archivo
const content = fs.readFileSync(cssPath, 'utf8');

// Dividir en líneas
const lines = content.split('\n');

// Tomar solo las primeras 622 líneas (índice 0-621)
const cleanedLines = lines.slice(0, 622);

// Escribir de vuelta
fs.writeFileSync(cssPath, cleanedLines.join('\n'), 'utf8');

console.log('✅ Archivo CSS limpiado correctamente');
console.log(`📊 Líneas totales: ${lines.length} → ${cleanedLines.length}`);
