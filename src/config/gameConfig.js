import { MobileDetection } from '../utils/MobileDetection.js';

// Get optimal game size based on device
const gameSize = MobileDetection.getOptimalGameSize();

export const gameConfig = {
    type: Phaser.AUTO,
    width: gameSize.width,
    height: gameSize.height,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameSize.width,
        height: gameSize.height
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    backgroundColor: '#0066cc'
};

export const raceConfig = {
    lanes: 6,
    playerLane: 2, // 0-indexed, so lane 3
    poolLength: 1120, // pixels (updated for 16:9 aspect ratio)
    baseSpeed: 100, // pixels per second
    rhythmWindow: 0.3, // seconds for good timing
    strokeTypes: ['freestyle', 'backstroke', 'breaststroke', 'butterfly']
};