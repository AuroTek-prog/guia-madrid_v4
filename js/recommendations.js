// js/recommendations.js - Versión MEJORADA con detección de zonas y ciudades optimizada

let currentFilter = 'all'; // Filtro activo por defecto

// Categorías por defecto (siempre visibles, sin "experience")
const defaultCategories = [
    { icon: "grid_view", key: "all" },
    { icon: "restaurant", key: "eat" },
    { icon: "local_cafe", key: "drink" },
    { icon: "shopping_bag", key: "shop" },
    { icon: "directions_bus", key: "transit" }
];

// Detector de zonas y ciudades
class ZoneDetector {
    constructor() {
        this.zonesData = null;
        this.citiesData = null;
        this.partnersData = null;
        this.lastFetchTime = 0;
        this.cacheExpiry = 3600000; // 1 hora en milisegundos
    }

    async initialize() {
        try {
            const now = Date.now();
            
            // Solo recargar si los datos son antiguos o no existen
            if (!this.zonesData || !this.citiesData || !this.partnersData || (now - this.lastFetchTime) > this.cacheExpiry) {
                const timestamp = now;
                
                // Cargar datos en paralelo para mayor eficiencia
                const [zonesRes, citiesRes, partnersRes] = await Promise.all([
                    fetch(`${window.ROOT_PATH}data/zones.json?t=${timestamp}`, { cache: 'no-store' }),
                    fetch(`${window.ROOT_PATH}data/cities.json?t=${timestamp}`, { cache: 'no-store' }),
                    fetch(`${window.ROOT_PATH}data/partners.json?t=${timestamp}`, { cache: 'no-store' })
                ]);
                
                if (!zonesRes.ok || !citiesRes.ok || !partnersRes.ok) {
                    throw new Error('No se pudieron cargar los datos necesarios');
                }
                
                this.zonesData = await zonesRes.json();
                this.citiesData = await citiesRes.json();
                this.partnersData = await partnersRes.json();
                this.lastFetchTime = now;
                
                console.log('Datos de zonas, ciudades y partners cargados correctamente');
            }
            
            return true;
        } catch (error) {
            console.error('Error inicializando ZoneDetector:', error);
            return false;
        }
    }

    // Detecta la zona de un punto geográfico
    async detectZone(lat, lng, cityId = null) {
        await this.initialize();
        
        if (!this.zonesData) {
            console.error('No hay datos de zonas disponibles');
            return null;
        }

        const point = turf.point([lng, lat]);
        
        // Filtrar zonas por ciudad si se especifica
        const zonesToCheck = cityId 
            ? this.zonesData.filter(zone => zone.cityId === cityId)
            : this.zonesData;

        // Buscar en qué zona está el punto
        for (const zone of zonesToCheck) {
            if (!zone?.polygon?.length || zone.polygon.length < 3) continue;
            
            let coords = zone.polygon.map(p => [Number(p[0]), Number(p[1])]);
            
            // Asegurar que el polígono está cerrado
            const first = coords[0];
            const last = coords[coords.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
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

    // Detecta la ciudad de un punto geográfico
    async detectCity(lat, lng) {
        await this.initialize();
        
        if (!this.citiesData) {
            console.error('No hay datos de ciudades disponibles');
            return null;
        }

        const point = turf.point([lng, lat]);
        
        // Buscar en qué ciudad está el punto
        for (const city of this.citiesData) {
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

    // Obtiene partners filtrados por ciudad, zona y categoría
    async getFilteredPartners(cityId, zoneId, categoryFilter = 'all') {
        await this.initialize();
        
        if (!this.partnersData) {
            console.error('No hay datos de partners disponibles');
            return { top: [], premium: [], basic: [] };
        }

        // Filtrar por ciudad y estado activo
        const cityPartners = this.partnersData.filter(partner => 
            partner.active !== false && partner.cityId === cityId
        );
        
        // Filtrar por categoría si no es 'all'
        const filteredByCategory = categoryFilter === 'all' 
            ? cityPartners 
            : cityPartners.filter(partner => partner.categoryKey === categoryFilter);

        // Clasificar partners
        const topPartners = filteredByCategory.filter(p => p.isTop === true);
        const premiumPartners = filteredByCategory.filter(p => p.global === true && !p.isTop);
        const basicPartners = zoneId 
            ? filteredByCategory.filter(p => !p.global && !p.isTop && p.zones?.includes(zoneId))
            : filteredByCategory.filter(p => !p.global && !p.isTop);

        return {
            top: topPartners,
            premium: premiumPartners,
            basic: basicPartners
        };
    }
}

// Instancia global del detector
window.zoneDetector = new ZoneDetector();

// Función para obtener el partner-top del día (rotación diaria)
function getPartnerOfDay(partners) {
    if (!partners || partners.length === 0) return null;
    
    if (partners.length === 1) return partners[0];
    
    // Usar la fecha actual para determinar qué partner mostrar
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    const partnerIndex = dayOfYear % partners.length;
    
    console.log(`Partner-top del día: ${partners[partnerIndex].name} (índice ${partnerIndex} basado en día ${dayOfYear})`);
    return partners[partnerIndex];
}

// Función para obtener la información del apartamento con ciudad y zona
async function getApartmentInfo(apartmentId) {
    try {
        // Obtener datos del apartamento
        const apt = window.appState.apartmentData?.[apartmentId];
        if (!apt) {
            console.error('No hay datos del apartamento disponibles');
            return null;
        }

        // Detectar ciudad (primero intentar usar cityId del apartamento)
        let city = null;
        if (apt.cityId) {
            city = await window.zoneDetector.detectCity(apt.lat, apt.lng);
            // Verificar que la ciudad detectada coincide con la cityId del apartamento
            if (city && city.id !== apt.cityId) {
                console.warn(`La ciudad detectada (${city.id}) no coincide con la cityId del apartamento (${apt.cityId})`);
            }
        }
        
        // Si no hay cityId o no se encuentra la ciudad, detectar por coordenadas
        if (!city) {
            city = await window.zoneDetector.detectCity(apt.lat, apt.lng);
        }
        
        // Detectar zona
        const zone = await window.zoneDetector.detectZone(apt.lat, apt.lng, city?.id);
        
        return {
            ...apt,
            city,
            zone
        };
    } catch (error) {
        console.error('Error obteniendo información del apartamento:', error);
        return null;
    }
}

// Función para renderizar una tarjeta de partner
function renderPartnerCard(partner, type = 'basic') {
    const card = document.createElement('div');
    
    // Clases según el tipo
    if (type === 'premium') {
        card.className = 'snap-start w-64 shrink-0 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border-2 border-primary/30 cursor-pointer';
    } else if (type === 'featured') {
        card.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer';
    } else {
        card.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer';
    }
    
    // Imagen con fallback
    const imageUrl = partner.image ? `${window.ROOT_PATH}${partner.image}` : "https://via.placeholder.com/600x300?text=Sin+imagen";
    
    // Altura según el tipo
    const imageHeight = type === 'premium' ? 'h-32' : (type === 'featured' ? 'h-48' : 'h-40');
    
    // Contenido HTML
    let badgeHtml = '';
    if (type === 'featured') {
        badgeHtml = `<span class="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">Destacado</span>`;
    } else if (type === 'premium') {
        badgeHtml = `<span class="inline-block bg-primary text-white text-xs font-bold px-2 py-1 rounded mb-2">Premium</span>`;
    }
    
    card.innerHTML = `
        <div class="${imageHeight} bg-cover bg-center" style="background-image: url('${imageUrl}')"></div>
        <div class="${type === 'featured' ? 'p-5' : 'p-4'}">
            ${badgeHtml ? `<div class="flex items-center gap-2 mb-2">${badgeHtml}</div>` : ''}
            <h4 class="${type === 'featured' ? 'text-xl' : 'text-base'} font-semibold mb-1">${partner.name}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 ${type === 'premium' ? 'line-clamp-2' : ''}">${partner.description || ''}</p>
            <p class="text-primary font-medium mt-2">${partner.offer || 'Oferta disponible'}</p>
            ${partner.distanceKey ? `<p class="text-sm text-gray-500 dark:text-gray-500 mt-2">${partner.distanceKey}</p>` : ''}
            ${partner.zones && type !== 'premium' ? `<p class="text-xs text-gray-500 dark:text-gray-500 mt-2">Zona: ${partner.zones.join(', ')}</p>` : ''}
        </div>`;
    
    // Hacer la tarjeta clicable
    card.onclick = () => {
        console.log(`Clicked on partner: ${partner.name}`);
        if (partner.redirectUrl) {
            window.open(partner.redirectUrl, '_blank');
        }
    };
    
    return card;
}

async function renderPage() {
    const apartmentId = window.appState.apartmentId;
    if (!apartmentId) {
        console.error('No hay ID de apartamento');
        showFallbackMessage('No se pudo identificar el apartamento.');
        return;
    }

    // Obtener información completa del apartamento (con ciudad y zona)
    const apartmentInfo = await getApartmentInfo(apartmentId);
    if (!apartmentInfo) {
        console.error('No se pudo obtener información del apartamento');
        showFallbackMessage('No se pudo cargar los datos del apartamento.');
        return;
    }

    const recs = apartmentInfo.recommendations || {};

    document.title = t('navigation.recommendations_title');
    safeText('page-title', t('navigation.recommendations_title'));
    safeText('headline', t('recommendations.title'));
    safeText('subtitle', t('recommendations.subtitle') || `Lugares seleccionados a poca distancia de tu apartamento en ${apartmentInfo.city?.name || 'Madrid'}`);

    // Renderizar chips de filtro SIEMPRE
    renderFilterChips(recs.categories || defaultCategories);

    // Renderizar contenido filtrado (estático + premium + básicos)
    await renderFilteredContent(apartmentInfo);

    // Configurar navegación inferior
    setupBottomNavigation(apartmentId, window.appState.lang);
}

// Renderiza chips de filtro (siempre visible y con azul al seleccionar)
function renderFilterChips(categories) {
    const container = document.getElementById('filter-chips');
    if (!container) return;
    
    container.innerHTML = '';
    categories.forEach(cat => {
        const chip = document.createElement('div');
        chip.dataset.key = cat.key;
        chip.className = `snap-start flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 border border-transparent cursor-pointer transition-all active:scale-95 ${
            cat.key === currentFilter 
                ? 'bg-primary text-white font-semibold shadow-md' 
                : 'bg-gray-100 dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-900 dark:text-gray-100'
        }`;
        chip.innerHTML = `
            <span class="material-symbols-outlined text-[18px]">${cat.icon}</span>
            <p class="text-sm leading-normal">${t(`recommendations.filters.${cat.key}`) || cat.key}</p>
        `;
        chip.onclick = () => {
            currentFilter = cat.key;
            // Actualizar estado visual de todos los chips
            document.querySelectorAll('#filter-chips > div').forEach(c => {
                if (c.dataset.key === currentFilter) {
                    c.classList.add('bg-primary', 'text-white', 'font-semibold', 'shadow-md');
                    c.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'text-gray-900', 'dark:text-gray-100', 'hover:border-gray-200', 'dark:hover:border-gray-700');
                } else {
                    c.classList.remove('bg-primary', 'text-white', 'font-semibold', 'shadow-md');
                    c.classList.add('bg-gray-100', 'dark:bg-gray-800', 'text-gray-900', 'dark:text-gray-100', 'hover:border-gray-200', 'dark:hover:border-gray-700');
                }
            });
            renderFilteredContent();
        };
        container.appendChild(chip);
    });
}

// Renderiza contenido filtrado (estático + premium + básicos)
async function renderFilteredContent(apartmentInfo = null) {
    // Si no se proporciona información del apartamento, obtenerla
    if (!apartmentInfo) {
        apartmentInfo = await getApartmentInfo(window.appState.apartmentId);
        if (!apartmentInfo) {
            console.error('No se pudo obtener información del apartamento');
            return;
        }
    }
    
    const recs = apartmentInfo.recommendations || {};
    const sectionsContainer = document.getElementById('sections-container');
    if (!sectionsContainer) return;

    sectionsContainer.innerHTML = ''; // Limpiar
    let hasContent = false;

    // 1. Recomendaciones estáticas filtradas
    if (recs.sections) {
        recs.sections.forEach(section => {
            const filteredItems = section.items.filter(item => currentFilter === 'all' || item.typeKey === currentFilter);
            if (filteredItems.length === 0) return;
            hasContent = true;

            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'pt-6';
            let sectionHTML = `<h3 class="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] mb-4">${t(`recommendations.${section.titleKey}`)}</h3>`;
            const itemsContainer = document.createElement('div');
            itemsContainer.className = section.titleKey === 'essentials_title' ? 'flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-4' : 'flex flex-col gap-4';

            filteredItems.forEach(item => {
                // Tu lógica original de renderizado de items (transport, essentials, etc.)
                // ... (mantén tu código aquí sin cambios)
            });

            sectionDiv.innerHTML += sectionHTML;
            sectionDiv.appendChild(itemsContainer);
            sectionsContainer.appendChild(sectionDiv);
        });
    }

    // 2. Partners dinámicos
    try {
        const cityId = apartmentInfo.city?.id;
        const zoneId = apartmentInfo.zone?.id;
        
        console.log(`Cargando partners para ciudad: ${cityId}, zona: ${zoneId || 'no detectada'}`);

        // Obtener partners filtrados
        const { top: topPartners, premium: premiumPartners, basic: basicPartners } = 
            await window.zoneDetector.getFilteredPartners(cityId, zoneId, currentFilter);

        // Mostrar PARTNER-TOP en sección destacada existente
        const partnerOfDay = getPartnerOfDay(topPartners);
        if (partnerOfDay) {
            hasContent = true;
            const featuredItem = document.getElementById('featured-item');
            if (featuredItem) {
                featuredItem.innerHTML = '';
                featuredItem.appendChild(renderPartnerCard(partnerOfDay, 'featured'));
            }
        }

        // Mostrar PREMIUM en carrusel
        if (premiumPartners.length > 0) {
            hasContent = true;
            const premiumSection = document.createElement('div');
            premiumSection.className = 'pt-6';
            premiumSection.innerHTML = `<h3 class="text-lg font-bold mb-4">Más recomendaciones premium</h3>`;
            
            const premiumContainer = document.createElement('div');
            premiumContainer.className = 'flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-4';
            
            premiumPartners.forEach(partner => {
                premiumContainer.appendChild(renderPartnerCard(partner, 'premium'));
            });
            
            premiumSection.appendChild(premiumContainer);
            sectionsContainer.appendChild(premiumSection);
        }

        // Mostrar básicos en sección locales (debajo)
        if (basicPartners.length > 0) {
            hasContent = true;
            const basicSection = document.createElement('div');
            basicSection.className = 'pt-8';
            basicSection.innerHTML = `<h3 class="text-xl font-bold mb-6">Ofertas locales ${apartmentInfo.zone ? `en ${apartmentInfo.zone.name}` : 'cerca de ti'}</h3>`;

            const basicContainer = document.createElement('div');
            basicContainer.className = 'grid gap-6 md:grid-cols-2';

            basicPartners.forEach(partner => {
                basicContainer.appendChild(renderPartnerCard(partner, 'basic'));
            });

            basicSection.appendChild(basicContainer);
            sectionsContainer.appendChild(basicSection);
        }
    } catch (err) {
        console.error('Error cargando partners o zonas:', err);
    }

    // Fallback visual si no hay NADA
    if (!hasContent) {
        const noContent = document.createElement('div');
        noContent.className = 'pt-8 text-center text-gray-500 dark:text-gray-400';
        noContent.innerHTML = `
            <span class="material-symbols-outlined text-5xl mb-4 text-gray-300 dark:text-gray-600">info</span>
            <p class="text-lg font-medium">No hay recomendaciones disponibles en este momento</p>
            <p class="text-sm mt-2">Próximamente más contenido personalizado.</p>`;
        sectionsContainer.appendChild(noContent);
    }

    setupBottomNavigation(window.appState.apartmentId, window.appState.lang);
}

// Función para mostrar mensaje de error
function showFallbackMessage(message) {
    const sectionsContainer = document.getElementById('sections-container');
    if (!sectionsContainer) return;
    
    sectionsContainer.innerHTML = `
        <div class="pt-8 text-center text-red-500 dark:text-red-400">
            <span class="material-symbols-outlined text-5xl mb-4">error</span>
            <p class="text-lg font-medium">${message}</p>
        </div>`;
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar el detector de zonas y ciudades
    await window.zoneDetector.initialize();
    
    // Si estamos en la página de recomendaciones, renderizar
    if (window.location.pathname.includes('recommendations.html')) {
        renderPage();
    }
});