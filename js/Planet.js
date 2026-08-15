class Planet {
    constructor(config) {
        this.x = config.x ?? 0.5;
        this.y = config.y ?? 0.5;
        this.scale = config.scale ?? 0.5;
        this.tilt = config.tilt ?? 0;
        this.spinSpeed = config.spinSpeed ?? 0.001;
        this.rotation = 0;

        // Visual properties bound to this specific instance
        this.baseColor = config.baseColor || '#1e2135';
        this.atmosColor = config.atmosColor || 'rgba(100,150,255,0.22)';
        this.atmosInnerRadius = config.atmosInnerRadius;
        this.atmosOuterRadius = config.atmosOuterRadius;
        this.gritCount = config.gritCount ?? 5000;
        this.bandCount = config.bandCount ?? 12;
        this.bandOpacityMin = config.bandOpacityMin ?? 0.05;
        this.bandOpacityMax = config.bandOpacityMax ?? 0.20;
        this.craters = config.craters;
        this.rings = config.rings || [];
        
        // Cache texture canvas instance locally at birth
        this.textureMap = null; 
    }

    update(dt) {
        // Increment continuous planetary surface rotation loop
        this.rotation += this.spinSpeed * dt;
    }
}
