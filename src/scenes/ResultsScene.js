import { highScoreManager } from '../utils/HighScoreManager.js';

export default class ResultsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ResultsScene' });
    }

    init(data) {
        this.results = data.results || [];
        this.strokeType = data.strokeType || 'freestyle';
        this.showHighScores = data.showHighScores || false;
    }

    create() {
        console.log('=== RESULTS SCENE STARTING ===');
        console.log('Results data:', this.results);
        console.log('Stroke type:', this.strokeType);
        
        try {
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;

            // Background
            this.add.rectangle(width / 2, height / 2, width, height, 0x001133);

            // Validate results data
            if (!this.results || this.results.length === 0) {
                console.error('No results data available!');
                this.createErrorUI();
                return;
            }

            // Sort results by place
            this.results.sort((a, b) => a.place - b.place);

            // Initialize state
            this.isHighScore = false;
            this.nameEntryMode = false;
            this.playerName = '';
            this.maxNameLength = 12;

            // Check for high scores and set mode
            this.checkForHighScores();

            // Create UI based on mode
            if (this.isHighScore && !this.nameEntryMode) {
                console.log('Creating high score UI');
                this.createHighScoreUI();
            } else if (this.nameEntryMode) {
                console.log('Creating name entry UI');
                this.createNameEntryUI();
            } else {
                console.log('Creating normal results UI');
                this.createNormalResultsUI();
            }
            
            console.log('Results scene created successfully');
        } catch (error) {
            console.error('Error creating results scene:', error);
            this.createErrorUI();
        }
    }

    createErrorUI() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height / 2 - 50, 'Error Loading Results', {
            font: 'bold 32px Arial',
            fill: '#ff0000'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2, 'Something went wrong. Returning to menu...', {
            font: '18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Auto return to menu after 3 seconds
        this.time.delayedCall(3000, () => {
            this.scene.start('MenuScene');
        });

        // Also allow manual return
        this.input.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }

    displayResults() {
        const width = this.cameras.main.width;
        const startY = 140;

        this.add.text(width / 2, startY - 20, 'Final Times:', {
            font: 'bold 20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.results.forEach((result, index) => {
            const y = startY + (index * 40);
            const isPlayer = result.swimmer.isPlayer;
            
            // Place
            const placeText = this.getPlaceText(result.place);
            this.add.text(150, y, placeText, {
                font: 'bold 18px Arial',
                fill: isPlayer ? '#ffff00' : '#ffffff'
            });

            // Lane
            this.add.text(220, y, `Lane ${result.swimmer.lane + 1}`, {
                font: '16px Arial',
                fill: isPlayer ? '#ffff00' : '#cccccc'
            });

            // Time
            this.add.text(320, y, `${result.time.toFixed(2)}s`, {
                font: '18px Arial',
                fill: isPlayer ? '#ffff00' : '#ffffff'
            });

            // Player indicator
            if (isPlayer) {
                this.add.text(420, y, '(YOU)', {
                    font: 'bold 16px Arial',
                    fill: '#ff6b35'
                });
            }

            // Stroke count
            this.add.text(500, y, `${result.swimmer.strokeCount} strokes`, {
                font: '14px Arial',
                fill: '#aaaaaa'
            });
            
            // Add miss tap count and accuracy for player
            if (isPlayer) {
                const accuracy = result.swimmer.totalTapCount > 0 ? 
                    ((result.swimmer.totalTapCount - result.swimmer.missTapCount) / result.swimmer.totalTapCount * 100) : 100;
                
                this.add.text(620, y, `${result.swimmer.missTapCount} misses`, {
                    font: '14px Arial',
                    fill: '#ff6666'
                });
                
                this.add.text(720, y + 20, `${accuracy.toFixed(0)}% accuracy`, {
                    font: '12px Arial',
                    fill: accuracy >= 90 ? '#00ff00' : accuracy >= 75 ? '#ffff00' : '#ff0000'
                });
            }
        });
    }

    highlightPlayerResult() {
        const playerResult = this.results.find(r => r.swimmer.isPlayer);
        if (!playerResult) return;

        const width = this.cameras.main.width;
        let message = '';
        let color = '#ffffff';

        switch (playerResult.place) {
            case 1:
                message = '🏆 FIRST PLACE! Excellent swimming!';
                color = '#ffd700';
                break;
            case 2:
                message = '🥈 Second place! Great job!';
                color = '#c0c0c0';
                break;
            case 3:
                message = '🥉 Third place! Well done!';
                color = '#cd7f32';
                break;
            default:
                message = `${this.getPlaceText(playerResult.place)} - Keep practicing!`;
                color = '#ffffff';
        }

        this.add.text(width / 2, 380, message, {
            font: 'bold 20px Arial',
            fill: color,
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);

        // Performance analysis
        const analysis = this.getPerformanceAnalysis(playerResult.swimmer);
        this.add.text(width / 2, 420, analysis, {
            font: '14px Arial',
            fill: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);
    }

    getPerformanceAnalysis(swimmer) {
        const strokeEfficiency = 25 / swimmer.strokeCount; // meters per stroke
        const accuracy = swimmer.totalTapCount > 0 ? 
            ((swimmer.totalTapCount - swimmer.missTapCount) / swimmer.totalTapCount * 100) : 100;

        let analysis = '';
        
        // Accuracy feedback
        if (accuracy >= 95) {
            analysis += 'Perfect accuracy! ';
        } else if (accuracy >= 85) {
            analysis += 'Great accuracy. ';
        } else if (accuracy >= 70) {
            analysis += 'Good accuracy, but watch your timing. ';
        } else {
            analysis += 'Focus on alternating keys correctly. ';
        }

        // Stroke efficiency feedback
        if (strokeEfficiency > 1.2) {
            analysis += 'Very efficient strokes!';
        } else if (strokeEfficiency > 0.8) {
            analysis += 'Good stroke efficiency.';
        } else {
            analysis += 'Try longer, more powerful strokes.';
        }

        return analysis;
    }

    getPlaceText(place) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const suffix = (place > 3) ? suffixes[0] : suffixes[place];
        return `${place}${suffix}`;
    }

    createButtons() {
        const width = this.cameras.main.width;

        // Race Again button
        const raceAgainBtn = this.add.rectangle(width / 2 - 100, 500, 150, 40, 0x0066cc)
            .setInteractive();
        
        this.add.text(width / 2 - 100, 500, 'Race Again', {
            font: '16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        raceAgainBtn.on('pointerover', () => {
            raceAgainBtn.setFillStyle(0x0088ff);
        });

        raceAgainBtn.on('pointerout', () => {
            raceAgainBtn.setFillStyle(0x0066cc);
        });

        raceAgainBtn.on('pointerdown', () => {
            this.scene.start('RaceScene', { strokeType: this.strokeType });
        });

        // Main Menu button
        const menuBtn = this.add.rectangle(width / 2 + 100, 500, 150, 40, 0x666666)
            .setInteractive();
        
        this.add.text(width / 2 + 100, 500, 'Main Menu', {
            font: '16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        menuBtn.on('pointerover', () => {
            menuBtn.setFillStyle(0x888888);
        });

        menuBtn.on('pointerout', () => {
            menuBtn.setFillStyle(0x666666);
        });

        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Instructions for next race
        this.add.text(width / 2, 550, 'Tip: Alternate LEFT and RIGHT arrows in a steady rhythm for best results!', {
            font: '12px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        // High Scores button
        const highScoresBtn = this.add.rectangle(width / 2, 580, 150, 30, 0x4a90e2)
            .setInteractive();
        
        this.add.text(width / 2, 580, '🏆 High Scores', {
            font: '14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        highScoresBtn.on('pointerover', () => {
            highScoresBtn.setFillStyle(0x5aa0f2);
        });

        highScoresBtn.on('pointerout', () => {
            highScoresBtn.setFillStyle(0x4a90e2);
        });

        highScoresBtn.on('pointerdown', () => {
            this.scene.start('HighScoreScene', { selectedStroke: this.strokeType });
        });
    }

    checkForHighScores() {
        // Only check if we haven't already shown high scores
        if (this.showHighScores) return;

        try {
            const playerResult = this.results.find(r => r.swimmer.isPlayer);
            if (!playerResult) {
                console.log('No player result found');
                return;
            }

            console.log('Checking high score for:', this.strokeType, playerResult.time);
            
            // Check if player's time qualifies for high score
            this.isHighScore = highScoreManager.isHighScore(this.strokeType, playerResult.time);
            console.log('High score check result:', this.isHighScore);
            
            if (this.isHighScore) {
                console.log('High score detected! Showing high score UI...');
                this.playerResult = playerResult;
            } else {
                console.log('Time does not qualify for high score');
            }
        } catch (error) {
            console.error('Error in checkForHighScores:', error);
            this.isHighScore = false;
        }
    }

    createNormalResultsUI() {
        const width = this.cameras.main.width;

        // Title
        this.add.text(width / 2, 50, 'Race Results', {
            font: 'bold 32px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 85, `${this.strokeType.toUpperCase()} - 25m`, {
            font: '18px Arial',
            fill: '#cccccc'
        }).setOrigin(0.5);

        // Display results
        this.displayResults();

        // Player's result highlight
        this.highlightPlayerResult();

        // Buttons
        this.createButtons();
    }

    createHighScoreUI() {
        const width = this.cameras.main.width;

        // Celebration background effect
        this.createCelebrationEffect();

        // Title
        this.add.text(width / 2, 80, 'NEW HIGH SCORE!', {
            font: 'bold 48px Arial',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Race details
        this.add.text(width / 2, 140, `${this.strokeType.toUpperCase()} - ${this.playerResult.time.toFixed(2)}s`, {
            font: 'bold 24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        if (this.playerResult.place) {
            const placeSuffix = this.getPlaceText(this.playerResult.place);
            this.add.text(width / 2, 170, `Finished ${placeSuffix} Place`, {
                font: '18px Arial',
                fill: '#ffff00'
            }).setOrigin(0.5);
        }

        // Continue button
        const continueBtn = this.add.rectangle(width / 2, 250, 200, 50, 0x4a90e2)
            .setInteractive();
        
        this.add.text(width / 2, 250, 'Enter Name for High Score', {
            font: '16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        continueBtn.on('pointerdown', () => {
            this.switchToNameEntry();
        });

        // Skip button
        const skipBtn = this.add.rectangle(width / 2, 320, 150, 40, 0x666666)
            .setInteractive();
        
        this.add.text(width / 2, 320, 'Skip High Score', {
            font: '14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        skipBtn.on('pointerdown', () => {
            this.switchToNormalResults();
        });
    }

    createNameEntryUI() {
        const width = this.cameras.main.width;

        // Clear screen
        this.children.removeAll();
        this.add.rectangle(width / 2, this.cameras.main.height / 2, width, this.cameras.main.height, 0x001133);

        // Title
        this.add.text(width / 2, 100, 'Enter Your Name', {
            font: 'bold 32px Arial',
            fill: '#ffd700'
        }).setOrigin(0.5);

        // Time display
        this.add.text(width / 2, 140, `${this.strokeType.toUpperCase()} - ${this.playerResult.time.toFixed(2)}s`, {
            font: '20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Name input field
        this.createNameInput();

        // Buttons
        this.createNameEntryButtons();

        // Setup keyboard
        this.setupKeyboardInput();
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

    switchToNameEntry() {
        this.nameEntryMode = true;
        this.createNameEntryUI();
    }

    switchToNormalResults() {
        this.isHighScore = false;
        this.nameEntryMode = false;
        this.children.removeAll();
        this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, 
            this.cameras.main.width, this.cameras.main.height, 0x001133);
        this.createNormalResultsUI();
    }

    createNameInput() {
        const width = this.cameras.main.width;

        // Input field background
        this.nameInputBg = this.add.rectangle(width / 2, 200, 300, 50, 0x333333);
        this.nameInputBg.setStrokeStyle(3, 0x66ccff);

        // Name text display
        this.nameText = this.add.text(width / 2, 200, this.playerName || 'Type your name...', {
            font: '24px Arial',
            fill: this.playerName ? '#ffffff' : '#888888'
        }).setOrigin(0.5);

        // Cursor
        this.cursor = this.add.text(width / 2 + this.getTextWidth() / 2, 200, '|', {
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

    createNameEntryButtons() {
        const width = this.cameras.main.width;

        // Submit button
        const submitBtn = this.add.rectangle(width / 2 - 100, 280, 120, 50, 0x4a90e2)
            .setInteractive();
        
        this.add.text(width / 2 - 100, 280, 'SUBMIT', {
            font: 'bold 18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        submitBtn.on('pointerdown', () => {
            this.submitScore();
        });

        // Skip button
        const skipBtn = this.add.rectangle(width / 2 + 100, 280, 120, 50, 0x666666)
            .setInteractive();
        
        this.add.text(width / 2 + 100, 280, 'SKIP', {
            font: 'bold 18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        skipBtn.on('pointerdown', () => {
            this.switchToNormalResults();
        });

        // Instructions
        this.add.text(width / 2, 340, 'Press ENTER to submit or ESC to skip', {
            font: '14px Arial',
            fill: '#cccccc'
        }).setOrigin(0.5);
    }

    setupKeyboardInput() {
        // Clear any existing listeners
        this.input.keyboard.removeAllListeners();
        
        // Handle all keyboard input
        this.input.keyboard.on('keydown', (event) => {
            if (!this.nameEntryMode) return;

            const key = event.key;

            if (key === 'Enter') {
                this.submitScore();
            } else if (key === 'Escape') {
                this.switchToNormalResults();
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

        // Add the high score
        const position = highScoreManager.addHighScore(
            this.strokeType,
            this.playerResult.time,
            this.playerName.trim(),
            this.playerResult.place
        );

        // Show confirmation and then switch to normal results
        const confirmText = this.add.text(this.cameras.main.width / 2, 380, 
            `Score saved! You're #${position} in ${this.strokeType}!`, {
            font: 'bold 18px Arial',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Wait a moment then show normal results
        this.time.delayedCall(2000, () => {
            this.switchToNormalResults();
        });
    }
}