const fs = require('fs');
const path = require('path');

// Configuración
const exts = ['.js', '.html'];
const rootDirs = ['js', 'pages'];
const todos = [];
const unusedFunctions = [];
const undefinedCalls = [];
const undefinedVars = [];
const definedFunctions = new Set();
const calledFunctions = new Set();
const declaredVars = new Set();
const usedVars = new Set();

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (exts.some(e => fullPath.endsWith(e))) {
      analyzeFile(fullPath);
    }
  });
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Buscar TODO y FIXME
  const todoRegex = /(TODO|FIXME|Pendiente|Por definir|Por mejorar)/gi;
  let match;
  while ((match = todoRegex.exec(content)) !== null) {
    todos.push({ file: filePath, line: getLine(content, match.index), text: match[0] });
  }
  // Buscar funciones definidas
  const funcDefRegex = /function\s+(\w+)/g;
  while ((match = funcDefRegex.exec(content)) !== null) {
    definedFunctions.add(match[1]);
  }
  // Buscar llamadas a funciones
  const funcCallRegex = /(\w+)\s*\(/g;
  while ((match = funcCallRegex.exec(content)) !== null) {
    calledFunctions.add(match[1]);
  }
  // Buscar variables declaradas
  const varDeclRegex = /(var|let|const)\s+(\w+)/g;
  while ((match = varDeclRegex.exec(content)) !== null) {
    declaredVars.add(match[2]);
  }
  // Buscar variables usadas
  const varUseRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  while ((match = varUseRegex.exec(content)) !== null) {
    usedVars.add(match[1]);
  }
}

function getLine(content, idx) {
  return content.substring(0, idx).split('\n').length;
}

// Analizar carpetas
rootDirs.forEach(d => walk(path.join(__dirname, d)));

// Funciones definidas pero nunca usadas
definedFunctions.forEach(fn => {
  if (!calledFunctions.has(fn)) unusedFunctions.push(fn);
});
// Funciones llamadas pero no definidas
calledFunctions.forEach(fn => {
  if (!definedFunctions.has(fn)) undefinedCalls.push(fn);
});
// Variables usadas pero no declaradas
usedVars.forEach(v => {
  if (!declaredVars.has(v) && !definedFunctions.has(v)) undefinedVars.push(v);
});

console.log('--- MEJORAS Y ADVERTENCIAS DEL PROYECTO ---');
if (todos.length) {
  console.log('TODOs y FIXMEs pendientes:');
  todos.forEach(t => console.log(`  ${t.file}:${t.line} -> ${t.text}`));
} else {
  console.log('No se encontraron TODOs/FIXMEs.');
}
if (unusedFunctions.length) {
  console.log('Funciones definidas pero nunca usadas:');
  unusedFunctions.forEach(f => console.log(`  ${f}`));
} else {
  console.log('No hay funciones sin usar.');
}
if (undefinedCalls.length) {
  console.log('Funciones llamadas pero no definidas:');
  undefinedCalls.forEach(f => console.log(`  ${f}`));
} else {
  console.log('No hay llamadas a funciones indefinidas.');
}
if (undefinedVars.length) {
  console.log('Variables usadas pero no declaradas:');
  undefinedVars.forEach(v => console.log(`  ${v}`));
} else {
  console.log('No hay variables usadas sin declarar.');
}
console.log('-------------------------------------------');

// Filtrar y mostrar solo problemas importantes
console.log('--- RESUMEN DE PROBLEMAS IMPORTANTES ---');
if (todos.length) {
  console.log('TODOs/FIXMEs pendientes:');
  todos.forEach(t => console.log(`  ${t.file}:${t.line} -> ${t.text}`));
}
if (unusedFunctions.length) {
  console.log('Funciones definidas pero nunca usadas:');
  unusedFunctions.forEach(f => console.log(`  ${f}`));
}
if (undefinedCalls.length) {
  console.log('Funciones llamadas pero no definidas:');
  undefinedCalls.forEach(f => console.log(`  ${f}`));
}
if (undefinedVars.length) {
  console.log('Variables usadas pero no declaradas:');
  undefinedVars.forEach(v => console.log(`  ${v}`));
}
if (!todos.length && !unusedFunctions.length && !undefinedCalls.length && !undefinedVars.length) {
  console.log('No se detectaron problemas importantes. ¡Buen trabajo!');
}
console.log('-------------------------------------------');
