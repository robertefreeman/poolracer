import Swimmer from '../sprites/Swimmer.js';
import { raceConfig } from '../config/gameConfig.js';
import { MobileDetection } from '../utils/MobileDetection.js';

export default class RaceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RaceScene' });
    }

    init(data) {
        this.strokeType = data.strokeType || 'freestyle';
        this.playerName = data.playerName || 'Anonymous';
    }

    create() {
        this.displayedRaceDistanceMeters = 25;
        const actualRaceDistanceFactor = 10; // Makes the race 10x longer
        this.actualRaceDistanceMeters = this.displayedRaceDistanceMeters * actualRaceDistanceFactor;

        this.pixelsPerMeter = 100; // Pixels per one actual meter

        // This is the property Swimmer.js currently uses for finish condition via this.scene.raceDistanceMeters
        this.raceDistanceMeters = this.actualRaceDistanceMeters;

        this.poolWorldLength = this.actualRaceDistanceMeters * this.pixelsPerMeter;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.physics.world.setBounds(0, 0, width, this.poolWorldLength);
        this.cameras.main.setBounds(0, 0, width, this.poolWorldLength);

        // Mobile detection and layout configuration
        this.isMobile = MobileDetection.isMobile();
        this.isPortrait = MobileDetection.isPortrait();
        this.portraitConfig = MobileDetection.getPortraitLayoutConfig();
        this.mobileControls = null;

        // Create pool background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0066cc);
        
        // Create pool lanes (adapted for portrait if needed)
        this.createPool();
        
        // Create swimmers
        this.swimmers = [];
        this.createSwimmers();
        
        // Find the player swimmer
        const playerSwimmer = this.swimmers.find(s => s.isPlayer);

        if (playerSwimmer) {
            // Make the camera follow the player swimmer
            // Parameters: target, roundPixels, lerpX, lerpY, offsetX, offsetY
            // We want smooth follow on Y, no follow on X (camera stays centered horizontally)
            // offsetY will position the player a bit below the center of the viewport.
            // For a screen height of, say, 720, an offset of 150-200 might be good.
            const verticalOffset = height * 0.25; // Player at 1/4 from bottom of screen
            this.cameras.main.startFollow(playerSwimmer.body, true, 0.1, 0.1, 0, verticalOffset);
            // Note: Following playerSwimmer.body (a Phaser GameObject) is typical.
            // If playerSwimmer itself is a Container, you might follow that.
            // Ensure playerSwimmer.body is the correct main visual part to follow.
        } else {
            console.error("Player swimmer not found, camera follow not initiated.");
        }

        // UI elements
        this.createUI();
        
        // Game state
        this.raceStarted = false;
        this.raceFinished = false;
        this.startTime = 0;
        this.finishedSwimmers = [];
        this.countdownActive = false;
        
        // Input handling
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Create mobile controls if needed
        if (this.isMobile) {
            this.createMobileControls();
        }
        
        // Start countdown
        this.startCountdown();
    }
    
    createPool() {
        const width = this.cameras.main.width;
        // const height = this.cameras.main.height; // Screen height, not pool world length

        // Pool Background
        this.add.rectangle(width / 2, this.poolWorldLength / 2, width, this.poolWorldLength, 0x0055aa); // Darker blue for depth

        const laneWorldWidth = width * 0.8 / raceConfig.lanes; // Use a portion of screen width
        const firstLaneX = (width - (laneWorldWidth * raceConfig.lanes)) / 2 + (laneWorldWidth / 2);

        for (let i = 0; i < raceConfig.lanes + 1; i++) { // Draw N+1 lines for N lanes
            const lineX = (firstLaneX - laneWorldWidth/2) + (i * laneWorldWidth);
            this.add.line(0, 0, lineX, 0, lineX, this.poolWorldLength, 0xffffff, 0.5).setOrigin(0,0);
        }

        const startLineY = this.poolWorldLength - 50;
        const finishLineY = 50;
        this.add.rectangle(width / 2, startLineY, width, 4, 0x00ff00);  // Start line (green)
        this.add.rectangle(width / 2, finishLineY, width, 4, 0xff0000); // Finish line (red)

        // Halfway marker
        const halfwayY = this.poolWorldLength / 2;
        this.add.rectangle(width / 2, halfwayY, width, 2, 0xcccccc);
        this.add.text(width / 2 + 10, halfwayY, `${this.displayedRaceDistanceMeters / 2}m`, {
            font: '12px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }); // style
    }
    
    // createPortraitPool() can be removed or kept if it has other uses, but is not called by createPool anymore.
    createPortraitPool() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const config = this.portraitConfig;
        // const laneWidth = config.laneWidth;
        
        // Enhanced pool background with gradient
        const poolGradient = this.add.rectangle(width / 2, height / 2, width, height, 0x0066cc);
        
        // Add water effects
        this.waterEffects = [];
        for (let i = 0; i < 10; i++) {
            const bubble = this.add.circle(
                Phaser.Math.Between(50, width - 50),
                Phaser.Math.Between(100, height - 200),
                Phaser.Math.Between(2, 6),
                0x87ceeb,
                0.3
            );
            
            this.waterEffects.push(bubble);
            
            this.tweens.add({
                targets: bubble,
                x: bubble.x + Phaser.Math.Between(-20, 20),
                alpha: 0,
                duration: Phaser.Math.Between(3000, 6000),
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
        
        // Vertical lane dividers for portrait mode
        const laneWidth = config && config.laneWidth ? config.laneWidth : width * 0.8 / raceConfig.lanes;
        const startX = (width - (laneWidth * raceConfig.lanes)) / 2;
        for (let i = 1; i < raceConfig.lanes; i++) {
            const x = startX + (i * laneWidth);
            
            // Lane rope (vertical dashed line)
            // This loop should use this.poolWorldLength
            for (let yPos = 100; yPos < this.poolWorldLength - 100; yPos += 20) { // Example change
                const rope = this.add.rectangle(x, yPos + 10, 2, 10, 0xffffff);
                
                this.tweens.add({
                    targets: rope,
                    x: x + Math.sin((yPos / 100) * Math.PI) * 2,
                    duration: 2000 + (yPos * 10),
                    repeat: -1,
                    yoyo: true,
                    ease: 'Sine.easeInOut'
                });
            }
        }
        
        // Pool edges - should use this.poolWorldLength
        this.add.rectangle(width / 2, 5, width * 0.9, 10, 0x333333); // Top edge
        this.add.rectangle(width / 2, this.poolWorldLength - 5, width * 0.9, 10, 0x333333); // Bottom edge
        
        // Start and finish lines (horizontal for portrait) - should use this.poolWorldLength
        const newStartLineY = this.poolWorldLength - 50; // Near bottom of world
        const newFinishLineY = 50; // Near top of world

        const startLine = this.add.rectangle(width / 2, newStartLineY, width * 0.9, 4, 0x00ff00);
        const finishLine = this.add.rectangle(width / 2, newFinishLineY, width * 0.9, 4, 0xff0000);
        
        // Animated lines
        this.tweens.add({
            targets: startLine,
            alpha: 0.6,
            duration: 1000,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
        
        this.tweens.add({
            targets: finishLine,
            alpha: 0.8,
            scaleY: 1.2,
            duration: 800,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
        
        // Halfway marker - should use this.poolWorldLength
        const halfwayYPortrait = this.poolWorldLength / 2;
        const halfwayMarker = this.add.rectangle(width / 2, halfwayYPortrait, width * 0.9, 2, 0xcccccc);
        
        this.add.text(width / 2, halfwayYPortrait - 20, `${this.raceDistanceMeters / 2}m`, {
            font: '12px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: halfwayMarker,
            alpha: 0.7,
            duration: 1500,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
    }
    
    createSwimmers() {
        const width = this.cameras.main.width;
        // const height = this.cameras.main.height; // Not directly needed for Y position anymore
        
        const laneWorldWidth = width * 0.8 / raceConfig.lanes;
        const firstLaneX = (width - (laneWorldWidth * raceConfig.lanes)) / 2 + (laneWorldWidth / 2);
        const swimmerStartY = this.poolWorldLength - 100; // Start swimmers a bit above the absolute bottom start line

        for (let i = 0; i < raceConfig.lanes; i++) {
            const swimmerX = firstLaneX + (i * laneWorldWidth);
            const isPlayer = i === raceConfig.playerLane;
            
            const swimmer = new Swimmer(
                this, // scene context
                swimmerX,
                swimmerStartY,
                i,      // lane index
                isPlayer,
                this.strokeType,
                true    // isPortraitMode is now always true
            );
            this.swimmers.push(swimmer);
        }
    }
    
    createUI() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Timer
        this.timerText = this.add.text(10, 10, 'Time: 0.00', {
            font: '18px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.timerText.setScrollFactor(0);
        
        // Stroke type
        this.strokeText = this.add.text(10, 40, `Stroke: ${this.strokeType}`, {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.strokeText.setScrollFactor(0);
        
        // Momentum meter for player
        let currentY = 70;
        this.momentumMeter = this.add.rectangle(10, currentY, 100, 20, 0x333333);
        this.momentumMeter.setScrollFactor(0);
        this.momentumBar = this.add.rectangle(10, currentY, 0, 16, 0x00ff00);
        this.momentumBar.setOrigin(0, 0.5).setScrollFactor(0);
        
        const momentumLabel = this.add.text(10, currentY + 20, 'Momentum', { // Adjusted Y for label
            font: '12px Arial',
            fill: '#ffffff'
        });
        momentumLabel.setScrollFactor(0);
        currentY += 40; // Next group Y
        
        // Click frequency meter
        this.frequencyMeter = this.add.rectangle(10, currentY, 100, 15, 0x333333);
        this.frequencyMeter.setScrollFactor(0);
        this.frequencyBar = this.add.rectangle(10, currentY, 0, 11, 0x00ffff);
        this.frequencyBar.setOrigin(0, 0.5).setScrollFactor(0);
        
        const frequencyLabel = this.add.text(10, currentY + 15, 'Click Frequency', { // Adjusted Y
            font: '10px Arial',
            fill: '#ffffff'
        });
        frequencyLabel.setScrollFactor(0);
        currentY += 35;

        // Click rate meter
        this.rateMeter = this.add.rectangle(10, currentY, 100, 15, 0x333333);
        this.rateMeter.setScrollFactor(0);
        this.rateBar = this.add.rectangle(10, currentY, 50, 11, 0xffff00);
        this.rateBar.setOrigin(0, 0.5).setScrollFactor(0);
        
        const rateLabel = this.add.text(10, currentY + 15, 'Click Rate', { // Adjusted Y
            font: '10px Arial',
            fill: '#ffffff'
        });
        rateLabel.setScrollFactor(0);
        currentY += 35;
        
        // Speed multiplier display
        this.speedMultiplierText = this.add.text(10, currentY, 'Speed: 1.0x', {
            font: '12px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        });
        this.speedMultiplierText.setScrollFactor(0);
        currentY += 25;
        
        // Miss tap counter
        this.missTapText = this.add.text(10, currentY, 'Miss Taps: 0', {
            font: '12px Arial',
            fill: '#ff6666',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        });
        this.missTapText.setScrollFactor(0);
        currentY += 25;
        
        // Accuracy display
        this.accuracyText = this.add.text(10, currentY, 'Accuracy: 100%', {
            font: '12px Arial',
            fill: '#66ff66',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        });
        this.accuracyText.setScrollFactor(0);
        currentY += 25;
        
        // Dive bonus display
        this.diveBonusText = this.add.text(10, currentY, 'Dive Bonus: 1.0x', {
            font: '12px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        });
        this.diveBonusText.setScrollFactor(0);
        currentY += 25;
        
        // Speed penalty display
        this.speedPenaltyText = this.add.text(10, currentY, 'Penalty: None', {
            font: '12px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        });
        this.speedPenaltyText.setScrollFactor(0);
        
        // Instructions (adapt for mobile and orientation)
        const instructionTextContent = this.isMobile ?
            'TAP DIVE button, then alternate LEFT/RIGHT buttons to swim!' :
            'SPACEBAR to dive, then alternate LEFT/RIGHT keys to swim!';
        
        const instructionFontSize = this.isPortrait ? '14px' : (this.isMobile ? '16px' : '18px');
            
        this.instructionText = this.add.text(width / 2, height - 100, instructionTextContent, {
            font: `bold ${instructionFontSize} Arial`,
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            backgroundColor: '#000000cc',
            padding: { x: 15, y: 8 },
            align: 'center',
            wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5);
        this.instructionText.setScrollFactor(0);

        // Additional tip - positioned below instructions
        const tipText = this.add.text(width / 2, height - 70, 'Perfect timing = maximum speed!', {
            font: 'bold 14px Arial',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: '#000000cc',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        tipText.setScrollFactor(0);
        
        // Next key indicator
        this.nextKeyIndicator = this.add.text(width / 2, 30, '← PRESS LEFT', { // Repositioned
            font: 'bold 24px Arial',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.nextKeyIndicator.setScrollFactor(0);
        
        // Dive status indicator
        this.diveStatusText = this.add.text(width / 2, 60, 'Press SPACEBAR to dive!', { // Repositioned
            font: '14px Arial',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        }).setOrigin(0.5); // Centered origin
        this.diveStatusText.setScrollFactor(0);
        
        // Countdown text
        this.countdownText = this.add.text(width / 2, height / 2, '', { // Screen centered
            font: 'bold 48px Arial',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.countdownText.setScrollFactor(0);
    }
    
    startCountdown() {
        this.countdownActive = true;
        let count = 3;
        
        const countdown = () => {
            if (count > 0) {
                this.countdownText.setText(count.toString());
                count--;
                this.time.delayedCall(1000, countdown);
            } else {
                this.countdownText.setText('GO!');
                this.time.delayedCall(500, () => {
                    this.countdownText.setVisible(false);
                    this.startRace();
                });
            }
        };
        
        countdown();
    }
    
    startRace() {
        this.raceStarted = true;
        this.countdownActive = false;
        this.startTime = this.time.now;
        this.raceStartTime = this.time.now; // Track exact race start for dive timing
        
        // Allow dive start for a brief period
        this.canDive = true;
        this.time.delayedCall(1000, () => {
            this.canDive = false;
            // If player hasn't dived by now, force them to dive to prevent infinite race
            const player = this.swimmers[raceConfig.playerLane];
            if (player && !player.hasDived) {
                player.dive(this.time.now, { multiplier: 1.0, type: 'late' });
                this.showDiveTimingFeedback({ multiplier: 1.0, type: 'late' });
            }
        });
    }
    
    update(time, delta) {
        if (!this.raceStarted || this.raceFinished) return;
        
        // Update timer
        const raceTime = (time - this.startTime) / 1000;
        this.timerText.setText(`Time: ${raceTime.toFixed(2)}`);
        
        // Failsafe: End race after 60 seconds regardless
        if (raceTime > 60) {
            console.log('FAILSAFE: Race timeout after 60 seconds');
            this.forceEndRace();
            return;
        }
        
        // Handle player input
        this.handleInput(time);
        
        // Update all swimmers
        this.swimmers.forEach(swimmer => swimmer.update(time, delta));
        
        // Check if any swimmer has finished and force end if needed
        const anyFinished = this.swimmers.some(swimmer => swimmer.finished);
        if (anyFinished && this.finishedSwimmers.length === 0) {
            console.log('FAILSAFE: Swimmer finished but not recorded, forcing race end');
            this.forceEndRace();
            return;
        }
        
        // Update momentum meter and UI for player
        const player = this.swimmers[raceConfig.playerLane];
        if (player) {
            // Update momentum bar
            const momentumWidth = (player.momentum / player.maxMomentum) * 80;
            this.momentumBar.width = Math.max(0, momentumWidth);
            
            // Color based on momentum level
            if (player.momentum > 130) {
                this.momentumBar.setFillStyle(0x00ff00); // Green - high momentum
            } else if (player.momentum > 70) {
                this.momentumBar.setFillStyle(0xffff00); // Yellow - medium momentum
            } else {
                this.momentumBar.setFillStyle(0xff0000); // Red - low momentum
            }
            
            // Update click frequency bar
            const frequencyWidth = (player.frequencySpeedMultiplier - 1.0) / 0.5 * 80; // 0.5 is max bonus
            this.frequencyBar.width = Math.max(0, Math.min(80, frequencyWidth));
            
            // Update click rate bar (centered at 50, showing deviation from 1.0x)
            const rateDeviation = player.clickRateMultiplier - 1.0; // -0.5 to +1.0 range
            const rateWidth = Math.abs(rateDeviation) * 40; // Scale to bar width
            this.rateBar.width = Math.max(5, Math.min(80, rateWidth + 20));
            
            // Color rate bar based on performance
            if (player.clickRateMultiplier > 1.2) {
                this.rateBar.setFillStyle(0x00ff00); // Green - fast clicking bonus
            } else if (player.clickRateMultiplier > 0.9) {
                this.rateBar.setFillStyle(0xffff00); // Yellow - normal rate
            } else {
                this.rateBar.setFillStyle(0xff0000); // Red - slow clicking penalty
            }
            
            // Update speed multiplier text
            const totalMultiplier = player.frequencySpeedMultiplier * player.clickRateMultiplier * player.diveBonus * player.speedPenaltyMultiplier;
            this.speedMultiplierText.setText(`Speed: ${totalMultiplier.toFixed(1)}x`);
            
            // Color speed multiplier text
            if (totalMultiplier > 1.5) {
                this.speedMultiplierText.setFill('#00ff00'); // Green - high speed
            } else if (totalMultiplier > 1.0) {
                this.speedMultiplierText.setFill('#ffff00'); // Yellow - bonus speed
            } else {
                this.speedMultiplierText.setFill('#ff0000'); // Red - penalty speed
            }
            
            // Update miss tap counter
            this.missTapText.setText(`Miss Taps: ${player.missTapCount}`);
            
            // Update accuracy display
            const accuracy = player.totalTapCount > 0 ? 
                ((player.totalTapCount - player.missTapCount) / player.totalTapCount * 100) : 100;
            this.accuracyText.setText(`Accuracy: ${accuracy.toFixed(0)}%`);
            
            // Color accuracy text
            if (accuracy >= 90) {
                this.accuracyText.setFill('#00ff00'); // Green - excellent
            } else if (accuracy >= 75) {
                this.accuracyText.setFill('#ffff00'); // Yellow - good
            } else {
                this.accuracyText.setFill('#ff0000'); // Red - poor
            }
            
            // Update dive bonus display
            this.diveBonusText.setText(`Dive Bonus: ${player.diveBonus.toFixed(2)}x`);
            
            // Color dive bonus text based on bonus level
            if (player.diveBonus >= 1.8) {
                this.diveBonusText.setFill('#00ff00'); // Green - excellent dive
            } else if (player.diveBonus >= 1.4) {
                this.diveBonusText.setFill('#66ff66'); // Light green - great dive
            } else if (player.diveBonus >= 1.2) {
                this.diveBonusText.setFill('#ccff00'); // Yellow-green - good dive
            } else if (player.diveBonus > 1.0) {
                this.diveBonusText.setFill('#ffff00'); // Yellow - small bonus
            } else {
                this.diveBonusText.setFill('#ffffff'); // White - no bonus
            }
            
            // Update speed penalty display
            if (player.speedPenaltyTimer > 0) {
                const penaltyTime = (player.speedPenaltyTimer / 1000).toFixed(1);
                this.speedPenaltyText.setText(`Penalty: ${penaltyTime}s (${(player.speedPenaltyMultiplier * 100).toFixed(0)}%)`);
                this.speedPenaltyText.setFill('#ff6600');
            } else {
                this.speedPenaltyText.setText('Penalty: None');
                this.speedPenaltyText.setFill('#ffffff');
            }
            
            // Update next key indicator
            if (!player.hasDived) {
                this.nextKeyIndicator.setText(this.isMobile ? 'TAP DIVE BUTTON' : 'SPACEBAR TO DIVE');
                this.nextKeyIndicator.setFill('#ffff00');
            } else {
                if (player.expectedNextKey === 'left') {
                    this.nextKeyIndicator.setText(this.isMobile ? '← TAP LEFT' : '← PRESS LEFT');
                    this.nextKeyIndicator.setFill('#00ff00');
                } else {
                    this.nextKeyIndicator.setText(this.isMobile ? 'TAP RIGHT →' : 'PRESS RIGHT →');
                    this.nextKeyIndicator.setFill('#00ff00');
                }
            }
            
            // Update mobile button states
            if (this.isMobile) {
                this.updateMobileButtonStates(player);
            }
            
            // Update dive/swim status
            if (!player.hasDived) {
                this.diveStatusText.setText('Press SPACEBAR to dive!');
                this.diveStatusText.setFill('#ffff00');
            } else if (player.momentum > 80) {
                this.diveStatusText.setText('Swimming fast!');
                this.diveStatusText.setFill('#00ff00');
            } else if (player.momentum > 30) {
                this.diveStatusText.setText('Keep alternating!');
                this.diveStatusText.setFill('#ffff00');
            } else {
                this.diveStatusText.setText('Slowing down - tap faster!');
                this.diveStatusText.setFill('#ff0000');
            }
        }
    }
    
    handleInput(time) {
        const player = this.swimmers[raceConfig.playerLane];
        if (!player) return;
        
        // Dive start
        if (this.canDive && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            const diveTimingBonus = this.calculateDiveTimingBonus(time);
            player.dive(time, diveTimingBonus);
            this.showDiveTimingFeedback(diveTimingBonus);
            this.canDive = false;
        }
        
        // Swimming strokes
        let keyPressed = null;
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            keyPressed = 'left';
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            keyPressed = 'right';
        }
        
        if (keyPressed) {
            const quality = player.stroke(time, keyPressed);
            
            // Visual feedback
            if (quality > 0.8) {
                this.cameras.main.shake(50, 0.01);
            }
        }
    }
    
    swimmerFinished(swimmer) {
        console.log(`=== SWIMMER FINISHED ===`);
        console.log(`Swimmer: Lane ${swimmer.lane}, Player: ${swimmer.isPlayer}, Position: ${swimmer.position}`);
        console.log(`Current finished count: ${this.finishedSwimmers.length}, Total swimmers: ${this.swimmers.length}`);
        
        const place = this.finishedSwimmers.length + 1;
        const time = (swimmer.finishTime - this.startTime) / 1000;
        
        console.log(`Assigning place ${place}, time ${time.toFixed(2)}s`);
        
        this.finishedSwimmers.push({
            swimmer: swimmer,
            time: time,
            place: place
        });
        
        // Create finish celebration effect
        this.createFinishCelebration(swimmer, place);
        
        console.log(`After adding: ${this.finishedSwimmers.length} finished out of ${this.swimmers.length} total`);
        
        // Check if race is complete
        if (this.finishedSwimmers.length >= this.swimmers.length) {
            console.log('All swimmers finished, ending race...');
            this.endRace();
        } else {
            console.log(`Waiting for ${this.swimmers.length - this.finishedSwimmers.length} more swimmers to finish`);
        }
    }
    
    createFinishCelebration(swimmer, place) {
        // Finish line explosion effect
        const explosionCount = swimmer.isPlayer ? 20 : 10;
        
        for (let i = 0; i < explosionCount; i++) {
            const particle = this.add.circle(
                swimmer.x,
                swimmer.y + Phaser.Math.Between(-15, 15),
                Phaser.Math.Between(2, 5),
                place === 1 ? 0xffd700 : (place === 2 ? 0xc0c0c0 : (place === 3 ? 0xcd7f32 : 0x87ceeb)),
                0.9
            );
            
            this.tweens.add({
                targets: particle,
                x: particle.x + Phaser.Math.Between(-50, 50),
                y: particle.y + Phaser.Math.Between(-30, 30),
                alpha: 0,
                scaleX: 0.1,
                scaleY: 0.1,
                duration: Phaser.Math.Between(500, 1000),
                ease: 'Power2.easeOut',
                onComplete: () => particle.destroy()
            });
        }
        
        // Place indicator
        let placeText = '';
        let placeColor = '#ffffff';
        
        switch (place) {
            case 1:
                placeText = '🥇 1ST PLACE!';
                placeColor = '#ffd700';
                break;
            case 2:
                placeText = '🥈 2ND PLACE!';
                placeColor = '#c0c0c0';
                break;
            case 3:
                placeText = '🥉 3RD PLACE!';
                placeColor = '#cd7f32';
                break;
            default:
                placeText = `${place}TH PLACE`;
                placeColor = '#ffffff';
                break;
        }
        
        const placeIndicator = this.add.text(swimmer.x, swimmer.y - 40, placeText, {
            font: 'bold 16px Arial',
            fill: placeColor,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Animate place indicator
        this.tweens.add({
            targets: placeIndicator,
            y: placeIndicator.y - 20,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        this.tweens.add({
            targets: placeIndicator,
            alpha: 0,
            duration: 2000,
            delay: 1500,
            onComplete: () => placeIndicator.destroy()
        });
        
        // Special effects for player finishing
        if (swimmer.isPlayer) {
            // Screen flash
            const flash = this.add.rectangle(640, 360, 1280, 720, 0xffffff, 0.3);
            this.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 400,
                onComplete: () => flash.destroy()
            });
            
            // Camera shake
            this.cameras.main.shake(300, 0.01);
        }
    }
    
    calculateDiveTimingBonus(currentTime) {
        const timeSinceRaceStart = currentTime - this.raceStartTime;
        
        // Perfect start: within 100ms of race start (0.1 seconds) - reduced bonus
        if (timeSinceRaceStart <= 100) {
            return { multiplier: 1.4, type: 'perfect' };
        }
        // Excellent start: within 200ms - reduced bonus
        else if (timeSinceRaceStart <= 200) {
            return { multiplier: 1.3, type: 'excellent' };
        }
        // Great start: within 300ms - reduced bonus
        else if (timeSinceRaceStart <= 300) {
            return { multiplier: 1.2, type: 'great' };
        }
        // Good start: within 500ms - reduced bonus
        else if (timeSinceRaceStart <= 500) {
            return { multiplier: 1.1, type: 'good' };
        }
        // Normal start: within 1000ms
        else if (timeSinceRaceStart <= 1000) {
            return { multiplier: 1.0, type: 'normal' };
        }
        // Late start: after 1000ms (shouldn't happen as canDive becomes false) - no penalty
        else {
            return { multiplier: 1.0, type: 'late' };
        }
    }
    
    showDiveTimingFeedback(diveBonus) {
        let feedbackText = '';
        let feedbackColor = '#ffffff';
        
        switch (diveBonus.type) {
            case 'perfect':
                feedbackText = 'PERFECT START!';
                feedbackColor = '#00ff00';
                break;
            case 'excellent':
                feedbackText = 'EXCELLENT START!';
                feedbackColor = '#66ff66';
                break;
            case 'great':
                feedbackText = 'GREAT START!';
                feedbackColor = '#99ff99';
                break;
            case 'good':
                feedbackText = 'GOOD START!';
                feedbackColor = '#ccff00';
                break;
            case 'normal':
                feedbackText = 'START!';
                feedbackColor = '#ffffff';
                break;
            case 'late':
                feedbackText = 'LATE START';
                feedbackColor = '#ff6666';
                break;
        }
        
        // Create feedback text
        const feedback = this.add.text(400, 200, feedbackText, {
            font: 'bold 36px Arial',
            fill: feedbackColor,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Add multiplier text
        const multiplierText = this.add.text(400, 240, `${diveBonus.multiplier.toFixed(1)}x Start Bonus!`, {
            font: 'bold 24px Arial',
            fill: feedbackColor,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Animate feedback
        this.tweens.add({
            targets: [feedback, multiplierText],
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });
        
        // Fade out feedback
        this.tweens.add({
            targets: [feedback, multiplierText],
            alpha: 0,
            duration: 2000,
            delay: 1000,
            onComplete: () => {
                feedback.destroy();
                multiplierText.destroy();
            }
        });
        
        // Screen flash for perfect start
        if (diveBonus.type === 'perfect') {
            const flash = this.add.rectangle(400, 300, 800, 600, 0xffffff, 0.3);
            this.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    flash.destroy();
                }
            });
        }
    }

    createMobileControls() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const controlSize = MobileDetection.getOptimalControlSize();
        
        // Adjust control size based on screen size and orientation
        let scale = Math.min(width / 1280, height / 720, 1);
        if (this.isPortrait) {
            scale = Math.min(width / 480, height / 854, 1);
            controlSize.width = Math.max(60, controlSize.width * scale);
            controlSize.height = Math.max(60, controlSize.height * scale);
        } else {
            controlSize.width *= scale;
            controlSize.height *= scale;
        }
        
        // Create mobile control container
        this.mobileControls = {
            diveButton: null,
            leftButton: null,
            rightButton: null,
            container: this.add.container(0, 0)
        };
        
        // Position controls based on orientation
        if (this.isPortrait) {
            // Portrait mode: stack controls vertically at bottom
            const buttonY = height - 80;
            const spacing = Math.min(controlSize.width + 20, width / 4);
            
            this.createDiveButton(width / 2, buttonY - 70, controlSize);
            this.createLeftButton(width / 2 - spacing, buttonY, controlSize);
            this.createRightButton(width / 2 + spacing, buttonY, controlSize);
        } else {
            // Landscape mode: horizontal layout
            const buttonY = height - 80;
            const spacing = 120;
            
            this.createDiveButton(width / 2, buttonY, controlSize);
            this.createLeftButton(width / 2 - spacing, buttonY, controlSize);
            this.createRightButton(width / 2 + spacing, buttonY, controlSize);
        }
        
        // Mobile-specific UI adjustments
        this.adjustUIForMobile();
    }
    
    createDiveButton(x, y, controlSize) {
        // Button background
        const diveButtonBg = this.add.circle(x, y, controlSize.width / 2, 0x0066cc, 0.8);
        diveButtonBg.setStrokeStyle(3, 0x66ccff, 1);
        
        // Button text
        const diveButtonText = this.add.text(x, y, 'DIVE', {
            font: `bold ${controlSize.fontSize} Arial`,
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Interactive area
        const diveButton = this.add.circle(x, y, controlSize.width / 2, 0x000000, 0)
            .setInteractive();
        
        // Store references
        this.mobileControls.diveButton = {
            bg: diveButtonBg,
            text: diveButtonText,
            button: diveButton
        };
        
        // Touch events
        diveButton.on('pointerdown', () => {
            this.handleMobileDive();
            this.animateButtonPress(diveButtonBg);
        });
        
        // Visual feedback
        diveButton.on('pointerover', () => {
            diveButtonBg.setFillStyle(0x0088ff, 0.9);
        });
        
        diveButton.on('pointerout', () => {
            diveButtonBg.setFillStyle(0x0066cc, 0.8);
        });
    }
    
    createLeftButton(x, y, controlSize) {
        // Button background
        const leftButtonBg = this.add.circle(x, y, controlSize.width / 2, 0x00cc66, 0.8);
        leftButtonBg.setStrokeStyle(3, 0x66ffcc, 1);
        
        // Button text
        const leftButtonText = this.add.text(x, y, '←', {
            font: `bold ${parseInt(controlSize.fontSize) + 8}px Arial`,
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Interactive area
        const leftButton = this.add.circle(x, y, controlSize.width / 2, 0x000000, 0)
            .setInteractive();
        
        // Store references
        this.mobileControls.leftButton = {
            bg: leftButtonBg,
            text: leftButtonText,
            button: leftButton
        };
        
        // Touch events
        leftButton.on('pointerdown', () => {
            this.handleMobileStroke('left');
            this.animateButtonPress(leftButtonBg);
        });
        
        // Visual feedback
        leftButton.on('pointerover', () => {
            leftButtonBg.setFillStyle(0x00ff88, 0.9);
        });
        
        leftButton.on('pointerout', () => {
            leftButtonBg.setFillStyle(0x00cc66, 0.8);
        });
    }
    
    createRightButton(x, y, controlSize) {
        // Button background
        const rightButtonBg = this.add.circle(x, y, controlSize.width / 2, 0xcc6600, 0.8);
        rightButtonBg.setStrokeStyle(3, 0xffcc66, 1);
        
        // Button text
        const rightButtonText = this.add.text(x, y, '→', {
            font: `bold ${parseInt(controlSize.fontSize) + 8}px Arial`,
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Interactive area
        const rightButton = this.add.circle(x, y, controlSize.width / 2, 0x000000, 0)
            .setInteractive();
        
        // Store references
        this.mobileControls.rightButton = {
            bg: rightButtonBg,
            text: rightButtonText,
            button: rightButton
        };
        
        // Touch events
        rightButton.on('pointerdown', () => {
            this.handleMobileStroke('right');
            this.animateButtonPress(rightButtonBg);
        });
        
        // Visual feedback
        rightButton.on('pointerover', () => {
            rightButtonBg.setFillStyle(0xff8800, 0.9);
        });
        
        rightButton.on('pointerout', () => {
            rightButtonBg.setFillStyle(0xcc6600, 0.8);
        });
    }
    
    adjustUIForMobile() {
        if (!this.isMobile) return;
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Move UI elements to avoid overlap with touch controls
        const uiElements = [
            this.timerText, this.strokeText, this.momentumMeter, this.momentumBar,
            this.frequencyMeter, this.frequencyBar, this.rateMeter, this.rateBar,
            this.speedMultiplierText, this.missTapText, this.accuracyText, this.diveBonusText
        ];
        
        // Scale down UI for mobile based on screen size
        const mobileScale = Math.min(width / 1280, height / 720, 0.8);
        uiElements.forEach(element => {
            if (element && element.setScale) {
                element.setScale(mobileScale);
            }
        });
        
        // Adjust instruction text position based on screen height and mobile controls
        if (this.instructionText) {
            if (this.isMobile) {
                this.instructionText.y = height - 180; // Higher up to avoid mobile controls
            } else {
                this.instructionText.y = height - 80; // Standard position for desktop
            }
        }
        
        // Adjust next key indicator for mobile
        if (this.nextKeyIndicator) {
            this.nextKeyIndicator.y = height * 0.15;
            this.nextKeyIndicator.setScale(mobileScale);
        }
        
        // Add orientation change warning if in portrait
        if (MobileDetection.shouldShowLandscapePrompt()) {
            this.showOrientationWarning();
        }
    }
    
    showOrientationWarning() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Semi-transparent overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        
        // Warning text
        const warningText = this.add.text(width / 2, height / 2, 
            '📱 Rotate to Landscape\nfor Better Experience', {
            font: 'bold 16px Arial',
            fill: '#ffff00',
            align: 'center'
        }).setOrigin(0.5);
        
        // Auto-hide after 3 seconds
        this.time.delayedCall(3000, () => {
            overlay.destroy();
            warningText.destroy();
        });
    }
    
    animateButtonPress(buttonBg) {
        this.tweens.add({
            targets: buttonBg,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }
    
    handleMobileDive() {
        const player = this.swimmers[raceConfig.playerLane];
        if (!player) return;
        
        if (this.canDive) {
            const diveTimingBonus = this.calculateDiveTimingBonus(this.time.now);
            player.dive(this.time.now, diveTimingBonus);
            this.showDiveTimingFeedback(diveTimingBonus);
            this.canDive = false;
            
            // Hide dive button and show stroke buttons
            this.mobileControls.diveButton.button.setVisible(false);
            this.mobileControls.diveButton.bg.setVisible(false);
            this.mobileControls.diveButton.text.setVisible(false);
        }
    }
    
    handleMobileStroke(direction) {
        const player = this.swimmers[raceConfig.playerLane];
        if (!player) return;
        
        const quality = player.stroke(this.time.now, direction);
        
        // Visual feedback
        if (quality > 0.8) {
            this.cameras.main.shake(50, 0.01);
        }
        
        // Update button colors based on expected next key
        this.updateMobileButtonStates(player);
    }
    
    updateMobileButtonStates(player) {
        if (!this.isMobile || !this.mobileControls) return;
        
        const { leftButton, rightButton } = this.mobileControls;
        
        if (player.hasDived) {
            // Highlight the expected next button
            if (player.expectedNextKey === 'left') {
                leftButton.bg.setFillStyle(0x00ff88, 1.0);
                rightButton.bg.setFillStyle(0xcc6600, 0.6);
            } else {
                rightButton.bg.setFillStyle(0xff8800, 1.0);
                leftButton.bg.setFillStyle(0x00cc66, 0.6);
            }
        }
    }

    endRace() {
        console.log('=== RACE ENDING ===');
        console.log('Finished swimmers count:', this.finishedSwimmers.length);
        console.log('Total swimmers:', this.swimmers.length);
        console.log('Race finished flag:', this.raceFinished);
        
        // Prevent multiple calls
        if (this.raceFinished) {
            console.log('Race already finished, ignoring duplicate call');
            return;
        }
        
        this.raceFinished = true;
        
        // Add visual indicator that race is ending
        const endingText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'RACE COMPLETE!', {
            font: 'bold 32px Arial',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Immediate transition - no delay to prevent hanging
        console.log('Transitioning to results immediately...');
        this.goToResults();
    }
    
    forceEndRace() {
        console.log('=== FORCE ENDING RACE ===');
        
        if (this.raceFinished) {
            console.log('Race already finished, ignoring force end');
            return;
        }
        
        this.raceFinished = true;
        
        // Create results for all swimmers based on their current positions
        this.finishedSwimmers = [];
        
        // Sort swimmers by position (furthest first)
        const sortedSwimmers = [...this.swimmers].sort((a, b) => b.position - a.position);
        
        sortedSwimmers.forEach((swimmer, index) => {
            const place = index + 1;
            const time = swimmer.finished ? 
                (swimmer.finishTime - this.startTime) / 1000 : 
                (this.time.now - this.startTime) / 1000; // Use current time if not finished
            
            this.finishedSwimmers.push({
                swimmer: swimmer,
                time: time,
                place: place
            });
            
            console.log(`Swimmer ${swimmer.lane} (${swimmer.isPlayer ? 'PLAYER' : 'AI'}): Place ${place}, Time ${time.toFixed(2)}s, Position ${swimmer.position.toFixed(0)}`);
        });
        
        console.log('Force ending complete, going to results...');
        this.goToResults();
    }

    goToResults() {
        console.log('goToResults called');
        try {
            // Always ensure we have results data
            if (!this.finishedSwimmers || this.finishedSwimmers.length === 0) {
                console.error('No finished swimmers data! Creating emergency results...');
                this.forceEndRace();
                return;
            }
            
            console.log('Starting ResultsScene with data:', {
                results: this.finishedSwimmers,
                strokeType: this.strokeType
            });
            
            this.scene.start('ResultsScene', {
                results: this.finishedSwimmers,
                strokeType: this.strokeType,
                playerName: this.playerName
            });
        } catch (error) {
            console.error('Error in goToResults:', error);
            // Ultimate fallback - go to menu
            console.log('Fallback to MenuScene');
            this.scene.start('MenuScene');
        }
    }
}