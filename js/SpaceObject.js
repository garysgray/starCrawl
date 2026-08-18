// ── SpaceObject Base Class ────────────────────────────────────────────────────
class SpaceObject {
    constructor(config) {
        if (this.constructor === SpaceObject) {
            throw new TypeError("Cannot instantiate base abstract class SpaceObject directly.");
        }
        
        // Universal tracking variables shared by ALL background space objects
        this.type       = config.objectType || 'generic';
        this.x          = config.x ?? 0.5;
        this.y          = config.y ?? 0.5;
        this.scale      = config.scale ?? 0.5;
        this.tilt       = config.tilt ?? 0;
        this.spinSpeed  = config.spinSpeed ?? 0.0;
        this.baseColor  = config.baseColor || '#1c1c1c';
        this.atmosColor = config.atmosColor || 'rgba(255,255,255,0.1)';
        this.rotation   = 0;
        this.textureMap = null; 
    }

    update(dt) {
        // Continuous rotation step calculation
        this.rotation += this.spinSpeed * dt;
    }
}

// ── Planet Subclass Component ─────────────────────────────────────────────────
class PlanetEntity extends SpaceObject {
    constructor(config) {
        super(config);
        this.gritCount      = config.gritCount ?? 5000;
        this.bandCount      = config.bandCount ?? 12;
        this.bandOpacityMin = config.bandOpacityMin ?? 0.05;
        this.bandOpacityMax = config.bandOpacityMax ?? 0.20;
        this.craters        = config.craters || [];
        this.rings          = config.rings || [];
        
        console.log(`🪐 CELESTIAL FACTORY: Instantiated a PlanetEntity subclass object layout.`);
    }
}

// ── SpaceStation Subclass Component ───────────────────────────────────────────
class SpaceStationEntity extends SpaceObject {
    constructor(config) {
        super(config);
        this.gritCount      = config.gritCount ?? 9000;
        this.bandCount      = config.bandCount ?? 45;
        this.bandOpacityMin = config.bandOpacityMin ?? 0.12;
        this.bandOpacityMax = config.bandOpacityMax ?? 0.28;
        this.craters        = config.craters || [];
        this.rings          = []; 
        
        console.log(`🛰️ CELESTIAL FACTORY: Instantiated a SpaceStationEntity subclass object layout.`);
    }
}
