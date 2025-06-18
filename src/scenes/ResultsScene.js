import { highScoreManager } from '../utils/HighScoreManager.js';

export default class ResultsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ResultsScene' });
    }

    init(data) {
        this.results = data.results || [];
        this.strokeType = data.strokeType || 'freestyle';
        this.showHighScores = data.showHighScores || false;
        this.playerName = data.playerName || 'Anonymous';
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

            // Check for high scores and automatically save if detected
            this.checkForHighScores();

            // Create normal results UI
            this.createNormalResultsUI();
            
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
        const startY = 180; // Moved down to accommodate Head Timer text

        this.add.text(width / 2, startY - 30, 'Final Times:', {
            font: 'bold 20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Center the table - calculate positions relative to center
        const centerX = width / 2;
        const placeX = centerX - 280; // New
        const nameX = centerX - 170;  // New (for Name column)
        const teamX = centerX - 60;   // New (for Team column)
        const timeX = centerX + 50;   // New
        const strokesX = centerX + 150; // New
        const statsX = centerX + 250;  // New

        // Create table headers
        this.add.text(placeX, startY - 5, 'Place', {
            font: 'bold 14px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(nameX, startY - 5, 'Name', {
            font: 'bold 14px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(teamX, startY - 5, 'Team', {
            font: 'bold 14px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(timeX, startY - 5, 'Time', {
            font: 'bold 14px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(strokesX, startY - 5, 'Strokes', {
            font: 'bold 14px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(statsX, startY - 5, 'Stats', {
            font: 'bold 14px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.results.forEach((result, index) => {
            const y = startY + 25 + (index * 50); // Increased spacing to 50px
            const isPlayer = result.swimmer.isPlayer;
            const isDisqualified = isPlayer && result.swimmer.missTapCount > 2;
            
            // Place - show DQ if disqualified
            let placeText;
            let placeColor;
            if (isDisqualified) {
                placeText = 'DQ';
                placeColor = '#ff0000';
            } else {
                placeText = this.getPlaceText(result.place);
                placeColor = isPlayer ? '#ffff00' : '#ffffff';
            }
            
            this.add.text(placeX, y, placeText, {
                font: 'bold 18px Arial',
                fill: placeColor
            }).setOrigin(0.5);

            // Name display
            let displayName;
            let nameColor = isPlayer ? '#ffff00' : '#cccccc'; // Default color

            if (isPlayer) {
                displayName = this.playerName;
            } else {
                // Using result.swimmer.lane, which is 0-indexed. Adding 1 for display.
                displayName = `Swimmer ${result.swimmer.lane + 1}`;
            }

            this.add.text(nameX, y, displayName, {
                font: '16px Arial',
                fill: nameColor
            }).setOrigin(0.5);

            // Team display (based on lane)
            const teamNameStr = this.getShortTeamName(result.swimmer.lane);
            this.add.text(teamX, y, teamNameStr, {
                font: '16px Arial',
                fill: isPlayer ? '#ffff00' : '#cccccc'
            }).setOrigin(0.5);

            // Time - show with strikethrough if DQ
            const timeText = `${result.time.toFixed(2)}s`;
            const timeElement = this.add.text(timeX, y, timeText, {
                font: '18px Arial',
                fill: isDisqualified ? '#ff6666' : (isPlayer ? '#ffff00' : '#ffffff')
            }).setOrigin(0.5);
            
            // Add strikethrough for DQ times
            if (isDisqualified) {
                this.add.line(timeX, y, -timeText.length * 5, 0, timeText.length * 5, 0, 0xff0000)
                    .setLineWidth(2);
            }

            // Stroke count
            this.add.text(strokesX, y, `${result.swimmer.strokeCount}`, {
                font: '16px Arial',
                fill: '#aaaaaa'
            }).setOrigin(0.5);

            // Player indicator and stats
            if (isPlayer) {
                if (isDisqualified) {
                    this.add.text(statsX, y - 10, '(YOU)', {
                        font: 'bold 14px Arial',
                        fill: '#ff0000'
                    }).setOrigin(0.5);
                    
                    this.add.text(statsX, y + 8, `${result.swimmer.missTapCount} misses`, {
                        font: '12px Arial',
                        fill: '#ff0000'
                    }).setOrigin(0.5);
                } else {
                    this.add.text(statsX, y - 10, '(YOU)', {
                        font: 'bold 14px Arial',
                        fill: '#ff6b35'
                    }).setOrigin(0.5);
                    
                    const accuracy = result.swimmer.totalTapCount > 0 ? 
                        ((result.swimmer.totalTapCount - result.swimmer.missTapCount) / result.swimmer.totalTapCount * 100) : 100;
                    
                    this.add.text(statsX, y + 8, `${accuracy.toFixed(0)}% acc`, {
                        font: '12px Arial',
                        fill: accuracy >= 90 ? '#00ff00' : accuracy >= 75 ? '#ffff00' : '#ff0000'
                    }).setOrigin(0.5);
                }
            }
        });
    }

    highlightPlayerResult() {
        const playerResult = this.results.find(r => r.swimmer.isPlayer);
        if (!playerResult) return;

        const width = this.cameras.main.width;
        const isDisqualified = playerResult.swimmer.missTapCount > 2;
        let message = '';
        let color = '#ffffff';

        if (isDisqualified) {
            message = 'Ref Jim DQ you: Incorrect Stroke!!!';
            color = '#ff0000';
        } else {
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
        }

        // Position notifications below high scores button (y = 620+)
        this.add.text(width / 2, 620, message, {
            font: 'bold 20px Arial',
            fill: color,
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);

        // High score celebration if applicable (only if not DQ)
        if (!isDisqualified && this.isHighScore && this.highScorePosition) {
            this.add.text(width / 2, 650, `🎉 NEW HIGH SCORE! You're #${this.highScorePosition} in ${this.strokeType}! 🎉`, {
                font: 'bold 18px Arial',
                fill: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 15, y: 8 }
            }).setOrigin(0.5);
        }

        // Performance analysis
        const analysis = this.getPerformanceAnalysis(playerResult.swimmer, isDisqualified);
        const analysisY = (!isDisqualified && this.isHighScore) ? 680 : 650;
        this.add.text(width / 2, analysisY, analysis, {
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

    getTeamName(lane) {
        // RH Seahawks: lanes 1,3,5 (indices 0,2,4)
        // Ravensworth Ravens: lanes 2,4,6 (indices 1,3,5)
        const isSeahawks = lane % 2 === 0;
        return isSeahawks ? 'RH Seahawks' : 'Ravensworth Ravens';
    }

    getShortTeamName(lane) {
        // Shortened team names for better layout
        const isSeahawks = lane % 2 === 0;
        return isSeahawks ? 'Seahawks' : 'Ravens';
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
                console.log('High score detected! Auto-saving with player name:', this.playerName);
                this.playerResult = playerResult;
                
                // Automatically save the high score
                const position = highScoreManager.addHighScore(
                    this.strokeType,
                    playerResult.time,
                    this.playerName,
                    playerResult.place
                );
                
                console.log(`High score saved! Player is now #${position} in ${this.strokeType}`);
                this.highScorePosition = position;
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

        // Head Timer credit
        this.add.text(width / 2, 110, 'Head Timer: Ms. Kristin', {
            font: '16px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        // Display results
        this.displayResults();

        // Player's result highlight
        this.highlightPlayerResult();

        // Buttons
        this.createButtons();
    }


}