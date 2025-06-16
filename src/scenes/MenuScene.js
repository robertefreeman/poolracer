export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create animated water background
        this.createWaterBackground();

        // Create decorative pool lanes
        this.createPoolLanes();

        // Main title with shadow effect
        this.add.text(width / 2 + 3, 103, 'Rolling Hills Racers', {
            font: 'bold 48px Arial',
            fill: '#000000'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, 100, 'Rolling Hills Racers', {
            font: 'bold 48px Arial',
            fill: '#ffffff',
            stroke: '#0066cc',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, 150, '🏊‍♂️ Championship Swimming Competition 🏊‍♀️', {
            font: '20px Arial',
            fill: '#66ccff'
        }).setOrigin(0.5);

        // Create stroke selection cards
        this.createStrokeCards();

        // Game features highlight
        this.createFeatureHighlights();

        // Instructions with better styling
        this.createInstructions();

        // Add animated elements
        this.createAnimatedElements();
    }

    createWaterBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Gradient water background
        const graphics = this.add.graphics();
        
        // Create gradient effect
        for (let i = 0; i < height; i++) {
            const alpha = 0.3 + (i / height) * 0.4;
            const blue = 0x0066cc + Math.floor((i / height) * 0x002244);
            graphics.fillStyle(blue, alpha);
            graphics.fillRect(0, i, width, 1);
        }

        // Add water ripple effects
        for (let i = 0; i < 5; i++) {
            const ripple = this.add.circle(
                Phaser.Math.Between(100, width - 100),
                Phaser.Math.Between(200, height - 200),
                Phaser.Math.Between(20, 40),
                0x66ccff,
                0.1
            );
            
            this.tweens.add({
                targets: ripple,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 3000,
                repeat: -1,
                delay: i * 600
            });
        }
    }

    createPoolLanes() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Pool lane dividers (decorative)
        for (let lane = 1; lane < 6; lane++) {
            const y = (height / 6) * lane;
            for (let x = 0; x < width; x += 30) {
                this.add.rectangle(x + 15, y, 15, 3, 0x4488cc, 0.3);
            }
        }
    }

    createStrokeCards() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const strokes = [
            { name: 'Freestyle', key: 'freestyle', emoji: '🏊‍♂️', desc: 'Fast & Efficient' },
            { name: 'Backstroke', key: 'backstroke', emoji: '🏊‍♀️', desc: 'Smooth & Steady' },
            { name: 'Breaststroke', key: 'breaststroke', emoji: '🏊', desc: 'Power & Technique' },
            { name: 'Butterfly', key: 'butterfly', emoji: '🦋', desc: 'Speed & Strength' }
        ];

        this.add.text(width / 2, 220, 'Choose Your Swimming Style', {
            font: 'bold 24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        const cardWidth = 250;
        const cardHeight = 80;
        const spacing = 20;
        const totalWidth = (cardWidth * 2) + spacing;
        const startX = (width - totalWidth) / 2;

        strokes.forEach((stroke, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = startX + (col * (cardWidth + spacing)) + (cardWidth / 2);
            const y = 280 + (row * (cardHeight + spacing));

            // Card background with gradient effect
            const card = this.add.graphics();
            card.fillGradientStyle(0x0066cc, 0x0066cc, 0x004499, 0x004499);
            card.fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 10);
            card.lineStyle(2, 0x66ccff, 0.8);
            card.strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 10);

            // Interactive area
            const button = this.add.rectangle(x, y, cardWidth, cardHeight, 0x000000, 0)
                .setInteractive();

            // Stroke emoji
            this.add.text(x - 80, y - 10, stroke.emoji, {
                font: '32px Arial'
            }).setOrigin(0.5);

            // Stroke name
            this.add.text(x + 10, y - 15, stroke.name, {
                font: 'bold 18px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5);

            // Description
            this.add.text(x + 10, y + 10, stroke.desc, {
                font: '12px Arial',
                fill: '#cccccc'
            }).setOrigin(0.5);

            // Hover effects
            button.on('pointerover', () => {
                card.clear();
                card.fillGradientStyle(0x0088ff, 0x0088ff, 0x0066cc, 0x0066cc);
                card.fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 10);
                card.lineStyle(3, 0x88ddff, 1);
                card.strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 10);
                
                this.tweens.add({
                    targets: button,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100
                });
            });

            button.on('pointerout', () => {
                card.clear();
                card.fillGradientStyle(0x0066cc, 0x0066cc, 0x004499, 0x004499);
                card.fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 10);
                card.lineStyle(2, 0x66ccff, 0.8);
                card.strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 10);
                
                this.tweens.add({
                    targets: button,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            });

            button.on('pointerdown', () => {
                this.cameras.main.flash(200, 255, 255, 255);
                this.time.delayedCall(200, () => {
                    this.scene.start('RaceScene', { strokeType: stroke.key });
                });
            });
        });
    }

    createFeatureHighlights() {
        const width = this.cameras.main.width;
        
        const features = [
            '⚡ Real-time Performance Tracking',
            '🎯 Precision Timing System',
            '🏆 Competitive AI Opponents'
        ];

        features.forEach((feature, index) => {
            this.add.text(width / 2, 500 + (index * 25), feature, {
                font: '14px Arial',
                fill: '#88ccff',
                align: 'center'
            }).setOrigin(0.5);
        });
    }

    createInstructions() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Instructions box
        const instructionBox = this.add.graphics();
        instructionBox.fillStyle(0x000000, 0.7);
        instructionBox.fillRoundedRect(width/2 - 300, height - 120, 600, 80, 10);
        instructionBox.lineStyle(2, 0x66ccff, 0.8);
        instructionBox.strokeRoundedRect(width/2 - 300, height - 120, 600, 80, 10);

        this.add.text(width / 2, height - 100, '🎮 CONTROLS', {
            font: 'bold 16px Arial',
            fill: '#66ccff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 75, 'SPACEBAR to dive • LEFT/RIGHT arrows to swim alternately', {
            font: '14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 55, 'Perfect timing = maximum speed!', {
            font: '12px Arial',
            fill: '#cccccc'
        }).setOrigin(0.5);
    }

    createAnimatedElements() {
        const width = this.cameras.main.width;

        // Floating bubbles
        for (let i = 0; i < 8; i++) {
            const bubble = this.add.circle(
                Phaser.Math.Between(50, width - 50),
                Phaser.Math.Between(600, 720),
                Phaser.Math.Between(3, 8),
                0x88ccff,
                0.6
            );

            this.tweens.add({
                targets: bubble,
                y: -20,
                duration: Phaser.Math.Between(3000, 6000),
                repeat: -1,
                delay: i * 500
            });
        }

        // Pulsing title effect
        this.tweens.add({
            targets: this.children.list.filter(child => 
                child.type === 'Text' && child.text === 'Rolling Hills Racers'
            )[1], // Get the main title (not shadow)
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}