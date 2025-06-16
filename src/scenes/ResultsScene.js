export default class ResultsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ResultsScene' });
    }

    init(data) {
        this.results = data.results || [];
        this.strokeType = data.strokeType || 'freestyle';
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
        const avgRhythm = swimmer.rhythmMultiplier;
        const strokeEfficiency = 25 / swimmer.strokeCount; // meters per stroke

        let analysis = '';
        
        if (avgRhythm > 1.1) {
            analysis += 'Excellent rhythm! ';
        } else if (avgRhythm > 0.9) {
            analysis += 'Good rhythm. ';
        } else {
            analysis += 'Work on your stroke timing. ';
        }

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
    }
}