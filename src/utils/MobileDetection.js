export class MobileDetection {
    static isMobile() {
        // Check for mobile user agents
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Mobile device patterns
        const mobilePatterns = [
            /Android/i,
            /webOS/i,
            /iPhone/i,
            /iPad/i,
            /iPod/i,
            /BlackBerry/i,
            /Windows Phone/i,
            /Mobile/i,
            /Tablet/i
        ];
        
        // Check user agent
        const isMobileUA = mobilePatterns.some(pattern => pattern.test(userAgent));
        
        // Check screen size (mobile-like dimensions)
        const isMobileScreen = window.innerWidth <= 1024 || window.innerHeight <= 768;
        
        // Check for touch capability
        const hasTouchScreen = 'ontouchstart' in window || 
                              navigator.maxTouchPoints > 0 || 
                              navigator.msMaxTouchPoints > 0;
        
        return isMobileUA || (isMobileScreen && hasTouchScreen);
    }
    
    static isTablet() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /iPad/i.test(userAgent) || 
               (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent)) ||
               (window.innerWidth >= 768 && window.innerWidth <= 1024);
    }
    
    static getDeviceType() {
        if (this.isTablet()) return 'tablet';
        if (this.isMobile()) return 'mobile';
        return 'desktop';
    }
    
    static getOptimalControlSize() {
        const deviceType = this.getDeviceType();
        switch (deviceType) {
            case 'mobile':
                return { width: 80, height: 80, fontSize: '18px' };
            case 'tablet':
                return { width: 100, height: 100, fontSize: '22px' };
            default:
                return { width: 60, height: 60, fontSize: '16px' };
        }
    }
    
    static isLandscape() {
        return window.innerWidth > window.innerHeight;
    }
    
    static isPortrait() {
        return window.innerHeight > window.innerWidth;
    }
    
    static getOptimalGameSize() {
        const baseWidth = 1280;
        const baseHeight = 720;
        
        if (!this.isMobile()) {
            return { width: baseWidth, height: baseHeight, scale: 1 };
        }
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // For mobile in portrait mode, use portrait-optimized dimensions
        if (this.isPortrait()) {
            const portraitWidth = Math.min(screenWidth * 0.95, 480);
            const portraitHeight = Math.min(screenHeight * 0.95, 854);
            
            return {
                width: Math.floor(portraitWidth),
                height: Math.floor(portraitHeight),
                scale: portraitWidth / baseWidth,
                isPortrait: true
            };
        }
        
        // For mobile in landscape, use existing logic
        const scaleX = screenWidth / baseWidth;
        const scaleY = screenHeight / baseHeight;
        const scale = Math.min(scaleX, scaleY, 1);
        
        return {
            width: Math.floor(baseWidth * scale),
            height: Math.floor(baseHeight * scale),
            scale: scale,
            isPortrait: false
        };
    }
    
    static shouldShowLandscapePrompt() {
        // Only show landscape prompt for very small screens or if user prefers landscape
        return this.isMobile() && this.isPortrait() && window.innerWidth < 600;
    }
    
    static getPortraitLayoutConfig() {
        if (!this.isPortrait()) return null;
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        return {
            poolOrientation: 'vertical', // Pool runs top to bottom instead of left to right
            controlsPosition: 'bottom',
            uiScale: Math.min(screenWidth / 480, 1),
            laneWidth: screenWidth * 0.8 / 6, // 6 lanes across 80% of screen width
            poolLength: screenHeight * 0.7 // Pool takes up 70% of screen height
        };
    }
}