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
        this.baseSpeed = 70; // Further reduced from 80 to slow down player
        this.momentum = 0; // Current forward momentum
        this.maxMomentum = 130; // Further reduced from 150 to cap maximum speed
        this.momentumDecay = 40; // Increased from 30 for faster momentum loss
        this.lastStrokeTime = 0;
        this.strokeCount = 0;
        this.hasStartedSwimming = false;
        this.lastStrokeKey = null; // Track last key pressed for alternation
        this.expectedNextKey = 'left'; // Start expecting left key
        this.hasDived = false; // Track if player has dived to start
        this.position = 0; // Distance swum
        this.finished = false;
        this.finishTime = 0;
        
        // Dive timing bonus tracking
        this.diveBonus = 1.0; // Multiplier from dive timing
        this.diveBonusDecayRate = 0.02; // Rate at which dive bonus decays
        
        // Miss tap penalty tracking
        this.speedPenaltyTimer = 0; // Time remaining for speed penalty
        this.speedPenaltyMultiplier = 1.0; // Speed reduction multiplier
        
        // Click frequency tracking (Option B)
        this.clickHistory = []; // Store timestamps of recent clicks
        this.clickFrequencyWindow = 2000; // Track clicks over last 2 seconds
        this.maxClickFrequency = 10; // Maximum clicks per second for bonus calculation
        this.frequencySpeedMultiplier = 1.0; // Speed multiplier based on click frequency
        
        // Recent click rate tracking (Option C)
        this.recentClickTimes = []; // Store last 5 click times for rate calculation
        this.maxRecentClicks = 5; // Number of recent clicks to track
        this.baseClickRate = 2.0; // Expected clicks per second for normal speed
        this.clickRateMultiplier = 1.0; // Speed multiplier based on recent click rate
        
        // Miss tap tracking
        this.missTapCount = 0; // Track number of wrong key presses
        this.totalTapCount = 0; // Track total taps for accuracy calculation
        
        // AI properties
        this.aiSkill = isPlayer ? 1.0 : Phaser.Math.FloatBetween(0.9, 1.3); // AI skill range 90-130% for competitive racing
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
        this.strokeAnimationActive = false;
        this.waterTrail = []; // Store water trail particles
        this.maxTrailParticles = 8;
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
        const newX = 80 + this.position;
        this.updatePosition(newX, this.y);
        
        // Animate swimming
        this.updateAnimation(time, delta);
        
        // Check for finish
        if (this.position >= 1120 && !this.finished) {
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
                // Update click frequency tracking
                this.updateClickFrequency(time);
                
                // Decay momentum over time when not tapping
                this.momentum = Math.max(0, this.momentum - this.momentumDecay * (delta / 1000));
                
                // Decay dive bonus over time (gradually lose the advantage)
                if (this.diveBonus > 1.0) {
                    this.diveBonus = Math.max(1.0, this.diveBonus - this.diveBonusDecayRate * (delta / 1000));
                }
                
                // Handle speed penalty from miss taps
                if (this.speedPenaltyTimer > 0) {
                    this.speedPenaltyTimer -= delta;
                    if (this.speedPenaltyTimer <= 0) {
                        this.speedPenaltyMultiplier = 1.0; // Reset penalty
                    }
                }
                
                // Calculate speed with all multipliers including miss tap penalty
                this.speed = this.momentum * this.frequencySpeedMultiplier * this.clickRateMultiplier * this.diveBonus * this.speedPenaltyMultiplier;
            }
        } else {
            // AI uses enhanced speed system - average 100 pixels/sec
            this.speed = 100 * (this.aiSkill || 1.0);
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
        
        // Enhanced swimming animation based on speed and stroke type
        const animSpeed = Math.max(100, 300 - (this.speed * 2)); // Faster animation when swimming faster
        
        if (this.animTimer >= animSpeed) {
            this.animFrame = (this.animFrame + 1) % 8; // More animation frames
            this.animTimer = 0;
            
            // Enhanced stroke-specific animations
            this.updateStrokeAnimation();
            
            // Create water trail particles when moving
            if (this.speed > 10) {
                this.createWaterTrail();
            }
        }
        
        // Update water trail particles
        this.updateWaterTrail(delta);
        
        // Body bobbing animation when swimming
        if (this.hasDived && this.speed > 0) {
            const bobOffset = Math.sin(time * 0.008) * 2;
            this.body.y = this.y + bobOffset;
            this.head.y = this.y + bobOffset;
        }
    }
    
    updateStrokeAnimation() {
        const intensity = Math.min(this.speed / 100, 2.0); // Animation intensity based on speed
        
        switch (this.strokeType) {
            case 'freestyle':
                // Alternating arm strokes
                const freestyleOffset = Math.sin(this.animFrame * Math.PI / 4) * (4 + intensity);
                this.leftArm.y = this.y - 8 + freestyleOffset;
                this.rightArm.y = this.y + 8 - freestyleOffset;
                this.leftArm.rotation = Math.sin(this.animFrame * Math.PI / 4) * 0.3;
                this.rightArm.rotation = -Math.sin(this.animFrame * Math.PI / 4) * 0.3;
                break;
                
            case 'backstroke':
                // Backward alternating strokes
                const backstrokeOffset = Math.cos(this.animFrame * Math.PI / 4) * (4 + intensity);
                this.leftArm.y = this.y - 8 + backstrokeOffset;
                this.rightArm.y = this.y + 8 - backstrokeOffset;
                this.leftArm.rotation = Math.cos(this.animFrame * Math.PI / 4) * 0.4;
                this.rightArm.rotation = -Math.cos(this.animFrame * Math.PI / 4) * 0.4;
                // Swimmer faces up
                this.head.setFillStyle(this.isPlayer ? 0xffcc99 : 0x99ccff);
                break;
                
            case 'breaststroke':
                // Synchronized wide arm movements
                const breastOffset = Math.sin(this.animFrame * Math.PI / 2) * (6 + intensity);
                this.leftArm.y = this.y - 10 + breastOffset;
                this.rightArm.y = this.y + 10 - breastOffset;
                this.leftArm.width = 8 + Math.abs(breastOffset);
                this.rightArm.width = 8 + Math.abs(breastOffset);
                break;
                
            case 'butterfly':
                // Synchronized butterfly strokes
                const butterflyOffset = Math.sin(this.animFrame * Math.PI / 3) * (5 + intensity);
                this.leftArm.y = this.y - 8 + butterflyOffset;
                this.rightArm.y = this.y + 8 + butterflyOffset; // Both arms move together
                this.leftArm.rotation = Math.sin(this.animFrame * Math.PI / 3) * 0.5;
                this.rightArm.rotation = Math.sin(this.animFrame * Math.PI / 3) * 0.5;
                // Body undulation
                this.body.scaleY = 1.0 + Math.sin(this.animFrame * Math.PI / 3) * 0.2;
                break;
        }
    }
    
    createWaterTrail() {
        // Create water droplet behind swimmer
        const trail = this.scene.add.circle(
            this.x - 15 + Phaser.Math.Between(-3, 3),
            this.y + Phaser.Math.Between(-8, 8),
            Phaser.Math.Between(1, 3),
            0x87ceeb,
            0.7
        );
        
        this.waterTrail.push({
            particle: trail,
            life: 1000, // 1 second lifetime
            initialAlpha: 0.7
        });
        
        // Remove old particles
        if (this.waterTrail.length > this.maxTrailParticles) {
            const oldest = this.waterTrail.shift();
            oldest.particle.destroy();
        }
    }
    
    updateWaterTrail(delta) {
        this.waterTrail.forEach((trail, index) => {
            trail.life -= delta;
            
            if (trail.life <= 0) {
                trail.particle.destroy();
                this.waterTrail.splice(index, 1);
            } else {
                // Fade out and drift
                const alpha = (trail.life / 1000) * trail.initialAlpha;
                trail.particle.setAlpha(alpha);
                trail.particle.x -= delta * 0.02; // Drift backward
                trail.particle.y += Math.sin(trail.life * 0.01) * 0.1; // Gentle wave motion
            }
        });
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
    
    // Option B: Update click frequency tracking
    updateClickFrequency(currentTime) {
        if (!this.isPlayer) return;
        
        // Remove old clicks outside the tracking window
        this.clickHistory = this.clickHistory.filter(clickTime => 
            currentTime - clickTime <= this.clickFrequencyWindow
        );
        
        // Calculate clicks per second over the tracking window
        const clicksInWindow = this.clickHistory.length;
        const windowSeconds = this.clickFrequencyWindow / 1000;
        const clicksPerSecond = clicksInWindow / windowSeconds;
        
        // Calculate frequency speed multiplier with diminishing returns
        const frequencyRatio = Math.min(clicksPerSecond / this.maxClickFrequency, 1.0);
        // Use square root for diminishing returns on frequency bonus
        const diminishedRatio = Math.sqrt(frequencyRatio);
        this.frequencySpeedMultiplier = 1.0 + (diminishedRatio * 0.1); // Reduced from 20% to 10% max bonus
    }
    
    // Option C: Calculate click rate multiplier based on recent clicks
    updateClickRateMultiplier(currentTime) {
        if (!this.isPlayer || this.recentClickTimes.length < 2) {
            this.clickRateMultiplier = 1.0;
            return;
        }
        
        // Calculate average time between recent clicks
        let totalTimeBetweenClicks = 0;
        for (let i = 1; i < this.recentClickTimes.length; i++) {
            totalTimeBetweenClicks += this.recentClickTimes[i] - this.recentClickTimes[i - 1];
        }
        
        const avgTimeBetweenClicks = totalTimeBetweenClicks / (this.recentClickTimes.length - 1);
        const avgClicksPerSecond = 1000 / avgTimeBetweenClicks; // Convert ms to clicks/second
        
        // Calculate multiplier based on how click rate compares to base rate
        const rateRatio = avgClicksPerSecond / this.baseClickRate;
        
        // Apply multiplier with diminishing returns for faster clicking
        if (rateRatio >= 1.0) {
            // Faster clicking gets bonus but with diminishing returns
            // Use logarithmic scaling to reduce effectiveness of very fast clicking
            const bonusRatio = Math.log(rateRatio) / Math.log(3); // Diminishing returns curve
            this.clickRateMultiplier = Math.min(1.0 + (bonusRatio * 0.2), 1.2); // Reduced max from 1.4x to 1.2x
        } else {
            // Slower clicking gets penalty (down to 0.5x speed for very slow clicking)
            this.clickRateMultiplier = Math.max(0.5 + (rateRatio * 0.5), 0.5);
        }
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
        
        // Record click for frequency tracking (Option B)
        if (this.isPlayer && keyPressed) {
            this.totalTapCount++; // Count all taps for accuracy tracking
            this.clickHistory.push(time);
            
            // Record click for recent rate tracking (Option C)
            this.recentClickTimes.push(time);
            if (this.recentClickTimes.length > this.maxRecentClicks) {
                this.recentClickTimes.shift(); // Remove oldest click
            }
            
            // Update click rate multiplier
            this.updateClickRateMultiplier(time);
        }
        
        // Check if this is the correct alternating key
        if (keyPressed === this.expectedNextKey) {
            // Correct alternation - add momentum
            wasCorrectKey = true;
            momentumGain = 30; // Reduced from 40 to slow progression
            
            // Timing bonus for good rhythm (250-700ms for tighter timing window)
            if (this.strokeCount > 1) {
                if (timeSinceLastStroke >= 250 && timeSinceLastStroke <= 700) {
                    momentumGain += 5; // Reduced bonus from 10 to 5
                } else if (timeSinceLastStroke < 250) {
                    momentumGain += 2; // Reduced bonus from 3 to 2
                } else if (timeSinceLastStroke > 1000) {
                    momentumGain -= 20; // Keep penalty the same
                }
            }
            
            // Add momentum and update expected key
            this.momentum = Math.min(this.maxMomentum, this.momentum + momentumGain);
            this.expectedNextKey = keyPressed === 'left' ? 'right' : 'left';
            
        } else {
            // Wrong key - MASSIVE PENALTY for miss tapping
            wasCorrectKey = false;
            this.missTapCount++; // Track miss taps
            this.momentum = Math.max(0, this.momentum - 80); // Increased penalty from 60 to 80
            
            // Additional speed penalty that persists
            this.speedPenaltyTimer = 2000; // 2 second speed penalty
            this.speedPenaltyMultiplier = 0.7; // 30% speed reduction
            
            // Don't update expected key - they need to press the correct one
        }
        
        // Enhanced visual feedback
        this.createStrokeEffect(wasCorrectKey, momentumGain);
        
        // Enhanced body animation based on stroke quality
        const scaleIntensity = wasCorrectKey ? 1.0 + (momentumGain / 100) : 0.8;
        this.scene.tweens.add({
            targets: this.body,
            scaleX: 1.0 + (scaleIntensity * 0.3),
            scaleY: 1.0 - (scaleIntensity * 0.2),
            duration: wasCorrectKey ? 150 : 80,
            yoyo: true,
            ease: 'Power2'
        });
        
        // Arm stroke animation
        const armToAnimate = keyPressed === 'left' ? this.leftArm : this.rightArm;
        this.scene.tweens.add({
            targets: armToAnimate,
            scaleX: wasCorrectKey ? 1.4 : 0.8,
            duration: 120,
            yoyo: true,
            ease: 'Back.easeOut'
        });
        
        // Add feedback effect for both correct and incorrect strokes
        if (!wasCorrectKey) {
            const missIndicator = this.scene.add.text(this.x, this.y - 25, '✗ MISS!', {
                font: 'bold 14px Arial',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: missIndicator,
                alpha: 0,
                y: this.y - 45,
                duration: 1000,
                onComplete: () => {
                    missIndicator.destroy();
                }
            });
            
            // Screen shake for miss
            this.scene.cameras.main.shake(100, 0.005);
            
            // Show speed penalty indicator
            const penaltyIndicator = this.scene.add.text(this.x, this.y - 50, 'SPEED PENALTY!', {
                font: 'bold 12px Arial',
                fill: '#ff6600',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: penaltyIndicator,
                alpha: 0,
                y: this.y - 70,
                duration: 2000,
                onComplete: () => {
                    penaltyIndicator.destroy();
                }
            });
        } else if (momentumGain > 50) {
            // Show "GOOD!" for excellent strokes
            const goodIndicator = this.scene.add.text(this.x, this.y - 25, 'GOOD!', {
                font: 'bold 12px Arial',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: goodIndicator,
                alpha: 0,
                y: this.y - 35,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 800,
                onComplete: () => {
                    goodIndicator.destroy();
                }
            });
        }
    }
    
    createStrokeEffect(wasCorrectKey, momentumGain) {
        if (!wasCorrectKey) return;
        
        // Create splash particles for good strokes
        const particleCount = Math.min(8, Math.floor(momentumGain / 10));
        
        for (let i = 0; i < particleCount; i++) {
            const splash = this.scene.add.circle(
                this.x + Phaser.Math.Between(-12, 8),
                this.y + Phaser.Math.Between(-8, 8),
                Phaser.Math.Between(1, 3),
                0x87ceeb,
                0.8
            );
            
            this.scene.tweens.add({
                targets: splash,
                x: splash.x + Phaser.Math.Between(-15, 15),
                y: splash.y + Phaser.Math.Between(-10, 10),
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: Phaser.Math.Between(300, 600),
                ease: 'Power2.easeOut',
                onComplete: () => splash.destroy()
            });
        }
        
        // Create momentum boost effect for excellent strokes
        if (momentumGain > 50) {
            const boostRing = this.scene.add.circle(this.x, this.y, 5, 0x00ff00, 0);
            boostRing.setStrokeStyle(2, 0x00ff00, 0.8);
            
            this.scene.tweens.add({
                targets: boostRing,
                radius: 25,
                alpha: 0,
                duration: 400,
                ease: 'Power2.easeOut',
                onComplete: () => boostRing.destroy()
            });
        }
        
        return wasCorrectKey ? 1.0 : 0;
    }
    
    dive(time, diveTimingBonus = null) {
        if (this.isPlayer) {
            // Mark that player has dived and can now swim
            this.hasDived = true;
            
            // Calculate initial momentum with timing bonus (reduced base)
            let baseMomentum = 50; // Further reduced from 60 to slow initial start
            if (diveTimingBonus) {
                baseMomentum = baseMomentum * diveTimingBonus.multiplier;
                // Store the dive bonus for continued momentum advantage
                this.diveBonus = diveTimingBonus.multiplier;
                this.diveBonusDecayRate = 0.025; // Slightly faster decay from 0.02 to 0.025
            } else {
                this.diveBonus = 1.0;
            }
            
            this.momentum = Math.min(this.maxMomentum, baseMomentum);
            this.lastStrokeTime = time;
        } else {
            // AI dive (simple)
            this.position += 20;
        }
        
        // Enhanced visual dive effect based on timing
        const effectIntensity = diveTimingBonus ? diveTimingBonus.multiplier : 1.0;
        
        this.scene.tweens.add({
            targets: [this.body, this.head, this.leftArm, this.rightArm],
            scaleX: 1.2 + (effectIntensity * 0.3),
            duration: 200 + (effectIntensity * 100),
            yoyo: true,
            ease: 'Power2'
        });
        
        // Enhanced splash effect for dives
        this.createDiveSplash(diveTimingBonus);
    }
    
    createDiveSplash(diveTimingBonus) {
        const splashIntensity = diveTimingBonus ? diveTimingBonus.multiplier : 1.0;
        const particleCount = Math.floor(5 + (splashIntensity * 8));
        
        // Main splash particles
        for (let i = 0; i < particleCount; i++) {
            const splash = this.scene.add.circle(
                this.x + Phaser.Math.Between(-15, 15),
                this.y + Phaser.Math.Between(-8, 8),
                Phaser.Math.Between(2, 5),
                0x87ceeb,
                0.9
            );
            
            this.scene.tweens.add({
                targets: splash,
                x: splash.x + Phaser.Math.Between(-30, 30),
                y: splash.y + Phaser.Math.Between(-20, 20),
                alpha: 0,
                scaleX: 0.1,
                scaleY: 0.1,
                duration: Phaser.Math.Between(400, 800),
                ease: 'Power2.easeOut',
                onComplete: () => splash.destroy()
            });
        }
        
        // Water ripples for good dives
        if (splashIntensity > 1.2) {
            for (let i = 0; i < 3; i++) {
                const ripple = this.scene.add.circle(this.x, this.y, 8, 0x87ceeb, 0);
                ripple.setStrokeStyle(2, 0x87ceeb, 0.6);
                
                this.scene.tweens.add({
                    targets: ripple,
                    radius: 40 + (i * 15),
                    alpha: 0,
                    duration: 600 + (i * 200),
                    delay: i * 100,
                    ease: 'Power2.easeOut',
                    onComplete: () => ripple.destroy()
                });
            }
        }
        
        // Perfect dive burst effect
        if (diveTimingBonus && diveTimingBonus.type === 'perfect') {
            const burst = this.scene.add.circle(this.x, this.y, 3, 0xffffff, 0.8);
            
            this.scene.tweens.add({
                targets: burst,
                radius: 50,
                alpha: 0,
                duration: 300,
                ease: 'Power3.easeOut',
                onComplete: () => burst.destroy()
            });
        }
    }
    
    destroy() {
        // Clean up water trail particles
        this.waterTrail.forEach(trail => {
            if (trail.particle) {
                trail.particle.destroy();
            }
        });
        this.waterTrail = [];
        
        // Destroy main sprite
        this.sprite.destroy();
    }
}