// Simplified main.js to debug loading issues
console.log('Loading main.js...');

// Simple fixed configuration
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#0066cc',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: function() {
            console.log('Preload scene started');
        },
        create: function() {
            console.log('Create scene started');
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            // Blue background
            this.add.rectangle(width/2, height/2, width, height, 0x0066cc);
            
            // Title
            this.add.text(width/2, height/2 - 100, 'SWIMMING GAME', {
                fontSize: '48px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            
            // Loading message
            this.add.text(width/2, height/2, 'Game Loading Successfully!', {
                fontSize: '24px',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            
            // Instructions
            this.add.text(width/2, height/2 + 100, 'If you see this, the game engine is working!', {
                fontSize: '18px',
                fill: '#ffffff'
            }).setOrigin(0.5);
            
            console.log('Scene created successfully');
        }
    }
};

console.log('Creating game with config:', config);

// Start the game
const game = new Phaser.Game(config);

console.log('Game created:', game);

export default game;