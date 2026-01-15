// js/index.js - Lógica principal de la home - Versión MEJORADA 2026
// Limpieza forzada + protección contra múltiples renders + logs mejorados

// ==========================================
// Fallback temporal para t() (por si main.js tarda)
// ==========================================
window.t = window.t || function(key) {
    return `[${key}]`; // fallback básico
};

let currentLang = 'es';

// Contador para detectar renders múltiples (útil para depuración)
window.renderPageCount = window.renderPageCount || 0;

// ==========================================
// Render principal de la página
// ==========================================
function renderPage() {
    window.renderPageCount++;
    console.log(`renderPage() iniciado - ejecución #${window.renderPageCount}`); // Log 0 mejorado

    // Validación defensiva
    if (!window.appState?.initialized) {
        console.warn('renderPage llamado antes de app:initialized → abortando');
        return;
    }

    if (typeof window.t !== 'function' || !window.appState.translations) {
        console.error('t() o traducciones no disponibles en renderPage');
        return;
    }

    const apt = window.appState.apartmentData?.[window.appState.apartmentId];
    console.log('Datos de apartamento cargados:', apt); // Log 1

    if (!apt) {
        console.error('No hay datos de apartamento disponibles');
        document.body.innerHTML = `
            <div class="p-8 text-center">
                <h1 class="text-3xl font-bold text-red-600">Apartamento no encontrado</h1>
                <p class="mt-4 text-gray-600 dark:text-gray-300">Vuelve al inicio o contacta al anfitrión.</p>
                <a href="index.html" class="mt-6 inline-block bg-primary text-white px-6 py-3 rounded-xl">Volver</a>
            </div>`;
        return;
    }

    currentLang = window.appState.lang;
    console.log('Idioma actual:', currentLang); // Log 2

    // ======================
    // Hero
    // ======================
    const heroImage = document.getElementById('hero-image');
    if (heroImage && apt.images?.portada) {
        heroImage.style.backgroundImage = `url(${apt.images.portada})`;
        console.log('Hero image asignada:', apt.images.portada); // Log 3
    }

    const subtitleEl = document.getElementById('hero-subtitle');
    if (subtitleEl) subtitleEl.textContent = t('index.hero_subtitle') || 'Bienvenido';

    const welcomeEl = document.getElementById('welcome-title');
    if (welcomeEl) {
        welcomeEl.innerHTML = 
            `${t('index.welcome_title') || 'Bienvenido'}<br/>` +
            `<span class="font-bold">${t('index.welcome_bold') || 'a Casa'}</span>`;
    }

    // ======================
    // Tarjeta flotante
    // ======================
    const thumbnail = document.getElementById('property-thumbnail');
    if (thumbnail && apt.images?.portada) {
        thumbnail.style.backgroundImage = `url(${apt.images.portada})`;
        console.log('Thumbnail asignada:', apt.images.portada); // Log 4
    }

    document.getElementById('property-name').textContent = apt.name || 'Apartamento sin nombre';
    document.getElementById('property-address').textContent = apt.address || 'Dirección no disponible';

    // ======================
    // Selector de idioma
    // ======================
    document.getElementById('select-lang-title').textContent = t('index.select_language_title') || 'Selecciona idioma';
    document.getElementById('select-lang-desc').textContent = t('index.select_language_desc') || 'Elige tu idioma preferido';
    document.getElementById('start-guide-text').textContent = t('index.start_guide') || 'Comenzar guía';

    const languageGrid = document.getElementById('language-grid');
    if (languageGrid) {
        languageGrid.innerHTML = '';

        const languages = [
            { code: 'es', flag: '🇪🇸', name: 'languages.spanish' },
            { code: 'en', flag: '🇬🇧', name: 'languages.english' },
            { code: 'fr', flag: '🇫🇷', name: 'languages.french' },
            { code: 'de', flag: '🇩🇪', name: 'languages.german' }
        ];

        languages.forEach(lang => {
            const isSelected = lang.code === currentLang;
            const button = document.createElement('button');

            button.className = `
                group relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl
                bg-white dark:bg-[#1e2736]
                ${isSelected
                    ? 'border-2 border-primary/10 dark:border-primary/30'
                    : 'border border-transparent hover:border-primary/30 dark:hover:border-primary/50'}
                shadow-sm hover:shadow-md transition-all duration-300
                ring-2 ring-transparent focus:ring-primary/20
            `;

            button.onclick = () => {
                console.log(`Idioma seleccionado: ${lang.code}`);
                changeLanguage(lang.code);
            };

            button.innerHTML = `
                <div class="w-10 h-10 rounded-full ${isSelected
                    ? 'bg-primary/10 dark:bg-primary/20'
                    : 'bg-[#f8f9fc] dark:bg-slate-700'}
                    flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    ${lang.flag}
                </div>
                <span class="text-sm font-semibold ${
                    isSelected
                        ? 'text-[#0d121b] dark:text-white'
                        : 'text-[#0d121b] dark:text-white group-hover:text-primary dark:group-hover:text-primary-400'
                }">${t(lang.name)}</span>
                ${isSelected
                    ? `<div class="absolute top-3 right-3">
                        <span class="material-symbols-outlined text-primary text-sm">
                            radio_button_checked
                        </span>
                       </div>`
                    : ''
                }
            `;

            languageGrid.appendChild(button);
        });

        console.log('Botones de idioma renderizados');
    }

    // ======================
    // Footer
    // ======================
    document.getElementById('host-name').textContent =
        `${t('index.hosted_by') || 'Alojado por'} ${apt.host?.name || 'Anfitrión'}`;
    document.getElementById('app-version').textContent = t('index.app_version') || 'Versión de la app';

    // ======================
    // Navegación - VERSIÓN ROBUSTA CON LIMPIEZA
    // ======================
    const navConfig = [
        { id: 'nav-essentials',    titleKey: 'navigation.essentials_title',    shortDesc: 'WiFi, Acceso y Normas' },
        { id: 'nav-devices',       titleKey: 'navigation.devices_title',       shortDesc: 'Controles y aparatos' },
        { id: 'nav-recommendations', titleKey: 'navigation.recommendations_title', shortDesc: 'Lugares cercanos de interés' },
        { id: 'nav-tourism',       titleKey: 'navigation.tourism_title',       shortDesc: 'Actividades y atracciones' },
        { id: 'nav-contact',       titleKey: 'navigation.contact_title',       shortDesc: 'Comunicación con el anfitrión' }
    ];

    navConfig.forEach(({ id, titleKey, shortDesc, icon }) => {
        const card = document.getElementById(id);
        if (!card) {
            console.warn(`Tarjeta no encontrada: ${id}`);
            return;
        }

        // Icono
        const iconEl = card.querySelector('.nav-icon');
        if (iconEl) {
            iconEl.textContent = icon;
        }

        // TÍTULO - Limpieza fuerte + asignación
        const h4 = card.querySelector('h4');
        if (h4) {
            const oldText = h4.textContent.trim();
            h4.textContent = ''; // ← Limpieza explícita primero
            h4.textContent = t(titleKey) || 'Sección';
            h4.className = 'font-bold text-lg leading-tight';
            console.log(`Título LIMPIO → ${id} | Antes: "${oldText}" → Ahora: "${h4.textContent}"`);
        }

        // DESCRIPCIÓN - Limpieza fuerte + asignación
        const p = card.querySelector('p');
        if (p) {
            const oldDesc = p.textContent.trim();
            p.textContent = ''; // ← Limpieza explícita primero
            p.textContent = shortDesc || 'Información disponible';
            p.className = 'text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-snug';
            console.log(`Descripción LIMPIA → ${id} | Antes: "${oldDesc}" → Ahora: "${p.textContent}"`);
        }

        // Flecha
        const arrow = card.querySelector('.nav-arrow');
        if (arrow) {
            arrow.textContent = 'arrow_forward';
        }
    });

    console.log('Navegación renderizada correctamente');

    if (typeof setupBottomNavigation === 'function') {
        setupBottomNavigation(window.appState.apartmentId, currentLang);
    }

    console.log('renderPage() completado');
}

// ==========================================
// Botón "Comenzar guía"
// ==========================================
function startGuide() {
    console.log('¡Botón Comenzar guía pulsado!');
    console.log('Estado actual:', window.appState);

    document.getElementById('language-selector-section')?.classList.add('hidden');
    document.getElementById('navigation-section')?.classList.remove('hidden');
}

// ==========================================
// Cambio de idioma
// ==========================================
function changeLanguage(lang) {
    console.log('Cambiando idioma a:', lang);
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.location.href = url.toString();
}

// ==========================================
// Asignación robusta del botón Start
// ==========================================
function assignStartButton() {
    const startBtn = document.getElementById('start-guide-btn');
    if (startBtn) {
        startBtn.removeEventListener('click', startGuide); // Evita duplicados
        startBtn.addEventListener('click', startGuide);
        console.log('Evento click asignado al botón Comenzar guía');
        return true;
    }
    console.warn('No se encontró el botón start-guide-btn');
    return false;
}

// Reintentos para asignar botón
if (!assignStartButton()) {
    let retryCount = 0;
    const maxRetries = 10;
    const retryInterval = setInterval(() => {
        retryCount++;
        if (assignStartButton() || retryCount >= maxRetries) {
            clearInterval(retryInterval);
            if (retryCount >= maxRetries) {
                console.error('No se pudo asignar evento al botón tras varios intentos');
            }
        }
    }, 500);
}

// ==========================================
// SINCRONIZACIÓN CON main.js
// ==========================================
window.addEventListener('app:initialized', () => {
    console.log('Evento app:initialized recibido en index.js');
    renderPage();
});