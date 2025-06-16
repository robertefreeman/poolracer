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
        
        // Draw lane dividers
        for (let i = 1; i < raceConfig.lanes; i++) {
            const y = i * laneHeight;
            
            // Lane rope (dashed line)
            for (let x = 0; x < width; x += 20) {
                this.add.rectangle(x + 10, y, 10, 2, 0xffffff);
            }
        }
        
        // Pool edges
        this.add.rectangle(width / 2, 5, width, 10, 0x333333);
        this.add.rectangle(width / 2, height - 5, width, 10, 0x333333);
        
        // Start and finish lines
        this.add.rectangle(80, height / 2, 4, height, 0x00ff00); // Start
        this.add.rectangle(1200, height / 2, 4, height, 0xff0000); // Finish
        
        // Distance markers
        for (let i = 1; i < 4; i++) {
            const x = 80 + (i * 280);
            this.add.rectangle(x, height / 2, 2, height, 0xcccccc);
            this.add.text(x - 10, 10, `${i * 25}m`, {
                font: '12px Arial',
                fill: '#ffffff'
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
            player.dive(time);
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
        this.finishedSwimmers.push({
            swimmer: swimmer,
            time: (swimmer.finishTime - this.startTime) / 1000,
            place: this.finishedSwimmers.length + 1
        });
        
        // Check if race is complete
        if (this.finishedSwimmers.length === this.swimmers.length) {
            this.endRace();
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