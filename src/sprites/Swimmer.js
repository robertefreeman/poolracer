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
        this.aiSkill = isPlayer ? 1.0 : Phaser.Math.FloatBetween(1.2, 1.6); // AI skill range 120-160% for competitive racing
        this.aiRhythmTimer = 0;
        this.aiStrokeInterval = Phaser.Math.FloatBetween(0.8, 1.2);
        
        this.createVisuals();
    }
    
    // Get stroke-specific speed multiplier based on real swimming times
    getStrokeSpeedMultiplier() {
        switch (this.strokeType) {
            case 'freestyle':
                return 1.0; // Baseline speed (fastest stroke)
            case 'butterfly':
                return 0.9; // 10% slower than freestyle
            case 'breaststroke':
                return 0.8; // 20% slower than freestyle
            case 'backstroke':
                return 0.7; // 30% slower than freestyle
            default:
                return 1.0;
        }
    }
    
    createVisuals() {
        // Determine team colors based on lane
        // RH Seahawks: lanes 1,3,5 (indices 0,2,4) - blue swimsuits
        // Ravensworth Ravens: lanes 2,4,6 (indices 1,3,5) - navy swimsuits
        const isSeahawks = this.lane % 2 === 0; // Even lane indices (0,2,4) are Seahawks
        
        // Color scheme
        let skinColor, swimsuitColor, teamName, capColor;
        if (this.isPlayer) {
            skinColor = 0xffdbac; // Skin tone
            swimsuitColor = 0x008b8b; // Teal swimsuit for RH Seahawks
            teamName = 'RH Seahawks';
            capColor = 0xc0c0c0; // Silver cap
        } else if (isSeahawks) {
            skinColor = 0xffdbac; // Skin tone
            swimsuitColor = 0x008b8b; // Teal swimsuit for RH Seahawks
            teamName = 'RH Seahawks';
            capColor = 0xc0c0c0; // Silver cap
        } else {
            skinColor = 0xffdbac; // Skin tone
            swimsuitColor = 0x1a1a4d; // Navy blue swimsuit
            teamName = 'Ravensworth Ravens';
            capColor = 0x000080; // Navy blue cap
        }
        
        // All swimmers face toward finish line (right side)
        // Head position based on stroke type
        let headX, bodyX, armX, legX;
        
        if (this.strokeType === 'backstroke') {
            // Backstroke: swimmer on back, head toward finish (leading), feet toward start
            headX = this.x + 12; // Head toward finish (right) - leading the race
            bodyX = this.x;
            armX = this.x + 6;
            legX = this.x - 8; // Legs toward start (left)
        } else {
            // All other strokes: head toward finish, standard forward position
            headX = this.x + 12; // Head toward finish (right)
            bodyX = this.x;
            armX = this.x + 6;
            legX = this.x - 8; // Legs toward start (left)
        }
        
        // Create swimmer body (torso in swimsuit)
        this.body = this.scene.add.rectangle(bodyX, this.y, 20, 10, swimsuitColor);
        
        // Create swimmer head (skin tone) - improved appearance
        this.head = this.scene.add.circle(headX, this.y, 5, skinColor);
        this.head.setStrokeStyle(1, 0xd4a574, 1); // Subtle darker outline for better definition
        
        // Create swim cap (half the size of head)
        this.cap = this.scene.add.circle(headX, this.y - 1, 2.5, capColor);
        this.cap.setStrokeStyle(0.5, 0x000000, 0.3); // Subtle outline for cap
        
        // Create arms (skin tone)
        this.leftArm = this.scene.add.rectangle(armX, this.y - 7, 8, 3, skinColor);
        this.rightArm = this.scene.add.rectangle(armX, this.y + 7, 8, 3, skinColor);
        
        // Create legs (skin tone) - NEW!
        this.leftLeg = this.scene.add.rectangle(legX, this.y - 4, 12, 3, skinColor);
        this.rightLeg = this.scene.add.rectangle(legX, this.y + 4, 12, 3, skinColor);
        
        // Create feet (small skin tone circles) - NEW!
        const feetX = legX - 8; // Feet are always toward start for all strokes now
        this.leftFoot = this.scene.add.circle(feetX, this.y - 4, 2, skinColor);
        this.rightFoot = this.scene.add.circle(feetX, this.y + 4, 2, skinColor);
        
        // Special styling for backstroke (face up)
        if (this.strokeType === 'backstroke') {
            this.head.setFillStyle(0xffeedd); // Lighter skin tone for face up
            this.body.setRotation(0); // Keep body normal for backstroke
        }
        
        // Group all parts including the cap
        this.sprite = this.scene.add.group([
            this.body, this.head, this.cap, this.leftArm, this.rightArm, 
            this.leftLeg, this.rightLeg, this.leftFoot, this.rightFoot
        ]);
        
        // Store team info for debugging
        this.teamName = teamName;
        this.swimsuitColor = swimsuitColor;
        
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
                
                // Calculate speed with all multipliers including stroke-specific speed and miss tap penalty
                const strokeMultiplier = this.getStrokeSpeedMultiplier();
                this.speed = this.momentum * this.frequencySpeedMultiplier * this.clickRateMultiplier * this.diveBonus * this.speedPenaltyMultiplier * strokeMultiplier;
            }
        } else {
            // AI uses enhanced speed system - average 100 pixels/sec with stroke-specific adjustments
            const strokeMultiplier = this.getStrokeSpeedMultiplier();
            this.speed = 100 * (this.aiSkill || 1.0) * strokeMultiplier;
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
            this.cap.y = this.y + bobOffset - 1; // Cap moves with head but slightly offset
            // Don't bob arms and legs as they have their own stroke animations
        }
    }
    
    updateStrokeAnimation() {
        const intensity = Math.min(this.speed / 100, 2.0); // Animation intensity based on speed
        
        switch (this.strokeType) {
            case 'freestyle':
                // Alternating arm strokes with reach and pull
                const freestylePhase = Math.sin(this.animFrame * Math.PI / 4);
                const armReach = freestylePhase * (4 + intensity);
                
                // Alternating arm movements (arms positioned correctly for forward-facing)
                this.leftArm.y = this.y - 7 + armReach;
                this.rightArm.y = this.y + 7 - armReach;
                
                // Arms extend forward during reach phase (toward finish line)
                this.leftArm.x = this.x + 6 + Math.max(0, freestylePhase) * 4;
                this.rightArm.x = this.x + 6 + Math.max(0, -freestylePhase) * 4;
                
                // Enhanced arm rotation for stroke motion
                this.leftArm.rotation = freestylePhase * 0.4;
                this.rightArm.rotation = -freestylePhase * 0.4;
                
                // Flutter kick - alternating leg movements
                const legKick = Math.sin(this.animFrame * Math.PI / 2) * (2 + intensity);
                this.leftLeg.y = this.y - 4 + legKick;
                this.rightLeg.y = this.y + 4 - legKick;
                
                // Feet follow legs with slight delay
                this.leftFoot.y = this.y - 4 + legKick * 0.8;
                this.rightFoot.y = this.y + 4 - legKick * 0.8;
                
                // Slight body roll for freestyle
                this.body.rotation = freestylePhase * 0.05;
                break;
                
            case 'backstroke':
                // Backward alternating strokes - arms reach back over head
                const backstrokePhase = Math.cos(this.animFrame * Math.PI / 4);
                const backstrokeOffset = backstrokePhase * (6 + intensity);
                
                this.leftArm.y = this.y - 7 + backstrokeOffset;
                this.rightArm.y = this.y + 7 - backstrokeOffset;
                
                // Arms rotate more dramatically for backstroke windmill motion
                this.leftArm.rotation = backstrokePhase * 0.6;
                this.rightArm.rotation = -backstrokePhase * 0.6;
                
                // Arms extend back over head for backstroke (but swimmer is now oriented forward)
                this.leftArm.x = this.x + 6 + Math.abs(backstrokePhase) * 4;
                this.rightArm.x = this.x + 6 + Math.abs(backstrokePhase) * 4;
                
                // Flutter kick for backstroke (similar to freestyle but on back)
                const backKick = Math.sin(this.animFrame * Math.PI / 2) * (2 + intensity);
                this.leftLeg.y = this.y - 4 + backKick;
                this.rightLeg.y = this.y + 4 - backKick;
                
                // Feet follow legs
                this.leftFoot.y = this.y - 4 + backKick * 0.8;
                this.rightFoot.y = this.y + 4 - backKick * 0.8;
                
                // Keep swimmer face up color
                this.head.setFillStyle(0xffeedd);
                break;
                
            case 'breaststroke':
                // Synchronized wide arm movements - arms sweep out and in
                const breastPhase = Math.sin(this.animFrame * Math.PI / 3) * (1 + intensity * 0.5);
                const armSweep = Math.abs(breastPhase) * 8; // Arms sweep wider
                
                // Arms move out and in synchronously
                this.leftArm.y = this.y - 7 - armSweep;
                this.rightArm.y = this.y + 7 + armSweep;
                
                // Arms extend forward and pull back
                this.leftArm.x = this.x + 6 + Math.cos(this.animFrame * Math.PI / 3) * 4;
                this.rightArm.x = this.x + 6 + Math.cos(this.animFrame * Math.PI / 3) * 4;
                
                // Arms get wider during sweep
                this.leftArm.width = 8 + armSweep * 0.5;
                this.rightArm.width = 8 + armSweep * 0.5;
                
                // Slight rotation for sweep motion
                this.leftArm.rotation = breastPhase * 0.3;
                this.rightArm.rotation = -breastPhase * 0.3;
                
                // Breaststroke kick - legs come together and kick out
                const breastKick = Math.sin(this.animFrame * Math.PI / 3);
                const legSeparation = Math.abs(breastKick) * 3;
                
                this.leftLeg.y = this.y - 4 - legSeparation;
                this.rightLeg.y = this.y + 4 + legSeparation;
                
                // Legs extend back during kick
                this.leftLeg.x = this.x - 8 - Math.max(0, breastKick) * 3;
                this.rightLeg.x = this.x - 8 - Math.max(0, breastKick) * 3;
                
                // Feet angle outward during kick
                this.leftFoot.y = this.y - 4 - legSeparation * 1.2;
                this.rightFoot.y = this.y + 4 + legSeparation * 1.2;
                this.leftFoot.x = this.x - 16 - Math.max(0, breastKick) * 2;
                this.rightFoot.x = this.x - 16 - Math.max(0, breastKick) * 2;
                
                // Body undulation for breaststroke
                this.body.scaleY = 1.0 + Math.sin(this.animFrame * Math.PI / 3) * 0.15;
                break;
                
            case 'butterfly':
                // Synchronized butterfly strokes - dramatic dolphin motion
                const butterflyPhase = Math.sin(this.animFrame * Math.PI / 2.5) * (1 + intensity * 0.3);
                const wingSpan = Math.abs(butterflyPhase) * 6;
                
                // Both arms move together in butterfly motion
                this.leftArm.y = this.y - 7 + butterflyPhase * 4;
                this.rightArm.y = this.y + 7 + butterflyPhase * 4;
                
                // Arms sweep forward and back together
                this.leftArm.x = this.x + 6 + Math.cos(this.animFrame * Math.PI / 2.5) * 6;
                this.rightArm.x = this.x + 6 + Math.cos(this.animFrame * Math.PI / 2.5) * 6;
                
                // Dramatic arm rotation for butterfly stroke
                this.leftArm.rotation = butterflyPhase * 0.7;
                this.rightArm.rotation = butterflyPhase * 0.7;
                
                // Arms extend during stroke
                this.leftArm.width = 8 + wingSpan * 0.3;
                this.rightArm.width = 8 + wingSpan * 0.3;
                
                // Dolphin kick - both legs move together in wave motion
                const dolphinKick = Math.sin(this.animFrame * Math.PI / 2.5) * (3 + intensity);
                
                this.leftLeg.y = this.y - 4 + dolphinKick;
                this.rightLeg.y = this.y + 4 + dolphinKick;
                
                // Legs undulate with body wave
                this.leftLeg.x = this.x - 8 + Math.sin(this.animFrame * Math.PI / 2.5) * 2;
                this.rightLeg.x = this.x - 8 + Math.sin(this.animFrame * Math.PI / 2.5) * 2;
                
                // Feet follow the dolphin wave motion
                this.leftFoot.y = this.y - 4 + dolphinKick * 1.3;
                this.rightFoot.y = this.y + 4 + dolphinKick * 1.3;
                this.leftFoot.x = this.x - 16 + Math.sin(this.animFrame * Math.PI / 2.5) * 3;
                this.rightFoot.x = this.x - 16 + Math.sin(this.animFrame * Math.PI / 2.5) * 3;
                
                // Enhanced body undulation - dolphin kick motion
                this.body.scaleY = 1.0 + Math.sin(this.animFrame * Math.PI / 2.5) * 0.25;
                this.body.rotation = Math.sin(this.animFrame * Math.PI / 2.5) * 0.1; // Body waves
                
                // Head bobs with dolphin motion (ensure head stays at front)
                this.head.x = this.x + 12; // Keep head at front
                this.head.y = this.y + Math.sin(this.animFrame * Math.PI / 2.5) * 3;
                this.cap.x = this.x + 12; // Cap follows head
                this.cap.y = this.y + Math.sin(this.animFrame * Math.PI / 2.5) * 3 - 1;
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
        this.cap.x += deltaX;
        this.cap.y += deltaY;
        this.leftArm.x += deltaX;
        this.leftArm.y += deltaY;
        this.rightArm.x += deltaX;
        this.rightArm.y += deltaY;
        this.leftLeg.x += deltaX;
        this.leftLeg.y += deltaY;
        this.rightLeg.x += deltaX;
        this.rightLeg.y += deltaY;
        this.leftFoot.x += deltaX;
        this.leftFoot.y += deltaY;
        this.rightFoot.x += deltaX;
        this.rightFoot.y += deltaY;
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
            
            // Calculate initial momentum with timing bonus (slightly increased base)
            let baseMomentum = 55; // Slightly increased from 50 to give better start momentum
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
        
        // Destroy individual components
        if (this.body) this.body.destroy();
        if (this.head) this.head.destroy();
        if (this.cap) this.cap.destroy();
        if (this.leftArm) this.leftArm.destroy();
        if (this.rightArm) this.rightArm.destroy();
        if (this.leftLeg) this.leftLeg.destroy();
        if (this.rightLeg) this.rightLeg.destroy();
        if (this.leftFoot) this.leftFoot.destroy();
        if (this.rightFoot) this.rightFoot.destroy();
        
        // Destroy main sprite group
        if (this.sprite) this.sprite.destroy();
    }
}