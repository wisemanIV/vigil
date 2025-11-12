import { DestinationRiskClassifier } from './destination-risk-classifier.js';
import { GlobalConfig } from '../config/global-config.js';

/**
 * Content Classification Detector
 * Implements 0-100 point scoring rubric for PUBLIC/INTERNAL/CONFIDENTIAL/HIGHLY CONFIDENTIAL classification
 * Includes destination risk analysis and company-specific configuration
 */
export class ContentClassificationDetector {
    constructor() {
        this.config = GlobalConfig;
        this.destinationClassifier = new DestinationRiskClassifier();
        this.initializeScorers();
    }

    initializeScorers() {
        // Load patterns from global configuration
        const financialConfig = this.config.getDetectionPatterns('financial');
        const strategicConfig = this.config.getDetectionPatterns('strategic');
        const customerConfig = this.config.getDetectionPatterns('customer');
        const employeeConfig = this.config.getDetectionPatterns('employee');
        const productConfig = this.config.getDetectionPatterns('product');
        const legalConfig = this.config.getDetectionPatterns('legal');
        
        // Content Sensitivity patterns (0-30 points)
        this.sensitivityPatterns = {
            highRisk: {
                financial: {
                    patterns: [
                        // Dynamic patterns from config
                        ...financialConfig.keywords.map(k => new RegExp(k, 'gi')),
                        ...financialConfig.patterns,
                        // Enhanced financial patterns
                        /revenue.*\$[\d,]+/gi,
                        /profit margin.*\d+%/gi,
                        /cost.*\$[\d,]+/gi,
                        /forecast.*\$[\d,]+/gi,
                        /earnings.*\$[\d,]+/gi,
                        /budget.*\$[\d,]+/gi,
                        /valuation.*\$[\d,]+/gi,
                        /burn rate/gi,
                        /runway/gi,
                        /ebitda/gi,
                        /financial statements/gi,
                        /cash flow/gi
                    ],
                    score: financialConfig.score,
                    keywords: ['financial data', 'revenue', 'costs', 'margins', 'forecasts']
                },
                customerData: {
                    patterns: [
                        // Dynamic patterns from config
                        ...customerConfig.keywords.map(k => new RegExp(k, 'gi')),
                        ...customerConfig.patterns,
                        // Enhanced customer patterns
                        /customer list/gi,
                        /client database/gi,
                        /customer usage data/gi,
                        /user analytics/gi,
                        /customer contact/gi,
                        /lead list/gi,
                        /prospect data/gi,
                        /churn analysis/gi,
                        /customer retention/gi
                    ],
                    score: customerConfig.score,
                    keywords: ['customer lists', 'contact information', 'usage data']
                },
                unreleased: {
                    patterns: [
                        // Dynamic patterns from config
                        ...productConfig.keywords.map(k => new RegExp(k, 'gi')),
                        ...productConfig.patterns,
                        // Enhanced product patterns
                        /unreleased/gi,
                        /upcoming product/gi,
                        /product roadmap/gi,
                        /feature spec/gi,
                        /alpha version/gi,
                        /beta release/gi,
                        /pre-launch/gi,
                        /not yet announced/gi,
                        /under development/gi,
                        /stealth mode/gi,
                        /product requirements/gi,
                        /technical specification/gi
                    ],
                    score: productConfig.score,
                    keywords: ['unreleased products', 'roadmaps', 'specifications']
                },
                tradeSecrets: {
                    patterns: [
                        /proprietary algorithm/gi,
                        /trade secret/gi,
                        /proprietary method/gi,
                        /secret sauce/gi,
                        /competitive advantage/gi,
                        /intellectual property/gi,
                        /patent pending/gi,
                        /know-how/gi,
                        /proprietary technology/gi
                    ],
                    score: 30,
                    keywords: ['algorithms', 'methodologies', 'trade secrets']
                },
                strategy: {
                    patterns: [
                        // Dynamic patterns from config
                        ...strategicConfig.keywords.map(k => new RegExp(k, 'gi')),
                        ...strategicConfig.patterns,
                        // Enhanced strategic patterns
                        /m&a/gi,
                        /merger/gi,
                        /acquisition/gi,
                        /competitive strategy/gi,
                        /strategic plan/gi,
                        /go-to-market/gi,
                        /market entry/gi,
                        /business strategy/gi,
                        /strategic initiative/gi,
                        /competitive analysis/gi
                    ],
                    score: strategicConfig.score,
                    keywords: ['M&A', 'competitive strategy', 'strategic plans']
                }
            },
            mediumRisk: {
                processes: {
                    patterns: [
                        /internal process/gi,
                        /workflow/gi,
                        /standard operating procedure/gi,
                        /business process/gi,
                        /operational procedure/gi,
                        /internal tool/gi,
                        /proprietary process/gi
                    ],
                    score: 20,
                    keywords: ['internal processes', 'workflows']
                },
                analytics: {
                    patterns: [
                        /customer analytics/gi,
                        /user behavior/gi,
                        /usage patterns/gi,
                        /conversion metrics/gi,
                        /engagement data/gi,
                        /performance metrics/gi
                    ],
                    score: 15,
                    keywords: ['aggregated analytics', 'customer metrics']
                },
                compensation: {
                    patterns: [
                        // Dynamic patterns from config
                        ...employeeConfig.keywords.map(k => new RegExp(k, 'gi')),
                        ...employeeConfig.patterns,
                        // Enhanced compensation patterns
                        /compensation/gi,
                        /salary/gi,
                        /pay scale/gi,
                        /bonus structure/gi,
                        /equity/gi,
                        /stock options/gi,
                        /benefits package/gi
                    ],
                    score: employeeConfig.score,
                    keywords: ['compensation structures', 'salary ranges']
                },
                contracts: {
                    patterns: [
                        // Dynamic patterns from config
                        ...legalConfig.keywords.map(k => new RegExp(k, 'gi')),
                        ...legalConfig.patterns,
                        // Enhanced legal patterns
                        /vendor contract/gi,
                        /supplier agreement/gi,
                        /pricing terms/gi,
                        /contract pricing/gi,
                        /negotiated rate/gi
                    ],
                    score: legalConfig.score,
                    keywords: ['vendor contracts', 'pricing terms']
                }
            },
            lowRisk: {
                policies: {
                    patterns: [
                        /company policy/gi,
                        /employee handbook/gi,
                        /code of conduct/gi,
                        /compliance policy/gi
                    ],
                    score: 5,
                    keywords: ['general policies']
                },
                marketing: {
                    patterns: [
                        /marketing material/gi,
                        /press release/gi,
                        /public announcement/gi,
                        /blog post/gi
                    ],
                    score: 0,
                    keywords: ['public marketing materials']
                }
            }
        };

        // Identifier Presence patterns (0-25 points)
        this.identifierPatterns = {
            customerNames: {
                patterns: [
                    /customer:\s*[A-Z][a-zA-Z\s]+/gi,
                    /client:\s*[A-Z][a-zA-Z\s]+/gi,
                    /account:\s*[A-Z][a-zA-Z\s]+/gi
                ],
                score: 10,
                label: 'Customer/Account Names'
            },
            employeePII: {
                patterns: [
                    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
                    /\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|blvd)/gi, // Addresses
                    /health insurance/gi,
                    /medical information/gi
                ],
                score: 15,
                label: 'Employee PII'
            },
            projectCodes: {
                patterns: [
                    /project\s+[A-Z][A-Za-z0-9]+/gi,
                    /codename:\s*[A-Za-z]+/gi,
                    /operation\s+[A-Za-z]+/gi
                ],
                score: 5,
                label: 'Internal Project Codes'
            },
            confidentialMarkings: {
                patterns: [
                    // Dynamic patterns from config
                    ...this.config.getConfidentialityMarkers().map(marker => new RegExp(marker, 'gi')),
                    // Company-specific patterns
                    ...this.config.getCompanyPatterns().map(pattern => new RegExp(`${pattern}[_\\s]confidential`, 'gi')),
                    // Standard patterns
                    /confidential/gi,
                    /internal only/gi,
                    /restricted/gi,
                    /do not distribute/gi,
                    /proprietary/gi,
                    /classified/gi
                ],
                score: 10,
                label: 'Confidential Markings'
            },
            credentials: {
                patterns: [
                    /api[_-]?key/gi,
                    /password/gi,
                    /access[_-]?token/gi,
                    /private[_-]?key/gi,
                    /credential/gi,
                    /secret/gi,
                    /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b.*password/gi
                ],
                score: 15,
                label: 'API Keys/Credentials'
            }
        };

        // Temporal Sensitivity patterns (0-20 points)
        this.temporalPatterns = {
            futureReleases: {
                patterns: [
                    /\b202[5-9]\b/g, // Future years
                    /next year/gi,
                    /upcoming/gi,
                    /planned for/gi,
                    /scheduled for/gi,
                    /launch date/gi,
                    /release date/gi,
                    /coming soon/gi
                ],
                score: 20,
                label: 'Future-dated content'
            },
            currentQuarter: {
                patterns: [
                    /q[1-4]\s+2024/gi,
                    /this quarter/gi,
                    /current quarter/gi,
                    /by end of quarter/gi
                ],
                score: 15,
                label: 'Current quarter timeline'
            },
            currentYear: {
                patterns: [
                    /2024/gi,
                    /this year/gi,
                    /by year end/gi,
                    /annual/gi
                ],
                score: 10,
                label: 'Current year timeline'
            }
        };

        // Competitive Impact indicators (0-15 points)
        this.competitivePatterns = {
            directAdvantage: {
                patterns: [
                    /competitive advantage/gi,
                    /secret sauce/gi,
                    /proprietary/gi,
                    /unique approach/gi,
                    /differentiator/gi,
                    /market positioning/gi
                ],
                score: 15,
                label: 'Direct competitive advantage'
            },
            strategicPositioning: {
                patterns: [
                    /market strategy/gi,
                    /positioning/gi,
                    /competitive positioning/gi,
                    /market approach/gi
                ],
                score: 10,
                label: 'Strategic positioning'
            },
            operationalDetails: {
                patterns: [
                    /operational details/gi,
                    /process/gi,
                    /methodology/gi,
                    /approach/gi
                ],
                score: 7,
                label: 'Operational details'
            }
        };

        // Legal/Regulatory Risk patterns (0-10 points)
        this.legalPatterns = {
            gdpr: {
                patterns: [
                    /personal data/gi,
                    /gdpr/gi,
                    /data protection/gi,
                    /privacy violation/gi,
                    /personal information/gi
                ],
                score: 10,
                label: 'GDPR/Privacy risk'
            },
            financial: {
                patterns: [
                    /sox compliance/gi,
                    /financial reporting/gi,
                    /earnings/gi,
                    /financial disclosure/gi
                ],
                score: 10,
                label: 'Financial compliance risk'
            },
            contractual: {
                patterns: [
                    /nda/gi,
                    /non-disclosure/gi,
                    /confidentiality agreement/gi,
                    /contract breach/gi
                ],
                score: 8,
                label: 'NDA/Contract risk'
            },
            export: {
                patterns: [
                    /itar/gi,
                    /export control/gi,
                    /ear/gi,
                    /restricted technology/gi
                ],
                score: 10,
                label: 'Export control risk'
            }
        };
    }

    /**
     * Analyze content and return classification with detailed scoring
     * @param {string} content - Content to analyze
     * @param {Object} context - Analysis context including destination URL
     */
    analyze(content, context = {}) {
        const scores = {
            contentSensitivity: this.scoreContentSensitivity(content),
            identifierPresence: this.scoreIdentifierPresence(content), 
            temporalSensitivity: this.scoreTemporalSensitivity(content),
            competitiveImpact: this.scoreCompetitiveImpact(content),
            legalRisk: this.scoreLegalRisk(content)
        };

        // Add destination risk analysis
        const destinationAnalysis = this.destinationClassifier.analyzeDestination(context.url);
        scores.destinationRisk = destinationAnalysis;

        const baseScore = Object.values(scores).reduce((sum, score) => {
            return sum + (score.score || 0);
        }, 0);

        // Apply destination risk multiplier to content score
        const contentClassification = this.classifyContent(baseScore);
        const riskMultiplier = this.destinationClassifier.getRiskMultiplier(
            destinationAnalysis.risk, 
            contentClassification.level
        );
        
        const adjustedScore = Math.min(100, Math.round(baseScore * riskMultiplier));
        const finalClassification = this.classifyContent(adjustedScore);
        
        // Collect all findings
        const findings = [];
        Object.values(scores).forEach(scoreObj => {
            if (scoreObj.findings.length > 0) {
                findings.push(...scoreObj.findings);
            }
        });

        return {
            type: 'content_classification',
            category: 'proprietary',
            classification: finalClassification.level,
            severity: finalClassification.severity,
            baseScore,
            adjustedScore,
            riskMultiplier,
            maxScore: 100,
            scoreBreakdown: {
                contentSensitivity: scores.contentSensitivity,
                identifierPresence: scores.identifierPresence,
                temporalSensitivity: scores.temporalSensitivity,
                competitiveImpact: scores.competitiveImpact,
                legalRisk: scores.legalRisk,
                destinationRisk: scores.destinationRisk
            },
            findings,
            recommendation: this.getFinalRecommendation(finalClassification, destinationAnalysis),
            destination: destinationAnalysis,
            source: 'content_classification'
        };
    }

    /**
     * Score content sensitivity (0-30 points)
     */
    scoreContentSensitivity(content) {
        let score = 0;
        const findings = [];
        const contentLower = content.toLowerCase();

        // Check high risk patterns
        Object.entries(this.sensitivityPatterns.highRisk).forEach(([category, config]) => {
            const matches = this.findPatternMatches(content, config.patterns);
            if (matches.length > 0) {
                score = Math.max(score, config.score);
                findings.push({
                    category: 'high_risk_content',
                    type: category,
                    matches: matches.length,
                    sample: matches.slice(0, 2),
                    score: config.score
                });
            }
        });

        // Check medium risk patterns  
        if (score < 25) {
            Object.entries(this.sensitivityPatterns.mediumRisk).forEach(([category, config]) => {
                const matches = this.findPatternMatches(content, config.patterns);
                if (matches.length > 0) {
                    score = Math.max(score, config.score);
                    findings.push({
                        category: 'medium_risk_content',
                        type: category,
                        matches: matches.length,
                        sample: matches.slice(0, 2),
                        score: config.score
                    });
                }
            });
        }

        // Check low risk patterns
        if (score < 10) {
            Object.entries(this.sensitivityPatterns.lowRisk).forEach(([category, config]) => {
                const matches = this.findPatternMatches(content, config.patterns);
                if (matches.length > 0) {
                    score = Math.max(score, config.score);
                    findings.push({
                        category: 'low_risk_content', 
                        type: category,
                        matches: matches.length,
                        sample: matches.slice(0, 2),
                        score: config.score
                    });
                }
            });
        }

        return { score, findings, maxScore: 30 };
    }

    /**
     * Score identifier presence (0-25 points)
     */
    scoreIdentifierPresence(content) {
        let totalScore = 0;
        const findings = [];

        Object.entries(this.identifierPatterns).forEach(([type, config]) => {
            const matches = this.findPatternMatches(content, config.patterns);
            if (matches.length > 0) {
                totalScore += config.score;
                findings.push({
                    category: 'identifier_presence',
                    type: type,
                    label: config.label,
                    matches: matches.length,
                    sample: matches.slice(0, 2),
                    score: config.score
                });
            }
        });

        return { score: Math.min(totalScore, 25), findings, maxScore: 25 };
    }

    /**
     * Score temporal sensitivity (0-20 points)
     */
    scoreTemporalSensitivity(content) {
        let score = 0;
        const findings = [];

        Object.entries(this.temporalPatterns).forEach(([type, config]) => {
            const matches = this.findPatternMatches(content, config.patterns);
            if (matches.length > 0) {
                score = Math.max(score, config.score);
                findings.push({
                    category: 'temporal_sensitivity',
                    type: type,
                    label: config.label,
                    matches: matches.length,
                    sample: matches.slice(0, 2),
                    score: config.score
                });
            }
        });

        return { score, findings, maxScore: 20 };
    }

    /**
     * Score competitive impact (0-15 points)
     */
    scoreCompetitiveImpact(content) {
        let score = 0;
        const findings = [];

        Object.entries(this.competitivePatterns).forEach(([type, config]) => {
            const matches = this.findPatternMatches(content, config.patterns);
            if (matches.length > 0) {
                score = Math.max(score, config.score);
                findings.push({
                    category: 'competitive_impact',
                    type: type,
                    label: config.label,
                    matches: matches.length,
                    sample: matches.slice(0, 2),
                    score: config.score
                });
            }
        });

        return { score, findings, maxScore: 15 };
    }

    /**
     * Score legal/regulatory risk (0-10 points)
     */
    scoreLegalRisk(content) {
        let totalScore = 0;
        const findings = [];

        Object.entries(this.legalPatterns).forEach(([type, config]) => {
            const matches = this.findPatternMatches(content, config.patterns);
            if (matches.length > 0) {
                totalScore += config.score;
                findings.push({
                    category: 'legal_risk',
                    type: type,
                    label: config.label,
                    matches: matches.length,
                    sample: matches.slice(0, 2),
                    score: config.score
                });
            }
        });

        return { score: Math.min(totalScore, 10), findings, maxScore: 10 };
    }

    /**
     * Classify content based on total score using configured thresholds
     */
    classifyContent(totalScore) {
        const thresholds = this.config.riskTolerance.contentClassification;
        
        if (totalScore >= thresholds.highlyConfidential) {
            return {
                level: 'HIGHLY CONFIDENTIAL',
                severity: 'critical',
                recommendation: `Restricted access - explicit approval required before sharing (Company: ${this.config.company.name})`
            };
        } else if (totalScore >= thresholds.confidential) {
            return {
                level: 'CONFIDENTIAL',
                severity: 'high', 
                recommendation: `Limited distribution - need-to-know basis only (Company: ${this.config.company.name})`
            };
        } else if (totalScore >= thresholds.internal) {
            return {
                level: 'INTERNAL',
                severity: 'medium',
                recommendation: `${this.config.company.name} internal only - no external sharing`
            };
        } else {
            return {
                level: 'PUBLIC',
                severity: 'low',
                recommendation: 'Safe to share externally'
            };
        }
    }

    /**
     * Get final recommendation considering both content and destination risk
     */
    getFinalRecommendation(classification, destinationAnalysis) {
        const baseRecommendation = classification.recommendation;
        const destinationRisk = destinationAnalysis.risk;
        const destinationCategory = destinationAnalysis.category;

        if (destinationRisk === 'HIGH') {
            return `${baseRecommendation}. HIGH RISK DESTINATION: Sharing to ${destinationCategory} significantly increases data exposure risk. ${destinationAnalysis.reason}`;
        } else if (destinationRisk === 'MEDIUM') {
            return `${baseRecommendation}. MEDIUM RISK DESTINATION: ${destinationCategory} - verify enterprise controls are enabled. ${destinationAnalysis.reason}`;
        } else if (destinationRisk === 'LOW') {
            return `${baseRecommendation}. LOW RISK DESTINATION: ${destinationCategory} has appropriate enterprise security controls.`;
        }
        
        return `${baseRecommendation}. Destination risk: ${destinationRisk}`;
    }

    /**
     * Find matches for an array of patterns
     */
    findPatternMatches(content, patterns) {
        const matches = [];
        patterns.forEach(pattern => {
            const patternMatches = content.match(pattern);
            if (patternMatches) {
                matches.push(...patternMatches);
            }
        });
        return [...new Set(matches)]; // Remove duplicates
    }
}