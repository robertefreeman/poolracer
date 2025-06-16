import { MobileDetection } from '../utils/MobileDetection.js';

export default class OrientationScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OrientationScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

        // Phone rotation icon
        this.createRotationIcon(width / 2, height / 2 - 100);

        // Title
        this.add.text(width / 2, height / 2 - 20, 'Please Rotate Your Device', {
            font: 'bold 24px Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 2 + 20, 'For the best experience, please\nrotate to landscape mode', {
            font: '16px Arial',
            fill: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);

        // Continue button for those who want to play in portrait anyway
        this.createContinueButton(width / 2, height / 2 + 100);

        // Listen for orientation changes
        this.checkOrientation();
        window.addEventListener('resize', () => this.checkOrientation());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.checkOrientation(), 500); // Delay for orientation change
        });
    }

    createRotationIcon(x, y) {
        // Phone outline
        const phone = this.add.graphics();
        phone.lineStyle(3, 0x66ccff, 1);
        phone.strokeRoundedRect(x - 25, y - 40, 50, 80, 8);
        
        // Screen
        phone.fillStyle(0x333333, 1);
        phone.fillRoundedRect(x - 20, y - 30, 40, 60, 4);
        
        // Home button
        phone.fillStyle(0x66ccff, 1);
        phone.fillCircle(x, y + 45, 3);

        // Rotation arrow
        const arrow = this.add.graphics();
        arrow.lineStyle(2, 0x00ff00, 1);
        
        // Curved arrow
        arrow.beginPath();
        arrow.arc(x + 60, y, 30, -Math.PI/2, Math.PI/2, false);
        arrow.strokePath();
        
        // Arrow head
        arrow.fillStyle(0x00ff00, 1);
        arrow.fillTriangle(x + 85, y + 25, x + 95, y + 30, x + 85, y + 35);

        // Animate the arrow
        this.tweens.add({
            targets: arrow,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createContinueButton(x, y) {
        // Button background
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x0066cc, 0.8);
        buttonBg.fillRoundedRect(x - 80, y - 20, 160, 40, 8);
        buttonBg.lineStyle(2, 0x66ccff, 1);
        buttonBg.strokeRoundedRect(x - 80, y - 20, 160, 40, 8);

        // Button text
        const buttonText = this.add.text(x, y, 'Continue Anyway', {
            font: 'bold 14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Interactive area
        const button = this.add.rectangle(x, y, 160, 40, 0x000000, 0)
            .setInteractive();

        // Button events
        button.on('pointerdown', () => {
            this.continueToGame();
        });

        button.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x0088ff, 0.9);
            buttonBg.fillRoundedRect(x - 80, y - 20, 160, 40, 8);
            buttonBg.lineStyle(2, 0x88ddff, 1);
            buttonBg.strokeRoundedRect(x - 80, y - 20, 160, 40, 8);
        });

        button.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x0066cc, 0.8);
            buttonBg.fillRoundedRect(x - 80, y - 20, 160, 40, 8);
            buttonBg.lineStyle(2, 0x66ccff, 1);
            buttonBg.strokeRoundedRect(x - 80, y - 20, 160, 40, 8);
        });
    }

    checkOrientation() {
        if (!MobileDetection.shouldShowLandscapePrompt()) {
            this.continueToGame();
        }
    }

    continueToGame() {
        // Remove event listeners
        window.removeEventListener('resize', this.checkOrientation);
        window.removeEventListener('orientationchange', this.checkOrientation);
        
        // Go to menu
        this.scene.start('MenuScene');
    }
}