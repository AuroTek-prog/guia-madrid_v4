// js/main.js - Versión MEJORADA con soporte multi-ciudad y optimizada (2026)

// ==============================
// Estado global mejorado
// ==============================
window.appState = {
    apartmentId: null,
    lang: 'es',
    apartmentData: null,
    translations: null,
    citiesData: null,
    zonesData: null,
    partnersData: null,
    currentCity: null,
    currentZone: null,
    theme: 'auto', // 'light', 'dark', 'auto'
    initialized: false
};

// ==============================
// Cache manager
// ==============================
const CacheManager = {
    cache: {},
    expiry: {},
    
    set(key, value, ttl = 3600000) { // TTL por defecto: 1 hora
        this.cache[key] = value;
        this.expiry[key] = Date.now() + ttl;
    },
    
    get(key) {
        if (!this.cache[key] || !this.expiry[key] || Date.now() > this.expiry[key]) {
            delete this.cache[key];
            delete this.expiry[key];
            return null;
        }
        return this.cache[key];
    },
    
    clear(key) {
        if (key) {
            delete this.cache[key];
            delete this.expiry[key];
        } else {
            this.cache = {};
            this.expiry = {};
        }
    }
};

// ==============================
// Traducción global con fallback mejorado
// ==============================
window.t = function(key, fallback = null) {
    if (!window.appState?.translations) return fallback || `[${key}]`;
    
    const result = key.split('.').reduce((obj, k) => obj?.[k], window.appState.translations);
    return result !== undefined ? result : (fallback || `[${key}]`);
};

// ==============================
// Helper global para texto seguro mejorado
// ==============================
window.safeText = function(id, value, fallback = '') {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`⚠️ Elemento #${id} no encontrado`);
        return;
    }
    
    if (value !== undefined && value !== null) {
        el.textContent = value;
    } else if (fallback) {
        el.textContent = fallback;
    }
};

// ==============================
// Helper global para HTML seguro
// ==============================
window.safeHTML = function(id, html, fallback = '') {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`⚠️ Elemento #${id} no encontrado`);
        return;
    }
    
    if (html !== undefined && html !== null) {
        el.innerHTML = html;
    } else if (fallback) {
        el.innerHTML = fallback;
    }
};

// ==============================
// Copiar al portapapeles mejorado
// ==============================
window.copyToClipboard = function(text) {
    if (!navigator.clipboard) {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification(t('common.copied') || 'Copiado');
        return;
    }
    
    navigator.clipboard.writeText(text)
        .then(() => showNotification(t('common.copied') || 'Copiado'))
        .catch(err => {
            console.error('Error al copiar:', err);
            showNotification('Error al copiar');
        });
};

// ==============================
// Mostrar notificaciones mejorado
// ==============================
window.showNotification = function(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    
    // Estilos según tipo
    const typeStyles = {
        info: 'bg-blue-600',
        success: 'bg-green-600',
        warning: 'bg-yellow-600',
        error: 'bg-red-600'
    };
    
    notification.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 ${typeStyles[type] || typeStyles.info} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.opacity = '0', duration);
    setTimeout(() => notification.remove(), duration + 300);
};

// ==============================
// Volver atrás preservando params
// ==============================
window.goBack = function() {
    const params = new URLSearchParams(window.location.search);
    const apartmentId = params.get('apartment') || 'sol-101';
    const lang = params.get('lang') || 'es';
    window.location.href = `${window.ROOT_PATH}index.html?apartment=${encodeURIComponent(apartmentId)}&lang=${encodeURIComponent(lang)}`;
};

// ==============================
// Cambiar idioma (preserva apt)
// ==============================
window.changeLanguage = function(newLang) {
    const apartmentId = window.appState.apartmentId || 'sol-101';
    const lang = newLang || window.appState.lang || 'es';
    window.location.href = `${window.ROOT_PATH}index.html?apartment=${encodeURIComponent(apartmentId)}&lang=${encodeURIComponent(lang)}`;
};

// ==============================
// Gestión de temas
// ==============================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'auto';
    window.appState.theme = savedTheme;
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
}

function toggleTheme() {
    const currentTheme = window.appState.theme;
    const newTheme = currentTheme === 'light' ? 'dark' : (currentTheme === 'dark' ? 'auto' : 'light');
    
    window.appState.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    
    showNotification(`Tema: ${newTheme === 'auto' ? 'Automático' : (newTheme === 'dark' ? 'Oscuro' : 'Claro')}`, 'info');
}

// ==============================
// Detector de zonas y ciudades mejorado
// ==============================
class GeoDetector {
    constructor() {
        this.initialized = false;
    }
    
    async initialize() {
        if (this.initialized) return true;
        
        try {
            const timestamp = Date.now();
            
            // Intentar obtener desde caché primero
            const cachedCities = CacheManager.get('citiesData');
            const cachedZones = CacheManager.get('zonesData');
            const cachedPartners = CacheManager.get('partnersData');
            
            if (cachedCities && cachedZones && cachedPartners) {
                window.appState.citiesData = cachedCities;
                window.appState.zonesData = cachedZones;
                window.appState.partnersData = cachedPartners;
                this.initialized = true;
                return true;
            }
            
            // Cargar datos en paralelo si no están en caché
            const [citiesRes, zonesRes, partnersRes] = await Promise.all([
                fetch(`${window.ROOT_PATH}data/cities.json?t=${timestamp}`, { cache: 'no-store' }),
                fetch(`${window.ROOT_PATH}data/zones.json?t=${timestamp}`, { cache: 'no-store' }),
                fetch(`${window.ROOT_PATH}data/partners.json?t=${timestamp}`, { cache: 'no-store' })
            ]);
            
            if (!citiesRes.ok || !zonesRes.ok || !partnersRes.ok) {
                throw new Error('No se pudieron cargar los datos geográficos');
            }
            
            window.appState.citiesData = await citiesRes.json();
            window.appState.zonesData = await zonesRes.json();
            window.appState.partnersData = await partnersRes.json();
            
            // Guardar en caché
            CacheManager.set('citiesData', window.appState.citiesData);
            CacheManager.set('zonesData', window.appState.zonesData);
            CacheManager.set('partnersData', window.appState.partnersData);
            
            this.initialized = true;
            console.log('Datos geográficos cargados correctamente');
            return true;
        } catch (error) {
            console.error('Error inicializando GeoDetector:', error);
            return false;
        }
    }
    
    async detectCity(lat, lng) {
        await this.initialize();
        
        if (!window.appState.citiesData) {
            console.error('No hay datos de ciudades disponibles');
            return null;
        }

        const point = turf.point([lng, lat]);
        
        // Buscar en qué ciudad está el punto
        for (const city of window.appState.citiesData) {
            if (!city?.polygon?.length || city.polygon.length < 3) continue;
            
            let coords = city.polygon.map(p => [Number(p[0]), Number(p[1])]);
            
            // Asegurar que el polígono está cerrado
            const first = coords[0];
            const last = coords[coords.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
                coords = [...coords, first];
            }
            
            const polygon = turf.polygon([coords]);
            if (turf.booleanPointInPolygon(point, polygon)) {
                console.log(`Ciudad detectada: ${city.name} (id: ${city.id})`);
                return city;
            }
        }
        
        return null;
    }
    
    async detectZone(lat, lng, cityId = null, tolerance = 0.0001) {
        await this.initialize();
        
        if (!window.appState.zonesData) {
            console.error('No hay datos de zonas disponibles');
            return null;
        }

        const point = turf.point([lng, lat]);
        
        // Filtrar zonas por ciudad si se especifica
        const zonesToCheck = cityId 
            ? window.appState.zonesData.filter(zone => zone.cityId === cityId)
            : window.appState.zonesData;

        // Buscar en qué zona está el punto
        for (const zone of zonesToCheck) {
            if (!zone?.polygon?.length || zone.polygon.length < 3) continue;
            
            let coords = zone.polygon.map(p => [Number(p[0]), Number(p[1])]).filter(c => !c.some(isNaN));
            if (coords.length < 3) continue;
            
            // Asegurar que el polígono está cerrado
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
        
        // Si no está en ninguna zona, intentar asignar la más cercana
        let closestZone = null;
        let minDistance = Infinity;
        
        for (const zone of zonesToCheck) {
            if (!zone?.polygon?.length || zone.polygon.length < 3) continue;
            
            const center = turf.center(turf.polygon([zone.polygon]));
            const distance = turf.distance(point, center, { units: 'kilometers' });
            
            if (distance < minDistance) {
                minDistance = distance;
                closestZone = zone;
            }
        }
        
        if (closestZone) {
            console.log(`Zona más cercana asignada: ${closestZone.name} (distancia: ${minDistance.toFixed(2)} km)`);
        }
        
        return closestZone;
    }
    
    async detectLocation(lat, lng, cityId = null) {
        await this.initialize();
        
        // Detectar ciudad
        let city = null;
        if (cityId) {
            city = window.appState.citiesData?.find(c => c.id === cityId);
        }
        
        if (!city) {
            city = await this.detectCity(lat, lng);
        }
        
        // Detectar zona
        const zone = await this.detectZone(lat, lng, city?.id);
        
        return { city, zone };
    }
}

// Instancia global del detector
window.geoDetector = new GeoDetector();

// ======================================================
// Navegación inferior (RUTAS ABSOLUTAS DESDE LA RAÍZ)
// ======================================================
window.setupBottomNavigation = function(apartmentId, lang) {
    const baseUrl = `?apartment=${encodeURIComponent(apartmentId)}&lang=${encodeURIComponent(lang)}`;
    const root = window.ROOT_PATH || './';
    const navMap = [
        { id: 'nav-home', href: `${root}index.html${baseUrl}`, key: 'navigation.nav_home' },
        { id: 'nav-devices', href: `${root}pages/devices.html${baseUrl}`, key: 'navigation.devices_title' },
        { id: 'nav-recommendations', href: `${root}pages/recommendations.html${baseUrl}`, key: 'navigation.recommendations_title' },
        { id: 'nav-tourism', href: `${root}pages/tourism.html${baseUrl}`, key: 'navigation.tourism_title' },
        { id: 'nav-contact', href: `${root}pages/contact.html${baseUrl}`, key: 'navigation.contact_title' },
        { id: 'nav-essentials', href: `${root}pages/essentials.html${baseUrl}`, key: 'navigation.essentials_title' }
    ];

    navMap.forEach(({ id, href, key }) => {
        const link = document.getElementById(id);
        if (link) {
            link.href = href;
            const span = link.querySelector('span:last-child');
            if (span) span.textContent = t(key) || key;
        }
    });
    
    console.log('Navegación inferior configurada');
};

// ==============================
// Obtener información completa del apartamento
// ==============================
async function getApartmentInfo(apartmentId) {
    try {
        const apartment = window.appState.apartmentData?.[apartmentId];
        if (!apartment) {
            console.error(`Apartamento "${apartmentId}" no encontrado`);
            return null;
        }
        
        // Detectar ciudad y zona
        const { city, zone } = await window.geoDetector.detectLocation(apartment.lat, apartment.lng, apartment.cityId);
        
        return {
            ...apartment,
            city,
            zone
        };
    } catch (error) {
        console.error('Error obteniendo información del apartamento:', error);
        return null;
    }
}

// ==============================
// Inicialización principal mejorada
// ==============================
async function initializeApp() {
    const params = new URLSearchParams(window.location.search);
    window.appState.apartmentId = params.get('apartment') || 'sol-101';
    window.appState.lang = params.get('lang') || 'es';
    
    // Inicializar tema
    initTheme();
    
    // Escuchar cambios en el sistema de temas
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (window.appState.theme === 'auto') {
            applyTheme('auto');
        }
    });

    try {
        // Intentar obtener datos desde caché primero
        const cachedApartments = CacheManager.get('apartmentsData');
        const cachedTranslations = CacheManager.get(`translations_${window.appState.lang}`);
        
        if (cachedApartments && cachedTranslations) {
            window.appState.apartmentData = cachedApartments;
            window.appState.translations = cachedTranslations;
        } else {
            // Cargar datos si no están en caché
            const [apartmentRes, translationsRes] = await Promise.all([
                fetch(`${window.ROOT_PATH}data/apartments.json`),
                fetch(`${window.ROOT_PATH}data/${window.appState.lang}.json`)
            ]);

            if (!apartmentRes.ok || !translationsRes.ok) throw new Error('Error cargando datos');

            window.appState.apartmentData = await apartmentRes.json();
            window.appState.translations = await translationsRes.json();
            
            // Guardar en caché
            CacheManager.set('apartmentsData', window.appState.apartmentData);
            CacheManager.set(`translations_${window.appState.lang}`, window.appState.translations);
        }

        // Verificar que el apartamento existe
        if (!window.appState.apartmentData[window.appState.apartmentId]) {
            console.warn(`Apartamento "${window.appState.apartmentId}" no encontrado → usando default`);
            window.appState.apartmentId = 'sol-101';
            if (!window.appState.apartmentData['sol-101']) throw new Error('Default sol-101 no existe');
        }
        
        // Inicializar detector geográfico
        await window.geoDetector.initialize();
        
        // Obtener información completa del apartamento
        const apartmentInfo = await getApartmentInfo(window.appState.apartmentId);
        if (apartmentInfo) {
            window.appState.currentCity = apartmentInfo.city;
            window.appState.currentZone = apartmentInfo.zone;
        }

        document.documentElement.lang = window.appState.lang;
        window.appState.initialized = true;

        // Esperar a que renderPage esté disponible
        const wait = setInterval(() => {
            if (typeof renderPage === 'function') {
                clearInterval(wait);
                renderPage();
            }
        }, 100);
        
        // Timeout por si renderPage nunca se define
        setTimeout(() => {
            clearInterval(wait);
            if (!window.appState.initialized) {
                console.error('Timeout esperando a renderPage');
            }
        }, 5000);

    } catch (error) {
        console.error('Error inicializando app:', error);
        showErrorPage(error);
    }
}

// ==============================
// Página de error mejorada
// ==============================
function showErrorPage(error) {
    document.body.innerHTML = `
        <div class="p-8 text-center bg-white dark:bg-gray-900 min-h-screen flex flex-col items-center justify-center">
            <div class="max-w-md mx-auto">
                <span class="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Error al cargar la guía</h1>
                <p class="text-gray-600 dark:text-gray-300 mb-6">
                    ${error.message || 'Parece que hay un problema con los datos o la conexión.'}
                </p>
                <div class="space-y-3">
                    <button onclick="location.reload()" class="w-full block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Reintentar
                    </button>
                    <a href="${window.ROOT_PATH}index.html?apartment=${encodeURIComponent(window.appState.apartmentId || 'sol-101')}&lang=${encodeURIComponent(window.appState.lang || 'es')}"
                       class="w-full block bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        Volver al inicio
                    </a>
                </div>
            </div>
        </div>`;
}

// ==============================
// Función de depuración
// ==============================
window.debugAppState = function() {
    console.log('Estado de la aplicación:', window.appState);
    console.log('Cache:', CacheManager.cache);
    return window.appState;
};

// ==============================
// Limpiar caché
// ==============================
window.clearAppCache = function(key) {
    CacheManager.clear(key);
    console.log(key ? `Cache "${key}" limpiado` : 'Toda la caché limpiada');
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeApp);

// Exponer funciones globalmente para facilitar depuración
window.getApartmentInfo = getApartmentInfo;
window.toggleTheme = toggleTheme;