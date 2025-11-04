import BulkDataDetector from './bulk-data-detector.js';

class FastAnalyzer {
    constructor() {
        this.bulkDetector = new BulkDataDetector();
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
            
            // Run fast checks only
            const patternFindings = this.detectPatterns(content);
            const bulkFindings = this.bulkDetector.analyze(content);
            const densityFinding = this.bulkDetector.analyzeDensity(content);
            
            // Combine findings
            const findings = [
                ...patternFindings,
                ...bulkFindings,
                ...(densityFinding ? [densityFinding] : [])
            ];
            
            // Make decision
            const decision = this.evaluateFindings(findings, context);
            
            return {
                allowed: decision.allowed,
                message: decision.message,
                findings: findings,
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
        
        // Check for bulk data exports - these are the most important
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
        
        // Multiple email addresses (likely a list)
        const emailFindings = findings.filter(f => f.type === 'email');
        if (emailFindings.length > 0 && emailFindings[0].count >= 3) {
            return {
                allowed: false,
                message: `Multiple email addresses detected (${emailFindings[0].count} addresses)`
            };
        }
        
        // Multiple phone numbers
        const phoneFindings = findings.filter(f => f.type === 'phone');
        if (phoneFindings.length > 0 && phoneFindings[0].count >= 3) {
            return {
                allowed: false,
                message: `Multiple phone numbers detected (${phoneFindings[0].count} numbers)`
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
