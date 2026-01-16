const fs = require('fs');
const path = require('path');

// Ruta al archivo de idioma
const langFile = path.join(__dirname, 'data', 'es.json');
const langData = JSON.parse(fs.readFileSync(langFile, 'utf8'));

// Recoge todas las claves del archivo de idioma (recursivo)
function collectKeys(obj, prefix = '') {
  let keys = [];
  for (const k in obj) {
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      keys = keys.concat(collectKeys(obj[k], prefix ? `${prefix}.${k}` : k));
    } else {
      keys.push(prefix ? `${prefix}.${k}` : k);
    }
  }
  return keys;
}
const definedKeys = new Set(collectKeys(langData));

// Busca claves usadas en el proyecto
const projectDirs = [
  'js', 'pages'
];
const projectFiles = [
  'index.html'
];
let usedKeys = new Set();

function searchKeysInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /['"`]([a-zA-Z0-9_.]+\.[a-zA-Z0-9_]+)['"`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    usedKeys.add(match[1]);
  }
}

// Recorrer carpetas del proyecto
function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
      searchKeysInFile(fullPath);
    }
  });
}
projectDirs.forEach(p => walk(path.join(__dirname, p)));
projectFiles.forEach(f => searchKeysInFile(path.join(__dirname, f)));

// Mostrar claves usadas pero no definidas
const missing = [...usedKeys].filter(k => !definedKeys.has(k));

// Mejorar: mostrar coincidencias parciales si la clave existe en algún nivel
function keyExistsPartial(key) {
  // Ejemplo: index.html existe como es.json["essentials"]["index.html"]
  const parts = key.split('.');
  let obj = langData;
  for (let i = 0; i < parts.length; i++) {
    if (obj && typeof obj === 'object' && parts[i] in obj) {
      obj = obj[parts[i]];
    } else {
      // Si la última parte existe como clave en el objeto actual
      if (i === parts.length - 1 && obj && typeof obj === 'object' && Object.keys(obj).includes(key)) {
        return true;
      }
      return false;
    }
  }
  return true;
}

const reallyMissing = missing.filter(k => !keyExistsPartial(k));
console.log('Claves realmente faltantes en es.json:');
console.log(reallyMissing);