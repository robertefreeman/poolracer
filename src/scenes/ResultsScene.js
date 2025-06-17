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
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x001133);

        // Title
        this.add.text(width / 2, 50, 'Race Results', {
            font: 'bold 32px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 85, `${this.strokeType.toUpperCase()} - 25m`, {
            font: '18px Arial',
            fill: '#cccccc'
        }).setOrigin(0.5);

        // Sort results by place
        this.results.sort((a, b) => a.place - b.place);

        // Check for high scores first
        this.checkForHighScores();

        // Display results
        this.displayResults();

        // Player's result highlight
        this.highlightPlayerResult();

        // Buttons
        this.createButtons();
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
            // Prevent clicking if handling high score
            if (this.handlingHighScore) {
                console.log('Button click blocked - handling high score');
                return;
            }
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
            // Prevent clicking if handling high score
            if (this.handlingHighScore) return;
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
            // Prevent clicking if handling high score
            if (this.handlingHighScore) return;
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
            const isHighScore = highScoreManager.isHighScore(this.strokeType, playerResult.time);
            console.log('High score check result:', isHighScore);
            
            if (isHighScore) {
                console.log('High score detected! Transitioning immediately...');
                
                // Transition immediately - no delay
                this.scene.start('NameEntryScene', {
                    raceTime: playerResult.time,
                    strokeType: this.strokeType,
                    place: playerResult.place,
                    results: this.results
                });
                return; // Exit early
            } else {
                console.log('Time does not qualify for high score');
                this.handlingHighScore = false; // Ensure buttons work
            }
        } catch (error) {
            console.error('Error in checkForHighScores:', error);
            this.handlingHighScore = false; // Ensure buttons work if error occurs
        }
    }
}