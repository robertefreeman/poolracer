// Fixed main.js - step by step restoration
console.log('Loading main.js...');

// Import scenes and utilities
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import RaceScene from './scenes/RaceScene.js';
import ResultsScene from './scenes/ResultsScene.js';
import HighScoreScene from './scenes/HighScoreScene.js';
import OrientationScene from './scenes/OrientationScene.js';
import { MobileDetection } from './utils/MobileDetection.js';

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
    physics: { // Added this block
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [PreloadScene, OrientationScene, MenuScene, RaceScene, ResultsScene, HighScoreScene]
};

console.log('Creating game with config:', config);

// Start the game
const game = new Phaser.Game(config);

console.log('Game created:', game);

// Add simple mobile handling (without complex resizing)
if (MobileDetection.isMobile()) {
    console.log('Mobile device detected');
    
    // Simple orientation check
    if (MobileDetection.shouldShowLandscapePrompt()) {
        setTimeout(() => {
            if (game.scene.isActive('MenuScene')) {
                game.scene.start('OrientationScene');
            }
        }, 1000);
    }
}

export default game;