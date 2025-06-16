# NVSL Champions: Rolling Hills Rising

A 2D swimming race game built with Phaser 3, featuring rhythm-based swimming mechanics and multiple stroke types. Deployed on Cloudflare Workers for global edge performance.

## 🏊‍♂️ Game Features

- **4 Swimming Strokes**: Freestyle, Backstroke, Breaststroke, and Butterfly
- **Rhythm-Based Gameplay**: Alternate LEFT/RIGHT arrow keys for optimal swimming speed
- **6-Lane Racing**: Compete against 5 AI opponents in realistic pool lanes
- **Performance Analytics**: Real-time feedback on stroke timing and efficiency
- **Shape-Based Graphics**: Clean, geometric visual design using Phaser shapes
- **Global Deployment**: Fast loading via Cloudflare Workers edge network

## 🎮 How to Play

### Game Flow
1. **Main Menu**: Choose from 4 swimming stroke types
2. **Race Countdown**: 3-2-1-GO! countdown sequence
3. **Dive Start**: Press SPACEBAR during first second for speed boost
4. **Swimming Phase**: Alternate LEFT/RIGHT arrows in steady rhythm
5. **Finish Line**: Cross at 25m mark to complete race
6. **Results**: View placement, time, and performance analysis

### Controls & Strategy
- **LEFT/RIGHT Arrow Keys**: Alternate these keys for swimming strokes
- **SPACEBAR**: Dive start boost (only available first 1 second of race)
- **Mouse/Click**: Navigate menus and restart races
- **Optimal Rhythm**: ~800ms between strokes for maximum efficiency
- **Visual Feedback**: Watch the rhythm meter (green = excellent, yellow = good, red = poor)

## 🛠️ Development & Deployment

### Quick Start (Local Development)
```bash
# Option 1: Simple HTTP server (no build required)
python3 -m http.server 8080
# Then open http://localhost:8080

# Option 2: Cloudflare Workers development
npm install
npm run dev          # Start Wrangler dev server with Workers environment
```

### 🚀 Deployment to Cloudflare Workers

#### Automatic Deployment (Recommended)
This repository uses GitHub Actions for automatic deployment:

1. **Fork this repository** to your GitHub account

2. **Set up Cloudflare secrets** in your repository:
   - Go to `Settings → Secrets and variables → Actions`
   - Add these secrets:
     - `CLOUDFLARE_API_TOKEN`: Get from [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
     - `CLOUDFLARE_ACCOUNT_ID`: Get from Cloudflare Dashboard sidebar

3. **Push to main branch** - GitHub Actions will automatically deploy!

#### Manual Deployment
```bash
# Install dependencies
npm install

# Deploy using script
./deploy.sh

# Or deploy directly
npm run deploy
```

#### Live URL
After deployment, your game will be available at:
`https://nvsl-swimming-game.your-subdomain.workers.dev`

### 🔧 Development Commands
```bash
npm run dev          # Start Wrangler dev server (Workers environment)
npm run build        # Build assets to dist/ directory
npm run deploy       # Build and deploy to Cloudflare Workers
npm run preview      # Preview locally with Workers runtime
```

## ⚙️ Game Mechanics

### Swimming Physics
- **Base Speed**: 100 pixels/second baseline movement
- **Rhythm Multiplier**: 0.5x to 1.3x speed based on stroke timing accuracy
- **Optimal Timing**: ~800ms between LEFT/RIGHT key presses for maximum efficiency
- **Stroke Decay**: Speed decreases over time without proper rhythm maintenance
- **Dive Boost**: SPACEBAR during first second adds 20 pixels + 1.2x rhythm multiplier

### Race Setup
- **Pool Length**: 25 meters (700 pixels)
- **Lane Count**: 6 lanes total
- **Player Position**: Always assigned to lane 3 (middle)
- **AI Opponents**: 5 computer-controlled swimmers in remaining lanes

### AI Behavior
- **Skill Variation**: Each AI has 70-90% rhythm accuracy
- **Stroke Intervals**: AI strokes every 0.6-1.0 seconds based on skill
- **Competitive Balance**: Slight performance variation keeps races close
- **No Rubber-banding**: Pure skill-based competition

### Stroke Types
All four strokes have identical mechanics but different visual representations:
- **Freestyle**: Standard forward swimming animation
- **Backstroke**: Swimmer faces upward
- **Breaststroke**: Wider arm movements
- **Butterfly**: Synchronized arm motions

## 📁 Project Structure

```
poolracer/
├── index.html              # Main HTML file with Phaser 3.80.1 CDN
├── src/                    # Game source code
│   ├── main.js             # Game initialization and scene configuration
│   ├── config/
│   │   └── gameConfig.js   # Game settings and race configuration
│   ├── scenes/             # Phaser game scenes
│   │   ├── PreloadScene.js # Loading screen with progress bar
│   │   ├── MenuScene.js    # Main menu and stroke selection
│   │   ├── RaceScene.js    # Core racing gameplay and mechanics
│   │   └── ResultsScene.js # Race results and performance analysis
│   └── sprites/
│       └── Swimmer.js      # Swimmer class with AI and player logic
├── dist/                   # Built assets for deployment
│   ├── index.html          # Copied HTML file
│   └── src/                # Copied source files
├── worker.js               # Cloudflare Worker with KV asset handler
├── wrangler.toml           # Cloudflare Workers configuration
├── package.json            # Dependencies and npm scripts
├── deploy.sh               # Deployment script with authentication
├── .github/workflows/      # GitHub Actions for auto-deployment
│   └── deploy.yml          # CI/CD pipeline configuration
└── README.md               # This documentation
```

## 🔧 Technical Implementation

### Core Technologies
- **Game Engine**: Phaser 3.80.1 (loaded from jsDelivr CDN)
- **Physics**: Arcade physics with custom swimming mechanics
- **Graphics**: Geometric shapes (rectangles, circles) - no sprite assets required
- **Hosting**: Cloudflare Workers with static asset serving
- **Deployment**: GitHub Actions + Wrangler CLI

### Performance Features
- **Edge Computing**: Global deployment via Cloudflare's edge network
- **Asset Caching**: Optimized caching headers for static files
- **Security Headers**: CSP, X-Frame-Options, and other security measures
- **Zero Build Step**: Runs directly in browser with CDN dependencies

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (ES6+ support required)
- **Mobile Support**: Touch-friendly interface (mouse/touch events)
- **No Installation**: Runs entirely in web browser

## 🚀 Future Enhancements

### Phase 4+ Roadmap
- **Visual Upgrades**
  - Sprite-based swimmer animations
  - Pool water effects and ripples
  - Particle effects for splashing
  - Team-specific swimmer colors/uniforms

- **Audio System**
  - Sound effects (splash, whistle, crowd)
  - Background music and ambience
  - Audio feedback for rhythm timing

- **Gameplay Features**
  - Multiple race distances (50m, 100m)
  - Relay races and team events
  - Tournament bracket system
  - Power-ups and special abilities

- **Social Features**
  - Online leaderboards
  - Ghost race replays
  - Social sharing of race results
  - Multiplayer racing

- **Mobile Optimization**
  - Touch controls for mobile devices
  - Progressive Web App (PWA) features
  - Offline gameplay capability

## 📋 Development Status

### ✅ Completed (Phases 1-3)
- Core swimming mechanics with rhythm-based gameplay
- 4 stroke types with visual differentiation
- AI opponents with varying skill levels
- Complete race flow (menu → race → results)
- Cloudflare Workers deployment
- Performance analytics and feedback

### 🔄 Current Phase
- **Phase 4**: Polish and optimization
- **Focus**: Performance tuning and user experience improvements

### 📊 Based on Original Plan
This implementation follows the [plan1.md](plan1.md) specification, delivering a fully playable swimming race game with modern web deployment. The shape-based graphics approach enables rapid prototyping while maintaining clean, performant gameplay.
