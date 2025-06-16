export default class Swimmer {
    constructor(scene, x, y, lane, isPlayer = false, strokeType = 'freestyle') {
        this.scene = scene;
        this.lane = lane;
        this.isPlayer = isPlayer;
        this.strokeType = strokeType;
        this.x = x;
        this.y = y;
        
        // Swimming stats
        this.speed = 0;
        this.baseSpeed = 100;
        this.rhythmMultiplier = isPlayer ? 0.0 : 1.0; // Player starts with no movement
        this.lastStrokeTime = 0;
        this.strokeCount = 0;
        this.hasStartedSwimming = false;
        this.position = 0; // Distance swum
        this.finished = false;
        this.finishTime = 0;
        
        // AI properties
        this.aiSkill = isPlayer ? 1.0 : Phaser.Math.FloatBetween(0.7, 0.9);
        this.aiRhythmTimer = 0;
        this.aiStrokeInterval = Phaser.Math.FloatBetween(0.8, 1.2);
        
        this.createVisuals();
    }
    
    createVisuals() {
        // Create swimmer body (rectangle)
        this.body = this.scene.add.rectangle(this.x, this.y, 24, 12, this.isPlayer ? 0xff6b35 : 0x4a90e2);
        
        // Create swimmer head (circle)
        this.head = this.scene.add.circle(this.x - 8, this.y, 6, this.isPlayer ? 0xffb366 : 0x7bb3f0);
        
        // Create arms (small rectangles)
        this.leftArm = this.scene.add.rectangle(this.x - 4, this.y - 8, 8, 4, this.isPlayer ? 0xffb366 : 0x7bb3f0);
        this.rightArm = this.scene.add.rectangle(this.x - 4, this.y + 8, 8, 4, this.isPlayer ? 0xffb366 : 0x7bb3f0);
        
        // Group all parts
        this.sprite = this.scene.add.group([this.body, this.head, this.leftArm, this.rightArm]);
        
        // Animation state
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    update(time, delta) {
        if (this.finished) return;
        
        // Handle AI swimming
        if (!this.isPlayer) {
            this.updateAI(time, delta);
        }
        
        // Update position based on speed
        this.position += this.speed * (delta / 1000);
        
        // Update visual position
        const newX = 50 + this.position;
        this.updatePosition(newX, this.y);
        
        // Animate swimming
        this.updateAnimation(time, delta);
        
        // Check for finish
        if (this.position >= 700 && !this.finished) {
            this.finished = true;
            this.finishTime = time;
            this.scene.swimmerFinished(this);
        }
        
        // Decay rhythm if no recent strokes
        if (time - this.lastStrokeTime > 2000) {
            this.rhythmMultiplier = Math.max(0.5, this.rhythmMultiplier - 0.1 * (delta / 1000));
        }
        
        // Update speed based on rhythm
        if (this.isPlayer && !this.hasStartedSwimming) {
            this.speed = 0; // Player doesn't move until first stroke
        } else {
            this.speed = this.baseSpeed * this.rhythmMultiplier * (this.isPlayer ? 1.0 : this.aiSkill);
        }
    }
    
    updateAI(time, delta) {
        this.aiRhythmTimer += delta;
        
        if (this.aiRhythmTimer >= this.aiStrokeInterval * 1000) {
            this.stroke(time);
            this.aiRhythmTimer = 0;
            this.aiStrokeInterval = Phaser.Math.FloatBetween(0.6, 1.0) / this.aiSkill;
        }
    }
    
    updateAnimation(time, delta) {
        this.animTimer += delta;
        
        if (this.animTimer >= 200) { // 200ms per frame
            this.animFrame = (this.animFrame + 1) % 4;
            this.animTimer = 0;
            
            // Simple arm animation
            const armOffset = Math.sin(this.animFrame * Math.PI / 2) * 3;
            this.leftArm.y = this.y - 8 + armOffset;
            this.rightArm.y = this.y + 8 - armOffset;
        }
    }
    
    updatePosition(x, y) {
        const deltaX = x - this.x;
        const deltaY = y - this.y;
        
        this.x = x;
        this.y = y;
        
        // Move all visual components
        this.body.x += deltaX;
        this.body.y += deltaY;
        this.head.x += deltaX;
        this.head.y += deltaY;
        this.leftArm.x += deltaX;
        this.leftArm.y += deltaY;
        this.rightArm.x += deltaX;
        this.rightArm.y += deltaY;
    }
    
    stroke(time) {
        const timeSinceLastStroke = time - this.lastStrokeTime;
        this.lastStrokeTime = time;
        this.strokeCount++;
        
        // Mark that player has started swimming
        if (this.isPlayer) {
            this.hasStartedSwimming = true;
            // Start with good rhythm on first stroke
            if (this.strokeCount === 1) {
                this.rhythmMultiplier = 1.0;
            }
        }
        
        // Calculate rhythm quality (ideal timing is around 800ms)
        const idealTiming = 800;
        const timingDiff = Math.abs(timeSinceLastStroke - idealTiming);
        const rhythmQuality = Math.max(0.5, 1.0 - (timingDiff / 1000));
        
        // Update rhythm multiplier
        this.rhythmMultiplier = Phaser.Math.Clamp(
            this.rhythmMultiplier + (rhythmQuality - 0.8) * 0.3,
            0.5,
            1.3
        );
        
        // Visual feedback for stroke
        this.scene.tweens.add({
            targets: this.body,
            scaleX: 1.2,
            scaleY: 0.8,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
        
        return rhythmQuality;
    }
    
    dive(time) {
        // Initial dive boost
        this.position += 20;
        this.rhythmMultiplier = 1.2;
        this.lastStrokeTime = time;
        
        // Visual dive effect
        this.scene.tweens.add({
            targets: [this.body, this.head, this.leftArm, this.rightArm],
            scaleX: 1.5,
            duration: 300,
            yoyo: true,
            ease: 'Power2'
        });
    }
    
    destroy() {
        this.sprite.destroy();
    }
}