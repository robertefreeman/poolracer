export const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
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
    poolLength: 700, // pixels
    baseSpeed: 100, // pixels per second
    rhythmWindow: 0.3, // seconds for good timing
    strokeTypes: ['freestyle', 'backstroke', 'breaststroke', 'butterfly']
};