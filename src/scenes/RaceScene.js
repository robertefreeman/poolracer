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
        this.add.rectangle(50, height / 2, 4, height, 0x00ff00); // Start
        this.add.rectangle(750, height / 2, 4, height, 0xff0000); // Finish
        
        // Distance markers
        for (let i = 1; i < 4; i++) {
            const x = 50 + (i * 175);
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
                50,
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
        
        // Rhythm meter for player
        this.rhythmMeter = this.add.rectangle(10, 80, 100, 20, 0x333333);
        this.rhythmBar = this.add.rectangle(10, 80, 50, 16, 0x00ff00);
        this.rhythmBar.setOrigin(0, 0.5);
        
        this.add.text(10, 105, 'Rhythm', {
            font: '12px Arial',
            fill: '#ffffff'
        });
        
        // Instructions
        this.instructionText = this.add.text(400, 550, 'Follow the arrow prompts! Press the correct LEFT/RIGHT key to stay in sync!', {
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
        
        // Sync status indicator
        this.syncStatusText = this.add.text(10, 130, 'Sync: Perfect', {
            font: '14px Arial',
            fill: '#00ff00',
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
        
        // Update rhythm meter and UI for player
        const player = this.swimmers[raceConfig.playerLane];
        if (player) {
            const rhythmWidth = player.rhythmMultiplier * 80;
            this.rhythmBar.width = Math.max(10, rhythmWidth);
            
            // Color based on rhythm quality
            if (player.rhythmMultiplier > 1.1) {
                this.rhythmBar.setFillStyle(0x00ff00); // Green - excellent
            } else if (player.rhythmMultiplier > 0.9) {
                this.rhythmBar.setFillStyle(0xffff00); // Yellow - good
            } else {
                this.rhythmBar.setFillStyle(0xff0000); // Red - poor
            }
            
            // Update next key indicator
            if (player.expectedNextKey === 'left') {
                this.nextKeyIndicator.setText('← PRESS LEFT');
                this.nextKeyIndicator.setFill('#00ff00');
            } else {
                this.nextKeyIndicator.setText('PRESS RIGHT →');
                this.nextKeyIndicator.setFill('#00ff00');
            }
            
            // Update sync status
            if (player.consecutiveOutOfSync === 0) {
                this.syncStatusText.setText(`Sync: Perfect (${player.syncBonus.toFixed(1)}x)`);
                this.syncStatusText.setFill('#00ff00');
            } else if (player.consecutiveOutOfSync === 1) {
                this.syncStatusText.setText('Sync: Off - Fix it!');
                this.syncStatusText.setFill('#ffff00');
            } else {
                this.syncStatusText.setText(`Sync: BAD (${player.consecutiveOutOfSync} errors)`);
                this.syncStatusText.setFill('#ff0000');
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