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
        this.maxMomentum = 200; // Increased maximum momentum for faster speeds
        this.momentumDecay = 30; // Reduced momentum decay for more forgiving system
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
                
                // Calculate speed with frequency, click rate, and dive bonus multipliers
                this.speed = this.momentum * this.frequencySpeedMultiplier * this.clickRateMultiplier * this.diveBonus;
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
        this.frequencySpeedMultiplier = 1.0 + (diminishedRatio * 0.4); // Up to 40% speed bonus with diminishing returns
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
            this.clickRateMultiplier = Math.min(1.0 + (bonusRatio * 0.5), 1.8); // Max 1.8x instead of 2x
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
            momentumGain = 40; // Base momentum gain per correct stroke
            
            // Timing bonus for good rhythm (200-800ms for more forgiving timing)
            if (this.strokeCount > 1) {
                if (timeSinceLastStroke >= 200 && timeSinceLastStroke <= 800) {
                    momentumGain += 20; // Bonus for good timing
                } else if (timeSinceLastStroke < 200) {
                    momentumGain += 10; // Small bonus for very fast clicking
                } else if (timeSinceLastStroke > 1200) {
                    momentumGain -= 15; // Penalty for too slow
                }
            }
            
            // Add momentum and update expected key
            this.momentum = Math.min(this.maxMomentum, this.momentum + momentumGain);
            this.expectedNextKey = keyPressed === 'left' ? 'right' : 'left';
            
        } else {
            // Wrong key - HIGH PENALTY for miss tapping
            wasCorrectKey = false;
            this.missTapCount++; // Track miss taps
            this.momentum = Math.max(0, this.momentum - 60); // Increased penalty from 20 to 60
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
        
        // Add feedback effect - only show visual indicator for miss taps
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
        }
        
        return wasCorrectKey ? 1.0 : 0;
    }
    
    dive(time, diveTimingBonus = null) {
        if (this.isPlayer) {
            // Mark that player has dived and can now swim
            this.hasDived = true;
            
            // Calculate initial momentum with timing bonus
            let baseMomentum = 80;
            if (diveTimingBonus) {
                baseMomentum = baseMomentum * diveTimingBonus.multiplier;
                // Store the dive bonus for continued momentum advantage
                this.diveBonus = diveTimingBonus.multiplier;
                this.diveBonusDecayRate = 0.02; // Bonus decays by 2% per second
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
        
        // Add splash effect for good dives
        if (diveTimingBonus && diveTimingBonus.multiplier > 1.4) {
            // Create splash particles
            for (let i = 0; i < 5; i++) {
                const splash = this.scene.add.circle(
                    this.x + Phaser.Math.Between(-10, 10),
                    this.y + Phaser.Math.Between(-5, 5),
                    Phaser.Math.Between(2, 4),
                    0x87ceeb
                );
                
                this.scene.tweens.add({
                    targets: splash,
                    x: splash.x + Phaser.Math.Between(-20, 20),
                    y: splash.y + Phaser.Math.Between(-15, 15),
                    alpha: 0,
                    duration: 500,
                    onComplete: () => splash.destroy()
                });
            }
        }
    }
    
    destroy() {
        this.sprite.destroy();
    }
}