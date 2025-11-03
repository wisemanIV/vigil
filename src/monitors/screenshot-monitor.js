class ScreenshotMonitor {
    constructor(onScreenshotAttempt) {
        this.onScreenshotAttempt = onScreenshotAttempt;
        this.sensitiveElements = [];
        this.isBlurring = false;
        this.settings = {
            enabled: true,
            autoBlur: true,
            logAttempts: true
        };
    }
    
    async initialize() {
        console.log('[Screenshot Monitor] Initializing...');
        
        // Load settings
        await this.loadSettings();
        
        if (!this.settings.enabled) {
            console.log('[Screenshot Monitor] Disabled in settings');
            return;
        }
        
        // Monitor keyboard shortcuts
        this.monitorKeyboardShortcuts();
        
        // Monitor clipboard for screenshots
        this.monitorClipboard();
        
        // Continuously scan for sensitive content
        this.startContentScanning();
        
        console.log('[Screenshot Monitor] Active');
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
    
    monitorKeyboardShortcuts() {
        // Detect screenshot-related keyboard shortcuts
        document.addEventListener('keydown', async (event) => {
            const isChromeScreenshot = 
                (event.ctrlKey || event.metaKey) && event.shiftKey && 
                (event.key === 'S' || event.key === 's');
            
            const isPrintScreen = event.key === 'PrintScreen';
            
            const isWindowsSnippingTool = 
                event.shiftKey && event.key === 'Windows' && event.key === 's';
            
            const isMacScreenshot = 
                (event.metaKey && event.shiftKey && 
                ['3', '4', '5'].includes(event.key));
            
            if (isChromeScreenshot || isPrintScreen || isWindowsSnippingTool || isMacScreenshot) {
                console.log('[Screenshot Monitor] Screenshot shortcut detected:', event.key);
                await this.handleScreenshotAttempt('keyboard', event.key);
            }
        }, true);
    }
    
    monitorClipboard() {
        // Monitor for images copied to clipboard (often from screenshots)
        document.addEventListener('paste', async (event) => {
            const items = event.clipboardData?.items;
            if (!items) return;
            
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    console.log('[Screenshot Monitor] Image in clipboard detected');
                    await this.handleScreenshotAttempt('clipboard', 'paste');
                }
            }
        }, true);
        
        // Monitor copy events that might capture screenshots
        document.addEventListener('copy', async (event) => {
            const selection = window.getSelection();
            if (selection && selection.toString().length > 0) {
                // Text copy - check if it contains sensitive data
                await this.checkCopiedContent(selection.toString());
            }
        }, true);
    }
    
    startContentScanning() {
        // Scan page periodically for sensitive content
        this.scanInterval = setInterval(() => {
            this.scanVisibleContent();
        }, 2000); // Scan every 2 seconds
        
        // Initial scan
        setTimeout(() => this.scanVisibleContent(), 1000);
    }
    
    async scanVisibleContent() {
        try {
            // Get all visible text on the page
            const visibleText = this.extractVisibleText();
            
            // Analyze for sensitive content
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
                // Mark sensitive areas
                this.markSensitiveContent(result.findings);
            } else {
                // Clear markings if no sensitive data
                this.clearSensitiveMarkings();
            }
            
        } catch (error) {
            console.error('[Screenshot Monitor] Scan failed:', error);
        }
    }
    
    extractVisibleText() {
        // Get text from visible elements
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip if parent is not visible
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    
                    const style = window.getComputedStyle(parent);
                    if (style.display === 'none' || 
                        style.visibility === 'hidden' ||
                        style.opacity === '0') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Check if in viewport
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
        }
        
        return visibleText.substring(0, 10000); // Limit to 10k chars for performance
    }
    
    markSensitiveContent(findings) {
        // Find and mark elements containing sensitive data
        this.sensitiveElements = [];
        
        findings.forEach(finding => {
            // Search for elements containing this sensitive data
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
        // This is simplified - in production you'd want more sophisticated matching
        const elements = [];
        const xpath = "//text()[contains(., '" + (finding.sample?.[0] || finding.type) + "')]/..";
        
        try {
            const result = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
            
            for (let i = 0; i < Math.min(result.snapshotLength, 10); i++) {
                elements.push(result.snapshotItem(i));
            }
        } catch (e) {
            // Fallback: search all text nodes
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT
            );
            
            let node;
            while (node = walker.nextNode()) {
                if (finding.sample && finding.sample.some(s => node.textContent.includes(s))) {
                    elements.push(node.parentElement);
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
        console.log(`[Screenshot Monitor] Attempt detected: ${method} - ${key}`);
        
        // Check if sensitive data is currently visible
        const hasSensitiveData = this.sensitiveElements.length > 0;
        
        if (hasSensitiveData) {
            // Apply blur if enabled
            if (this.settings.autoBlur) {
                this.blurSensitiveContent();
                
                // Show warning
                this.showWarning(
                    '⚠️ Screenshot Blocked',
                    `Sensitive data detected on screen. ${this.sensitiveElements.length} area(s) temporarily blurred.`,
                    5000
                );
                
                // Remove blur after a delay
                setTimeout(() => {
                    this.unblurSensitiveContent();
                }, 3000);
            } else {
                // Just warn
                this.showWarning(
                    '⚠️ Screenshot Warning',
                    `Sensitive data is visible on this page. Screenshot contains protected information.`,
                    5000
                );
            }
        }
        
        // Log the attempt
        if (this.settings.logAttempts) {
            await this.logScreenshotAttempt(method, key, hasSensitiveData);
        }
        
        // Notify callback
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
            // Store original filter
            el.dataset.vigilOriginalFilter = el.style.filter || '';
            
            // Apply blur
            el.style.filter = 'blur(10px)';
            el.style.transition = 'filter 0.2s';
            
            // Add visual indicator
            el.style.outline = '2px solid rgba(234, 67, 53, 0.5)';
        });
    }
    
    unblurSensitiveContent() {
        if (!this.isBlurring) return;
        this.isBlurring = false;
        
        console.log('[Screenshot Monitor] Removing blur');
        
        this.sensitiveElements.forEach(el => {
            // Restore original filter
            el.style.filter = el.dataset.vigilOriginalFilter || '';
            delete el.dataset.vigilOriginalFilter;
            
            // Remove outline
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
    
    async checkCopiedContent(text) {
        try {
            const result = await chrome.runtime.sendMessage({
                action: 'analyzePaste',
                content: text,
                context: {
                    url: window.location.href,
                    domain: window.location.hostname,
                    type: 'copy'
                }
            });
            
            if (!result.allowed) {
                this.showWarning(
                    '⚠️ Sensitive Data Copied',
                    `You copied: ${result.reason}`,
                    4000
                );
            }
        } catch (error) {
            console.error('[Screenshot Monitor] Copy check failed:', error);
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
            background: rgba(234, 67, 53, 0.95);
            color: white;
            padding: 24px 32px;
            border-radius: 12px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 16px;
            font-weight: 500;
            z-index: 2147483647;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            max-width: 500px;
            text-align: center;
            animation: vigilPulse 0.5s ease-out;
        `;
        
        warning.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 12px;">${title.split(' ')[0]}</div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">
                ${title.split(' ').slice(1).join(' ')}
            </div>
            <div style="font-size: 14px; opacity: 0.9;">
                ${message}
            </div>
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes vigilPulse {
                0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.05); }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.style.transition = 'opacity 0.3s';
            warning.style.opacity = '0';
            setTimeout(() => warning.remove(), 300);
        }, duration);
    }
    
    cleanup() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }
        this.clearSensitiveMarkings();
    }
}

export default ScreenshotMonitor;
