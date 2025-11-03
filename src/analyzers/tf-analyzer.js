import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

class TensorFlowDLPAnalyzer {
    constructor() {
        this.useModel = null;
        this.sensitiveEmbeddings = null;
        this.bulkDetector = new BulkDataDetector();
        this.initialized = false;
    }
    
    async initialize() {
        console.log('Initializing TensorFlow.js DLP Analyzer...');
        
        try {
            // Set backend
            await tf.setBackend('cpu');
            await tf.ready();
            console.log('TensorFlow.js backend ready');
            
            // Load Universal Sentence Encoder
            console.log('Loading Universal Sentence Encoder...');
            this.useModel = await use.load();
            console.log('USE model loaded');
            
            // Pre-compute sensitive category embeddings
            await this.computeSensitiveEmbeddings();
            
            // Warm up
            await this.warmUp();
            
            this.initialized = true;
            console.log('Analyzer initialized successfully');
            
        } catch (error) {
            console.error('Initialization failed:', error);
            throw error;
        }
    }
    
    async computeSensitiveEmbeddings() {
        console.log('Computing sensitive embeddings...');
        
        const categories = {
            financial: [
                "credit card number payment method",
                "bank account routing number",
                "social security number SSN tax ID",
                "financial information salary compensation"
            ],
            credentials: [
                "password secret key authentication",
                "API key access token bearer token",
                "private key certificate RSA key",
                "credentials username password login"
            ],
            confidential: [
                "confidential proprietary trade secret",
                "internal only company private",
                "classified restricted sensitive",
                "do not share confidential information"
            ],
            pii: [
                "personal information home address",
                "phone number contact information",
                "email address personal data",
                "date of birth identification"
            ]
        };
        
        // Flatten all examples
        const allExamples = [];
        const labels = [];
        
        for (const [category, examples] of Object.entries(categories)) {
            allExamples.push(...examples);
            examples.forEach(() => labels.push(category));
        }
        
        // Compute embeddings
        const embeddings = await this.useModel.embed(allExamples);
        
        this.sensitiveEmbeddings = {
            embeddings: embeddings,
            labels: labels,
            categories: Object.keys(categories)
        };
        
        console.log('Sensitive embeddings computed');
    }
    
    async warmUp() {
        // Warm up model with dummy input
        const dummy = await this.useModel.embed(["warmup"]);
        dummy.dispose();
        console.log('Model warmed up');
    }
    
    async analyze(content, context) {
        if (!this.initialized) {
            throw new Error('Analyzer not initialized');
        }
        
        const startTime = performance.now();
        
        try {
            // Run all analyses
            const [semanticResult, patternResult] = await Promise.all([
                this.analyzeSemanticSimilarity(content),
                this.detectPatterns(content)
            ]);
            
            // Combine findings
            const findings = [
                ...semanticResult.findings,
                ...patternResult.findings
            ];
            
            // Make decision
            const decision = this.evaluateFindings(findings, context);
            
            return {
                allowed: decision.allowed,
                reason: decision.reason,
                findings: findings,
                semanticScores: semanticResult.scores,
                analysisTime: performance.now() - startTime
            };
            
        } catch (error) {
            console.error('Analysis failed:', error);
            return {
                allowed: false,
                reason: 'Analysis error',
                error: error.message,
                analysisTime: performance.now() - startTime
            };
        }
    }
    
    async analyzeSemanticSimilarity(content) {
        try {
            // Get embedding for content
            const contentEmbedding = await this.useModel.embed([content]);
            
            // Calculate similarities
            const similarities = await this.calculateSimilarities(
                contentEmbedding,
                this.sensitiveEmbeddings.embeddings
            );
            
            // Clean up
            contentEmbedding.dispose();
            
            // Group by category
            const categoryScores = this.groupByCategory(similarities);
            
            // Create findings
            const findings = [];
            const threshold = 0.65;
            
            for (const score of categoryScores) {
                if (score.maxScore > threshold) {
                    findings.push({
                        type: 'semantic_similarity',
                        category: score.category,
                        severity: this.getSeverityFromScore(score.maxScore),
                        confidence: score.maxScore,
                        source: 'tensorflow_use'
                    });
                }
            }
            
            return {
                findings: findings,
                scores: categoryScores
            };
            
        } catch (error) {
            console.error('Semantic analysis failed:', error);
            return { findings: [], scores: [] };
        }
    }
    
    calculateSimilarities(contentEmbedding, referenceEmbeddings) {
        return tf.tidy(() => {
            // Normalize embeddings
            const contentNorm = tf.norm(contentEmbedding, 2, 1, true);
            const referenceNorm = tf.norm(referenceEmbeddings, 2, 1, true);
            
            // Calculate dot product
            const dotProduct = tf.matMul(
                contentEmbedding,
                referenceEmbeddings,
                false,
                true
            );
            
            // Calculate cosine similarity
            const similarity = dotProduct.div(
                contentNorm.mul(referenceNorm.transpose())
            );
            
            return Array.from(similarity.dataSync());
        });
    }
    
    groupByCategory(similarities) {
        const grouped = {};
        
        // Group similarities by category
        this.sensitiveEmbeddings.labels.forEach((label, idx) => {
            if (!grouped[label]) {
                grouped[label] = [];
            }
            grouped[label].push(similarities[idx]);
        });
        
        // Get max score per category
        return Object.entries(grouped).map(([category, scores]) => ({
            category: category,
            maxScore: Math.max(...scores),
            avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
        })).sort((a, b) => b.maxScore - a.maxScore);
    }
    
    detectPatterns(content) {
        const patterns = {
            creditCard: {
                regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
                severity: 'critical',
                category: 'financial'
            },
            ssn: {
                regex: /\b\d{3}-\d{2}-\d{4}\b/g,
                severity: 'critical',
                category: 'pii'
            },
            awsKey: {
                regex: /\b(AKIA[0-9A-Z]{16})\b/g,
                severity: 'critical',
                category: 'credentials'
            },
            apiKey: {
                regex: /(?:api[_-]?key|apikey)[_-]?[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
                severity: 'critical',
                category: 'credentials'
            },
            privateKey: {
                regex: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
                severity: 'critical',
                category: 'credentials'
            },
            email: {
                regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
                severity: 'medium',
                category: 'pii'
            }
        };
        
        const findings = [];
        
        for (const [name, config] of Object.entries(patterns)) {
            const matches = content.match(config.regex);
            if (matches) {
                findings.push({
                    type: name,
                    category: config.category,
                    severity: config.severity,
                    count: matches.length,
                    source: 'pattern_detection'
                });
            }
        }
        
        return { findings };
    }
    
    evaluateFindings(findings, context) {
        if (findings.length === 0) {
            return {
                allowed: true,
                reason: 'No sensitive content detected'
            };
        }
        
        // Critical = always block
        const critical = findings.filter(f => f.severity === 'critical');
        if (critical.length > 0) {
            return {
                allowed: false,
                reason: `Critical content: ${critical[0].type}`
            };
        }
        
        // External domain + high severity = block
        const isExternal = this.isExternalDomain(context.url);
        const high = findings.filter(f => f.severity === 'high');
        
        if (isExternal && high.length > 0) {
            return {
                allowed: false,
                reason: 'Sensitive content on external domain'
            };
        }
        
        // Multiple findings on external = block
        if (isExternal && findings.length >= 2) {
            return {
                allowed: false,
                reason: 'Multiple sensitive patterns detected'
            };
        }
        
        return {
            allowed: true,
            reason: 'Content allowed'
        };
    }
    
    isExternalDomain(url) {
        const internalDomains = ['company.com', 'localhost'];
        try {
            const hostname = new URL(url).hostname;
            return !internalDomains.some(d => hostname.includes(d));
        } catch {
            return true;
        }
    }
    
    getSeverityFromScore(score) {
        if (score > 0.85) return 'critical';
        if (score > 0.75) return 'high';
        if (score > 0.65) return 'medium';
        return 'low';
    }
    
    dispose() {
        if (this.sensitiveEmbeddings?.embeddings) {
            this.sensitiveEmbeddings.embeddings.dispose();
        }
    }

    async analyze(content, context) {
        if (!this.initialized) {
            throw new Error('Analyzer not initialized');
        }
        
        const startTime = performance.now();
        
        try {
            // Run all analyses in parallel
            const [semanticResult, patternResult, bulkResult] = await Promise.all([
                this.analyzeSemanticSimilarity(content),
                this.detectPatterns(content),
                Promise.resolve(this.bulkDetector.analyze(content))
            ]);
            
            // Add density check
            const densityResult = this.bulkDetector.analyzeDensity(content);
            
            // Combine findings
            const findings = [
                ...semanticResult.findings,
                ...patternResult.findings,
                ...bulkResult,
                ...(densityResult ? [densityResult] : [])
            ];
            
            // Make decision
            const decision = this.evaluateFindings(findings, context);
            
            return {
                allowed: decision.allowed,
                reason: decision.reason,
                findings: findings,
                semanticScores: semanticResult.scores,
                analysisTime: performance.now() - startTime
            };
            
        } catch (error) {
            console.error('Analysis failed:', error);
            return {
                allowed: false,
                reason: 'Analysis error',
                error: error.message,
                analysisTime: performance.now() - startTime
            };
        }
    }
    
    evaluateFindings(findings, context) {
        if (findings.length === 0) {
            return {
                allowed: true,
                reason: 'No sensitive content detected'
            };
        }
        
        // Check for bulk data - ALWAYS BLOCK
        const bulkFindings = findings.filter(f => f.category === 'bulk_pii');
        if (bulkFindings.length > 0) {
            const bulkFinding = bulkFindings[0];
            return {
                allowed: false,
                reason: `Bulk data export detected: ${bulkFinding.type} (${bulkFinding.count || bulkFinding.rows} items)`
            };
        }
        
        // Critical = always block
        const critical = findings.filter(f => f.severity === 'critical');
        if (critical.length > 0) {
            return {
                allowed: false,
                reason: `Critical content: ${critical[0].type}`
            };
        }
        
        // External domain + high severity = block
        const isExternal = this.isExternalDomain(context.url);
        const high = findings.filter(f => f.severity === 'high');
        
        if (isExternal && high.length > 0) {
            return {
                allowed: false,
                reason: 'Sensitive content on external domain'
            };
        }
        
        // Multiple findings on external = block
        if (isExternal && findings.length >= 2) {
            return {
                allowed: false,
                reason: 'Multiple sensitive patterns detected'
            };
        }
        
        return {
            allowed: true,
            reason: 'Content allowed'
        };
    }
}

export default TensorFlowDLPAnalyzer;
