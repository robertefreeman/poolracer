export default class Swimmer {
    constructor(scene, x, y, lane, isPlayer = false, strokeType = 'freestyle', isPortraitMode = false) {
        this.scene = scene;
        this.lane = lane;
        this.isPlayer = isPlayer;
        this.strokeType = strokeType;
        this.isPortraitMode = true;
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        
        // Swimming stats
        this.speed = 0;
        this.baseSpeed = 70; // Further reduced from 80 to slow down player
        this.momentum = 0; // Current forward momentum
        this.maxMomentum = 6.5; // Further reduced from 150 to cap maximum speed
        this.momentumDecay = 4; // Increased from 30 for faster momentum loss
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
        
        // Swimmer oriented upwards (head at top, feet at bottom)
        // Calculations are relative to this.x (horizontal center of lane) and this.y (vertical position, moves upwards)
        
        const headY = this.y - 12; // Head towards top (smaller Y is "up")
        const bodyY = this.y;     // Body center
        const armY = this.y;      // Arms centered with body
        const legY = this.y + 8;  // Legs below body (larger Y is "down")
        const feetY = legY + 8;   // Feet at the end of legs

        // Create swimmer body (torso in swimsuit) - vertical orientation
        this.body = this.scene.add.rectangle(this.x, bodyY, 10, 20, swimsuitColor); // width 10, height 20
        
        // Create swimmer head (skin tone) - above body
        this.head = this.scene.add.circle(this.x, headY, 5, skinColor);
        this.head.setStrokeStyle(1, 0xd4a574, 1);
        
        // Create swim cap (on top part of head)
        // Arc is drawn from startAngle to endAngle. For top half, 180 to 0 degrees.
        this.cap = this.scene.add.arc(this.x, headY - 2, 5, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(0), false, capColor);
        this.cap.setStrokeStyle(0.5, 0x000000, 0.3);
        
        // Create arms (skin tone) - sides of body, oriented vertically
        this.leftArm = this.scene.add.rectangle(this.x - 7, armY, 3, 8, skinColor); // width 3, height 8
        this.rightArm = this.scene.add.rectangle(this.x + 7, armY, 3, 8, skinColor); // width 3, height 8
        
        // Create legs (skin tone) - below body, oriented vertically
        this.leftLeg = this.scene.add.rectangle(this.x - 4, legY, 3, 12, skinColor); // width 3, height 12
        this.rightLeg = this.scene.add.rectangle(this.x + 4, legY, 3, 12, skinColor); // width 3, height 12
        
        // Create feet (small skin tone circles) - bottom of legs
        this.leftFoot = this.scene.add.circle(this.x - 4, feetY, 2, skinColor);
        this.rightFoot = this.scene.add.circle(this.x + 4, feetY, 2, skinColor);
        
        // Special styling for backstroke (face up) - No longer rotating head, adjust visual if necessary
        if (this.strokeType === 'backstroke') {
            this.head.setFillStyle(0xffeedd); // Lighter skin tone for face up
            // Body rotation is not applied anymore, visual adjustments for backstroke might be needed elsewhere if any.
        }
        
        // Group all parts including the cap
        this.sprite = this.scene.add.group([
            this.body, this.head, this.cap, this.leftArm, this.rightArm, 
            this.leftLeg, this.rightLeg, this.leftFoot, this.rightFoot
        ]);

        // Rotate individual parts for portrait mode if applicable
        // if (this.isPortraitMode) {
        //     this.body.angle = -90;
        //     this.head.angle = -90;
        //     this.cap.angle = -90;
        //     this.leftArm.angle = -90;
        //     this.rightArm.angle = -90;
        //     this.leftLeg.angle = -90;
        //     this.rightLeg.angle = -90;
        //     this.leftFoot.angle = -90;
        //     this.rightFoot.angle = -90;
        // }
        
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
        
        // Update visual position (always portrait mode)
        // Portrait mode: swimmers move vertically (bottom to top)
        // Ensure this.scene.poolWorldLength, this.scene.pixelsPerMeter, and this.scene.raceDistanceMeters are set by RaceScene
        const startLineYOffset = 100; // How far from the true bottom the visual start line is
        const actualStartLineY = this.scene.poolWorldLength - startLineYOffset; // e.g. 3000 - 100 = 2900

        const newY = actualStartLineY - (this.position * this.scene.pixelsPerMeter);
        this.updatePosition(this.x, newY); // this.x is managed by lane position

        // Finish line check for portrait mode (swimming towards Y=0 or a small offset)
        // This assumes this.position is correctly tracking progress towards raceConfig.raceDistanceMeters
        if (this.position >= this.scene.raceDistanceMeters && !this.finished) { // raceDistanceMeters needs to be available
            this.finished = true;
            this.finishTime = time;
            this.scene.swimmerFinished(this);
        }
        
        // Animate swimming
        this.updateAnimation(time, delta);
        
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
            this.speed = 5 * (this.aiSkill || 1.0) * strokeMultiplier;
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
            this.cap.y = this.y + bobOffset; // Cap moves with head
            // Don't bob arms and legs as they have their own stroke animations
        }
    }
    
    updateStrokeAnimation() {
        const intensity = Math.min(this.speed / 100, 2.0); // Animation intensity based on speed

        // Animations are now unified for vertical orientation
        // Original X-axis (length of swimmer) is now Screen Y-axis (negative for forward/up, positive for backward/down).
        // Original Y-axis (width of swimmer) is now Screen X-axis (negative for left, positive for right).

        // Base Y positions for parts relative to this.y (center of swimmer)
        const armBaseY = this.y; // Arms aligned with body center
        const legBaseY = this.y + 8; // Legs start below body center
        const feetBaseY = legBaseY + 8; // Feet start below legs
        const headBaseY = this.y - 12; // Head is above body center

        switch (this.strokeType) {
            case 'freestyle':
                const freestylePhase = Math.sin(this.animFrame * Math.PI / 4);
                const armSideReach = freestylePhase * (5 + intensity * 1.5); // Sideways reach

                // Sideways arm movement (Screen X-axis)
                this.leftArm.x = this.x - 7 + armSideReach;
                this.rightArm.x = this.x + 7 - armSideReach;

                // Forward/backward arm reach (Screen Y-axis, negative is "up" or "forward")
                // this.y is swimmer's center. Arms are initially at armBaseY (this.y).
                // Reaching forward means decreasing Y.
                this.leftArm.y = armBaseY - (Math.max(0, freestylePhase) * 5);
                this.rightArm.y = armBaseY - (Math.max(0, -freestylePhase) * 5);

                this.leftArm.rotation = freestylePhase * 0.5;
                this.rightArm.rotation = -freestylePhase * 0.5;

                const legKickSide = Math.sin(this.animFrame * Math.PI / 2) * (3 + intensity * 1.2); // Sideways kick
                // Sideways leg kick (Screen X-axis)
                this.leftLeg.x = this.x - 4 + legKickSide;
                this.rightLeg.x = this.x + 4 - legKickSide;

                // Legs are positioned at legBaseY. Flutter kick is primarily sideways.
                // If there's a forward/backward component to the kick, it would modify Y.
                this.leftLeg.y = legBaseY;
                this.rightLeg.y = legBaseY;

                // Feet X (sideways motion, similar to legs)
                this.leftFoot.x = (this.x - 4) + legKickSide * 0.8;
                this.rightFoot.x = (this.x + 4) - legKickSide * 0.8;
                
                // Feet Y (base position)
                this.leftFoot.y = feetBaseY;
                this.rightFoot.y = feetBaseY;

                this.body.rotation = freestylePhase * 0.08; // Body roll (Z-axis rotation)
                break;

            case 'backstroke':
                const backstrokePhase = Math.cos(this.animFrame * Math.PI / 4);
                const backstrokeSideOffset = backstrokePhase * (7 + intensity * 1.2); // Sideways offset

                // Sideways arm movement (Screen X-axis)
                this.leftArm.x = this.x - 7 + backstrokeSideOffset;
                this.rightArm.x = this.x + 7 - backstrokeSideOffset;

                // Forward/backward arm reach ("over the head" - Screen Y-axis, negative is "up")
                // Arms reach "upwards" (decreasing Y) and then pull "downwards" (increasing Y) relative to armBaseY
                this.leftArm.y = armBaseY - (backstrokePhase > 0 ? Math.abs(backstrokePhase) * 5 : -Math.abs(backstrokePhase) * 3); // Reach up, pull down
                this.rightArm.y = armBaseY - (backstrokePhase < 0 ? Math.abs(backstrokePhase) * 5 : -Math.abs(backstrokePhase) * 3); // Reach up, pull down

                this.leftArm.rotation = backstrokePhase * 0.7;
                this.rightArm.rotation = -backstrokePhase * 0.7;

                const backKickSide = Math.sin(this.animFrame * Math.PI / 2) * (3 + intensity * 1.1); // Sideways kick
                // Sideways leg kick (Screen X-axis)
                this.leftLeg.x = this.x - 4 + backKickSide;
                this.rightLeg.x = this.x + 4 - backKickSide;
                
                // Legs base Y position
                this.leftLeg.y = legBaseY;
                this.rightLeg.y = legBaseY;

                // Feet X (sideways motion)
                this.leftFoot.x = (this.x - 4) + backKickSide * 0.8;
                this.rightFoot.x = (this.x + 4) - backKickSide * 0.8;
                
                // Feet Y (base position)
                this.leftFoot.y = feetBaseY;
                this.rightFoot.y = feetBaseY;

                this.head.setFillStyle(0xffeedd); // Keep face up color
                break;

            case 'breaststroke':
                const breastPhase = Math.sin(this.animFrame * Math.PI / 3) * (1 + intensity * 0.5);
                const armSweepSide = Math.abs(breastPhase) * 10; // Sideways sweep

                // Sideways arm sweep (Screen X-axis)
                this.leftArm.x = this.x - 7 - armSweepSide;
                this.rightArm.x = this.x + 7 + armSweepSide;

                // Forward/backward arm pull (Screen Y-axis, negative is "forward/up")
                const armForwardExtensionY = Math.cos(this.animFrame * Math.PI / 3) * 5;
                this.leftArm.y = armBaseY - armForwardExtensionY; // Moves "up"
                this.rightArm.y = armBaseY - armForwardExtensionY; // Moves "up"

                // Arm "length" (height of rectangle) changes during sweep
                this.leftArm.height = 8 + armSweepSide * 0.6;
                this.rightArm.height = 8 + armSweepSide * 0.6;
                this.leftArm.rotation = breastPhase * 0.3;
                this.rightArm.rotation = -breastPhase * 0.3;

                const breastKickPhase = Math.sin(this.animFrame * Math.PI / 3);
                const legSeparationSide = Math.abs(breastKickPhase) * 4; // Sideways separation
                // Sideways leg separation (Screen X-axis)
                this.leftLeg.x = this.x - 4 - legSeparationSide;
                this.rightLeg.x = this.x + 4 + legSeparationSide;

                // Backward leg propulsion (Screen Y-axis, positive is "backward/down")
                // Legs start at legBaseY (this.y + 8). Propulsion moves them further "down" (increasing Y).
                const legPropulsionY = Math.max(0, breastKickPhase) * 4;
                this.leftLeg.y = legBaseY + legPropulsionY;
                this.rightLeg.y = legBaseY + legPropulsionY;

                // Feet follow legs
                this.leftFoot.x = this.x - 4 - legSeparationSide * 1.3;
                this.rightFoot.x = this.x + 4 + legSeparationSide * 1.3;
                this.leftFoot.y = legBaseY + Math.max(0, breastKickPhase) * 3 + 8; // Relative to legBaseY, then add offset to feet
                this.rightFoot.y = legBaseY + Math.max(0, breastKickPhase) * 3 + 8;


                // Body undulation (along length of swimmer - Y-axis)
                this.body.scaleY = 1.0 + Math.sin(this.animFrame * Math.PI / 3) * 0.2;
                this.body.scaleX = 1.0; // Reset scaleX
                break;

            case 'butterfly':
                const butterflyPhase = Math.sin(this.animFrame * Math.PI / 2.5) * (1 + intensity * 0.3);
                const wingSpanSide = Math.abs(butterflyPhase) * 7; // Sideways wingspan element

                // Sideways arm movement (Screen X-axis, together)
                this.leftArm.x = this.x - 7 + butterflyPhase * 5;
                this.rightArm.x = this.x + 7 + butterflyPhase * 5; // Note: original had same direction, might need one to be - for outward flap

                // Forward/backward arm sweep (Screen Y-axis, together, negative is "forward/up")
                const armSweepY = Math.cos(this.animFrame * Math.PI / 2.5) * 6;
                this.leftArm.y = armBaseY - armSweepY;
                this.rightArm.y = armBaseY - armSweepY;

                this.leftArm.rotation = butterflyPhase * 0.8;
                this.rightArm.rotation = butterflyPhase * 0.8; // Arms rotate together
                // Arm "length" (height of rectangle) changes
                this.leftArm.height = 8 + wingSpanSide * 0.4;
                this.rightArm.height = 8 + wingSpanSide * 0.4;

                const dolphinKickSide = Math.sin(this.animFrame * Math.PI / 2.5) * (4 + intensity * 1.2); // Sideways kick
                // Sideways leg kick (Screen X-axis, together)
                this.leftLeg.x = this.x - 4 + dolphinKickSide;
                this.rightLeg.x = this.x + 4 + dolphinKickSide; // Should be same direction for dolphin kick X component

                // Forward/backward leg undulation (Screen Y-axis, negative is "forward/up" part of wave)
                // Legs start at legBaseY. Undulation moves Y.
                const legUndulationY = Math.sin(this.animFrame * Math.PI / 2.5) * 3;
                this.leftLeg.y = legBaseY - legUndulationY;
                this.rightLeg.y = legBaseY - legUndulationY;

                // Feet follow legs
                this.leftFoot.x = this.x - 4 + dolphinKickSide * 1.3;
                this.rightFoot.x = this.x + 4 + dolphinKickSide * 1.3; // Same X direction
                const footUndulationY = Math.sin(this.animFrame * Math.PI / 2.5) * 4;
                // Feet start at feetBaseY. Undulation moves Y.
                this.leftFoot.y = feetBaseY - footUndulationY;
                this.rightFoot.y = feetBaseY - footUndulationY;

                // Body undulation (along length - Y-axis)
                this.body.scaleY = 1.0 + Math.sin(this.animFrame * Math.PI / 2.5) * 0.3;
                this.body.scaleX = 1.0; // Reset
                this.body.rotation = Math.sin(this.animFrame * Math.PI / 2.5) * 0.15; // Roll

                // Head/Cap movement (Screen Y-axis bobbing, negative is "up")
                const headBobY = Math.sin(this.animFrame * Math.PI / 2.5) * 4;
                this.head.y = headBaseY - headBobY;
                this.cap.y = headBaseY - headBobY - 2; // Cap is slightly above head center
                // Head X is fixed relative to swimmer's X (center of lane)
                this.head.x = this.x;
                this.cap.x = this.x; // Cap X aligned with head X

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
            momentumGain = 1.5; // Reduced from 40 to slow progression
            
            // Timing bonus for good rhythm (250-700ms for tighter timing window)
            if (this.strokeCount > 1) {
                if (timeSinceLastStroke >= 250 && timeSinceLastStroke <= 700) {
                    momentumGain += 0.5; // Reduced bonus from 10 to 5
                } else if (timeSinceLastStroke < 250) {
                    momentumGain += 0; // Reduced bonus from 3 to 2
                } else if (timeSinceLastStroke > 1000) {
                    momentumGain -= 1; // Keep penalty the same
                }
            }
            
            // Add momentum and update expected key
            this.momentum = Math.min(this.maxMomentum, this.momentum + momentumGain);
            this.expectedNextKey = keyPressed === 'left' ? 'right' : 'left';
            
        } else {
            // Wrong key - MASSIVE PENALTY for miss tapping
            wasCorrectKey = false;
            this.missTapCount++; // Track miss taps
            this.momentum = Math.max(0, this.momentum - 8); // Increased penalty from 60 to 80
            
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
            let baseMomentum = 6; // Slightly increased from 50 to give better start momentum
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