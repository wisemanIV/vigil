import { GlobalConfig } from '../config/global-config.js';

/**
 * File Metadata Analyzer
 * Analyzes file metadata for proprietary data indicators at upload interception point
 * Fast analysis using only File API metadata (no content reading required)
 * Uses global configuration for company-specific patterns and risk thresholds
 */
export class FileMetadataAnalyzer {
    constructor() {
        this.config = GlobalConfig;
        this.initializeClassifiers();
    }

    initializeClassifiers() {
        // Load patterns from global configuration
        const financialConfig = this.config.getDetectionPatterns('financial');
        const strategicConfig = this.config.getDetectionPatterns('strategic');
        const customerConfig = this.config.getDetectionPatterns('customer');
        const employeeConfig = this.config.getDetectionPatterns('employee');
        const productConfig = this.config.getDetectionPatterns('product');
        const legalConfig = this.config.getDetectionPatterns('legal');
        const draftsConfig = this.config.getDetectionPatterns('drafts');
        
        // Filename patterns indicating proprietary content
        this.filenamePatterns = {
            confidentialMarkers: {
                patterns: [
                    // Dynamic patterns from config
                    ...this.config.getConfidentialityMarkers().map(marker => new RegExp(marker, 'i')),
                    // Company-specific patterns
                    ...this.config.getCompanyPatterns().map(pattern => new RegExp(pattern, 'i'))
                ],
                score: 25,
                category: 'Confidential Markers',
                reason: `Filename contains confidentiality markers for ${this.config.company.name}`
            },
            financialIndicators: {
                patterns: [
                    // Dynamic patterns from config
                    ...financialConfig.keywords.map(k => new RegExp(k, 'i')),
                    ...financialConfig.patterns,
                    // Additional financial patterns
                    /fy\d{2,4}/i, // FY2024, FY24
                    /q[1-4][\s_-]?\d{2,4}/i, // Q1 2024, Q1_24
                    /\d{4}[\s_-]budget/i
                ],
                score: financialConfig.score,
                category: 'Financial Data',
                reason: 'Filename suggests financial or business-critical data'
            },
            strategicContent: {
                patterns: [
                    // Dynamic patterns from config
                    ...strategicConfig.keywords.map(k => new RegExp(k, 'i')),
                    ...strategicConfig.patterns,
                    // Additional strategic patterns
                    /goals_\d{4}/i,
                    /objectives/i
                ],
                score: strategicConfig.score,
                category: 'Strategic Content',
                reason: 'Filename indicates strategic or high-level business content'
            },
            customerData: {
                patterns: [
                    // Dynamic patterns from config
                    ...customerConfig.keywords.map(k => new RegExp(k, 'i')),
                    ...customerConfig.patterns,
                    // Additional customer patterns
                    /export/i,
                    /list/i,
                    /directory/i,
                    /cohort/i,
                    /segment/i
                ],
                score: customerConfig.score,
                category: 'Customer Data',
                reason: 'Filename suggests customer or user data'
            },
            employeeData: {
                patterns: [
                    // Dynamic patterns from config
                    ...employeeConfig.keywords.map(k => new RegExp(k, 'i')),
                    ...employeeConfig.patterns,
                    // Additional employee patterns
                    /directory/i,
                    /headcount/i
                ],
                score: employeeConfig.score,
                category: 'Employee Data',
                reason: 'Filename indicates employee or HR-related data'
            },
            productDevelopment: {
                patterns: [
                    // Dynamic patterns from config
                    ...productConfig.keywords.map(k => new RegExp(k, 'i')),
                    ...productConfig.patterns,
                    // Additional product patterns
                    /prd/i, // Product Requirements Document
                    /wireframe/i,
                    /changelog/i,
                    /unreleased/i
                ],
                score: productConfig.score,
                category: 'Product Development',
                reason: 'Filename indicates product or development content'
            },
            legalCompliance: {
                patterns: [
                    // Dynamic patterns from config
                    ...legalConfig.keywords.map(k => new RegExp(k, 'i')),
                    ...legalConfig.patterns
                ],
                score: legalConfig.score,
                category: 'Legal/Compliance',
                reason: 'Filename indicates legal or compliance-related content'
            },
            draftVersions: {
                patterns: [
                    // Dynamic patterns from config
                    ...draftsConfig.keywords.map(k => new RegExp(k, 'i')),
                    ...draftsConfig.patterns
                ],
                score: draftsConfig.score,
                category: 'Draft/Work in Progress',
                reason: 'Filename indicates draft or work-in-progress content'
            },
            companyNames: {
                patterns: [
                    // Dynamic patterns from config
                    ...this.config.getCompanyPatterns().map(pattern => new RegExp(pattern, 'i')),
                    // Company name variations
                    new RegExp(this.config.company.name.replace(/\s+/g, '[_\\s-]'), 'i'),
                    // Domain-based patterns
                    ...this.config.company.domains.map(domain => new RegExp(domain.replace('.', '[._-]'), 'i'))
                ],
                score: 12,
                category: 'Company References',
                reason: `Filename contains references to ${this.config.company.name} or related entities`
            }
        };

        // Use file type risks from global configuration
        this.fileTypeRisks = this.config.fileTypeRisks;

        // Use file size thresholds from global configuration
        this.sizeThresholds = this.config.fileSizeThresholds;
    }

    /**
     * Analyze file metadata for proprietary data indicators
     * @param {File} file - Browser File object
     * @param {Object} context - Additional context (URL, user info, etc.)
     * @returns {Object} Analysis result with risk scoring
     */
    analyzeFileMetadata(file, context = {}) {
        if (!file) {
            return {
                allowed: true,
                reason: 'No file provided',
                findings: [],
                metadata: null
            };
        }

        const metadata = this.extractMetadata(file);
        const findings = [];

        // Analyze filename patterns
        const filenameFindings = this.analyzeFilename(metadata.name);
        findings.push(...filenameFindings);

        // Analyze file type
        const typeFindings = this.analyzeFileType(metadata.type, metadata.name);
        findings.push(...typeFindings);

        // Analyze file recency
        const recencyFindings = this.analyzeRecency(metadata.lastModified);
        findings.push(...recencyFindings);

        // Analyze file size
        const sizeFindings = this.analyzeFileSize(metadata.size, metadata.type);
        findings.push(...sizeFindings);

        // Calculate total risk score
        const totalScore = findings.reduce((sum, finding) => sum + (finding.score || 0), 0);
        const riskLevel = this.calculateRiskLevel(totalScore);

        return {
            type: 'file_metadata_analysis',
            category: 'file_upload',
            riskLevel: riskLevel.level,
            severity: riskLevel.severity,
            totalScore,
            maxScore: 100,
            findings,
            metadata,
            recommendation: this.getRecommendation(riskLevel, findings),
            source: 'file_metadata_analysis'
        };
    }

    /**
     * Extract metadata from File object
     */
    extractMetadata(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            lastModifiedDate: new Date(file.lastModified),
            extension: this.getFileExtension(file.name)
        };
    }

    /**
     * Analyze filename for proprietary indicators
     */
    analyzeFilename(filename) {
        const findings = [];
        const filenameLower = filename.toLowerCase();

        Object.entries(this.filenamePatterns).forEach(([patternType, config]) => {
            const matches = config.patterns.filter(pattern => pattern.test(filenameLower));
            
            if (matches.length > 0) {
                findings.push({
                    type: 'filename_pattern',
                    category: config.category,
                    score: config.score,
                    patterns: matches.map(p => p.source),
                    reason: config.reason,
                    sample: filename
                });
            }
        });

        return findings;
    }

    /**
     * Analyze file type for risk indicators
     */
    analyzeFileType(mimeType, filename) {
        const findings = [];
        const extension = this.getFileExtension(filename);

        Object.entries(this.fileTypeRisks).forEach(([riskType, config]) => {
            const extensionMatch = config.extensions.includes(extension);
            const mimeMatch = config.mimeTypes.includes(mimeType);

            if (extensionMatch || mimeMatch) {
                findings.push({
                    type: 'file_type_risk',
                    category: config.category,
                    score: config.score,
                    fileType: riskType,
                    extension,
                    mimeType,
                    reason: config.reason
                });
            }
        });

        return findings;
    }

    /**
     * Analyze file recency (recent files = higher risk)
     */
    analyzeRecency(lastModified) {
        const findings = [];
        const now = Date.now();
        const ageInDays = (now - lastModified) / (1000 * 60 * 60 * 24);

        if (ageInDays <= 1) {
            findings.push({
                type: 'file_recency',
                category: 'Recently Modified',
                score: 15,
                ageInDays: ageInDays.toFixed(1),
                reason: 'File modified within 24 hours - likely contains current/active data'
            });
        } else if (ageInDays <= 7) {
            findings.push({
                type: 'file_recency',
                category: 'Recently Modified',
                score: 10,
                ageInDays: ageInDays.toFixed(1),
                reason: 'File modified within 1 week - likely contains recent data'
            });
        } else if (ageInDays <= 30) {
            findings.push({
                type: 'file_recency',
                category: 'Recently Modified',
                score: 5,
                ageInDays: ageInDays.toFixed(1),
                reason: 'File modified within 1 month - may contain current data'
            });
        }

        return findings;
    }

    /**
     * Analyze file size for bulk data indicators
     */
    analyzeFileSize(size, mimeType) {
        const findings = [];

        if (size >= this.sizeThresholds.massive) {
            findings.push({
                type: 'file_size',
                category: 'Massive File',
                score: 20,
                sizeBytes: size,
                sizeMB: (size / (1024 * 1024)).toFixed(1),
                reason: 'Extremely large file (>100MB) - likely contains bulk data or media'
            });
        } else if (size >= this.sizeThresholds.large) {
            findings.push({
                type: 'file_size',
                category: 'Large File',
                score: 15,
                sizeBytes: size,
                sizeMB: (size / (1024 * 1024)).toFixed(1),
                reason: 'Large file (>50MB) - may contain significant amounts of data'
            });
        } else if (size >= this.sizeThresholds.bulk) {
            findings.push({
                type: 'file_size',
                category: 'Bulk Data File',
                score: 10,
                sizeBytes: size,
                sizeMB: (size / (1024 * 1024)).toFixed(1),
                reason: 'Medium-large file (>10MB) - may contain bulk data export'
            });
        }

        // Special case: Large CSV/Excel files are very likely bulk data exports
        if (size >= this.sizeThresholds.bulk && (
            mimeType.includes('csv') || 
            mimeType.includes('spreadsheet') ||
            mimeType.includes('excel')
        )) {
            findings.push({
                type: 'bulk_data_export',
                category: 'Likely Data Export',
                score: 25,
                sizeBytes: size,
                sizeMB: (size / (1024 * 1024)).toFixed(1),
                reason: 'Large spreadsheet file - very likely to be bulk data export'
            });
        }

        return findings;
    }

    /**
     * Calculate risk level based on total score using configured thresholds
     */
    calculateRiskLevel(score) {
        const thresholds = this.config.riskTolerance.fileMetadata;
        
        if (score >= thresholds.critical) {
            return { level: 'CRITICAL', severity: 'critical' };
        } else if (score >= thresholds.high) {
            return { level: 'HIGH', severity: 'high' };
        } else if (score >= thresholds.medium) {
            return { level: 'MEDIUM', severity: 'medium' };
        } else {
            return { level: 'LOW', severity: 'low' };
        }
    }

    /**
     * Get recommendation based on risk level and findings
     */
    getRecommendation(riskLevel, findings) {
        const hasConfidentialMarkers = findings.some(f => f.category === 'Confidential Markers');
        const hasFinancialData = findings.some(f => f.category === 'Financial Data');
        const isBulkData = findings.some(f => f.type === 'bulk_data_export');
        const isRecent = findings.some(f => f.type === 'file_recency');

        const companyName = this.config.company.name;
        
        if (riskLevel.level === 'CRITICAL') {
            return `CRITICAL RISK: File metadata indicates highly sensitive ${companyName} content. Review required before upload.`;
        } else if (riskLevel.level === 'HIGH') {
            if (hasConfidentialMarkers) {
                return `HIGH RISK: File contains explicit ${companyName} confidentiality markers. Verify authorization before sharing.`;
            } else if (hasFinancialData && isRecent) {
                return `HIGH RISK: Recent ${companyName} financial document detected. Ensure proper approval for external sharing.`;
            } else if (isBulkData) {
                return `HIGH RISK: Large ${companyName} data export detected. Verify this bulk data is approved for sharing.`;
            } else {
                return `HIGH RISK: File metadata indicates potentially sensitive ${companyName} content.`;
            }
        } else if (riskLevel.level === 'MEDIUM') {
            return `MEDIUM RISK: File may contain ${companyName} business-sensitive information. Review recommended.`;
        } else {
            return 'LOW RISK: File metadata analysis shows no significant risk indicators.';
        }
    }

    /**
     * Get file extension from filename
     */
    getFileExtension(filename) {
        const lastDot = filename.lastIndexOf('.');
        return lastDot >= 0 ? filename.substring(lastDot).toLowerCase() : '';
    }

    /**
     * Add custom company patterns for filename detection
     */
    addCompanyPatterns(patterns) {
        this.filenamePatterns.companyNames.patterns.push(...patterns.map(p => new RegExp(p, 'i')));
    }
}