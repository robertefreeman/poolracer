// Phaser is loaded from CDN
import { gameConfig } from './config/gameConfig.js';
import { MobileDetection } from './utils/MobileDetection.js';
import PreloadScene from './scenes/PreloadScene.js';
import OrientationScene from './scenes/OrientationScene.js';
import MenuScene from './scenes/MenuScene.js';
import RaceScene from './scenes/RaceScene.js';
import ResultsScene from './scenes/ResultsScene.js';
import HighScoreScene from './scenes/HighScoreScene.js';
import NameEntryScene from './scenes/NameEntryScene.js';

// Configure Phaser game
const config = {
    ...gameConfig,
    scene: [PreloadScene, OrientationScene, MenuScene, RaceScene, ResultsScene, HighScoreScene, NameEntryScene],
    parent: 'game-container'
};

// Start the game
const game = new Phaser.Game(config);

// Handle dynamic resizing for mobile
if (MobileDetection.isMobile()) {
    // Listen for orientation changes and resize events
    const handleResize = () => {
        const newSize = MobileDetection.getOptimalGameSize();
        
        // Update game scale
        game.scale.setGameSize(newSize.width, newSize.height);
        game.scale.refresh();
        
        // Check if we need to show orientation prompt
        if (MobileDetection.shouldShowLandscapePrompt() && 
            (game.scene.isActive('MenuScene') || 
             game.scene.isActive('RaceScene') || 
             game.scene.isActive('ResultsScene'))) {
            game.scene.start('OrientationScene');
        }
    };
    
    // Add event listeners for mobile
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 500); // Delay for orientation change completion
    });
    
    // Initial check
    setTimeout(() => {
        if (MobileDetection.shouldShowLandscapePrompt()) {
            game.scene.start('OrientationScene');
        }
    }, 100);
}

export default game;