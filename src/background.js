// background.js

import HybridAnalyzer from './analyzers/hybrid-analyzer.js';

console.log('[Background] Service worker starting...');

const analyzer = new HybridAnalyzer();
let analyzerReady = false;

// Initialize analyzer on extension load
analyzer.initialize()
    .then(() => {
        analyzerReady = true;
        console.log('[Background] Hybrid analyzer initialized');
    })
    .catch(error => {
        console.error('[Background] Analyzer initialization failed:', error);
        analyzerReady = true; // Still mark as ready (fast layer works)
    });

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Background] Received message:', request.action);
    
    // Handle paste analysis
    if (request.action === 'analyzePaste') {
        handlePasteAnalysis(request, sendResponse);
        return true; // Keep channel open for async response
    }
    
    // Handle file analysis
    if (request.action === 'analyzeFile') {
        handleFileAnalysis(request, sendResponse);
        return true;
    }
    
    // Get analyzer status
    if (request.action === 'getStatus') {
        const status = analyzer.getStatus();
        sendResponse({
            ready: analyzerReady,
            ...status
        });
        return false;
    }
    
    // Log screenshot attempt
    if (request.action === 'logScreenshot') {
        handleScreenshotLog(request, sendResponse);
        return true;
    }
    
    return false;
});

async function handlePasteAnalysis(request, sendResponse) {
    const { content, context } = request;
    
    console.log('[Background] Analyzing paste:', {
        length: content.length,
        url: context.url,
        element: context.elementType
    });
    
    try {
        const result = await analyzer.analyze(content, context);
        
        console.log('[Background] Paste analysis complete:', {
            allowed: result.allowed,
            stage: result.stage,
            time: Math.round(result.analysis_took_ms) + 'ms',
            findings: result.findings.length
        });
        
        sendResponse(result);
        
    } catch (error) {
        console.error('[Background] Paste analysis error:', error);
        sendResponse({
            allowed: true, // Fail open
            message: 'Analysis error - paste allowed',
            findings: [],
            error: error.message
        });
    }
}

async function handleFileAnalysis(request, sendResponse) {
    const { file, fileData, context } = request;
    
    console.log('[Background] Analyzing file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        url: context.url
    });
    
    try {
        // Create file object for metadata analysis
        const fileObj = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
        };
        
        // Extract content for content analysis (if applicable)
        let content = '';
        let hasContent = false;
        
        if (file.type.startsWith('text/') || 
            file.name.endsWith('.txt') ||
            file.name.endsWith('.csv') ||
            file.name.endsWith('.json') ||
            file.name.endsWith('.xml') ||
            file.name.endsWith('.js') ||
            file.name.endsWith('.py') ||
            file.name.endsWith('.sql')) {
            
            const decoder = new TextDecoder('utf-8');
            content = decoder.decode(fileData);
            
            // Limit content size for analysis (first 50KB)
            if (content.length > 50000) {
                content = content.substring(0, 50000);
            }
            hasContent = true;
        }
        
        // Use the comprehensive file analysis from FastAnalyzer
        const enhancedContext = {
            ...context,
            content: hasContent ? content : null
        };
        
        const result = await analyzer.fastAnalyzer.analyzeFile(fileObj, enhancedContext);
        
        console.log('[Background] File analysis complete:', {
            allowed: result.allowed,
            findings: result.findings.length,
            riskLevel: result.fileMetadata?.riskLevel,
            totalScore: result.fileMetadata?.totalScore
        });
        
        sendResponse(result);
        
    } catch (error) {
        console.error('[Background] File analysis error:', error);
        sendResponse({
            allowed: false,
            reason: 'Analysis error',
            findings: [],
            error: error.message
        });
    }
}

async function handleScreenshotLog(request, sendResponse) {
    const { data } = request;
    
    console.log('[Background] Screenshot attempt logged:', {
        method: data.method,
        hasSensitiveData: data.hasSensitiveData,
        elementCount: data.elementCount,
        url: data.url
    });
    
    // Store screenshot log (optional - you can save to chrome.storage)
    try {
        const logs = await chrome.storage.local.get(['screenshotLogs']) || { screenshotLogs: [] };
        const screenshotLogs = logs.screenshotLogs || [];
        
        screenshotLogs.push({
            ...data,
            timestamp: Date.now()
        });
        
        // Keep only last 100 logs
        if (screenshotLogs.length > 100) {
            screenshotLogs.shift();
        }
        
        await chrome.storage.local.set({ screenshotLogs });
        
        sendResponse({ success: true });
    } catch (error) {
        console.error('[Background] Failed to log screenshot:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Extension installed/updated
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[Background] Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        console.log('[Background] First time installation');
        // Set default settings
        chrome.storage.local.set({
            screenshotProtection: {
                enabled: true,
                autoBlur: true,
                logAttempts: true,
                showIndicator: true
            }
        });
    }
});

// Extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('[Background] Extension startup');
});

// Keep service worker alive (optional, for Manifest V3)
let keepAliveInterval;

function keepAlive() {
    keepAliveInterval = setInterval(() => {
        chrome.runtime.getPlatformInfo(() => {
            // Just a dummy call to keep service worker alive
        });
    }, 20000); // Every 20 seconds
}

// Start keep-alive
keepAlive();

// Clean up on unload
self.addEventListener('unload', () => {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }
    if (analyzer) {
        analyzer.dispose();
    }
});

console.log('[Background] Service worker loaded and ready');