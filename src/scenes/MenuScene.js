export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Title
        this.add.text(width / 2, 100, 'NVSL Champions', {
            font: 'bold 36px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 140, 'Rolling Hills Rising', {
            font: '24px Arial',
            fill: '#cccccc'
        }).setOrigin(0.5);

        // Stroke selection buttons
        const strokes = [
            { name: 'Freestyle', key: 'freestyle' },
            { name: 'Backstroke', key: 'backstroke' },
            { name: 'Breaststroke', key: 'breaststroke' },
            { name: 'Butterfly', key: 'butterfly' }
        ];

        this.add.text(width / 2, 220, 'Choose Your Stroke:', {
            font: '20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        strokes.forEach((stroke, index) => {
            const button = this.add.rectangle(
                width / 2, 
                280 + (index * 60), 
                200, 
                40, 
                0x0066cc
            ).setInteractive();

            const buttonText = this.add.text(
                width / 2, 
                280 + (index * 60), 
                stroke.name, 
                {
                    font: '18px Arial',
                    fill: '#ffffff'
                }
            ).setOrigin(0.5);

            button.on('pointerover', () => {
                button.setFillStyle(0x0088ff);
            });

            button.on('pointerout', () => {
                button.setFillStyle(0x0066cc);
            });

            button.on('pointerdown', () => {
                this.scene.start('RaceScene', { strokeType: stroke.key });
            });
        });

        // Instructions
        this.add.text(width / 2, 520, 'Use LEFT/RIGHT arrows to swim • SPACEBAR to dive', {
            font: '14px Arial',
            fill: '#cccccc'
        }).setOrigin(0.5);
    }
}