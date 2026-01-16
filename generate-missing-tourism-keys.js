// generate-missing-tourism-keys.js
// Script para detectar y sugerir claves de traducción faltantes para lugares de barcelona y valencia
const fs = require('fs');
const path = require('path');

const cities = ['barcelona', 'valencia'];
const langFiles = ['es.json', 'en.json', 'fr.json', 'de.json'];
const dataDir = path.join(__dirname, 'data');

// Cargar claves existentes en cada idioma
const langData = {};
for (const lang of langFiles) {
  const file = path.join(dataDir, lang);
  langData[lang] = JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Extraer claves de lugares de cada ciudad
let missing = {};
for (const city of cities) {
  const cityData = JSON.parse(fs.readFileSync(path.join(dataDir, city + '.json'), 'utf8'));
  for (const exp of cityData.experiences) {
    const nameKey = exp.nameKey;
    const descKey = exp.descriptionKey;
    for (const lang of langFiles) {
      const places = langData[lang].tourism && langData[lang].tourism.places ? langData[lang].tourism.places : {};
      if (!places[nameKey]) {
        if (!missing[lang]) missing[lang] = [];
        missing[lang].push(`${nameKey}`);
      }
      if (!places[descKey]) {
        if (!missing[lang]) missing[lang] = [];
        missing[lang].push(`${descKey}`);
      }
    }
  }
}

for (const lang of langFiles) {
  if (missing[lang] && missing[lang].length) {
    console.log(`\nFaltan en ${lang}:`);
    for (const k of missing[lang]) {
      if (k.endsWith('_name')) {
        console.log(`  "${k}": "Nombre de lugar",`);
      } else if (k.endsWith('_desc')) {
        console.log(`  "${k}": "Descripción del lugar.",`);
      }
    }
  }
}
