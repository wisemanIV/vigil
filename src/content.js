import UploadMonitor from './monitors/upload-monitor.js';
import ScreenshotMonitor from './monitors/screenshot-monitor.js';
import confirmationDialog from './ui/confirmation-dialog.js';

(function() {
    'use strict';
    
    console.log('[Vigil] Content script loaded on:', window.location.href);
    
    let analyzerReady = false;
    let uploadMonitor = null;
    let screenshotMonitor = null;
    let approvedContentCache = new Map(); // Store approved content to prevent re-analysis loops
    
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
        console.warn('[Vigil] Extension context invalid on load');
        return;
    }
    
    // Initialize
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
        if (!chrome.runtime?.id) return;
        
        analyzerReady = response?.ready || false;
        console.log('[Vigil] Analyzer status:', analyzerReady ? 'Ready' : 'Initializing...');
        
        if (analyzerReady) {
            initializeMonitors();
        } else {
            setTimeout(() => {
                if (!chrome.runtime?.id) return;
                
                chrome.runtime.sendMessage({ action: 'getStatus' }, (resp) => {
                    if (resp?.ready) {
                        initializeMonitors();
                    }
                });
            }, 3000);
        }
    });
    
    function initializeMonitors() {
        console.log('[Vigil] Initializing monitors...');
        
        try {
            uploadMonitor = new UploadMonitor(handleFileUpload);
            uploadMonitor.initialize();
        } catch (error) {
            console.error('[Vigil] Failed to initialize upload monitor:', error);
        }
        
        try {
            screenshotMonitor = new ScreenshotMonitor(handleScreenshotAttempt);
            screenshotMonitor.initialize();
        } catch (error) {
            console.error('[Vigil] Failed to initialize screenshot monitor:', error);
        }
    }
    
    function handleScreenshotAttempt(data) {
        console.log('[Vigil] Screenshot attempt:', data);
    }
    
    async function handleFileUpload(file) {
        console.log('[Vigil] File upload detected:', file.name);
        
        if (!chrome.runtime?.id) {
            console.warn('[Vigil] Extension context invalidated');
            return {
                allowed: false,
                reason: 'Extension disconnected - please reload page'
            };
        }
        
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
            
            if (!result.allowed && result.findings && result.findings.length > 0) {
                const userDecision = await confirmationDialog.show({
                    title: 'File Upload Warning',
                    message: `The file "${file.name}" contains sensitive data that may violate company policy.`,
                    findings: result.findings,
                    type: 'upload'
                });
                
                return {
                    allowed: userDecision.allowed,
                    reason: userDecision.allowed ? 'User approved' : 'User denied',
                    userApproved: userDecision.allowed
                };
            }
            
            return result;
            
        } catch (error) {
            console.error('[Vigil] File analysis failed:', error);
            
            if (error.message?.includes('Extension context invalidated') || 
                error.message?.includes('Receiving end does not exist')) {
                return {
                    allowed: false,
                    reason: 'Extension disconnected - please reload page',
                    error: error.message
                };
            }
            
            return {
                allowed: false,
                reason: 'Analysis error',
                error: error.message
            };
        }
    }
    
    // Helper: Detect complex web apps
    function isComplexWebApp() {
        const hostname = window.location.hostname;
        const complexApps = [
            'sheets.google.com',
            'docs.google.com',
            'slides.google.com',
            'airtable.com',
            'notion.so',
            'coda.io'
        ];
        
        return complexApps.some(app => hostname.includes(app));
    }
    
    // Helper: Hash content for cache identification
    function hashContent(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    
    // ============================================================================
    // PASTE HANDLING - Single entry point for all paste events
    // ============================================================================
    
    document.addEventListener('paste', handlePaste, true);
    
    async function handlePaste(event) {
        const clipboardData = event.clipboardData;
        
        if (!clipboardData) return;
        
        // Check what type of content is being pasted
        const items = clipboardData.items;
        let hasImage = false;
        let hasText = false;
        
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                hasImage = true;
            }
            if (item.type.startsWith('text/')) {
                hasText = true;
            }
        }
        
        // Route image pastes to screenshot monitor
        if (hasImage) {
            console.log('[Vigil] Image paste detected');
            if (screenshotMonitor) {
                screenshotMonitor.handleImagePaste(event);
            }
            return;
        }
        
        if (!hasText) return;
        
        const content = clipboardData.getData('text');
        if (!content || content.trim().length === 0) return;
        
        const target = event.target;
        
        console.log('[Vigil] Text paste detected, length:', content.length, 'target:', target.tagName);
        
        // Detect if this is a complex web app
        const isComplex = isComplexWebApp();
        
        if (isComplex) {
            console.log('[Vigil] Complex app detected - using paste-then-intercept mode');
            handleComplexAppPaste(event, content, target);
        } else {
            console.log('[Vigil] Standard site - using intercept-then-paste mode');
            handleStandardPaste(event, content, target);
        }
    }
    
    // ============================================================================
    // COMPLEX APP MODE: Let paste happen, analyze, ask, undo if blocked
    // ============================================================================
    
    async function handleComplexAppPaste(event, content, target) {
        // Check if this content was just approved (prevent re-analysis loop)
        const contentHash = hashContent(content);
        if (approvedContentCache.has(contentHash)) {
            console.log('[Vigil] Approved content re-pasting - bypassing analysis');
            approvedContentCache.delete(contentHash);
            return;
        }
        
        // Don't prevent default - let the app handle paste natively
        
        if (!chrome.runtime?.id) {
            console.warn('[Vigil] Extension context invalidated');
            return;
        }
        
        // Show analyzing notification
        showNotification('🔍 Analyzing...', '#4285f4', 3000);
        
        try {
            const result = await chrome.runtime.sendMessage({
                action: 'analyzePaste',
                content: content,
                context: {
                    url: window.location.href,
                    domain: window.location.hostname,
                    elementType: target.tagName
                }
            });
            
            console.log('[Vigil] Analysis result:', result);
            
            if (!result.allowed && result.findings && result.findings.length > 0) {
                hideNotification();
                
                // Show confirmation dialog (paste already happened)
                const userDecision = await confirmationDialog.show({
                    title: 'Clipboard Warning',
                    message: 'You just pasted content containing sensitive data.',
                    findings: result.findings,
                    type: 'paste'
                });
                
                if (userDecision.allowed) {
                    console.log('[Vigil] User approved - keeping pasted content');
                    showNotification('✓ Paste allowed by user', '#34a853', 2000);
                } else {
                    console.log('[Vigil] User blocked - attempting to undo paste');
                    
                    // User blocked - undo the paste
                    await undoPaste();
                    
                    showNotification('🛡️ Paste blocked and undone', '#ea4335', 3000);
                }
            } else {
                // No sensitive data - paste already happened
                hideNotification();
            }
            
        } catch (error) {
            console.error('[Vigil] Analysis failed:', error);
            hideNotification();
            
            if (error.message?.includes('Extension context invalidated') || 
                error.message?.includes('Receiving end does not exist')) {
                showNotification('⚠️ Extension disconnected - reload page', '#f9ab00', 3000);
            }
        }
    }
    
    async function undoPaste() {
        const isMac = navigator.platform.includes('Mac');
        
        // Approach 1: Keyboard event (Ctrl+Z / Cmd+Z)
        const undoEvent = new KeyboardEvent('keydown', {
            key: 'z',
            code: 'KeyZ',
            keyCode: 90,
            which: 90,
            ctrlKey: !isMac,
            metaKey: isMac,
            bubbles: true,
            cancelable: true
        });
        document.activeElement?.dispatchEvent(undoEvent);
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const undoEventUp = new KeyboardEvent('keyup', {
            key: 'z',
            code: 'KeyZ',
            keyCode: 90,
            which: 90,
            ctrlKey: !isMac,
            metaKey: isMac,
            bubbles: true,
            cancelable: true
        });
        document.activeElement?.dispatchEvent(undoEventUp);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Approach 2: execCommand (fallback)
        try {
            document.execCommand('undo');
        } catch (e) {
            console.log('[Vigil] execCommand undo not supported');
        }
        
        // Approach 3: For Google Sheets - try to clear the cell
        if (window.location.hostname.includes('sheets.google.com')) {
            const deleteEvent = new KeyboardEvent('keydown', {
                key: 'Delete',
                code: 'Delete',
                keyCode: 46,
                which: 46,
                bubbles: true,
                cancelable: true
            });
            document.activeElement?.dispatchEvent(deleteEvent);
            
            const deleteEventUp = new KeyboardEvent('keyup', {
                key: 'Delete',
                code: 'Delete',
                keyCode: 46,
                which: 46,
                bubbles: true,
                cancelable: true
            });
            document.activeElement?.dispatchEvent(deleteEventUp);
        }
    }
    
    // ============================================================================
    // STANDARD MODE: Intercept, analyze, show dialog, insert if allowed
    // ============================================================================
    
    async function handleStandardPaste(event, content, target) {
        event.preventDefault();
        event.stopPropagation();
        
        let selectionState = null;
        
        // Save selection state
        if (target.isContentEditable) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                selectionState = {
                    type: 'contentEditable',
                    range: selection.getRangeAt(0).cloneRange()
                };
            }
        } else if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
            selectionState = {
                type: 'input',
                start: target.selectionStart,
                end: target.selectionEnd
            };
        }
        
        if (!chrome.runtime?.id) {
            console.warn('[Vigil] Extension context invalidated');
            showNotification('⚠️ Extension disconnected - reload page', '#f9ab00', 5000);
            insertContentWithState(target, content, selectionState);
            return;
        }
        
        showNotification('🔍 Analyzing...', '#4285f4', 10000);
        
        try {
            const result = await chrome.runtime.sendMessage({
                action: 'analyzePaste',
                content: content,
                context: {
                    url: window.location.href,
                    domain: window.location.hostname,
                    elementType: target.tagName
                }
            });
            
            console.log('[Vigil] Paste analysis result:', result);
            
            if (!result.allowed && result.findings && result.findings.length > 0) {
                hideNotification();
                
                const userDecision = await confirmationDialog.show({
                    title: 'Clipboard Warning',
                    message: 'You are about to paste content containing sensitive data.',
                    findings: result.findings,
                    type: 'paste'
                });
                
                if (userDecision.allowed) {
                    insertContentWithState(target, content, selectionState);
                    showNotification('✓ Paste allowed by user', '#34a853', 2000);
                } else {
                    showNotification('🛡️ Paste blocked by user', '#ea4335', 3000);
                }
            } else {
                insertContentWithState(target, content, selectionState);
                hideNotification();
            }
        } catch (error) {
            console.error('[Vigil] Paste analysis failed:', error);
            hideNotification();
            
            if (error.message?.includes('Extension context invalidated') || 
                error.message?.includes('Receiving end does not exist')) {
                showNotification('⚠️ Extension disconnected', '#f9ab00', 5000);
                insertContentWithState(target, content, selectionState);
            } else {
                showNotification('⚠️ Analysis error - paste blocked', '#ea4335', 3000);
            }
        }
    }
    
    // ============================================================================
    // CONTENT INSERTION HELPERS
    // ============================================================================
    
    function insertContentWithState(target, content, selectionState) {
        target.focus();
        
        if (selectionState) {
            if (selectionState.type === 'contentEditable' && selectionState.range) {
                setTimeout(() => {
                    try {
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(selectionState.range);
                        
                        const success = document.execCommand('insertText', false, content);
                        
                        if (!success) {
                            // Fallback: manually insert
                            selectionState.range.deleteContents();
                            const textNode = document.createTextNode(content);
                            selectionState.range.insertNode(textNode);
                            
                            selectionState.range.setStartAfter(textNode);
                            selectionState.range.setEndAfter(textNode);
                            selection.removeAllRanges();
                            selection.addRange(selectionState.range);
                            
                            target.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    } catch (error) {
                        console.error('[Vigil] ContentEditable insertion failed:', error);
                        target.textContent += content;
                        target.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }, 50);
            } else if (selectionState.type === 'input') {
                setTimeout(() => {
                    try {
                        const start = selectionState.start;
                        const end = selectionState.end;
                        const value = target.value;
                        
                        target.value = value.substring(0, start) + content + value.substring(end);
                        target.selectionStart = target.selectionEnd = start + content.length;
                        
                        target.dispatchEvent(new Event('input', { bubbles: true }));
                        target.dispatchEvent(new Event('change', { bubbles: true }));
                    } catch (error) {
                        console.error('[Vigil] Input insertion failed:', error);
                    }
                }, 50);
            }
        } else {
            setTimeout(() => insertContent(target, content), 50);
        }
    }
    
    function insertContent(target, content) {
        if (target.isContentEditable) {
            document.execCommand('insertText', false, content);
        } else if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
            const start = target.selectionStart || 0;
            const end = target.selectionEnd || 0;
            const value = target.value;
            
            target.value = value.substring(0, start) + content + value.substring(end);
            target.selectionStart = target.selectionEnd = start + content.length;
            
            target.dispatchEvent(new Event('input', { bubbles: true }));
            target.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    
    // ============================================================================
    // NOTIFICATION HELPERS
    // ============================================================================
    
    function showNotification(message, color, duration) {
        const existing = document.getElementById('vigil-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.id = 'vigil-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${color}; color: white;
            padding: 12px 24px; border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px; font-weight: 500;
            z-index: 2147483646;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), duration);
    }
    
    function hideNotification() {
        const notification = document.getElementById('vigil-notification');
        if (notification) notification.remove();
    }
    
    // ============================================================================
    // CLEANUP
    // ============================================================================
    
    window.addEventListener('beforeunload', () => {
        if (screenshotMonitor) {
            screenshotMonitor.cleanup();
        }
    });
})();