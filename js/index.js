// js/index.js - Lógica principal de la home - Versión FINAL robusta, segura y con logs

// ==========================================
// Fallback temporal para t() (por si main.js tarda)
// ==========================================
window.t = window.t || function(key) {
    return `[${key}]`; // fallback básico
};

let currentLang = 'es';

// ==========================================
// Render principal de la página
// ==========================================
function renderPage() {
    console.log('renderPage() iniciado'); // Log 0

    // Validación defensiva (NO reintentos aquí)
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

    document.getElementById('hero-subtitle').textContent = t('index.hero_subtitle');
    document.getElementById('welcome-title').innerHTML =
        `${t('index.welcome_title')} <br/><span class="font-bold">${t('index.welcome_bold')}</span>`;

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
    document.getElementById('select-lang-title').textContent = t('index.select_language_title');
    document.getElementById('select-lang-desc').textContent = t('index.select_language_desc');
    document.getElementById('start-guide-text').textContent = t('index.start_guide');

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
                console.log(`Idioma seleccionado: ${lang.code}`); // Log 5
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

        console.log('Botones de idioma renderizados'); // Log 6
    }

    // ======================
    // Footer
    // ======================
    document.getElementById('host-name').textContent =
        `${t('index.hosted_by')} ${apt.host?.name || 'Anfitrión'}`;
    document.getElementById('app-version').textContent = t('index.app_version');

    // ======================
    // Navegación - CON CONTROL DE ESTILOS
    // ======================
    const navConfig = [
        { id: 'nav-essentials', titleKey: 'navigation.essentials_title', descKey: 'navigation.essentials_desc' },
        { id: 'nav-devices', titleKey: 'navigation.devices_title', descKey: 'navigation.devices_desc' },
        { id: 'nav-recommendations', titleKey: 'navigation.recommendations_title', descKey: 'navigation.recommendations_desc' },
        { id: 'nav-tourism', titleKey: 'navigation.tourism_title', descKey: 'navigation.tourism_desc' },
        { id: 'nav-contact', titleKey: 'navigation.contact_title', descKey: 'navigation.contact_desc' }
    ];

    navConfig.forEach(({ id, titleKey, descKey }) => {
        const card = document.getElementById(id);
        if (card) {
            const h4 = card.querySelector('h4');
            const p = card.querySelector('p');
            
            if (h4) {
                h4.textContent = t(titleKey);
                // Forzar estilos directamente desde JavaScript
                h4.style.fontSize = '1rem !important';
                h4.style.fontWeight = '600 !important';
                h4.style.lineHeight = '1.25 !important';
                h4.style.margin = '0 !important';
                h4.style.padding = '0 !important';
                h4.style.color = '#0d121b';
                
                // Asegurar que no tenga clases que puedan afectar el tamaño
                h4.className = 'font-bold';
                
                // Para modo oscuro
                if (document.body.classList.contains('dark')) {
                    h4.style.color = 'white !important';
                }
            }
            
            if (p) {
                p.textContent = t(descKey);
                // Forzar estilos directamente desde JavaScript
                p.style.fontSize = '0.75rem !important';
                p.style.lineHeight = '1.2 !important';
                p.style.margin = '0.125rem 0 0 0 !important';
                p.style.padding = '0 !important';
                p.style.color = '#6b7280';
                
                // Asegurar que no tenga clases que puedan afectar el tamaño
                p.className = '';
                
                // Para modo oscuro
                if (document.body.classList.contains('dark')) {
                    p.style.color = '#9ca3af !important';
                }
            }
            
            // Asegurar que el contenedor del texto tenga los estilos correctos
            const textContainer = card.querySelector('.flex-1');
            if (textContainer) {
                textContainer.style.flex = '1';
                textContainer.style.minWidth = '0';
            }
        }
    });

    console.log('Navegación renderizada con estilos controlados'); // Log 7

    setupBottomNavigation(window.appState.apartmentId, currentLang);

    console.log('renderPage() completado'); // Log final
}

// ==========================================
// Botón "Comenzar guía"
// ==========================================
function startGuide() {
    console.log('¡Botón Comenzar guía pulsado!');
    console.log('Estado actual:', window.appState);

    const langSection = document.getElementById('language-selector-section');
    const navSection = document.getElementById('navigation-section');

    if (langSection) langSection.classList.add('hidden');
    if (navSection) {
        navSection.classList.remove('hidden');
        
        // Forzar estilos en las tarjetas de navegación después de mostrarlas
        setTimeout(() => {
            document.querySelectorAll('.nav-card').forEach(card => {
                const h4 = card.querySelector('h4');
                const p = card.querySelector('p');
                
                if (h4) {
                    h4.style.fontSize = '1rem !important';
                    h4.style.fontWeight = '600 !important';
                    h4.style.lineHeight = '1.25 !important';
                    h4.style.margin = '0 !important';
                    h4.style.padding = '0 !important';
                    h4.style.color = '#0d121b';
                    h4.className = 'font-bold';
                    
                    if (document.body.classList.contains('dark')) {
                        h4.style.color = 'white !important';
                    }
                }
                
                if (p) {
                    p.style.fontSize = '0.75rem !important';
                    p.style.lineHeight = '1.2 !important';
                    p.style.margin = '0.125rem 0 0 0 !important';
                    p.style.padding = '0 !important';
                    p.style.color = '#6b7280';
                    p.className = '';
                    
                    if (document.body.classList.contains('dark')) {
                        p.style.color = '#9ca3af !important';
                    }
                }
                
                const textContainer = card.querySelector('.flex-1');
                if (textContainer) {
                    textContainer.style.flex = '1';
                    textContainer.style.minWidth = '0';
                }
            });
        }, 100);
    }
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
        startBtn.removeEventListener('click', startGuide);
        startBtn.addEventListener('click', startGuide);
        console.log('Evento click asignado al botón Comenzar guía');
    } else {
        setTimeout(assignStartButton, 500);
    }
}

assignStartButton();

// ==========================================
// ✅ SINCRONIZACIÓN CORRECTA CON main.js
// ==========================================
window.addEventListener('app:initialized', () => {
    console.log('Evento app:initialized recibido en index.js');
    renderPage();
});