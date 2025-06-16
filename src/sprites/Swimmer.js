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
        this.momentum = 0; // Current forward momentum
        this.maxMomentum = 150; // Maximum momentum from alternating taps
        this.momentumDecay = 50; // Momentum lost per second when not tapping
        this.lastStrokeTime = 0;
        this.strokeCount = 0;
        this.hasStartedSwimming = false;
        this.lastStrokeKey = null; // Track last key pressed for alternation
        this.expectedNextKey = 'left'; // Start expecting left key
        this.hasDived = false; // Track if player has dived to start
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
        
        // Handle momentum decay for player
        if (this.isPlayer) {
            if (!this.hasDived) {
                // Player can't move until they dive
                this.speed = 0;
                this.momentum = 0;
            } else {
                // Decay momentum over time when not tapping
                this.momentum = Math.max(0, this.momentum - this.momentumDecay * (delta / 1000));
                this.speed = this.momentum;
            }
        } else {
            // AI uses old rhythm system
            this.speed = this.baseSpeed * (this.aiSkill || 1.0);
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
    
    stroke(time, keyPressed = null) {
        const timeSinceLastStroke = time - this.lastStrokeTime;
        this.lastStrokeTime = time;
        this.strokeCount++;
        
        // For AI swimmers, use simple stroke system
        if (!this.isPlayer) {
            return 1.0; // AI always has good strokes
        }
        
        // Player must have dived first
        if (!this.hasDived) {
            return 0; // No movement without dive
        }
        
        let wasCorrectKey = false;
        let momentumGain = 0;
        
        // Check if this is the correct alternating key
        if (keyPressed === this.expectedNextKey) {
            // Correct alternation - add momentum
            wasCorrectKey = true;
            momentumGain = 40; // Base momentum gain per correct stroke
            
            // Timing bonus for good rhythm (300-600ms)
            if (this.strokeCount > 1) {
                if (timeSinceLastStroke >= 300 && timeSinceLastStroke <= 600) {
                    momentumGain += 20; // Bonus for good timing
                } else if (timeSinceLastStroke < 300) {
                    momentumGain -= 10; // Penalty for too fast
                } else if (timeSinceLastStroke > 1000) {
                    momentumGain -= 15; // Penalty for too slow
                }
            }
            
            // Add momentum and update expected key
            this.momentum = Math.min(this.maxMomentum, this.momentum + momentumGain);
            this.expectedNextKey = keyPressed === 'left' ? 'right' : 'left';
            
        } else {
            // Wrong key - no momentum gain, lose some momentum
            wasCorrectKey = false;
            this.momentum = Math.max(0, this.momentum - 20);
            // Don't update expected key - they need to press the correct one
        }
        
        // Visual feedback
        let strokeColor = wasCorrectKey ? 0x00ff00 : 0xff0000;
        
        this.scene.tweens.add({
            targets: this.body,
            scaleX: 1.2,
            scaleY: 0.8,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
        
        // Add feedback effect
        const feedbackCircle = this.scene.add.circle(this.x, this.y - 20, 8, strokeColor);
        
        let feedbackText = wasCorrectKey ? 'STROKE!' : 'WRONG!';
        const textFeedback = this.scene.add.text(this.x, this.y - 35, feedbackText, {
            font: 'bold 12px Arial',
            fill: wasCorrectKey ? '#00ff00' : '#ff0000'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: [feedbackCircle, textFeedback],
            alpha: 0,
            y: this.y - 50,
            duration: 800,
            onComplete: () => {
                feedbackCircle.destroy();
                textFeedback.destroy();
            }
        });
        
        return wasCorrectKey ? 1.0 : 0;
    }
    
    dive(time) {
        if (this.isPlayer) {
            // Mark that player has dived and can now swim
            this.hasDived = true;
            this.momentum = 80; // Initial momentum from dive
            this.lastStrokeTime = time;
        } else {
            // AI dive (simple)
            this.position += 20;
        }
        
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