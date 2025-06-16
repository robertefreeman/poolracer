import Swimmer from '../sprites/Swimmer.js';
import { raceConfig } from '../config/gameConfig.js';

export default class RaceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RaceScene' });
    }

    init(data) {
        this.strokeType = data.strokeType || 'freestyle';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create pool background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0066cc);
        
        // Create pool lanes
        this.createPool();
        
        // Create swimmers
        this.swimmers = [];
        this.createSwimmers();
        
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
        
        // Start countdown
        this.startCountdown();
    }
    
    createPool() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const laneHeight = height / raceConfig.lanes;
        
        // Enhanced pool background with gradient
        const poolGradient = this.add.rectangle(width / 2, height / 2, width, height, 0x0066cc);
        
        // Add subtle water texture with animated circles
        this.waterEffects = [];
        for (let i = 0; i < 15; i++) {
            const bubble = this.add.circle(
                Phaser.Math.Between(100, width - 100),
                Phaser.Math.Between(50, height - 50),
                Phaser.Math.Between(3, 8),
                0x87ceeb,
                0.3
            );
            
            this.waterEffects.push(bubble);
            
            // Animate water bubbles
            this.tweens.add({
                targets: bubble,
                y: bubble.y - Phaser.Math.Between(20, 40),
                alpha: 0,
                duration: Phaser.Math.Between(3000, 6000),
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
        
        // Enhanced lane dividers with floating effect
        for (let i = 1; i < raceConfig.lanes; i++) {
            const y = i * laneHeight;
            
            // Lane rope (animated dashed line)
            for (let x = 0; x < width; x += 20) {
                const rope = this.add.rectangle(x + 10, y, 10, 2, 0xffffff);
                
                // Add gentle floating animation
                this.tweens.add({
                    targets: rope,
                    y: y + Math.sin((x / 100) * Math.PI) * 2,
                    duration: 2000 + (x * 10),
                    repeat: -1,
                    yoyo: true,
                    ease: 'Sine.easeInOut'
                });
            }
        }
        
        // Pool edges with enhanced styling
        this.add.rectangle(width / 2, 5, width, 10, 0x333333);
        this.add.rectangle(width / 2, height - 5, width, 10, 0x333333);
        
        // Enhanced start and finish lines
        const startLine = this.add.rectangle(80, height / 2, 4, height, 0x00ff00);
        const finishLine = this.add.rectangle(1200, height / 2, 4, height, 0xff0000);
        
        // Animated start line glow
        this.tweens.add({
            targets: startLine,
            alpha: 0.6,
            duration: 1000,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
        
        // Animated finish line glow
        this.tweens.add({
            targets: finishLine,
            alpha: 0.8,
            scaleX: 1.2,
            duration: 800,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
        
        // Distance markers with enhanced styling
        for (let i = 1; i < 4; i++) {
            const x = 80 + (i * 280);
            const marker = this.add.rectangle(x, height / 2, 2, height, 0xcccccc);
            
            this.add.text(x - 10, 10, `${i * 25}m`, {
                font: '12px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 1
            });
            
            // Subtle marker animation
            this.tweens.add({
                targets: marker,
                alpha: 0.7,
                duration: 1500 + (i * 200),
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
    }
    
    createSwimmers() {
        const height = this.cameras.main.height;
        const laneHeight = height / raceConfig.lanes;
        
        for (let i = 0; i < raceConfig.lanes; i++) {
            const y = (i + 0.5) * laneHeight;
            const isPlayer = i === raceConfig.playerLane;
            
            const swimmer = new Swimmer(
                this,
                80,
                y,
                i,
                isPlayer,
                this.strokeType
            );
            
            this.swimmers.push(swimmer);
        }
    }
    
    createUI() {
        // Timer
        this.timerText = this.add.text(10, 10, 'Time: 0.00', {
            font: '18px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        
        // Stroke type
        this.strokeText = this.add.text(10, 40, `Stroke: ${this.strokeType}`, {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        
        // Momentum meter for player
        this.momentumMeter = this.add.rectangle(10, 80, 100, 20, 0x333333);
        this.momentumBar = this.add.rectangle(10, 80, 0, 16, 0x00ff00);
        this.momentumBar.setOrigin(0, 0.5);
        
        this.add.text(10, 105, 'Momentum', {
            font: '12px Arial',
            fill: '#ffffff'
        });
        
        // Click frequency meter
        this.frequencyMeter = this.add.rectangle(10, 130, 100, 15, 0x333333);
        this.frequencyBar = this.add.rectangle(10, 130, 0, 11, 0x00ffff);
        this.frequencyBar.setOrigin(0, 0.5);
        
        this.add.text(10, 150, 'Click Frequency', {
            font: '10px Arial',
            fill: '#ffffff'
        });
        
        // Click rate meter
        this.rateMeter = this.add.rectangle(10, 170, 100, 15, 0x333333);
        this.rateBar = this.add.rectangle(10, 170, 50, 11, 0xffff00);
        this.rateBar.setOrigin(0, 0.5);
        
        this.add.text(10, 190, 'Click Rate', {
            font: '10px Arial',
            fill: '#ffffff'
        });
        
        // Speed multiplier display
        this.speedMultiplierText = this.add.text(10, 210, 'Speed: 1.0x', {
            font: '12px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        });
        
        // Miss tap counter
        this.missTapText = this.add.text(10, 235, 'Miss Taps: 0', {
            font: '12px Arial',
            fill: '#ff6666',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        });
        
        // Accuracy display
        this.accuracyText = this.add.text(10, 260, 'Accuracy: 100%', {
            font: '12px Arial',
            fill: '#66ff66',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        });
        
        // Dive bonus display
        this.diveBonusText = this.add.text(10, 285, 'Dive Bonus: 1.0x', {
            font: '12px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        });
        
        // Instructions
        this.instructionText = this.add.text(400, 550, 'SPACEBAR to dive, then alternate LEFT/RIGHT keys to swim! Click faster = swim faster!', {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        // Next key indicator
        this.nextKeyIndicator = this.add.text(400, 50, '← PRESS LEFT', {
            font: 'bold 24px Arial',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Dive status indicator
        this.diveStatusText = this.add.text(10, 130, 'Press SPACEBAR to dive!', {
            font: '14px Arial',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        });
        
        // Countdown text
        this.countdownText = this.add.text(400, 300, '', {
            font: 'bold 48px Arial',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
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
        });
    }
    
    update(time, delta) {
        if (!this.raceStarted || this.raceFinished) return;
        
        // Update timer
        const raceTime = (time - this.startTime) / 1000;
        this.timerText.setText(`Time: ${raceTime.toFixed(2)}`);
        
        // Handle player input
        this.handleInput(time);
        
        // Update all swimmers
        this.swimmers.forEach(swimmer => swimmer.update(time, delta));
        
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
            const totalMultiplier = player.frequencySpeedMultiplier * player.clickRateMultiplier;
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
            
            // Update next key indicator
            if (!player.hasDived) {
                this.nextKeyIndicator.setText('SPACEBAR TO DIVE');
                this.nextKeyIndicator.setFill('#ffff00');
            } else {
                if (player.expectedNextKey === 'left') {
                    this.nextKeyIndicator.setText('← PRESS LEFT');
                    this.nextKeyIndicator.setFill('#00ff00');
                } else {
                    this.nextKeyIndicator.setText('PRESS RIGHT →');
                    this.nextKeyIndicator.setFill('#00ff00');
                }
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
        const place = this.finishedSwimmers.length + 1;
        const time = (swimmer.finishTime - this.startTime) / 1000;
        
        this.finishedSwimmers.push({
            swimmer: swimmer,
            time: time,
            place: place
        });
        
        // Create finish celebration effect
        this.createFinishCelebration(swimmer, place);
        
        // Check if race is complete
        if (this.finishedSwimmers.length === this.swimmers.length) {
            this.endRace();
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
        
        // Perfect start: within 100ms of race start (0.1 seconds)
        if (timeSinceRaceStart <= 100) {
            return { multiplier: 2.0, type: 'perfect' };
        }
        // Excellent start: within 200ms
        else if (timeSinceRaceStart <= 200) {
            return { multiplier: 1.8, type: 'excellent' };
        }
        // Great start: within 300ms
        else if (timeSinceRaceStart <= 300) {
            return { multiplier: 1.6, type: 'great' };
        }
        // Good start: within 500ms
        else if (timeSinceRaceStart <= 500) {
            return { multiplier: 1.4, type: 'good' };
        }
        // Normal start: within 1000ms
        else if (timeSinceRaceStart <= 1000) {
            return { multiplier: 1.0, type: 'normal' };
        }
        // Late start: after 1000ms (shouldn't happen as canDive becomes false)
        else {
            return { multiplier: 0.8, type: 'late' };
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

    endRace() {
        this.raceFinished = true;
        
        this.time.delayedCall(2000, () => {
            this.scene.start('ResultsScene', {
                results: this.finishedSwimmers,
                strokeType: this.strokeType
            });
        });
    }
}