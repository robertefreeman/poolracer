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
        
        // For mobile, calculate scale to fit screen
        const scaleX = screenWidth / baseWidth;
        const scaleY = screenHeight / baseHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1
        
        return {
            width: Math.floor(baseWidth * scale),
            height: Math.floor(baseHeight * scale),
            scale: scale
        };
    }
    
    static shouldShowLandscapePrompt() {
        return this.isMobile() && this.isPortrait() && window.innerWidth < 800;
    }
}