import { highScoreManager } from '../utils/HighScoreManager.js';

export default class NameEntryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'NameEntryScene' });
    }

    init(data) {
        this.raceTime = data.raceTime;
        this.strokeType = data.strokeType;
        this.place = data.place;
        this.results = data.results;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x001133);

        // Celebration background effect
        this.createCelebrationEffect();

        // Title
        this.add.text(width / 2, 100, 'NEW HIGH SCORE!', {
            font: 'bold 48px Arial',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Race details
        this.add.text(width / 2, 160, `${this.strokeType.toUpperCase()} - ${highScoreManager.constructor.formatTime(this.raceTime)}`, {
            font: 'bold 24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        if (this.place) {
            this.add.text(width / 2, 190, `Finished ${highScoreManager.constructor.getRankSuffix(this.place)} Place`, {
                font: '18px Arial',
                fill: '#ffff00'
            }).setOrigin(0.5);
        }

        // Name entry instructions
        this.add.text(width / 2, 250, 'Enter your name (up to 12 characters):', {
            font: '20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Name input field
        this.playerName = '';
        this.maxNameLength = 12;
        this.createNameInput();

        // Buttons
        this.createButtons();

        // Keyboard input
        this.setupKeyboardInput();

        // Auto-focus for immediate typing
        this.nameInputActive = true;
    }

    createCelebrationEffect() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create floating particles
        for (let i = 0; i < 20; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(3, 8),
                Phaser.Math.Choose([0xffd700, 0xffff00, 0xff6600, 0x00ff00]),
                0.8
            );

            this.tweens.add({
                targets: particle,
                y: particle.y - Phaser.Math.Between(100, 200),
                x: particle.x + Phaser.Math.Between(-50, 50),
                alpha: 0,
                duration: Phaser.Math.Between(2000, 4000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });
        }
    }

    createNameInput() {
        const width = this.cameras.main.width;

        // Input field background
        this.nameInputBg = this.add.rectangle(width / 2, 320, 300, 50, 0x333333);
        this.nameInputBg.setStrokeStyle(3, 0x66ccff);

        // Name text display
        this.nameText = this.add.text(width / 2, 320, this.playerName || 'Type your name...', {
            font: '24px Arial',
            fill: this.playerName ? '#ffffff' : '#888888'
        }).setOrigin(0.5);

        // Cursor
        this.cursor = this.add.text(width / 2 + this.getTextWidth() / 2, 320, '|', {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);

        // Blinking cursor animation
        this.tweens.add({
            targets: this.cursor,
            alpha: 0,
            duration: 500,
            repeat: -1,
            yoyo: true
        });
    }

    createButtons() {
        const width = this.cameras.main.width;

        // Submit button
        this.submitButton = this.add.rectangle(width / 2 - 100, 420, 120, 50, 0x4a90e2);
        this.submitButton.setStrokeStyle(2, 0x66ccff);

        this.submitText = this.add.text(width / 2 - 100, 420, 'SUBMIT', {
            font: 'bold 18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const submitInteractive = this.add.rectangle(width / 2 - 100, 420, 120, 50, 0x000000, 0)
            .setInteractive();

        submitInteractive.on('pointerdown', () => {
            this.submitScore();
        });

        submitInteractive.on('pointerover', () => {
            this.submitButton.setFillStyle(0x5aa0f2);
        });

        submitInteractive.on('pointerout', () => {
            this.submitButton.setFillStyle(0x4a90e2);
        });

        // Skip button
        this.skipButton = this.add.rectangle(width / 2 + 100, 420, 120, 50, 0x666666);
        this.skipButton.setStrokeStyle(2, 0x999999);

        this.skipText = this.add.text(width / 2 + 100, 420, 'SKIP', {
            font: 'bold 18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const skipInteractive = this.add.rectangle(width / 2 + 100, 420, 120, 50, 0x000000, 0)
            .setInteractive();

        skipInteractive.on('pointerdown', () => {
            this.skipScore();
        });

        skipInteractive.on('pointerover', () => {
            this.skipButton.setFillStyle(0x777777);
        });

        skipInteractive.on('pointerout', () => {
            this.skipButton.setFillStyle(0x666666);
        });

        // Instructions
        this.add.text(width / 2, 480, 'Press ENTER to submit or ESC to skip', {
            font: '14px Arial',
            fill: '#cccccc'
        }).setOrigin(0.5);
    }

    setupKeyboardInput() {
        // Handle all keyboard input
        this.input.keyboard.on('keydown', (event) => {
            if (!this.nameInputActive) return;

            const key = event.key;

            if (key === 'Enter') {
                this.submitScore();
            } else if (key === 'Escape') {
                this.skipScore();
            } else if (key === 'Backspace') {
                if (this.playerName.length > 0) {
                    this.playerName = this.playerName.slice(0, -1);
                    this.updateNameDisplay();
                }
            } else if (key.length === 1 && this.playerName.length < this.maxNameLength) {
                // Only allow alphanumeric characters and spaces
                if (/[a-zA-Z0-9 ]/.test(key)) {
                    this.playerName += key;
                    this.updateNameDisplay();
                }
            }
        });
    }

    updateNameDisplay() {
        if (this.playerName.length > 0) {
            this.nameText.setText(this.playerName);
            this.nameText.setFill('#ffffff');
        } else {
            this.nameText.setText('Type your name...');
            this.nameText.setFill('#888888');
        }

        // Update cursor position
        this.cursor.x = this.cameras.main.width / 2 + this.getTextWidth() / 2 + 5;
    }

    getTextWidth() {
        if (this.playerName.length === 0) return 0;
        
        // Create temporary text to measure width
        const tempText = this.add.text(0, 0, this.playerName, {
            font: '24px Arial'
        });
        const width = tempText.width;
        tempText.destroy();
        return width;
    }

    submitScore() {
        if (this.playerName.trim().length === 0) {
            // Flash the input field to indicate name is required
            this.tweens.add({
                targets: this.nameInputBg,
                fillColor: 0xff3333,
                duration: 200,
                yoyo: true,
                onComplete: () => {
                    this.nameInputBg.setFillStyle(0x333333);
                }
            });
            return;
        }

        this.nameInputActive = false;

        // Add the high score
        const position = highScoreManager.addHighScore(
            this.strokeType,
            this.raceTime,
            this.playerName.trim(),
            this.place
        );

        // Show confirmation
        const confirmText = this.add.text(this.cameras.main.width / 2, 380, 
            `Score saved! You're #${position} in ${this.strokeType}!`, {
            font: 'bold 18px Arial',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Wait a moment then go to results
        this.time.delayedCall(2000, () => {
            this.goToResults();
        });
    }

    skipScore() {
        this.nameInputActive = false;
        this.goToResults();
    }

    goToResults() {
        this.scene.start('ResultsScene', {
            results: this.results,
            strokeType: this.strokeType,
            showHighScores: true
        });
    }
}