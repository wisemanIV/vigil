import FastAnalyzer from './fast-analyzer.js';
import TensorFlowDLPAnalyzer from './tf-analyzer.js';

class HybridAnalyzer {
    constructor() {
        this.fastAnalyzer = new FastAnalyzer();
        this.semanticAnalyzer = null;
        this.semanticReady = false;
        this.initializingSemantic = false;
    }
    
    async initialize() {
        console.log('[Hybrid Analyzer] Initializing...');
        
        // Initialize semantic analyzer in background (async, non-blocking)
        this.initializingSemantic = true;
        this.semanticAnalyzer = new TensorFlowDLPAnalyzer();
        
        this.semanticAnalyzer.initialize()
            .then(() => {
                this.semanticReady = true;
                this.initializingSemantic = false;
                console.log('[Hybrid Analyzer] Semantic layer ready');
            })
            .catch(error => {
                console.error('[Hybrid Analyzer] Semantic init failed:', error);
                this.initializingSemantic = false;
            });
        
        console.log('[Hybrid Analyzer] Fast layer ready (semantic loading in background)');
    }
    
    async analyze(content, context) {
        const startTime = performance.now();
        
        try {
            // STAGE 1: Fast regex + bulk detection (always runs, 5-10ms)
            console.log('[Hybrid] Stage 1: Fast pattern check...');
            const fastResult = await this.fastAnalyzer.analyze(content, context);
            
            // If fast analyzer found something, return immediately
            if (!fastResult.allowed) {
                console.log('[Hybrid] Stage 1 BLOCKED:', fastResult.message);
                return {
                    ...fastResult,
                    analysis_took_ms: performance.now() - startTime,
                    stage: 'fast'
                };
            }
            
            console.log('[Hybrid] Stage 1 passed, moving to Stage 2...');
            
            // STAGE 2: Semantic analysis (only if fast check passed)
            if (this.semanticReady) {
                console.log('[Hybrid] Stage 2: Semantic analysis...');
                
                // Run semantic analysis (but with timeout)
                const semanticPromise = this.semanticAnalyzer.analyze(content, context);
                const timeoutPromise = new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({
                            allowed: true,
                            reason: 'Semantic analysis timeout',
                            findings: [],
                            timedOut: true
                        });
                    }, 3000); // 3 second timeout for semantic
                });
                
                const semanticResult = await Promise.race([semanticPromise, timeoutPromise]);
                
                if (semanticResult.timedOut) {
                    console.warn('[Hybrid] Stage 2 timed out, allowing paste');
                    return {
                        allowed: true,
                        message: 'Analysis timeout - paste allowed',
                        findings: [],
                        analysis_took_ms: performance.now() - startTime,
                        stage: 'semantic_timeout'
                    };
                }
                
                console.log('[Hybrid] Stage 2 complete:', semanticResult.allowed ? 'ALLOWED' : 'BLOCKED');
                
                return {
                    allowed: semanticResult.allowed,
                    message: semanticResult.reason,
                    findings: semanticResult.findings,
                    semanticScores: semanticResult.semanticScores,
                    analysis_took_ms: performance.now() - startTime,
                    stage: 'semantic'
                };
            } else {
                // Semantic not ready yet, allow paste
                console.log('[Hybrid] Semantic layer not ready, allowing paste');
                return {
                    allowed: true,
                    message: this.initializingSemantic ? 
                        'Semantic analysis still loading - paste allowed' : 
                        'Semantic analysis unavailable - paste allowed',
                    findings: [],
                    analysis_took_ms: performance.now() - startTime,
                    stage: 'semantic_not_ready'
                };
            }
            
        } catch (error) {
            console.error('[Hybrid] Analysis error:', error);
            return {
                allowed: true, // Fail open
                message: 'Analysis error - paste allowed',
                findings: [],
                error: error.message,
                analysis_took_ms: performance.now() - startTime,
                stage: 'error'
            };
        }
    }
    
    getStatus() {
        return {
            ready: true,
            semanticReady: this.semanticReady,
            semanticInitializing: this.initializingSemantic
        };
    }
    
    dispose() {
        if (this.semanticAnalyzer) {
            this.semanticAnalyzer.dispose();
        }
    }
}

export default HybridAnalyzer;
