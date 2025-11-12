import BulkDataDetector from './bulk-data-detector.js';
import { ContentClassificationDetector } from './content-classification-detector.js';
import { FileMetadataAnalyzer } from './file-metadata-analyzer.js';
import { GlobalConfig } from '../config/global-config.js';

class FastAnalyzer {
    constructor() {
        this.config = GlobalConfig;
        this.bulkDetector = new BulkDataDetector();
        this.classificationDetector = new ContentClassificationDetector();
        this.fileMetadataAnalyzer = new FileMetadataAnalyzer();
    }
    
    async analyze(content, context) {
        const startTime = performance.now();
        
        try {
            // Skip analysis for very short content
            if (content.length < 20) {
                return {
                    allowed: true,
                    message: 'Content too short to analyze',
                    findings: [],
                    analysis_took_ms: performance.now() - startTime
                };
            }
            
            // Run all detection layers
            const patternFindings = this.detectPatterns(content);
            const bulkFindings = this.bulkDetector.analyze(content);
            const densityFinding = this.bulkDetector.analyzeDensity(content);
            
            // Run comprehensive content classification with destination context
            const classificationResult = this.classificationDetector.analyze(content, context);
            
            // Combine findings
            const findings = [
                ...patternFindings,
                ...bulkFindings,
                ...(densityFinding ? [densityFinding] : [])
            ];
            
            // Add classification as a finding if content is not PUBLIC
            if (classificationResult.classification !== 'PUBLIC') {
                findings.push(classificationResult);
            }
            
            // Make decision
            const decision = this.evaluateFindings(findings, context);
            
            return {
                allowed: decision.allowed,
                message: decision.message,
                findings: findings,
                classification: classificationResult,
                analysis_took_ms: performance.now() - startTime
            };
            
        } catch (error) {
            console.error('[Fast Analyzer] Analysis failed:', error);
            return {
                allowed: true, // Fail open for better UX
                message: 'Analysis error - allowing paste',
                findings: [],
                error: error.message,
                analysis_took_ms: performance.now() - startTime
            };
        }
    }

    /**
     * Analyze file upload for metadata-based risks
     * @param {File} file - Browser File object
     * @param {Object} context - Context including destination URL
     * @returns {Object} Analysis result
     */
    async analyzeFile(file, context = {}) {
        const startTime = performance.now();
        
        try {
            // Fast metadata analysis (no content reading)
            const metadataResult = this.fileMetadataAnalyzer.analyzeFileMetadata(file, context);
            
            // If file content is available, also run content classification
            let contentResult = null;
            if (context.content) {
                contentResult = this.classificationDetector.analyze(context.content, context);
            }

            // Combine results
            const findings = [...metadataResult.findings];
            if (contentResult && contentResult.classification !== 'PUBLIC') {
                findings.push(contentResult);
            }

            // Make decision based on combined analysis
            const decision = this.evaluateFileFindings(metadataResult, contentResult, context);

            return {
                allowed: decision.allowed,
                message: decision.message,
                findings,
                fileMetadata: metadataResult,
                contentClassification: contentResult,
                analysis_took_ms: performance.now() - startTime
            };

        } catch (error) {
            console.error('[Fast Analyzer] File analysis failed:', error);
            return {
                allowed: true, // Fail open for better UX
                message: 'File analysis error - allowing upload',
                findings: [],
                error: error.message,
                analysis_took_ms: performance.now() - startTime
            };
        }
    }

    /**
     * Evaluate findings for file uploads
     */
    evaluateFileFindings(metadataResult, contentResult, context) {
        // Critical file metadata risks should be blocked
        if (metadataResult.riskLevel === 'CRITICAL') {
            return {
                allowed: false,
                message: `Critical file risk: ${metadataResult.recommendation}`
            };
        }

        // High-risk file metadata with high-risk destination
        if (metadataResult.riskLevel === 'HIGH' && context.destinationRisk === 'HIGH') {
            return {
                allowed: false,
                message: `High-risk file to high-risk destination blocked: ${metadataResult.recommendation}`
            };
        }

        // Content classification takes precedence if available
        if (contentResult) {
            if (['HIGHLY CONFIDENTIAL', 'CONFIDENTIAL'].includes(contentResult.classification)) {
                const destinationInfo = contentResult.destination ? 
                    ` to ${contentResult.destination.category}` : '';
                return {
                    allowed: false,
                    message: `${contentResult.classification} file content detected${destinationInfo}`
                };
            }
        }

        // High file metadata risk should warn
        if (metadataResult.riskLevel === 'HIGH') {
            return {
                allowed: false,
                message: `High-risk file detected: ${metadataResult.recommendation}`
            };
        }

        // Medium risk files to high-risk destinations
        if (metadataResult.riskLevel === 'MEDIUM' && context.destinationRisk === 'HIGH') {
            return {
                allowed: false,
                message: `Business file to high-risk destination: ${metadataResult.recommendation}`
            };
        }

        // Allow with warning for medium risk
        if (metadataResult.riskLevel === 'MEDIUM') {
            return {
                allowed: false,
                message: `Medium-risk file: ${metadataResult.recommendation}`
            };
        }

        return {
            allowed: true,
            message: 'File upload allowed'
        };
    }
    
    detectPatterns(content) {
        const patterns = {
            creditCard: {
                regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
                severity: 'critical',
                category: 'financial',
                label: 'Credit Card Number'
            },
            ssn: {
                regex: /\b\d{3}-\d{2}-\d{4}\b/g,
                severity: 'critical',
                category: 'pii',
                label: 'Social Security Number'
            },
            awsKey: {
                regex: /\b(AKIA[0-9A-Z]{16})\b/g,
                severity: 'critical',
                category: 'credentials',
                label: 'AWS Access Key'
            },
            apiKey: {
                regex: /(?:api[_-]?key|apikey)[_-]?[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
                severity: 'critical',
                category: 'credentials',
                label: 'API Key'
            },
            privateKey: {
                regex: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
                severity: 'critical',
                category: 'credentials',
                label: 'Private Key'
            },
            password: {
                regex: /(?:password|pwd|passwd)[_-]?[:=]\s*['"]?([^\s'"]{6,})['"]?/gi,
                severity: 'critical',
                category: 'credentials',
                label: 'Password'
            },
            email: {
                regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
                severity: 'medium',
                category: 'pii',
                label: 'Email Address'
            },
            phone: {
                regex: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
                severity: 'medium',
                category: 'pii',
                label: 'Phone Number'
            },
            ipAddress: {
                regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
                severity: 'low',
                category: 'technical',
                label: 'IP Address'
            }
        };
        
        const findings = [];
        
        for (const [type, config] of Object.entries(patterns)) {
            const matches = content.match(config.regex);
            if (matches) {
                // Get unique matches
                const uniqueMatches = [...new Set(matches)];
                
                findings.push({
                    type: type,
                    category: config.category,
                    severity: config.severity,
                    count: uniqueMatches.length,
                    sample: uniqueMatches.slice(0, 3), // First 3 examples
                    source: 'pattern_detection'
                });
            }
        }
        
        return findings;
    }
    
    evaluateFindings(findings, context) {
        if (findings.length === 0) {
            return {
                allowed: true,
                message: 'No sensitive content detected'
            };
        }
        
        // Check for content classification first (highest priority)
        const classificationFindings = findings.filter(f => f.type === 'content_classification');
        if (classificationFindings.length > 0) {
            const classification = classificationFindings[0];
            
            // HIGHLY CONFIDENTIAL and CONFIDENTIAL should be blocked
            if (['HIGHLY CONFIDENTIAL', 'CONFIDENTIAL'].includes(classification.classification)) {
                const destinationInfo = classification.destination ? 
                    ` to ${classification.destination.category} (${classification.destination.risk} risk)` : '';
                return {
                    allowed: false,
                    message: `${classification.classification} content detected${destinationInfo} (Score: ${classification.adjustedScore}/100)`
                };
            }
            
            // INTERNAL content - consider destination risk
            if (classification.classification === 'INTERNAL') {
                const destinationInfo = classification.destination ? 
                    ` to ${classification.destination.category} (${classification.destination.risk} risk)` : '';
                    
                // Block INTERNAL content going to HIGH risk destinations
                if (classification.destination?.risk === 'HIGH') {
                    return {
                        allowed: false,
                        message: `Internal content blocked - HIGH RISK destination: ${classification.destination.category}`
                    };
                }
                
                return {
                    allowed: false,
                    message: `Internal company content detected${destinationInfo} (Score: ${classification.adjustedScore}/100)`
                };
            }
        }
        
        // Check for bulk data exports - these are very important
        const bulkFindings = findings.filter(f => f.category === 'bulk_pii');
        if (bulkFindings.length > 0) {
            const bulkFinding = bulkFindings[0];
            return {
                allowed: false,
                message: `Bulk data export detected: ${bulkFinding.type} (${bulkFinding.count || bulkFinding.rows} items)`
            };
        }
        
        // Critical patterns (credentials, SSN, credit cards)
        const critical = findings.filter(f => f.severity === 'critical');
        if (critical.length > 0) {
            return {
                allowed: false,
                message: `${critical[0].type} detected`
            };
        }
        
        // Multiple email addresses (likely a list) - use configuration threshold
        const emailFindings = findings.filter(f => f.type === 'email');
        const emailThreshold = this.config.bulkDataSettings.emailThreshold;
        if (emailFindings.length > 0 && emailFindings[0].count >= emailThreshold) {
            return {
                allowed: false,
                message: `Multiple email addresses detected (${emailFindings[0].count} addresses, threshold: ${emailThreshold})`
            };
        }
        
        // Multiple phone numbers - use configuration threshold
        const phoneFindings = findings.filter(f => f.type === 'phone');
        const phoneThreshold = this.config.bulkDataSettings.phoneThreshold;
        if (phoneFindings.length > 0 && phoneFindings[0].count >= phoneThreshold) {
            return {
                allowed: false,
                message: `Multiple phone numbers detected (${phoneFindings[0].count} numbers, threshold: ${phoneThreshold})`
            };
        }
        
        // Medium severity - show warning but allow
        const medium = findings.filter(f => f.severity === 'medium');
        if (medium.length > 0) {
            return {
                allowed: false,
                message: `Potentially sensitive data: ${medium.map(f => f.type).join(', ')}`
            };
        }
        
        // Low severity - allow without warning
        return {
            allowed: true,
            message: 'Content allowed'
        };
    }
}

export default FastAnalyzer;
