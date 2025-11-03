class UploadMonitor {
    constructor(onFileSelect) {
        this.onFileSelect = onFileSelect;
        this.originalInputs = new WeakMap();
        this.blockedFiles = new Set();
        this.observer = null;
    }
    
    initialize() {
        console.log('[DLP Upload Monitor] Initializing...');
        
        // Wait for body to exist
        this.waitForBody().then(() => {
            this.startMonitoring();
        });
    }
    
    waitForBody() {
        return new Promise((resolve) => {
            if (document.body) {
                resolve();
                return;
            }
            
            // Wait for body
            const observer = new MutationObserver(() => {
                if (document.body) {
                    observer.disconnect();
                    resolve();
                }
            });
            
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        });
    }
    
    startMonitoring() {
        console.log('[DLP Upload Monitor] Starting monitoring...');
        
        try {
            // Monitor existing file inputs
            this.monitorExistingInputs();
            
            // Monitor dynamically added file inputs
            this.observeDOMChanges();
            
            // Monitor drag and drop
            this.monitorDragAndDrop();
            
            // Monitor hidden inputs periodically
            this.monitorHiddenInputs();
            
            console.log('[DLP Upload Monitor] Monitoring active');
        } catch (error) {
            console.error('[DLP Upload Monitor] Failed to start monitoring:', error);
        }
    }
    
    monitorExistingInputs() {
        try {
            const fileInputs = document.querySelectorAll('input[type="file"]');
            console.log(`[DLP Upload Monitor] Found ${fileInputs.length} file inputs`);
            fileInputs.forEach(input => this.attachToInput(input));
        } catch (error) {
            console.error('[DLP Upload Monitor] Error monitoring existing inputs:', error);
        }
    }
    
    observeDOMChanges() {
        try {
            // Make sure body exists
            if (!document.body) {
                console.warn('[DLP Upload Monitor] Body not available for observation');
                return;
            }
            
            this.observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.tagName === 'INPUT' && node.type === 'file') {
                                console.log('[DLP Upload Monitor] New file input detected');
                                this.attachToInput(node);
                            }
                            
                            if (node.querySelectorAll) {
                                const inputs = node.querySelectorAll('input[type="file"]');
                                if (inputs.length > 0) {
                                    console.log(`[DLP Upload Monitor] Found ${inputs.length} file inputs in added node`);
                                    inputs.forEach(input => this.attachToInput(input));
                                }
                            }
                        }
                    });
                });
            });
            
            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            console.log('[DLP Upload Monitor] DOM mutation observer active');
        } catch (error) {
            console.error('[DLP Upload Monitor] Error setting up DOM observer:', error);
        }
    }
    
    monitorHiddenInputs() {
        // Check periodically for new inputs
        setInterval(() => {
            try {
                const allInputs = document.querySelectorAll('input[type="file"]');
                allInputs.forEach(input => {
                    if (!this.originalInputs.has(input)) {
                        console.log('[DLP Upload Monitor] Found previously unmonitored input');
                        this.attachToInput(input);
                    }
                });
            } catch (error) {
                console.error('[DLP Upload Monitor] Error in periodic check:', error);
            }
        }, 2000);
    }
    
    attachToInput(input) {
        if (this.originalInputs.has(input)) {
            return;
        }
        
        try {
            console.log('[DLP Upload Monitor] Attaching to input:', {
                id: input.id,
                className: input.className,
                accept: input.accept,
                multiple: input.multiple
            });
            
            this.originalInputs.set(input, true);
            
            // Use capture phase
            input.addEventListener('change', async (event) => {
                console.log('[DLP Upload Monitor] Change event triggered');
                await this.handleFileSelection(event, input);
            }, true);
            
            this.addVisualIndicator(input);
        } catch (error) {
            console.error('[DLP Upload Monitor] Error attaching to input:', error);
        }
    }
    
    async handleFileSelection(event, input) {
        const files = Array.from(input.files || []);
        
        if (files.length === 0) {
            console.log('[DLP Upload Monitor] No files selected');
            return;
        }
        
        console.log('[DLP Upload Monitor] Files selected:', files.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size
        })));
        
        // Prevent default
        event.preventDefault();
        event.stopPropagation();
        
        this.showNotification('🔍 Scanning uploaded files...', '#4285f4');
        
        try {
            const results = [];
            for (const file of files) {
                console.log('[DLP Upload Monitor] Analyzing file:', file.name);
                const result = await this.onFileSelect(file);
                results.push({ file, result });
            }
            
            const blockedFiles = results.filter(r => !r.result.allowed);
            
            if (blockedFiles.length > 0) {
                console.warn('[DLP Upload Monitor] Files blocked:', blockedFiles);
                
                input.value = '';
                
                const blockedNames = blockedFiles.map(r => r.file.name).join(', ');
                const reason = blockedFiles[0].result.reason;
                
                this.showNotification(
                    `🛡️ Upload blocked: ${blockedNames}\nReason: ${reason}`,
                    '#ea4335',
                    7000
                );
                
                return false;
            }
            
            console.log('[DLP Upload Monitor] All files approved');
            this.showNotification(
                `✓ ${files.length} file(s) approved`,
                '#34a853',
                3000
            );
            
            return true;
            
        } catch (error) {
            console.error('[DLP Upload Monitor] Analysis failed:', error);
            
            input.value = '';
            this.showNotification(
                '⚠️ Upload blocked: Analysis error',
                '#ea4335',
                5000
            );
            
            return false;
        }
    }
    
    monitorDragAndDrop() {
        try {
            document.addEventListener('drop', async (event) => {
                const files = Array.from(event.dataTransfer?.files || []);
                
                if (files.length === 0) return;
                
                console.log('[DLP Upload Monitor] Files dropped:', files.map(f => f.name));
                
                event.preventDefault();
                event.stopPropagation();
                
                this.showNotification('🔍 Scanning dropped files...', '#4285f4');
                
                const results = [];
                for (const file of files) {
                    const result = await this.onFileSelect(file);
                    results.push({ file, result });
                }
                
                const blockedFiles = results.filter(r => !r.result.allowed);
                
                if (blockedFiles.length > 0) {
                    const blockedNames = blockedFiles.map(r => r.file.name).join(', ');
                    this.showNotification(
                        `🛡️ Drop blocked: ${blockedNames}`,
                        '#ea4335',
                        5000
                    );
                    return false;
                }
                
                this.showNotification(
                    `✓ ${files.length} file(s) approved`,
                    '#34a853',
                    3000
                );
                
            }, true);
            
            document.addEventListener('dragover', (event) => {
                if (event.dataTransfer?.types.includes('Files')) {
                    event.preventDefault();
                }
            }, true);
            
            console.log('[DLP Upload Monitor] Drag and drop monitoring active');
        } catch (error) {
            console.error('[DLP Upload Monitor] Error setting up drag and drop:', error);
        }
    }
    
    addVisualIndicator(input) {
        try {
            if (input.dataset.dlpMonitored) return;
            
            input.dataset.dlpMonitored = 'true';
            
            const indicator = document.createElement('span');
            indicator.textContent = '🛡️';
            indicator.title = 'DLP Protection Active';
            indicator.style.cssText = `
                position: absolute;
                margin-left: -25px;
                margin-top: 5px;
                font-size: 14px;
                opacity: 0.7;
                pointer-events: none;
            `;
            
            if (input.parentNode) {
                input.parentNode.insertBefore(indicator, input);
            }
        } catch (error) {
            // Silently fail for visual indicator
        }
    }
    
    showNotification(message, color, duration = 3000) {
        try {
            const existing = document.getElementById('dlp-upload-notification');
            if (existing) existing.remove();
            
            const notification = document.createElement('div');
            notification.id = 'dlp-upload-notification';
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: ${color};
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                font-size: 14px;
                font-weight: 500;
                z-index: 2147483647;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                max-width: 400px;
                white-space: pre-line;
            `;
            notification.textContent = message;
            
            if (document.body) {
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, duration);
            }
        } catch (error) {
            console.error('[DLP Upload Monitor] Error showing notification:', error);
        }
    }
    
    cleanup() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

export default UploadMonitor;
