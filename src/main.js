// Fixed main.js - step by step restoration
console.log('Loading main.js...');

// Import scenes one by one to identify issues
import MenuScene from './scenes/MenuScene.js';

// Simple but working configuration
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
    scene: [MenuScene]
};

console.log('Creating game with config:', config);

// Start the game
const game = new Phaser.Game(config);

console.log('Game created:', game);

export default game;