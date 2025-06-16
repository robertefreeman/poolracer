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
}