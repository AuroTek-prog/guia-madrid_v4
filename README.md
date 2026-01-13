# Guía Digital Inteligente para Huéspedes - Madrid (Aurotek Guest)

Proyecto frontend estático para guías personalizadas de apartamentos turísticos en Madrid. Multi-apartamento, multi-idioma, integración Raixer con detección dinámica de puertas, recomendaciones locales y soporte para partners comerciales (premium y básicos).

**Estado actual (enero 2026)**: 100% frontend estático (GitHub Pages), sin backend. Preparado para escalar a backend en el futuro.

## Características principales

- **Multi-apartamento**: Cada piso tiene su propia guía personalizada (WiFi, acceso, reglas, dispositivos, Raixer, recomendaciones).
- **Multi-idioma**: Español, inglés, francés, alemán (ampliable).
- **Raixer dinámico**: Detecta puertas reales vía API (`/devices/{id}/doors`), botones y LEDs solo para puertas existentes. Animación al abrir con éxito.
- **Recomendaciones locales**: Filtradas por zona del apartamento (con geolocalización vía Turf.js).
- **Partners comerciales**: 
  - Premium (`global: true`): Aparecen en **todas las guías** (destacados arriba).
  - Básicos (`global: false`): Solo en zonas seleccionadas.
- **Panel para gestor**: `gestor.html` → lista dinámica de apartamentos.
- **Panel para partners**: `partner-panel.html` → ve zonas cubiertas y número de pisos que reciben su info.
- **Responsive y moderno**: Tailwind CSS + Manrope + Material Symbols.
- **Despliegue**: GitHub Pages (estático, sin servidor).

## Estructura del proyecto
***📖 Resumen de las Mejoras Clave en la Estructura***
1. Nombre del Proyecto: guia-madrid_v3 → aurotek-guest-guide para reflejar su naturaleza multi-ciudad.
2. Datos Multi-ciudad:
- cities.json: Nuevo archivo maestro para definir las ciudades.
- {cityId}.json: Archivos individuales para el contenido turístico de cada ciudad (ej. barcelona.json).
- apartments.json, zones.json, partners.json: Ahora incluyen el campo cityId para asociar cada elemento a una ciudad.
3. JavaScript Mejorado:
- main.js: Es ahora el cerebro de la app, con la clase GeoDetector, gestión de caché y temas.
- recommendations.js y tourism.js: Son completamente dinámicos y se adaptan a la ciudad actual.
4. Assets Organizados: La carpeta assets/images/tourism ahora está subdividida por ciudad, manteniendo todo ordenado y escalable.


```
aurotek-guest-guide/                          # Renombrado para reflejar el alcance multi-ciudad
│
├── README.md                                   # Documentación actualizada del proyecto
│
├── index.html                                  # Página principal (selección idioma + navegación)
├── gestor.html                                 # Panel para gestores (lista de apartamentos)
├── partner-panel.html                          # Panel para partners (zonas y pisos cubiertos)
│
├── pages/
│   ├── essentials.html                         # Información esencial (WiFi, acceso, reglas, Raixer)
│   ├── devices.html                            # Dispositivos del apartamento
│   ├── recommendations.html                     # Recomendaciones locales (estáticas + partners dinámicos)
│   ├── tourism.html                            # Guía turística (DINÁMICA según ciudad del apartamento)
│   └── contact.html                            # Contacto y emergencias
│
├── js/
│   ├── main.js                                 # ⭐ Núcleo de la aplicación:
│   │                                             # - Estado global (appState)
│   │                                             # - Gestión de temas (claro/oscuro/auto)
│   │                                             # - Sistema de caché (CacheManager)
│   │                                             # - Clase GeoDetector (ciudades y zonas con Turf.js)
│   │                                             # - Funciones globales (t(), safeText(), copyToClipboard(), etc.)
│   │                                             # - Lógica de inicialización
│   ├── index.js                                 # Lógica de la página principal
│   ├── essentials.js                            # Lógica de esenciales (Raixer dinámico)
│   ├── recommendations.js                       # ⭐ Recomendaciones mejoradas:
│   │                                             # - Usa GeoDetector para filtrar por ciudad y zona
│   │                                             # - Gestión de partners (top, premium, básicos)
│   │                                             # - Filtrado por categoría
│   ├── tourism.js                               # ⭐ Guía turística multi-ciudad:
│   │                                             # - Carga datos dinámicamente (madrid.json, barcelona.json, etc.)
│   │                                             # - Renderiza contenido según la ciudad del apartamento
│   ├── devices.js                               # Lógica de dispositivos
│   └── contact.js                               # Lógica de contacto
│
├── data/
│   ├── apartments.json                          # ⭐ Apartamentos (AHORA CON CAMPO `cityId`)
│   ├── cities.json                              # 🆕 Información de ciudades (polígonos, nombre, etc.)
│   ├── zones.json                               # ⭐ Zonas (AHORA CON CAMPO `cityId` para multi-ciudad)
│   ├── partners.json                            # ⭐ Partners (AHORA CON CAMPO `cityId`)
│   ├── madrid.json                              # 🆕 Contenido turístico específico de Madrid
│   ├── barcelona.json                           # 🆕 Contenido turístico específico de Barcelona
│   ├── valencia.json                            # 🆕 Contenido turístico específico de Valencia
│   ├── es.json                                  # Traducciones español (con claves de todas las ciudades)
│   ├── en.json                                  # Traducciones inglés
│   ├── fr.json                                  # Traducciones francés
│   └── de.json                                  # Traducciones alemán
│
├── assets/
│   └── images/
│       ├── apartments/                          # Fotos por apartamento (portada, acceso, host)
│       │   ├── madrid-sol-101/
│       │   ├── barcelona-gotic-205/
│       │   └── valencia-beach-301/
│       ├── partners/                            # Fotos de locales comerciales
│       │   ├── rest-001/
│       │   └── shop-045/
│       └── tourism/                             # 🆕 Estructura por ciudad para turismo
│           ├── madrid/
│           │   ├── madrid-skyline.jpg           # Imagen de héroe
│           │   ├── royal-palace.jpg
│           │   └── prado-museum.jpg
│           ├── barcelona/
│           │   ├── barcelona-skyline.jpg        # Imagen de héroe
│           │   ├── sagrada-familia.jpg
│           │   └── park-guell.jpg
│           └── valencia/
│               ├── valencia-skyline.jpg         # Imagen de héroe
│               ├── city-arts-sciences.jpg
│               └── valencia-cathedral.jpg
│
└── css/
    └── styles.css                               # Estilos personalizados (si hay)
```

## Cómo añadir un nuevo apartamento (para gestores)

1. Crea carpeta: `assets/images/apartments/nuevo-slug/`
2. Sube fotos: `portada.jpg` (obligatorio), `acceso.jpg` (opcional)
3. Edita `data/apartments.json`:
   - Copia un bloque existente
   - Cambia clave a `"nuevo-slug"`
   - Actualiza `name`, `address`, `lat`, `lng`, `zone`, `wifi`, `access`, `raixerDevices.deviceId`, etc.
4. Commit y push → ¡la guía y `gestor.html` se actualizan automáticamente!

**Ejemplo enlace**: `https://tu-usuario.github.io/guia-madrid_v3/?apartment=nuevo-slug`

## Cómo añadir un nuevo partner comercial (para locales)

1. Crea carpeta: `assets/images/partners/nuevo-id/`
2. Sube foto: `portada.jpg`
3. Edita `data/partners.json`:
   - Copia un bloque existente
   - Cambia `id` único (ej. "rest-006")
   - Actualiza `name`, `description`, `image`, `lat`, `lng`, `zones`, `categoryKey`
   - Si quieres que aparezca **en TODAS las guías** → `"global": true` (plan premium)
   - Si solo en zonas específicas → `"global": false` y lista de `zones`
   - Set `active: true`
4. Commit y push → aparece automáticamente en recomendaciones de los pisos correspondientes.

**Ejemplo enlace panel partners**: `https://tu-usuario.github.io/guia-madrid_v3/partner-panel.html`

## Funciones y lógica importantes

- **Estado global** (`appState` en `main.js`): `apartmentId`, `lang`, `apartmentData`, `translations`.
- **Traducción** (`t(key)`): Fallback a `[key]` si no cargan traducciones.
- **Navegación** (`setupBottomNavigation`): Rutas absolutas con `window.ROOT_PATH` (evita 404 en GitHub Pages).
- **Detección de zona** (`getApartmentZone` en `main.js`): Usa Turf.js + `zones.json` + coordenadas del apartamento.
- **Raixer dinámico** (`essentials.js`): GET `/devices/{id}/doors` → botones/LEDs solo para puertas reales.
- **Recomendaciones + partners** (`recommendations.js`):
  - Filtro superior siempre visible (categorías por defecto).
  - Premium (`global: true`) → sección "Recomendaciones Premium" (arriba).
  - Básicos → "Ofertas locales" (filtrados por zona).
  - Fallback visual si no hay contenido.

## Tecnologías

- HTML + Tailwind CSS (CDN)
- JavaScript vanilla (sin frameworks pesados)
- Fetch API para datos
- Material Symbols (Google Icons)
- Leaflet + Turf.js (geolocalización frontend)
- GitHub Pages (despliegue gratuito y automático)

## Futuras mejoras planeadas

- Backend (Fastify + PostgreSQL) → Raixer seguro (key oculta), panel de gestión real, pagos Stripe para partners.
- Mapa interactivo en recomendaciones (marcadores de partners).
- Recomendaciones dinámicas por distancia real.
- Estadísticas para gestores y partners.

## Licencia

MIT License – libre para uso personal y comercial.

¡Disfruta de tu estancia en Madrid! 🏙️✨

Creado con ❤️ por Aurotek – 2026

**Explicación detallada de Turf.js** (versión 2025–2026)

**Turf.js** es una biblioteca JavaScript **open-source** extremadamente popular y ligera para realizar **operaciones geoespaciales** directamente en el navegador o en Node.js. Es la versión JavaScript del ecosistema **Turf** (originalmente escrito en JavaScript, pero con equivalentes en otros lenguajes).

Es la herramienta estándar cuando quieres hacer cálculos geográficos **sin depender de un servidor** (como PostGIS, GeoServer, etc.), lo que la hace perfecta para proyectos frontend estáticos (GitHub Pages, Vercel, Netlify, etc.), PWAs, mapas interactivos y aplicaciones móviles.

### 1. ¿Qué puedes hacer con Turf.js? (principales funcionalidades)

| Categoría                  | Ejemplos de funciones más usadas                                                                 | Uso típico en proyectos como el tuyo |
|----------------------------|--------------------------------------------------------------------------------------------------|--------------------------------------|
| **Geometría básica**       | `turf.point([lng, lat])`, `turf.lineString()`, `turf.polygon()`                                 | Crear puntos o polígonos desde coordenadas |
| **Análisis espacial**      | `turf.booleanPointInPolygon(point, polygon)`                                                     | ¿Está este apartamento dentro de esta zona? (tu caso principal) |
| **Medidas**                | `turf.distance(pointA, pointB, {units: 'kilometers'})`, `turf.bearing()`, `turf.area()`        | Calcular distancia real entre apartamento y partner |
| **Transformaciones**       | `turf.buffer(polygon, radius, {units: 'meters'})`, `turf.centroid()`, `turf.bbox()`            | Crear zonas de influencia (radio 500 m alrededor de un local) |
| **Operaciones booleanas**  | `turf.booleanContains()`, `turf.booleanCrosses()`, `turf.booleanOverlap()`                      | Comprobar intersecciones entre zonas |
| **Agregación**             | `turf.collect()`, `turf.tag()`                                                                   | Asignar propiedades (ej. zona) a múltiples puntos |
| **Simplificación**         | `turf.simplify(geometry, {tolerance: 0.0001})`                                                  | Reducir complejidad de polígonos grandes |
| **Transformación de coordenadas** | `turf.transformRotate()`, `turf.transformScale()`                                          | Rotar o escalar geometrías (menos común) |

### 2. Por qué Turf.js es ideal para tu proyecto actual (guía Madrid)

- **Frontend puro** → 0 backend, 0 servidor → GitHub Pages lo soporta perfectamente.
- **Tamaño pequeño** → ~120 KB minificado → carga rápida en móvil.
- **No requiere API externa** → todo se calcula en cliente (sin claves, sin latencia).
- **Compatible con GeoJSON** → `zones.json` y coordenadas de apartamentos son GeoJSON puro.
- **Muy usado** → comunidad enorme, documentación excelente, actualizaciones constantes.

### 3. Ejemplo práctico que usas en tu proyecto (detección de zona)

Este es el código que ya tienes en `main.js` y que funciona muy bien:

```javascript
async function getApartmentZone(apartment) {
    if (!apartment?.lat || !apartment?.lng) return null;

    const lat = Number(apartment.lat);
    const lng = Number(apartment.lng);
    if (isNaN(lat) || isNaN(lng)) return null;

    try {
        const zonesRes = await fetch(`${window.ROOT_PATH}data/zones.json`);
        const zones = await zonesRes.json();

        const point = turf.point([lng, lat]);

        for (const zone of zones) {
            let coords = zone.polygon.map(p => [Number(p[0]), Number(p[1])]);
            if (coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1]) {
                coords = [...coords, coords[0]];
            }
            const polygon = turf.polygon([coords]);
            if (turf.booleanPointInPolygon(point, polygon)) {
                return zone;
            }
        }
        return null;
    } catch (err) {
        console.error('Error en getApartmentZone:', err);
        return null;
    }
}
```

### 4. Cómo mejorar aún más la detección de zona (si sigues teniendo problemas)

**Problema común**: Algunas coordenadas están justo en el borde o los polígonos son demasiado simples.

**Mejoras rápidas**:

```javascript
// Versión mejorada con tolerancia y logging
async function getApartmentZone(apartment, tolerance = 0.0001) {
    if (!apartment?.lat || !apartment?.lng) return null;

    const lat = Number(apartment.lat);
    const lng = Number(apartment.lng);
    if (isNaN(lat) || isNaN(lng)) return null;

    try {
        const zonesRes = await fetch(`${window.ROOT_PATH}data/zones.json`);
        const zones = await zonesRes.json();

        const point = turf.point([lng, lat]);

        for (const zone of zones) {
            if (!zone?.polygon?.length || zone.polygon.length < 3) continue;

            let coords = zone.polygon.map(p => [Number(p[0]), Number(p[1])]);
            const first = coords[0];
            const last = coords[coords.length - 1];
            if (Math.abs(first[0] - last[0]) > tolerance || Math.abs(first[1] - last[1]) > tolerance) {
                coords = [...coords, first];
            }

            const polygon = turf.polygon([coords]);
            if (turf.booleanPointInPolygon(point, polygon)) {
                console.log(`Zona detectada: ${zone.name} (id: ${zone.id})`);
                return zone;
            }
        }

        console.log('No se encontró zona para:', { lat, lng });
        return null;
    } catch (err) {
        console.error('Error cargando/detectando zona:', err);
        return null;
    }
}
```

### Resumen: ¿Qué hace Turf.js en tu proyecto?

- Convierte coordenadas (`lat`, `lng`) en un `point`.
- Convierte polígonos de `zones.json` en `polygon`.
- Comprueba si el punto está dentro del polígono → asigna la zona al apartamento.
- Permite filtrar partners solo de esa zona (o globales).

