import { highScoreManager } from '../utils/HighScoreManager.js';

export default class HighScoreScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HighScoreScene' });
    }

    init(data) {
        this.selectedStroke = data.selectedStroke || 'freestyle';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x001133);

        // Title
        this.add.text(width / 2, 50, 'HIGH SCORES', {
            font: 'bold 36px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Stroke type selector
        this.createStrokeSelector();

        // High scores display
        this.createHighScoresDisplay();

        // Back button
        this.createBackButton();

        // Clear scores button (for testing)
        this.createClearButton();

        // Input handling
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    createStrokeSelector() {
        const width = this.cameras.main.width;
        const strokeTypes = ['freestyle', 'backstroke', 'breaststroke', 'butterfly'];
        const buttonWidth = 150;
        const buttonHeight = 40;
        const startX = width / 2 - (strokeTypes.length * buttonWidth) / 2;

        strokeTypes.forEach((stroke, index) => {
            const x = startX + (index * buttonWidth) + buttonWidth / 2;
            const y = 120;

            // Button background
            const isSelected = stroke === this.selectedStroke;
            const buttonBg = this.add.rectangle(x, y, buttonWidth - 10, buttonHeight, 
                isSelected ? 0x4a90e2 : 0x333333);
            buttonBg.setStrokeStyle(2, isSelected ? 0x66ccff : 0x666666);

            // Button text
            const buttonText = this.add.text(x, y, stroke.toUpperCase(), {
                font: '14px Arial',
                fill: isSelected ? '#ffffff' : '#cccccc'
            }).setOrigin(0.5);

            // Make interactive
            const button = this.add.rectangle(x, y, buttonWidth - 10, buttonHeight, 0x000000, 0)
                .setInteractive();

            button.on('pointerdown', () => {
                this.selectedStroke = stroke;
                this.scene.restart({ selectedStroke: stroke });
            });

            button.on('pointerover', () => {
                if (stroke !== this.selectedStroke) {
                    buttonBg.setFillStyle(0x555555);
                    buttonText.setFill('#ffffff');
                }
            });

            button.on('pointerout', () => {
                if (stroke !== this.selectedStroke) {
                    buttonBg.setFillStyle(0x333333);
                    buttonText.setFill('#cccccc');
                }
            });
        });
    }

    createHighScoresDisplay() {
        const width = this.cameras.main.width;
        const scores = highScoreManager.getHighScores(this.selectedStroke);

        // Header
        this.add.text(width / 2, 180, `${this.selectedStroke.toUpperCase()} - TOP 10`, {
            font: 'bold 24px Arial',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Column headers
        const headerY = 220;
        this.add.text(width / 2 - 200, headerY, 'RANK', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2 - 50, headerY, 'NAME', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2 + 100, headerY, 'TIME', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2 + 200, headerY, 'DATE', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Scores list
        if (scores.length === 0) {
            this.add.text(width / 2, 300, 'No high scores yet!\nBe the first to set a record!', {
                font: '18px Arial',
                fill: '#cccccc',
                align: 'center'
            }).setOrigin(0.5);
        } else {
            scores.forEach((score, index) => {
                const y = 260 + (index * 30);
                const rank = index + 1;

                // Rank colors
                let rankColor = '#ffffff';
                if (rank === 1) rankColor = '#ffd700'; // Gold
                else if (rank === 2) rankColor = '#c0c0c0'; // Silver
                else if (rank === 3) rankColor = '#cd7f32'; // Bronze

                // Rank
                this.add.text(width / 2 - 200, y, `${rank}.`, {
                    font: 'bold 16px Arial',
                    fill: rankColor
                }).setOrigin(0.5);

                // Name
                this.add.text(width / 2 - 50, y, score.name, {
                    font: '16px Arial',
                    fill: '#ffffff'
                }).setOrigin(0.5);

                // Time
                this.add.text(width / 2 + 100, y, highScoreManager.constructor.formatTime(score.time), {
                    font: '16px Arial',
                    fill: rank <= 3 ? rankColor : '#ffffff'
                }).setOrigin(0.5);

                // Date
                this.add.text(width / 2 + 200, y, score.date, {
                    font: '14px Arial',
                    fill: '#cccccc'
                }).setOrigin(0.5);
            });
        }
    }

    createBackButton() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const backButton = this.add.rectangle(100, height - 50, 160, 40, 0x4a90e2);
        backButton.setStrokeStyle(2, 0x66ccff);

        const backText = this.add.text(100, height - 50, 'BACK TO MENU', {
            font: '16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const backInteractive = this.add.rectangle(100, height - 50, 160, 40, 0x000000, 0)
            .setInteractive();

        backInteractive.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        backInteractive.on('pointerover', () => {
            backButton.setFillStyle(0x5aa0f2);
        });

        backInteractive.on('pointerout', () => {
            backButton.setFillStyle(0x4a90e2);
        });
    }

    createClearButton() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const clearButton = this.add.rectangle(width - 100, height - 50, 120, 40, 0xcc3333);
        clearButton.setStrokeStyle(2, 0xff6666);

        const clearText = this.add.text(width - 100, height - 50, 'CLEAR', {
            font: '14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const clearInteractive = this.add.rectangle(width - 100, height - 50, 120, 40, 0x000000, 0)
            .setInteractive();

        clearInteractive.on('pointerdown', () => {
            // Confirm before clearing
            const confirmText = this.add.text(width / 2, height / 2, 
                'Clear all high scores for ' + this.selectedStroke + '?\nClick again to confirm', {
                font: '18px Arial',
                fill: '#ff6666',
                align: 'center',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5);

            this.time.delayedCall(3000, () => {
                if (confirmText) confirmText.destroy();
            });

            // Second click confirms
            clearInteractive.removeAllListeners();
            clearInteractive.on('pointerdown', () => {
                highScoreManager.clearStrokeScores(this.selectedStroke);
                this.scene.restart({ selectedStroke: this.selectedStroke });
            });
        });

        clearInteractive.on('pointerover', () => {
            clearButton.setFillStyle(0xdd4444);
        });

        clearInteractive.on('pointerout', () => {
            clearButton.setFillStyle(0xcc3333);
        });
    }
}