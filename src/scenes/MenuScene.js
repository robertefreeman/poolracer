import { MobileDetection } from '../utils/MobileDetection.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Mobile detection
        this.isMobile = MobileDetection.isMobile();

        // Create clean background
        this.createCleanBackground();

        // Main title - larger and more prominent
        this.createMainTitle();

        // Create stroke selection cards - bigger and cleaner
        this.createStrokeCards();
        
        // Create bottom buttons section
        this.createBottomButtons();

        // Add subtle animated elements
        this.createSubtleAnimations();
    }

    createCleanBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Clean gradient background
        const graphics = this.add.graphics();
        
        // Simple two-tone gradient
        graphics.fillGradientStyle(0x001133, 0x001133, 0x003366, 0x003366);
        graphics.fillRect(0, 0, width, height);

        // Subtle water texture with minimal elements
        for (let i = 0; i < 3; i++) {
            const ripple = this.add.circle(
                Phaser.Math.Between(200, width - 200),
                Phaser.Math.Between(300, height - 300),
                Phaser.Math.Between(40, 80),
                0x004488,
                0.1
            );
            
            this.tweens.add({
                targets: ripple,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 4000,
                repeat: -1,
                delay: i * 1500,
                ease: 'Sine.easeOut'
            });
        }
    }

    createMainTitle() {
        const width = this.cameras.main.width;

        // Main title - much larger and more prominent
        const titleSize = this.isMobile ? '56px' : '72px';
        const subtitleSize = this.isMobile ? '20px' : '28px';

        // Title shadow
        this.add.text(width / 2 + 4, 124, 'Pool Racer', {
            font: `bold ${titleSize} Arial`,
            fill: '#000000',
            alpha: 0.3
        }).setOrigin(0.5);
        
        // Main title
        const mainTitle = this.add.text(width / 2, 120, 'Pool Racer', {
            font: `bold ${titleSize} Arial`,
            fill: '#ffffff',
            stroke: '#0066cc',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle - cleaner and more readable
        this.add.text(width / 2, 180, 'Championship Swimming', {
            font: `${subtitleSize} Arial`,
            fill: '#66ccff',
            alpha: 0.9
        }).setOrigin(0.5);

        // Add subtle glow effect to title
        this.tweens.add({
            targets: mainTitle,
            alpha: 0.9,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createStrokeCards() {
        const width = this.cameras.main.width;

        const strokes = [
            { name: 'Freestyle', key: 'freestyle', emoji: '🏊‍♂️', desc: 'Fast & Efficient' },
            { name: 'Backstroke', key: 'backstroke', emoji: '🏊‍♀️', desc: 'Smooth & Steady' },
            { name: 'Breaststroke', key: 'breaststroke', emoji: '🏊', desc: 'Power & Technique' },
            { name: 'Butterfly', key: 'butterfly', emoji: '🦋', desc: 'Speed & Strength' }
        ];

        // Section title - larger and more prominent
        this.add.text(width / 2, 260, 'Choose Your Style', {
            font: this.isMobile ? 'bold 28px Arial' : 'bold 36px Arial',
            fill: '#ffffff',
            stroke: '#0066cc',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Much larger cards with better proportions
        const cardWidth = this.isMobile ? 280 : 320;
        const cardHeight = this.isMobile ? 100 : 120;
        const spacing = this.isMobile ? 25 : 35;
        const totalWidth = (cardWidth * 2) + spacing;
        const startX = (width - totalWidth) / 2;

        strokes.forEach((stroke, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = startX + (col * (cardWidth + spacing)) + (cardWidth / 2);
            const y = 340 + (row * (cardHeight + spacing));

            // Card background with cleaner design
            const card = this.add.graphics();
            card.fillStyle(0x0066cc, 0.9);
            card.fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 15);
            card.lineStyle(3, 0x66ccff, 0.8);
            card.strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 15);

            // Interactive area
            const button = this.add.rectangle(x, y, cardWidth, cardHeight, 0x000000, 0)
                .setInteractive();

            // Stroke emoji - larger
            this.add.text(x - cardWidth/3, y, stroke.emoji, {
                font: this.isMobile ? '48px Arial' : '56px Arial'
            }).setOrigin(0.5);

            // Stroke name - larger and better positioned
            this.add.text(x + cardWidth/6, y - 20, stroke.name, {
                font: this.isMobile ? 'bold 20px Arial' : 'bold 24px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5);

            // Description - larger and more readable
            this.add.text(x + cardWidth/6, y + 15, stroke.desc, {
                font: this.isMobile ? '14px Arial' : '16px Arial',
                fill: '#ccddff'
            }).setOrigin(0.5);

            // Hover effects
            button.on('pointerover', () => {
                card.clear();
                card.fillStyle(0x0088ff, 1.0);
                card.fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 15);
                card.lineStyle(4, 0x88ddff, 1);
                card.strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 15);
                
                this.tweens.add({
                    targets: button,
                    scaleX: 1.03,
                    scaleY: 1.03,
                    duration: 150,
                    ease: 'Back.easeOut'
                });
            });

            button.on('pointerout', () => {
                card.clear();
                card.fillStyle(0x0066cc, 0.9);
                card.fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 15);
                card.lineStyle(3, 0x66ccff, 0.8);
                card.strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 15);
                
                this.tweens.add({
                    targets: button,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 150,
                    ease: 'Back.easeOut'
                });
            });

            button.on('pointerdown', () => {
                this.cameras.main.flash(300, 255, 255, 255, 0.3);
                this.time.delayedCall(200, () => {
                    this.scene.start('RaceScene', { strokeType: stroke.key });
                });
            });
        });
    }

    createBottomButtons() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // High scores button - larger and more prominent
        const buttonWidth = this.isMobile ? 240 : 300;
        const buttonHeight = this.isMobile ? 60 : 70;
        const buttonY = height - 120;

        const highScoresBg = this.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, 0x4a90e2);
        highScoresBg.setStrokeStyle(4, 0x66ccff);

        const highScoresText = this.add.text(width / 2, buttonY, '🏆 HIGH SCORES', {
            font: this.isMobile ? 'bold 20px Arial' : 'bold 26px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const highScoresButton = this.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, 0x000000, 0)
            .setInteractive();

        highScoresButton.on('pointerdown', () => {
            this.cameras.main.flash(200, 255, 255, 255, 0.2);
            this.time.delayedCall(100, () => {
                this.scene.start('HighScoreScene');
            });
        });

        highScoresButton.on('pointerover', () => {
            highScoresBg.setFillStyle(0x5aa0f2);
            this.tweens.add({
                targets: [highScoresBg, highScoresText],
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150,
                ease: 'Back.easeOut'
            });
        });

        highScoresButton.on('pointerout', () => {
            highScoresBg.setFillStyle(0x4a90e2);
            this.tweens.add({
                targets: [highScoresBg, highScoresText],
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 150,
                ease: 'Back.easeOut'
            });
        });

        // Simple instructions - cleaner and less cluttered
        this.add.text(width / 2, height - 60, this.isMobile ? 
            'TAP to dive, then alternate LEFT/RIGHT to swim' :
            'SPACEBAR to dive • LEFT/RIGHT arrows to swim', {
            font: this.isMobile ? '14px Arial' : '16px Arial',
            fill: '#88ccff',
            alpha: 0.8
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 35, 'Perfect timing = maximum speed!', {
            font: this.isMobile ? '12px Arial' : '14px Arial',
            fill: '#66aadd',
            alpha: 0.7
        }).setOrigin(0.5);
    }

    createSubtleAnimations() {
        // Minimal floating elements for ambiance
        const width = this.cameras.main.width;

        for (let i = 0; i < 4; i++) {
            const bubble = this.add.circle(
                Phaser.Math.Between(100, width - 100),
                Phaser.Math.Between(500, 700),
                Phaser.Math.Between(4, 8),
                0x66aadd,
                0.3
            );

            this.tweens.add({
                targets: bubble,
                y: bubble.y - 200,
                alpha: 0,
                duration: Phaser.Math.Between(4000, 8000),
                repeat: -1,
                delay: i * 1000,
                ease: 'Sine.easeOut'
            });
        }
    }
}