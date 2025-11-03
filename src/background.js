import TensorFlowDLPAnalyzer from './analyzers/tf-analyzer.js';
import FileParser from './analyzers/file-parser.js';

let analyzer = null;
let fileParser = null;
let initPromise = null;

async function initializeAnalyzer() {
    if (initPromise) return initPromise;
    
    initPromise = (async () => {
        try {
            console.log('Starting initialization...');
            
            analyzer = new TensorFlowDLPAnalyzer();
            await analyzer.initialize();
            
            fileParser = new FileParser();
            
            await chrome.storage.local.set({ 
                analyzerReady: true,
                initTime: Date.now()
            });
            
            console.log('Analyzer and file parser ready!');
            return { analyzer, fileParser };
        } catch (error) {
            console.error('Initialization failed:', error);
            await chrome.storage.local.set({ 
                analyzerReady: false,
                initError: error.message
            });
            throw error;
        }
    })();
    
    return initPromise;
}

// Start initialization
initializeAnalyzer();

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzePaste') {
        handleAnalyzePaste(request, sendResponse);
        return true;
    }
    
    if (request.action === 'analyzeFile') {
        handleAnalyzeFile(request, sendResponse);
        return true;
    }
    
    if (request.action === 'getStatus') {
        chrome.storage.local.get(['analyzerReady', 'initError'], (data) => {
            sendResponse({
                ready: data.analyzerReady || false,
                error: data.initError || null
            });
        });
        return true;
    }
});

async function handleAnalyzePaste(request, sendResponse) {
    try {
        if (!analyzer) {
            await initializeAnalyzer();
        }
        
        const result = await analyzer.analyze(
            request.content,
            request.context
        );
        
        logAnalysis('paste', request.context, result);
        sendResponse(result);
        
    } catch (error) {
        console.error('Paste analysis failed:', error);
        sendResponse({
            allowed: false,
            reason: 'Analysis error',
            error: error.message
        });
    }
}

async function handleAnalyzeFile(request, sendResponse) {
    try {
        if (!analyzer || !fileParser) {
            await initializeAnalyzer();
        }
        
        console.log('Analyzing file:', request.file.name);
        
        // Reconstruct File object from ArrayBuffer
        const file = new File(
            [request.fileData],
            request.file.name,
            { type: request.file.type }
        );
        
        // Parse file to extract text
        const parseResult = await fileParser.parseFile(file);
        
        console.log('File parsed, extracted text length:', parseResult.text.length);
        
        // If no text extracted or parsing failed
        if (!parseResult.text || parseResult.text.trim().length === 0) {
            // Check file metadata for sensitive patterns
            const metadataCheck = checkFileMetadata(request.file, parseResult.metadata);
            
            if (!metadataCheck.allowed) {
                const result = {
                    allowed: false,
                    reason: metadataCheck.reason,
                    findings: [],
                    analysisTime: 0,
                    fileMetadata: parseResult.metadata
                };
                
                logAnalysis('file', request.context, result, request.file);
                sendResponse(result);
                return;
            }
            
            // No text to analyze, allow by default
            const result = {
                allowed: true,
                reason: 'No text content to analyze',
                findings: [],
                analysisTime: 0,
                fileMetadata: parseResult.metadata
            };
            
            logAnalysis('file', request.context, result, request.file);
            sendResponse(result);
            return;
        }
        
        // Analyze extracted text
        const result = await analyzer.analyze(
            parseResult.text,
            {
                ...request.context,
                fileType: parseResult.metadata.type,
                fileName: request.file.name
            }
        );
        
        result.fileMetadata = parseResult.metadata;
        
        logAnalysis('file', request.context, result, request.file);
        sendResponse(result);
        
    } catch (error) {
        console.error('File analysis failed:', error);
        sendResponse({
            allowed: false,
            reason: 'File analysis error',
            error: error.message
        });
    }
}

function checkFileMetadata(file, metadata) {
    // Check for suspicious file characteristics
    
    // Very large files (>100MB) could be data exfiltration
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
        return {
            allowed: false,
            reason: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB > 100MB limit)`
        };
    }
    
    // Check for encrypted or password-protected files
    if (metadata.error && metadata.error.includes('password')) {
        return {
            allowed: false,
            reason: 'Encrypted or password-protected files not allowed'
        };
    }
    
    return { allowed: true };
}

function logAnalysis(type, context, result, file = null) {
    chrome.storage.local.get(['auditLog'], (data) => {
        const log = data.auditLog || [];
        
        const entry = {
            timestamp: Date.now(),
            type: type,
            url: new URL(context.url).hostname,
            allowed: result.allowed,
            findingsCount: result.findings?.length || 0,
            analysisTime: result.analysisTime,
            reason: result.reason
        };
        
        if (file) {
            entry.fileName = file.name;
            entry.fileType = file.type;
            entry.fileSize = file.size;
        }
        
        log.push(entry);
        
        if (log.length > 1000) log.shift();
        
        chrome.storage.local.set({ auditLog: log });
    });
}
