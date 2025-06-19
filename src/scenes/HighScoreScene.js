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

        // Define X coordinates for columns
        const rankX = width * 0.15;
        const nameX = width * 0.38;
        const timeX = width * 0.65;
        const dateX = width * 0.85;

        // Column headers
        const headerY = 220;
        this.add.text(rankX, headerY, 'RANK', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(nameX, headerY, 'NAME', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(timeX, headerY, 'TIME', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(dateX, headerY, 'DATE', {
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
                this.add.text(rankX, y, `${rank}.`, {
                    font: 'bold 16px Arial',
                    fill: rankColor
                }).setOrigin(0.5);

                // Name
                this.add.text(nameX, y, score.name, {
                    font: '16px Arial',
                    fill: '#ffffff'
                }).setOrigin(0.5);

                // Time
                this.add.text(timeX, y, highScoreManager.constructor.formatTime(score.time), {
                    font: '16px Arial',
                    fill: rank <= 3 ? rankColor : '#ffffff'
                }).setOrigin(0.5);

                // Date
                this.add.text(dateX, y, score.date, {
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

}