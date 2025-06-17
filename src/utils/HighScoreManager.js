export class HighScoreManager {
    constructor() {
        this.storageKey = 'poolracer_highscores';
        this.maxScores = 10;
        this.strokeTypes = ['freestyle', 'backstroke', 'breaststroke', 'butterfly'];
        this.initializeScores();
    }

    initializeScores() {
        // Load existing scores or create default structure
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                this.scores = JSON.parse(saved);
                // Ensure all stroke types exist
                this.strokeTypes.forEach(stroke => {
                    if (!this.scores[stroke]) {
                        this.scores[stroke] = [];
                    }
                });
            } catch (e) {
                console.error('Error loading high scores:', e);
                this.createDefaultScores();
            }
        } else {
            this.createDefaultScores();
        }
    }

    createDefaultScores() {
        this.scores = {};
        this.strokeTypes.forEach(stroke => {
            this.scores[stroke] = [];
        });
        this.saveScores();
    }

    // Check if a time qualifies for high score (lower time is better)
    isHighScore(strokeType, time) {
        try {
            const strokeScores = this.scores[strokeType] || [];
            
            console.log(`Checking high score for ${strokeType}: ${time}s`);
            console.log(`Current scores:`, strokeScores);
            
            // If less than max scores, it's automatically a high score
            if (strokeScores.length < this.maxScores) {
                console.log(`Qualifies: Less than ${this.maxScores} scores exist`);
                return true;
            }
            
            // Check if time is better than the worst high score
            const worstScore = strokeScores[strokeScores.length - 1];
            const qualifies = time < worstScore.time;
            console.log(`Worst score: ${worstScore.time}s, Qualifies: ${qualifies}`);
            return qualifies;
        } catch (error) {
            console.error('Error checking high score:', error);
            return false;
        }
    }

    // Add a new high score
    addHighScore(strokeType, time, playerName, place = null) {
        if (!this.scores[strokeType]) {
            this.scores[strokeType] = [];
        }

        const newScore = {
            name: playerName.substring(0, 12), // Limit to 12 characters
            time: time,
            place: place,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now()
        };

        // Add the new score
        this.scores[strokeType].push(newScore);
        
        // Sort by time (ascending - faster times first)
        this.scores[strokeType].sort((a, b) => a.time - b.time);
        
        // Keep only top 10
        if (this.scores[strokeType].length > this.maxScores) {
            this.scores[strokeType] = this.scores[strokeType].slice(0, this.maxScores);
        }

        this.saveScores();
        
        // Return the position of the new score (1-based)
        const position = this.scores[strokeType].findIndex(score => 
            score.timestamp === newScore.timestamp
        ) + 1;
        
        return position;
    }

    // Get high scores for a specific stroke
    getHighScores(strokeType) {
        return this.scores[strokeType] || [];
    }

    // Get all high scores
    getAllHighScores() {
        return this.scores;
    }

    // Save scores to localStorage
    saveScores() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
        } catch (e) {
            console.error('Error saving high scores:', e);
        }
    }

    // Clear all high scores (for testing or reset)
    clearAllScores() {
        this.createDefaultScores();
    }

    // Clear scores for a specific stroke
    clearStrokeScores(strokeType) {
        if (this.scores[strokeType]) {
            this.scores[strokeType] = [];
            this.saveScores();
        }
    }

    // Format time for display (e.g., "23.45s")
    static formatTime(time) {
        return `${time.toFixed(2)}s`;
    }

    // Get rank suffix (1st, 2nd, 3rd, etc.)
    static getRankSuffix(rank) {
        if (rank === 1) return '1st';
        if (rank === 2) return '2nd';
        if (rank === 3) return '3rd';
        return `${rank}th`;
    }
}

// Create global instance
export const highScoreManager = new HighScoreManager();