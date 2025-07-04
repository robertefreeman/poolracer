import { MobileDetection } from '../utils/MobileDetection.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Mobile detection
        this.isMobile = MobileDetection.isMobile();

        // Initialize player name
        this.playerName = localStorage.getItem('poolracer_playername') || '';

        // Create clean background
        this.createCleanBackground();

        // Main title - larger and more prominent
    this.createMainTitle();

        // Create player name input section
    this.createPlayerNameSection();

        // Create stroke selection cards - bigger and cleaner
        this.createStrokeCards();
        
        // Create bottom buttons section
        this.createBottomButtons();

        // Add subtle animated elements
        this.createSubtleAnimations();
    }

    createCleanBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Clean gradient background
        const graphics = this.add.graphics();
        
        // Simple two-tone gradient
        graphics.fillGradientStyle(0x001133, 0x001133, 0x003366, 0x003366);
        graphics.fillRect(0, 0, width, height);

        // Subtle water texture with minimal elements
        for (let i = 0; i < 3; i++) {
            const ripple = this.add.circle(
                Phaser.Math.Between(200, width - 200),
                Phaser.Math.Between(300, height - 300),
                Phaser.Math.Between(40, 80),
                0x004488,
                0.1
            );
            
            this.tweens.add({
                targets: ripple,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 4000,
                repeat: -1,
                delay: i * 1500,
                ease: 'Sine.easeOut'
            });
        }
    }

    createMainTitle() {
        const width = this.cameras.main.width;

        // Main title - much larger and more prominent
        const titleSize = this.isMobile ? '56px' : '72px';
        const subtitleSize = this.isMobile ? '20px' : '28px';

        // Title shadow
        this.add.text(width / 2 + 4, 124, 'Rolling Hills Racers', {
            font: `bold ${titleSize} Arial`,
            fill: '#000000',
            alpha: 0.3
        }).setOrigin(0.5);
        
        // Main title
        const mainTitle = this.add.text(width / 2, 120, 'Rolling Hills Racers', {
            font: `bold ${titleSize} Arial`,
            fill: '#ffffff',
            stroke: '#0066cc',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle - cleaner and more readable
        this.add.text(width / 2, 180, 'Week 2: Seahawks VS Ravens', {
            font: `${subtitleSize} Arial`,
            fill: '#66ccff',
            alpha: 0.9
        }).setOrigin(0.5);

        // Add subtle glow effect to title
        this.tweens.add({
            targets: mainTitle,
            alpha: 0.9,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createStrokeCards() {
        const width = this.cameras.main.width;

        const strokes = [
            { name: 'Freestyle', key: 'freestyle', emoji: 'FS', desc: 'Fast & Efficient' },
            { name: 'Backstroke', key: 'backstroke', emoji: 'BS', desc: 'Smooth & Steady' },
            { name: 'Breaststroke', key: 'breaststroke', emoji: 'BR', desc: 'Power & Technique' },
            { name: 'Butterfly', key: 'butterfly', emoji: 'FLY', desc: 'Speed & Strength' }
        ];

        // Section title - larger and more prominent
        this.add.text(width / 2, 300, 'Choose Your Style', {
            font: this.isMobile ? 'bold 28px Arial' : 'bold 36px Arial',
            fill: '#ffffff',
            stroke: '#0066cc',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Much larger cards with better proportions
        const cardWidth = width * 0.7; // Adjusted for portrait
        const cardHeight = this.isMobile ? 100 : 120;
        const spacing = this.isMobile ? 25 : 35;
        // const totalWidth = (cardWidth * 2) + spacing; // Old
        // const startX = (width - totalWidth) / 2; // Old

        strokes.forEach((stroke, index) => {
            // const row = Math.floor(index / 2); // Old
            // const col = index % 2; // Old
            // const x = startX + (col * (cardWidth + spacing)) + (cardWidth / 2); // Old
            // const y = 380 + (row * (cardHeight + spacing)); // Old

            // New calculations for vertical stack:
            const x = width / 2; // Center each card horizontally
            const initialCardY = 380; // Starting Y for the first card
            const y = initialCardY + (index * (cardHeight + spacing));

            // Card background with cleaner design
            const card = this.add.graphics();
            card.fillStyle(0x0066cc, 0.9);
            card.fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 15);
            card.lineStyle(3, 0x66ccff, 0.8);
            card.strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 15);

            // Interactive area
            const button = this.add.rectangle(x, y, cardWidth, cardHeight, 0x000000, 0) // Uncommented
                .setInteractive(); // Uncommented

            // Stroke emoji - larger
            this.add.text(x - cardWidth/3, y, stroke.emoji, {
                font: this.isMobile ? '48px Arial' : '56px Arial'
            }).setOrigin(0.5);

            // Stroke name - larger and better positioned
            this.add.text(x + cardWidth/6, y - 20, stroke.name, {
                font: this.isMobile ? 'bold 20px Arial' : 'bold 24px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5);

            // Description - larger and more readable
            this.add.text(x + cardWidth/6, y + 15, stroke.desc, {
                font: this.isMobile ? '14px Arial' : '16px Arial',
                fill: '#ccddff'
            }).setOrigin(0.5);

            // Hover effects
            button.on('pointerover', () => {
                card.clear();
                card.fillStyle(0x0088ff, 1.0);
                card.fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 15);
                card.lineStyle(4, 0x88ddff, 1);
                card.strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 15);
                
                this.tweens.add({
                    targets: button,
                    scaleX: 1.03,
                    scaleY: 1.03,
                    duration: 150,
                    ease: 'Back.easeOut'
                });
            });

            button.on('pointerout', () => {
                card.clear();
                card.fillStyle(0x0066cc, 0.9);
                card.fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 15);
                card.lineStyle(3, 0x66ccff, 0.8);
                card.strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 15);
                
                this.tweens.add({
                    targets: button,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 150,
                    ease: 'Back.easeOut'
                });
            });

            button.on('pointerdown', () => {
                // Check if player has entered a name
                if (!this.playerName || this.playerName.trim().length === 0) {
                    this.showNameRequiredMessage();
                    return;
                }
                
                this.cameras.main.flash(300, 255, 255, 255, 0.3);
                this.time.delayedCall(200, () => {
                    this.scene.start('RaceScene', { 
                        strokeType: stroke.key,
                        playerName: this.playerName.trim()
                    });
                });
            });
        });
    }

    createBottomButtons() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // High scores button - larger and more prominent
        const buttonWidth = this.isMobile ? 240 : 300;
        const buttonHeight = this.isMobile ? 60 : 70;
        const buttonY = height - 120;

        const highScoresBg = this.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, 0x4a90e2);
        highScoresBg.setStrokeStyle(4, 0x66ccff);

        const highScoresText = this.add.text(width / 2, buttonY, '🏆 HIGH SCORES', {
            font: this.isMobile ? 'bold 20px Arial' : 'bold 26px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const highScoresButton = this.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, 0x000000, 0)
            .setInteractive();

        highScoresButton.on('pointerdown', () => {
            this.cameras.main.flash(200, 255, 255, 255, 0.2);
            this.time.delayedCall(100, () => {
                this.scene.start('HighScoreScene');
            });
        });

        highScoresButton.on('pointerover', () => {
            highScoresBg.setFillStyle(0x5aa0f2);
            this.tweens.add({
                targets: [highScoresBg, highScoresText],
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 150,
                ease: 'Back.easeOut'
            });
        });

        highScoresButton.on('pointerout', () => {
            highScoresBg.setFillStyle(0x4a90e2);
            this.tweens.add({
                targets: [highScoresBg, highScoresText],
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 150,
                ease: 'Back.easeOut'
            });
        });

        // Simple instructions - cleaner and less cluttered
        this.add.text(width / 2, height - 60, this.isMobile ? 
            'TAP to dive, then alternate LEFT/RIGHT to swim' :
            'SPACEBAR to dive • LEFT/RIGHT arrows to swim', {
            font: this.isMobile ? '14px Arial' : '16px Arial',
            fill: '#88ccff',
            alpha: 0.8
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 35, 'Perfect timing = maximum speed!', {
            font: this.isMobile ? '12px Arial' : '14px Arial',
            fill: '#66aadd',
            alpha: 0.7
        }).setOrigin(0.5);
    }

    createPlayerNameSection() {
        const width = this.cameras.main.width;
        
        // Player name label
        this.add.text(width / 2, 220, 'Your Name (for high scores):', {
            font: this.isMobile ? '16px Arial' : '18px Arial',
            fill: '#ccddff'
        }).setOrigin(0.5);

        // Name input field background
        this.nameInputBg = this.add.rectangle(width / 2, 250, 300, 40, 0x003366);
        this.nameInputBg.setStrokeStyle(2, 0x66ccff);

        // Name text display
        this.nameText = this.add.text(width / 2, 250, this.playerName || 'Enter your name...', {
            font: '18px Arial',
            fill: this.playerName ? '#ffffff' : '#888888'
        }).setOrigin(0.5);

        // Make input interactive
        this.nameInputBg.setInteractive();
        this.htmlNameInput = document.getElementById('nameInput'); // Store reference

        if (this.isMobile && this.htmlNameInput) {
            // Mobile: Use HTML input
            this.htmlNameInput.value = this.playerName; // Initialize with current name

            this.nameInputBg.on('pointerdown', () => {
                this.nameInputActive = true;
                this.nameInputBg.setStrokeStyle(3, 0x88ddff); // Highlight effect

                this.htmlNameInput.style.display = 'block';
                this.htmlNameInput.value = this.playerName; // Ensure it has current name

                // Basic positioning - can be improved
                const gameCanvas = this.sys.game.canvas;
                const canvasRect = gameCanvas.getBoundingClientRect();
                const nameTextBounds = this.nameText.getBounds();
                const scaleX = canvasRect.width / gameCanvas.width;
                const scaleY = canvasRect.height / gameCanvas.height;

                this.htmlNameInput.style.position = 'absolute';
                this.htmlNameInput.style.left = `${canvasRect.left + nameTextBounds.x * scaleX}px`;
                this.htmlNameInput.style.top = `${canvasRect.top + nameTextBounds.y * scaleY}px`;
                this.htmlNameInput.style.width = `${nameTextBounds.width * scaleX}px`;
                this.htmlNameInput.style.height = `${nameTextBounds.height * scaleY}px`;
                this.htmlNameInput.style.fontSize = `${18 * scaleY}px`;
                this.htmlNameInput.style.border = 'none';
                this.htmlNameInput.style.background = 'transparent'; // Or a debug color: 'rgba(255,0,0,0.2)';
                this.htmlNameInput.style.color = this.nameText.style.fill;
                this.htmlNameInput.style.textAlign = 'center';
                this.htmlNameInput.style.outline = 'none';

                this.htmlNameInput.focus();
                this.nameText.setVisible(false); // Hide Phaser text
            });

            this.htmlNameInput.addEventListener('input', (event) => {
                this.playerName = event.target.value.substring(0, 12); // Max 12 chars
                event.target.value = this.playerName; // Ensure input reflects truncated value
                // Phaser this.nameText is hidden, so no need to call updateNameDisplay() here.
            });

            const onMobileInputEnd = () => {
                if (!this.nameInputActive) return;
                this.htmlNameInput.style.display = 'none';
                this.nameText.setVisible(true);
                // this.playerName is already updated from 'input' event
                this.finishNameEntry(); // This will trim, save, and call updateNameDisplay
            };

            this.htmlNameInput.addEventListener('blur', () => {
                // Add a small delay to allow 'Enter' keydown to potentially clear focus first
                // and prevent double calls if Enter also triggers blur.
                setTimeout(onMobileInputEnd, 50);
            });

            this.htmlNameInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.htmlNameInput.blur(); // Triggers blur listener
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    this.htmlNameInput.blur(); // Treat escape like finishing entry for simplicity here
                }
            });

        } else {
            // Non-mobile: Original Phaser keyboard input logic
            this.nameInputBg.on('pointerdown', () => {
                this.promptForName();
            });
        }

        // Setup Phaser keyboard input (primarily for non-mobile)
        this.input.keyboard.on('keydown', (event) => {
            // If mobile and HTML input is focused and visible, Phaser shouldn't handle key events for typing
            if (this.isMobile && this.htmlNameInput && document.activeElement === this.htmlNameInput && this.htmlNameInput.style.display === 'block') {
                // Allow Enter/Escape to be handled by the HTML input's own listeners above
                if (event.key === 'Enter' || event.key === 'Escape') {
                    // Already handled by HTML input's listeners
                }
                return; // Stop Phaser from processing other keys
            }

            if (!this.nameInputActive) return; // Only process if name input is generally active

            if (event.key === 'Enter') {
                this.finishNameEntry();
            } else if (event.key === 'Escape') {
                this.cancelNameEntry();
            } else if (event.key === 'Backspace') {
                if (this.playerName.length > 0) {
                    this.playerName = this.playerName.slice(0, -1);
                    this.updateNameDisplay();
                }
            } else if (event.key.length === 1 && this.playerName.length < 12) {
                // Check if it's not mobile or if it is mobile but html input isn't the one handling things
                 if (!this.isMobile || (this.isMobile && document.activeElement !== this.htmlNameInput)) {
                    if (/[a-zA-Z0-9 ]/.test(event.key)) { // Allow spaces
                        this.playerName += event.key;
                        this.updateNameDisplay();
                    }
                }
            }
        });
    }

    promptForName() { // Primarily for non-mobile, or initial setup
        this.nameInputActive = true;
        this.nameInputBg.setStrokeStyle(3, 0x88ddff);
        if (!this.playerName) {
            this.playerName = '';
            this.updateNameDisplay();
        }
    }

    finishNameEntry() {
        if (!this.nameInputActive) return; // Prevent issues if called multiple times
        this.nameInputActive = false;
        this.nameInputBg.setStrokeStyle(2, 0x66ccff);

        if (this.isMobile && this.htmlNameInput && this.htmlNameInput.style.display !== 'none') {
            this.htmlNameInput.style.display = 'none';
        }
        this.nameText.setVisible(true);

        this.playerName = this.playerName.trim(); // Trim whitespace
        localStorage.setItem('poolracer_playername', this.playerName);

        this.updateNameDisplay(); // Update Phaser text with final (possibly trimmed) name
    }

    cancelNameEntry() { // Primarily for non-mobile Escape key
        if (!this.nameInputActive && !(this.isMobile && this.htmlNameInput && this.htmlNameInput.style.display !== 'none')) {
            return;
        }
        this.nameInputActive = false;
        this.nameInputBg.setStrokeStyle(2, 0x66ccff);

        if (this.isMobile && this.htmlNameInput) {
            this.htmlNameInput.style.display = 'none';
        }
        this.nameText.setVisible(true);

        this.playerName = localStorage.getItem('poolracer_playername') || '';
        this.updateNameDisplay();
    }

    updateNameDisplay() {
        // This function's job is to update the Phaser text object.
        // The HTML input updates itself via its 'input' event and value property.
        this.nameText.setVisible(true); // Ensure it's visible

        if (this.playerName.length > 0) {
            this.nameText.setText(this.playerName);
            this.nameText.setFill('#ffffff');
        } else {
            this.nameText.setText('Enter your name...');
            this.nameText.setFill('#888888');
        }
    }

    showNameRequiredMessage() {
        // Flash the name input to indicate it's required
        this.tweens.add({
            targets: this.nameInputBg,
            fillColor: 0xff3333,
            duration: 200,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.nameInputBg.setFillStyle(0x003366);
            }
        });

        // Show temporary message
        const message = this.add.text(this.cameras.main.width / 2, 280, 'Please enter your name first!', {
            font: 'bold 16px Arial',
            fill: '#ff6666',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // Auto-remove message after 2 seconds
        this.time.delayedCall(2000, () => {
            if (message && message.destroy) {
                message.destroy();
            }
        });
    }

    createSubtleAnimations() {
        // Minimal floating elements for ambiance
        const width = this.cameras.main.width;

        for (let i = 0; i < 4; i++) {
            const bubble = this.add.circle(
                Phaser.Math.Between(100, width - 100),
                Phaser.Math.Between(500, 700),
                Phaser.Math.Between(4, 8),
                0x66aadd,
                0.3
            );

            this.tweens.add({
                targets: bubble,
                y: bubble.y - 200,
                alpha: 0,
                duration: Phaser.Math.Between(4000, 8000),
                repeat: -1,
                delay: i * 1000,
                ease: 'Sine.easeOut'
            });
        }
    }
}