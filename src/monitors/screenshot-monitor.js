class ScreenshotMonitor {
    constructor(onScreenshotAttempt) {
        this.onScreenshotAttempt = onScreenshotAttempt;
        this.sensitiveElements = [];
        this.isBlurring = false;
        this.settings = {
            enabled: true,
            autoBlur: true,
            logAttempts: true,
            showIndicator: true
        };
    }
    
    async initialize() {
        console.log('[Screenshot Monitor] Initializing...');
        
        await this.loadSettings();
        
        if (!this.settings.enabled) {
            console.log('[Screenshot Monitor] Disabled in settings');
            return;
        }
        
        // Add visual indicator that protection is active
        if (this.settings.showIndicator) {
            this.addProtectionIndicator();
        }
        
        // Monitor keyboard shortcuts (Windows/Mac/Linux)
        this.monitorKeyboardShortcuts();
        
        // Monitor visibility changes (user might take screenshot when switching apps)
        this.monitorVisibilityChanges();
        
        // Continuously scan for sensitive content
        this.startContentScanning();
        
        console.log('[Screenshot Monitor] Active - Monitoring keyboard shortcuts and visibility');
    }
    
    async loadSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['screenshotProtection'], (data) => {
                if (data.screenshotProtection) {
                    this.settings = { ...this.settings, ...data.screenshotProtection };
                }
                resolve();
            });
        });
    }
    
    addProtectionIndicator() {
        // Add a small, unobtrusive indicator
        const indicator = document.createElement('div');
        indicator.id = 'vigil-protection-indicator';
        indicator.innerHTML = '🛡️';
        indicator.title = 'Vigil Protection Active - Monitoring for sensitive data';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            background: rgba(26, 115, 232, 0.9);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            z-index: 2147483646;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        `;
        
        indicator.addEventListener('mouseenter', () => {
            indicator.style.transform = 'scale(1.1)';
        });
        
        indicator.addEventListener('mouseleave', () => {
            indicator.style.transform = 'scale(1)';
        });
        
        indicator.addEventListener('click', () => {
            this.showStatus();
        });
        
        document.body?.appendChild(indicator);
    }
    
    showStatus() {
        const hasSensitiveData = this.sensitiveElements.length > 0;
        
        this.showNotification(
            'Vigil Status',
            `Protection: Active\nSensitive areas detected: ${this.sensitiveElements.length}\n${hasSensitiveData ? '⚠️ Screenshot will trigger blur' : '✓ Safe to screenshot'}`,
            5000,
            hasSensitiveData ? '#ea4335' : '#34a853'
        );
    }
    
    // NEW: Called by content.js when an image paste is detected
    handleImagePaste(event) {
        console.log('[Screenshot Monitor] Image paste detected');
        this.handleScreenshotAttempt('paste', 'image');
    }
    
    monitorKeyboardShortcuts() {
        // Windows/Linux/Chrome shortcuts
        document.addEventListener('keydown', async (event) => {
            const isChromeScreenshot = 
                (event.ctrlKey || event.metaKey) && event.shiftKey && 
                (event.key === 'S' || event.key === 's');
            
            const isPrintScreen = event.key === 'PrintScreen';
            
            // Mac screenshot shortcuts: Cmd+Shift+3, 4, 5, 6
            const isMacScreenshot = 
                event.metaKey && event.shiftKey && 
                ['3', '4', '5', '6'].includes(event.key);
            
            // Windows Snipping Tool: Win+Shift+S
            const isWindowsSnip = 
                event.key === 'Meta' && event.shiftKey && event.key === 's';
            
            if (isChromeScreenshot || isPrintScreen || isMacScreenshot || isWindowsSnip) {
                console.log('[Screenshot Monitor] Keyboard shortcut detected:', event.key);
                await this.handleScreenshotAttempt('keyboard', event.key);
            }
        }, true);
    }
    
    monitorVisibilityChanges() {
        // When user switches away, they might be taking a screenshot
        document.addEventListener('visibilitychange', async () => {
            if (document.hidden) {
                console.log('[Screenshot Monitor] Page hidden - potential screenshot');
                // Blur sensitive content preemptively
                if (this.sensitiveElements.length > 0 && this.settings.autoBlur) {
                    this.blurSensitiveContent();
                    
                    // Unblur after user returns and waits a moment
                    const unblurTimer = setTimeout(() => {
                        if (!document.hidden) {
                            this.unblurSensitiveContent();
                        }
                    }, 2000);
                    
                    // Clean up timer if page becomes visible before timeout
                    const visibilityHandler = () => {
                        if (!document.hidden) {
                            clearTimeout(unblurTimer);
                            setTimeout(() => this.unblurSensitiveContent(), 1000);
                            document.removeEventListener('visibilitychange', visibilityHandler);
                        }
                    };
                    document.addEventListener('visibilitychange', visibilityHandler);
                }
            }
        });
    }
    
    startContentScanning() {
        // Scan page periodically for sensitive content
        this.scanInterval = setInterval(() => {
            this.scanVisibleContent();
        }, 5000); // Scan every 5 seconds
        
        // Initial scan
        setTimeout(() => this.scanVisibleContent(), 1000);
    }
    
    async scanVisibleContent() {
        try {
            const visibleText = this.extractVisibleText();
            
            if (visibleText.length < 50) return; // Skip if very little content
            
            const result = await chrome.runtime.sendMessage({
                action: 'analyzePaste',
                content: visibleText,
                context: {
                    url: window.location.href,
                    domain: window.location.hostname,
                    type: 'screenshot_scan'
                }
            });
            
            if (!result.allowed && result.findings && result.findings.length > 0) {
                this.markSensitiveContent(result.findings);
                this.updateIndicatorColor('warning');
            } else {
                this.clearSensitiveMarkings();
                this.updateIndicatorColor('safe');
            }
            
        } catch (error) {
            // Silently fail - content script might not be fully loaded
        }
    }
    
    updateIndicatorColor(status) {
        const indicator = document.getElementById('vigil-protection-indicator');
        if (!indicator) return;
        
        if (status === 'warning') {
            indicator.style.background = 'rgba(234, 67, 53, 0.9)';
            indicator.style.animation = 'pulse 2s infinite';
        } else {
            indicator.style.background = 'rgba(26, 115, 232, 0.9)';
            indicator.style.animation = 'none';
        }
        
        // Add pulse animation
        if (!document.getElementById('vigil-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'vigil-pulse-style';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    extractVisibleText() {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    
                    const style = window.getComputedStyle(parent);
                    if (style.display === 'none' || 
                        style.visibility === 'hidden' ||
                        style.opacity === '0') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    const rect = parent.getBoundingClientRect();
                    if (rect.bottom < 0 || rect.top > window.innerHeight ||
                        rect.right < 0 || rect.left > window.innerWidth) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        let visibleText = '';
        let node;
        while (node = walker.nextNode()) {
            visibleText += node.textContent + ' ';
            if (visibleText.length > 10000) break; // Limit for performance
        }
        
        return visibleText.substring(0, 10000);
    }
    
    markSensitiveContent(findings) {
        this.sensitiveElements = [];
        
        findings.forEach(finding => {
            const elements = this.findElementsWithContent(finding);
            elements.forEach(el => {
                if (!this.sensitiveElements.includes(el)) {
                    this.sensitiveElements.push(el);
                    el.dataset.vigilSensitive = 'true';
                }
            });
        });
        
        console.log(`[Screenshot Monitor] Marked ${this.sensitiveElements.length} sensitive elements`);
    }
    
    findElementsWithContent(finding) {
        const elements = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT
        );
        
        let node;
        while (node = walker.nextNode()) {
            if (finding.sample && finding.sample.some(s => node.textContent.includes(s))) {
                const parent = node.parentElement;
                if (parent && !elements.includes(parent)) {
                    elements.push(parent);
                    if (elements.length >= 10) break;
                }
            }
        }
        
        return elements;
    }
    
    clearSensitiveMarkings() {
        this.sensitiveElements.forEach(el => {
            delete el.dataset.vigilSensitive;
        });
        this.sensitiveElements = [];
    }
    
    async handleScreenshotAttempt(method, key) {
        console.log(`[Screenshot Monitor] Screenshot attempt: ${method} - ${key}`);
        
        const hasSensitiveData = this.sensitiveElements.length > 0;
        
        if (hasSensitiveData) {
            if (this.settings.autoBlur) {
                this.blurSensitiveContent();
                
                this.showWarning(
                    '⚠️ Screenshot Protection Active',
                    `${this.sensitiveElements.length} sensitive area(s) detected and blurred.\nScreenshot may contain protected information.`,
                    5000
                );
                
                setTimeout(() => {
                    this.unblurSensitiveContent();
                }, 4000);
            } else {
                this.showWarning(
                    '⚠️ Screenshot Warning',
                    `Sensitive data visible on this page.\nScreenshot contains ${this.sensitiveElements.length} protected area(s).`,
                    5000
                );
            }
        } else {
            console.log('[Screenshot Monitor] No sensitive data detected - screenshot safe');
        }
        
        if (this.settings.logAttempts) {
            await this.logScreenshotAttempt(method, key, hasSensitiveData);
        }
        
        if (this.onScreenshotAttempt) {
            this.onScreenshotAttempt({
                method,
                key,
                hasSensitiveData,
                elementCount: this.sensitiveElements.length,
                timestamp: Date.now()
            });
        }
    }
    
    blurSensitiveContent() {
        if (this.isBlurring) return;
        this.isBlurring = true;
        
        console.log(`[Screenshot Monitor] Blurring ${this.sensitiveElements.length} elements`);
        
        this.sensitiveElements.forEach(el => {
            el.dataset.vigilOriginalFilter = el.style.filter || '';
            el.style.filter = 'blur(12px)';
            el.style.transition = 'filter 0.3s';
            el.style.outline = '3px solid rgba(234, 67, 53, 0.6)';
        });
    }
    
    unblurSensitiveContent() {
        if (!this.isBlurring) return;
        this.isBlurring = false;
        
        console.log('[Screenshot Monitor] Removing blur');
        
        this.sensitiveElements.forEach(el => {
            el.style.filter = el.dataset.vigilOriginalFilter || '';
            delete el.dataset.vigilOriginalFilter;
            el.style.outline = '';
        });
    }
    
    async logScreenshotAttempt(method, key, hasSensitiveData) {
        try {
            await chrome.runtime.sendMessage({
                action: 'logScreenshot',
                data: {
                    method,
                    key,
                    hasSensitiveData,
                    elementCount: this.sensitiveElements.length,
                    url: window.location.href,
                    timestamp: Date.now()
                }
            });
        } catch (error) {
            console.error('[Screenshot Monitor] Failed to log:', error);
        }
    }
    
    showWarning(title, message, duration) {
        const existing = document.getElementById('vigil-screenshot-warning');
        if (existing) existing.remove();
        
        const warning = document.createElement('div');
        warning.id = 'vigil-screenshot-warning';
        warning.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(234, 67, 53, 0.98);
            color: white;
            padding: 32px 40px;
            border-radius: 16px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 16px;
            z-index: 2147483647;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            max-width: 500px;
            text-align: center;
            animation: vigilSlideIn 0.4s ease-out;
            border: 3px solid rgba(255, 255, 255, 0.3);
        `;
        
        warning.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">🛡️</div>
            <div style="font-size: 22px; font-weight: 700; margin-bottom: 12px;">
                ${title}
            </div>
            <div style="font-size: 15px; line-height: 1.5; opacity: 0.95;">
                ${message.replace(/\n/g, '<br>')}
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes vigilSlideIn {
                0% { 
                    transform: translate(-50%, -50%) scale(0.8); 
                    opacity: 0; 
                }
                50% { 
                    transform: translate(-50%, -50%) scale(1.05); 
                }
                100% { 
                    transform: translate(-50%, -50%) scale(1); 
                    opacity: 1; 
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.style.transition = 'opacity 0.4s, transform 0.4s';
            warning.style.opacity = '0';
            warning.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => warning.remove(), 400);
        }, duration);
    }
    
    showNotification(title, message, duration, color = '#1a73e8') {
        const existing = document.getElementById('vigil-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.id = 'vigil-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px;
            font-weight: 500;
            z-index: 2147483646;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px;">${title}</div>
            <div style="font-size: 13px; opacity: 0.9; white-space: pre-line;">${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), duration);
    }
    
    cleanup() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }
        this.clearSensitiveMarkings();
        const indicator = document.getElementById('vigil-protection-indicator');
        if (indicator) indicator.remove();
    }
}

export default ScreenshotMonitor;