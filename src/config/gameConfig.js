export const gameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
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