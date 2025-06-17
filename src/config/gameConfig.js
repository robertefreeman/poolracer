import { MobileDetection } from '../utils/MobileDetection.js';

// Use fixed game size for stability
// const gameSize = MobileDetection.getOptimalGameSize();

export const gameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 320,
            height: 180
        },
        max: {
            width: 1920,
            height: 1080
        }
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    backgroundColor: '#e6f3ff'
};

export const raceConfig = {
    lanes: 6,
    playerLane: 2, // 0-indexed, so lane 3
    poolLength: 1120, // pixels (updated for 16:9 aspect ratio)
    baseSpeed: 100, // pixels per second
    rhythmWindow: 0.3, // seconds for good timing
    strokeTypes: ['freestyle', 'backstroke', 'breaststroke', 'butterfly']
};