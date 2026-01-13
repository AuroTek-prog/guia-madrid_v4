// js/zoneDetection.js
class ZoneDetector {
    constructor() {
        this.zonesData = null;
        this.citiesData = null;
    }

    async initialize() {
        try {
            // Cargar datos de zonas y ciudades
            const zonesResponse = await fetch(`${window.ROOT_PATH}data/zones.json`);
            this.zonesData = await zonesResponse.json();
            
            const citiesResponse = await fetch(`${window.ROOT_PATH}data/cities.json`);
            this.citiesData = await citiesResponse.json();
            
            return true;
        } catch (error) {
            console.error('Error inicializando ZoneDetector:', error);
            return false;
        }
    }

    // Detecta la zona de un punto geográfico
    async detectZone(lat, lng, cityId = null) {
        if (!this.zonesData) {
            await this.initialize();
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
        if (!this.citiesData) {
            await this.initialize();
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
}

// Instancia global del detector
window.zoneDetector = new ZoneDetector();