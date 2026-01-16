// test-turf.js
// Script de prueba para Turf.js

// Esperar a que Turf esté disponible en window.turf
function testTurf() {
  if (!window.turf) {
    console.error('Turf.js no está cargado en window.turf');
    return;
  }
  const turf = window.turf;
  // Crear un polígono simple (cuadrado)
  const polygon = turf.polygon([[
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0],
    [0, 0]
  ]]);
  // Crear un punto dentro y otro fuera
  const inside = turf.point([5, 5]);
  const outside = turf.point([20, 20]);
  // Probar si los puntos están dentro del polígono
  console.log('¿El punto [5,5] está dentro?', turf.booleanPointInPolygon(inside, polygon)); // true
  console.log('¿El punto [20,20] está dentro?', turf.booleanPointInPolygon(outside, polygon)); // false
  // Calcular el centro del polígono
  const center = turf.center(polygon);
  console.log('Centro del polígono:', center.geometry.coordinates);
  // Calcular la distancia entre dos puntos
  const distance = turf.distance(inside, outside, { units: 'kilometers' });
  console.log('Distancia entre puntos:', distance, 'km');
}

// Ejecutar automáticamente si se carga en un entorno de navegador
if (typeof window !== 'undefined') {
  window.testTurf = testTurf;
  // Puedes llamar a testTurf() desde la consola para probar
}
