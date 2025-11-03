import UploadMonitor from './monitors/upload-monitor.js';

(function() {
    'use strict';
    
    console.log('[DLP] Content script loaded on:', window.location.href);
    
    let analyzerReady = false;
    let uploadMonitor = null;
    
    // Check analyzer status
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
        analyzerReady = response?.ready || false;
        console.log('[DLP] Analyzer status:', analyzerReady ? 'Ready' : 'Initializing...');
        
        if (analyzerReady) {
            initializeUploadMonitor();
        } else {
            console.log('[DLP] Waiting for analyzer to be ready...');
            // Retry after delay
            setTimeout(() => {
                chrome.runtime.sendMessage({ action: 'getStatus' }, (resp) => {
                    if (resp?.ready) {
                        initializeUploadMonitor();
                    }
                });
            }, 3000);
        }
    });
    
    // Initialize upload monitor
    function initializeUploadMonitor() {
        console.log('[DLP] Initializing upload monitor...');
        try {
            uploadMonitor = new UploadMonitor(handleFileUpload);
            uploadMonitor.initialize();
            console.log('[DLP] Upload monitor initialized successfully');
        } catch (error) {
            console.error('[DLP] Failed to initialize upload monitor:', error);
        }
    }
    
    // Handle file uploads
    async function handleFileUpload(file) {
        console.log('[DLP] File upload detected:', file.name, file.type, file.size);
        
        try {
            const result = await chrome.runtime.sendMessage({
                action: 'analyzeFile',
                file: {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified
                },
                fileData: await file.arrayBuffer(),
                context: {
                    url: window.location.href,
                    domain: window.location.hostname
                }
            });
            
            console.log('[DLP] File analysis result:', result);
            return result;
            
        } catch (error) {
            console.error('[DLP] File analysis failed:', error);
            return {
                allowed: false,
                reason: 'Analysis error',
                error: error.message
            };
        }
    }
    
    // Monitor paste events
    document.addEventListener('paste', handlePaste, true);
    
    async function handlePaste(event) {
        const content = event.clipboardData?.getData('text');
        
        if (!content || content.trim().length === 0) return;
        
        console.log('[DLP] Paste detected, length:', content.length);
        
        event.preventDefault();
        event.stopPropagation();
        
        showNotification('🔍 Analyzing paste...', '#4285f4', 10000);
        
        try {
            const result = await chrome.runtime.sendMessage({
                action: 'analyzePaste',
                content: content,
                context: {
                    url: window.location.href,
                    domain: window.location.hostname,
                    elementType: event.target.tagName
                }
            });
            
            console.log('[DLP] Paste analysis result:', result);
            
            if (result.allowed) {
                insertContent(event.target, content);
                showNotification('✓ Paste allowed', '#34a853', 2000);
            } else {
                showNotification(`🛡️ Blocked: ${result.reason}`, '#ea4335', 5000);
            }
        } catch (error) {
            console.error('[DLP] Paste analysis failed:', error);
            showNotification('⚠️ Paste blocked: Error', '#ea4335', 3000);
        }
    }
    
    function insertContent(target, content) {
        if (target.isContentEditable) {
            document.execCommand('insertText', false, content);
        } else if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const value = target.value;
            
            target.value = value.substring(0, start) + content + value.substring(end);
            target.selectionStart = target.selectionEnd = start + content.length;
            
            target.dispatchEvent(new Event('input', { bubbles: true }));
            target.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    
    function showNotification(message, color, duration) {
        const existing = document.getElementById('dlp-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.id = 'dlp-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${color}; color: white;
            padding: 12px 24px; border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px; font-weight: 500;
            z-index: 2147483647;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), duration);
    }
})();
