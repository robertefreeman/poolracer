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
        const height = this.cameras.main.height; // Now 1280
        let currentY = 180; // Initial Y position for the first result block, below "Final Times" title

        // "Final Times:" title (can keep this or similar)
        this.add.text(width / 2, currentY - 40, 'Final Times:', { // Adjusted Y for title
            font: 'bold 24px Arial', // Slightly larger title
            fill: '#ffffff'
        }).setOrigin(0.5);

        const textStartX = width * 0.1; // Left margin for text
        const valueOffsetX = width * 0.35; // Indent for values, relative to textStartX
        const labelStyle = { font: '18px Arial', fill: '#aaaaaa' };
        const valueStyleBase = { font: 'bold 18px Arial', fill: '#ffffff' };
        const lineSpacing = 28; // Space between lines within a block
        const blockSpacing = 40; // Space between player result blocks

        this.results.forEach((result, index) => {
            const isPlayer = result.swimmer.isPlayer;
            const isDisqualified = isPlayer && result.swimmer.missTapCount > 2;

            // --- Place ---
            let placeText;
            let placeColor = isPlayer ? '#ffff00' : '#ffffff';
            if (isDisqualified) {
                placeText = 'DQ';
                placeColor = '#ff0000';
            } else {
                placeText = this.getPlaceText(result.place);
            }
            this.add.text(textStartX, currentY, 'Place:', labelStyle);
            this.add.text(textStartX + valueOffsetX, currentY, placeText, { ...valueStyleBase, fill: placeColor });
            currentY += lineSpacing;

            // --- Name ---
            let displayName;
            let nameColor = isPlayer ? '#ffff00' : (isDisqualified ? '#ff6666' : '#cccccc');
            if (isPlayer) {
                displayName = this.playerName;
            } else {
                displayName = `Swimmer ${result.swimmer.lane + 1}`;
            }
            this.add.text(textStartX, currentY, 'Name:', labelStyle);
            this.add.text(textStartX + valueOffsetX, currentY, displayName, { ...valueStyleBase, fill: nameColor });
            currentY += lineSpacing;

            // --- Team ---
            const teamNameStr = this.getShortTeamName(result.swimmer.lane);
            const teamColor = isPlayer ? '#ffff00' : '#cccccc';
            this.add.text(textStartX, currentY, 'Team:', labelStyle);
            this.add.text(textStartX + valueOffsetX, currentY, teamNameStr, { ...valueStyleBase, fill: teamColor });
            currentY += lineSpacing;

            // --- Time ---
            const timeTextStr = `${result.time.toFixed(2)}s`;
            const timeColor = isDisqualified ? '#ff6666' : (isPlayer ? '#ffff00' : '#ffffff');
            this.add.text(textStartX, currentY, 'Time:', labelStyle);
            const timeValueText = this.add.text(textStartX + valueOffsetX, currentY, timeTextStr, { ...valueStyleBase, fill: timeColor });
            if (isDisqualified) {
                // Add strikethrough for DQ time: X relative to the timeValueText's X
                this.add.line(0, 0, timeValueText.x - (timeValueText.width/2) + 5, timeValueText.y + (timeValueText.height/2) -2, timeValueText.x + (timeValueText.width/2) -5 , timeValueText.y+(timeValueText.height/2)-2, 0xff0000, 2).setOrigin(0,0);
            }
            currentY += lineSpacing;

            // --- Strokes ---
            this.add.text(textStartX, currentY, 'Strokes:', labelStyle);
            this.add.text(textStartX + valueOffsetX, currentY, `${result.swimmer.strokeCount}`, { ...valueStyleBase, fill: '#aaaaaa' });
            currentY += lineSpacing;

            // --- Player Specific Stats (Accuracy / Misses) ---
            if (isPlayer) {
                if (isDisqualified) {
                    this.add.text(textStartX, currentY, 'Reason:', labelStyle);
                    this.add.text(textStartX + valueOffsetX, currentY, `${result.swimmer.missTapCount} misses`, { ...valueStyleBase, fill: '#ff0000' });
                } else {
                    const accuracy = result.swimmer.totalTapCount > 0 ?
                        ((result.swimmer.totalTapCount - result.swimmer.missTapCount) / result.swimmer.totalTapCount * 100) : 100;
                    const accuracyColor = accuracy >= 90 ? '#00ff00' : accuracy >= 75 ? '#ffff00' : '#ff0000';
                    this.add.text(textStartX, currentY, 'Accuracy:', labelStyle);
                    this.add.text(textStartX + valueOffsetX, currentY, `${accuracy.toFixed(0)}%`, { ...valueStyleBase, fill: accuracyColor });
                }
                currentY += lineSpacing;
            }

            // Add a visual separator or just space for the next block
            currentY += blockSpacing - lineSpacing; // Spacing before next swimmer block
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