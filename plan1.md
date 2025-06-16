# Rolling Hills Racers - Build Plan

## Project Overview
A simplified 2D swimming race game focusing on the race phase only, built with Phaser3 and hosted on Cloudflare Pages (free tier).

## Tech Stack

### Core Technologies
- **Game Framework**: Phaser 3.80.1 (latest stable)
- **Language**: JavaScript/ES6
- **Build Tool**: Vite 5.x
- **Hosting**: Cloudflare Pages (free tier)
- **Version Control**: GitHub

### Development Tools
- **Code Editor**: VS Code
- **Asset Creation**: 
  - Aseprite or Piskel (pixel art)
  - Audacity (sound effects)
- **Local Server**: Vite dev server

## Project Structure

```
nvsl-swimming-game/
├── src/
│   ├── scenes/
│   │   ├── PreloadScene.js
│   │   ├── MenuScene.js
│   │   ├── RaceScene.js
│   │   └── ResultsScene.js
│   ├── sprites/
│   │   ├── Swimmer.js
│   │   └── Lane.js
│   ├── config/
│   │   ├── gameConfig.js
│   │   └── raceConfig.js
│   └── main.js
├── assets/
│   ├── images/
│   │   ├── swimmers/
│   │   ├── pool/
│   │   └── ui/
│   └── audio/
│       ├── sfx/
│       └── music/
├── public/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Race Phase Features (MVP)

### Core Mechanics
1. **Swimming Controls**
   - Left/Right arrow keys: Alternate for stroke rhythm
   - Spacebar: Dive start (timing-based)
   - Maintain rhythm for optimal speed

2. **Race Types**
   - 25m Freestyle
   - 25m Backstroke
   - 25m Breaststroke
   - 25m Butterfly

3. **Lane System**
   - 6 lanes total
   - Player in lane 3
   - AI opponents in other lanes

4. **Timing System**
   - Race timer display
   - Split times
   - Final times with places

### Visual Design
- **Pool View**: Top-down perspective
- **Swimmer Sprites**: 32x32 pixel sprites with 4-frame animation
- **Pool Dimensions**: 800x600 game canvas
- **Lane Markers**: Clear lane ropes
- **UI Elements**: Timer, stroke indicator, rhythm meter

## Development Phases

### Phase 1: Setup & Basic Structure (Week 1)
- [ ] Initialize project with Vite
- [ ] Set up Phaser3 configuration
- [ ] Create basic scene structure
- [ ] Implement Cloudflare Pages deployment pipeline

### Phase 2: Core Swimming Mechanics (Week 2)
- [ ] Create swimmer sprite and animations
- [ ] Implement rhythm-based movement
- [ ] Add lane boundaries
- [ ] Create basic AI opponents

### Phase 3: Race Logic (Week 3)
- [ ] Implement race start sequence
- [ ] Add timing system
- [ ] Create finish line detection
- [ ] Build results display

### Phase 4: Polish & Additional Races (Week 4)
- [ ] Add all four stroke types
- [ ] Implement sound effects
- [ ] Create team-specific visuals
- [ ] Add particle effects for splashing

### Phase 5: Testing & Deployment (Week 5)
- [ ] Performance optimization
- [ ] Mobile touch controls
- [ ] Final testing
- [ ] Deploy to Cloudflare Pages

## Technical Implementation Details

### Game Configuration
```javascript
// Basic Phaser config
const config = {
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
    scene: [PreloadScene, MenuScene, RaceScene, ResultsScene]
};
```

### Swimmer Movement Algorithm
- Base speed: 100 pixels/second
- Rhythm multiplier: 0.8x - 1.2x based on timing
- Stroke efficiency decay: -5% per second if rhythm broken
- Lane drift: ±10 pixels if rhythm poor

### AI Opponent Behavior
- Skill levels: Easy (Walden Glenn), Medium (Fox Hunt)
- Random rhythm accuracy: 70-90%
- Slight rubber-banding to keep races competitive

## Asset Requirements

### Sprites Needed
- [ ] Swimmer animations (4 strokes × 4 frames each)
- [ ] Pool background
- [ ] Lane ropes
- [ ] Starting blocks
- [ ] UI elements (buttons, timer, meters)

### Audio Needed
- [ ] Starter pistol
- [ ] Splash effects
- [ ] Crowd cheering
- [ ] Background ambience
- [ ] Victory fanfare

## Cloudflare Deployment

### Build Configuration
```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Cloudflare Pages Settings
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables: None needed for MVP

## Performance Targets
- Load time: < 3 seconds
- Stable 60 FPS on mid-range devices
- Total build size: < 5MB
- Mobile-responsive design

## Future Enhancements (Post-MVP)
- Team management phase
- Multiple meet tournaments
- Online leaderboards
- Customizable swimmer appearances
- Weather effects
- Power-ups and special abilities

## Success Metrics
- Playable race in under 2 minutes
- Clear visual feedback for rhythm timing
- Distinctive feel between stroke types
- Engaging enough for "just one more race"

## Resources & References
- [Phaser 3 Documentation](https://phaser.io/phaser3)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [NVSL Official Rules](https://www.nvsl.com)
- [Vite Documentation](https://vitejs.dev)
