# NVSL Champions: Rolling Hills Rising

A 2D swimming race game built with Phaser 3, featuring rhythm-based swimming mechanics and multiple stroke types.

## Features

- **4 Swimming Strokes**: Freestyle, Backstroke, Breaststroke, and Butterfly
- **Rhythm-Based Gameplay**: Alternate LEFT/RIGHT arrow keys for optimal swimming speed
- **6-Lane Racing**: Compete against AI opponents in realistic pool lanes
- **Performance Analytics**: Get feedback on your stroke timing and efficiency
- **Shape-Based Graphics**: Clean, simple visual design using Phaser shapes

## How to Play

1. **Choose Your Stroke**: Select from 4 different swimming strokes in the main menu
2. **Race Start**: Wait for the countdown, then press SPACEBAR for a diving start boost
3. **Swimming**: Alternate pressing LEFT and RIGHT arrow keys in a steady rhythm
4. **Timing is Key**: Maintain consistent timing for maximum speed and efficiency
5. **Finish Strong**: Cross the finish line and see your results!

## Controls

- **LEFT/RIGHT Arrow Keys**: Alternate for swimming strokes
- **SPACEBAR**: Dive start (only available at race beginning)
- **Mouse**: Navigate menus and buttons

## Local Development

1. Start a local server:
   ```bash
   python3 -m http.server 8080
   ```

2. Open your browser to `http://localhost:8080`

## Deployment to Cloudflare Workers

### Automatic Deployment (Recommended)
The repository is configured for automatic deployment to Cloudflare Workers via GitHub Actions:

1. **Set up Cloudflare secrets** in your GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Add `CLOUDFLARE_API_TOKEN` (get from Cloudflare dashboard)
   - Add `CLOUDFLARE_ACCOUNT_ID` (get from Cloudflare dashboard)

2. **Push to main branch** - deployment happens automatically!

### Manual Deployment
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

   Or deploy manually:
   ```bash
   npm run deploy
   ```

3. **Your game will be live at**: `https://nvsl-swimming-game.your-subdomain.workers.dev`

### Local Development with Workers
```bash
npm run dev          # Start Wrangler dev server
npm run preview      # Preview locally
```

## Game Mechanics

### Swimming System
- **Base Speed**: 100 pixels/second
- **Rhythm Multiplier**: 0.5x to 1.3x based on stroke timing
- **Optimal Timing**: ~800ms between strokes for best efficiency
- **Stroke Decay**: Poor timing reduces speed over time

### AI Opponents
- **Skill Levels**: Varying difficulty from 70-90% rhythm accuracy
- **Lane Assignment**: Player always in lane 3, AI fills other lanes
- **Competitive Racing**: Slight rubber-banding keeps races exciting

## Project Structure

```
├── index.html              # Main HTML file with Phaser CDN
├── src/
│   ├── main.js             # Game initialization
│   ├── config/
│   │   └── gameConfig.js   # Game and race configuration
│   ├── scenes/
│   │   ├── PreloadScene.js # Loading screen
│   │   ├── MenuScene.js    # Main menu and stroke selection
│   │   ├── RaceScene.js    # Main racing gameplay
│   │   └── ResultsScene.js # Race results and analysis
│   └── sprites/
│       └── Swimmer.js      # Swimmer class with AI and player logic
├── worker.js               # Cloudflare Worker script
├── wrangler.toml           # Cloudflare Workers configuration
├── deploy.sh               # Deployment script
├── dist/                   # Built assets directory
└── README.md               # This file
```

## Technical Details

- **Framework**: Phaser 3.80.1 (loaded from CDN)
- **Physics**: Arcade physics with custom swimming mechanics
- **Graphics**: Shape-based rendering (no sprite assets needed)
- **Hosting**: Cloudflare Workers with static asset handling
- **No Dependencies**: Runs directly in browser with CDN-loaded Phaser

## Future Enhancements

- Sprite-based graphics and animations
- Sound effects and background music
- Team management and tournament modes
- Online leaderboards
- Mobile touch controls
- Weather effects and power-ups

## Based on Plan

This game implements Phase 1-3 of the original build plan, focusing on core swimming mechanics and race functionality using shape-based graphics instead of sprites for rapid prototyping.
