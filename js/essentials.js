/* =====================================================
   js/essentials.js - FINAL COMPLETO Y SEGURO
   - Lista dinámica de puertas Raixer
   - Helpers con fallback
   - No pisa window.appState
   - LEDs desacoplados
   - Init seguro (DOMContentLoaded + app:initialized)
===================================================== */

/* =========================
   CONFIG RAIXER
========================= */
const RAIXER_API = {
    baseUrl: 'https://api.raixer.com',
    apiUser: 'user_580949a8d4d6ac1f3602ebc9',
    apiSecret: '8ad5553cf21a1b3cfca144a98aa1d27998ffbf38042eafca73051905589f1db6'
};

function getRaixerAuthHeaders() {
    const credentials = btoa(`${RAIXER_API.apiUser}:${RAIXER_API.apiSecret}`);
    return {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
    };
}

/* =========================
   HELPERS (ORIG + MEJORAS)
========================= */
function safeGet(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`⚠️ Elemento #${id} no encontrado`);
    return el;
}

function safeText(id, value) {
    if (window.safeText && typeof window.safeText === 'function') {
        return window.safeText(id, value);
    }
    const el = safeGet(id);
    if (el && value !== undefined && value !== null) el.textContent = value;
}

function showNotification(message) {
    if (window.showNotification && typeof window.showNotification === 'function') {
        return window.showNotification(message);
    }

    const notification = document.createElement('div');
    notification.className =
        'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
    notification.innerHTML =
        `${message} <span class="ml-2 cursor-pointer font-bold">✖</span>`;
    notification.querySelector('span').onclick = () => notification.remove();

    document.body.appendChild(notification);
    setTimeout(() => notification.style.opacity = '0', 3000);
    setTimeout(() => notification.remove(), 3500);

    console.log('[NOTIF]', message);
}

const notify = (msg, type) => showNotification(msg);

function t(key) {
    if (window.t && typeof window.t === 'function') return window.t(key);
    if (!window.appState?.translations) return `[${key}]`;
    return key.split('.').reduce((o, k) => o?.[k], window.appState.translations) ?? `[${key}]`;
}

/* =========================
   RAIXER API
========================= */
async function getRaixerDoors(deviceId) {
    console.log('[Raixer] Listando puertas:', deviceId);
    try {
        const res = await fetch(`${RAIXER_API.baseUrl}/devices/${deviceId}/doors`, {
            headers: getRaixerAuthHeaders()
        });
        if (!res.ok) throw new Error(res.status);
        return await res.json();
    } catch (e) {
        console.error('[Raixer] Error puertas:', e);
        notify('No se pudieron cargar las puertas');
        return [];
    }
}

async function checkRaixerDeviceStatus(deviceId) {
    try {
        const res = await fetch(`${RAIXER_API.baseUrl}/devices/${deviceId}`, {
            headers: getRaixerAuthHeaders()
        });
        if (!res.ok) throw new Error(res.status);
        const dev = await res.json();
        return { success: true, online: dev.online || dev.status === 'online' };
    } catch {
        return { success: false, online: false };
    }
}

async function raixerOpenDoor(deviceId, doorId) {
    try {
        const res = await fetch(
            `${RAIXER_API.baseUrl}/devices/${deviceId}/open-door/${doorId}`,
            { method: 'POST', headers: getRaixerAuthHeaders() }
        );
        if (!res.ok) throw new Error(res.status);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/* =========================
   INIT PRINCIPAL
========================= */
async function initializeEssentials() {
    const params = new URLSearchParams(window.location.search);
    const apartmentId = params.get('apartment') || 'sol-101';
    const lang = params.get('lang') || 'es';

    try {
        const [aRes, tRes] = await Promise.all([
            fetch(`${window.ROOT_PATH}data/apartments.json`),
            fetch(`${window.ROOT_PATH}data/${lang}.json`)
        ]);

        const apartments = await aRes.json();
        const translations = await tRes.json();

        window.appState = Object.assign(window.appState || {}, {
            apartmentId,
            apartmentData: apartments,
            translations,
            lang
        });

        const apt = apartments[apartmentId];
        if (!apt) throw new Error('Apartamento no encontrado');

        document.title = t('essentials.title');
        safeText('page-title', t('essentials.title'));
        safeText('apartment-name', apt.name);
        safeText('apartment-address', apt.address);

        /* ---- WIFI ---- */
        safeText('wifi-title', t('essentials.wifi_title'));
        safeText('wifi-network', apt.wifi?.network || '—');
        safeText('wifi-password', apt.wifi?.password || '—');

        const copyBtn = safeGet('wifi-copy-btn');
        if (copyBtn && apt.wifi?.password) {
            copyBtn.onclick = () =>
                navigator.clipboard
                    ?.writeText(apt.wifi.password)
                    .then(() => notify(t('common.copied')));
        } else if (copyBtn) {
            copyBtn.style.display = 'none';
        }

        /* ---- ACCESO ---- */
        safeText('access-title', t('essentials.access_title'));
        safeText('access-code', apt.access?.code || '—');

        const steps = safeGet('access-steps-list');
        if (steps) {
            steps.innerHTML = '';
            (apt.access?.instructions || []).forEach((s, i) => {
                const li = document.createElement('li');
                li.textContent = s;
                steps.appendChild(li);
            });
        }

        /* ---- RAIXER ---- */
        const portalBtn = safeGet('btn-portal-access');
        const houseBtn = safeGet('btn-house-access');
        const portalLed = safeGet('led-portal');
        const houseLed = safeGet('led-house');

        const deviceId = apt.raixerDevices?.deviceId;
        if (!deviceId) {
            notify('Control de puertas no configurado');
            return;
        }

        const doors = await getRaixerDoors(deviceId);

        const portalDoor = doors.find(d =>
            (d.use || '').toLowerCase() === 'street' ||
            (d.name || '').toLowerCase().includes('portal')
        );

        const houseDoor = doors.find(d =>
            (d.use || '').toLowerCase() === 'home' ||
            (d.name || '').toLowerCase().includes('interior')
        );

        async function updateLed(led, available) {
            if (!led) return;
            led.className = 'absolute top-3 right-3 h-3 w-3 rounded-full';
            if (!available) {
                led.classList.add('bg-gray-500');
                return;
            }
            led.classList.add('bg-yellow-500', 'animate-pulse');
            const st = await checkRaixerDeviceStatus(deviceId);
            led.className =
                `absolute top-3 right-3 h-3 w-3 rounded-full ${
                    st.online ? 'bg-green-500' : 'bg-red-500'
                }`;
        }

        await updateLed(portalLed, !!portalDoor);
        await updateLed(houseLed, !!houseDoor);

        if (portalBtn) {
            portalBtn.disabled = !portalDoor;
            portalBtn.onclick = async () => {
                notify('Abriendo portal...');
                const r = await raixerOpenDoor(deviceId, portalDoor.use ?? portalDoor._id);
                notify(r.success ? 'Portal abierto' : 'Error abriendo portal');
                updateLed(portalLed, true);
            };
        }

        if (houseBtn) {
            houseBtn.disabled = !houseDoor;
            houseBtn.onclick = async () => {
                notify('Abriendo puerta...');
                const r = await raixerOpenDoor(deviceId, houseDoor.use ?? houseDoor._id);
                notify(r.success ? 'Puerta abierta' : 'Error abriendo puerta');
                updateLed(houseLed, true);
            };
        }

    } catch (e) {
        console.error(e);
        notify('Error cargando información del apartamento');
    }
}

/* =========================
   ARRANQUE SEGURO
========================= */
document.addEventListener('DOMContentLoaded', () => {
    if (window.appState?.initialized) {
        initializeEssentials();
    } else {
        window.addEventListener('app:initialized', initializeEssentials, { once: true });
    }
});
