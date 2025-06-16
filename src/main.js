// Phaser is loaded from CDN
import { gameConfig } from './config/gameConfig.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import RaceScene from './scenes/RaceScene.js';
import ResultsScene from './scenes/ResultsScene.js';

// Configure Phaser game
const config = {
    ...gameConfig,
    scene: [PreloadScene, MenuScene, RaceScene, ResultsScene],
    parent: 'game-container'
};

// Start the game
const game = new Phaser.Game(config);

export default game;