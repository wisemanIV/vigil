/**
 * Proprietary Data Detector
 * Identifies company-sensitive information using semantic analysis
 */
export class ProprietaryDataDetector {
    constructor() {
        this.initializeClassifiers();
    }

    initializeClassifiers() {
        // Strategic document indicators
        this.strategicKeywords = {
            competitive: ['competitor analysis', 'competitive landscape', 'market share', 'competitive advantage', 'threat analysis'],
            strategy: ['strategic plan', 'business strategy', 'go-to-market', 'market entry', 'strategic initiative'],
            confidential: ['confidential', 'internal only', 'restricted', 'proprietary', 'trade secret'],
            acquisition: ['acquisition target', 'merger', 'due diligence', 'valuation', 'acquisition strategy'],
            partnerships: ['partnership agreement', 'strategic partnership', 'joint venture', 'exclusive deal']
        };

        // Product and development indicators  
        this.productKeywords = {
            roadmap: ['product roadmap', 'development roadmap', 'feature roadmap', 'release timeline'],
            unreleased: ['upcoming release', 'beta features', 'alpha version', 'pre-release', 'under development'],
            technical: ['architecture decision', 'technical specification', 'design document', 'implementation plan'],
            pricing: ['pricing strategy', 'pricing model', 'cost structure', 'pricing analysis', 'revenue model'],
            features: ['feature specification', 'product requirements', 'user stories', 'acceptance criteria']
        };

        // Financial indicators
        this.financialKeywords = {
            sensitive: ['financial statements', 'revenue figures', 'profit margins', 'cost analysis', 'budget allocation'],
            projections: ['revenue projections', 'financial forecast', 'budget projections', 'earnings estimate'],
            metrics: ['key metrics', 'performance indicators', 'financial kpis', 'revenue metrics', 'growth metrics'],
            costs: ['operational costs', 'development costs', 'infrastructure costs', 'personnel costs'],
            deals: ['contract terms', 'deal structure', 'pricing terms', 'payment terms', 'commercial agreement']
        };

        // Employee and organizational data
        this.organizationalKeywords = {
            personnel: ['organization chart', 'reporting structure', 'team structure', 'headcount planning'],
            performance: ['performance review', 'employee evaluation', 'compensation analysis', 'promotion plan'],
            hiring: ['hiring plan', 'recruitment strategy', 'candidate pipeline', 'interview feedback'],
            compensation: ['salary ranges', 'compensation bands', 'equity grants', 'bonus structure'],
            internal: ['internal memo', 'all-hands', 'leadership meeting', 'executive summary']
        };
    }

    /**
     * Analyze content for proprietary information
     */
    analyze(content) {
        const findings = [];
        const contentLower = content.toLowerCase();
        
        // Strategic analysis
        const strategicFindings = this.detectStrategicContent(contentLower, content);
        findings.push(...strategicFindings);

        // Product analysis  
        const productFindings = this.detectProductContent(contentLower, content);
        findings.push(...productFindings);

        // Financial analysis
        const financialFindings = this.detectFinancialContent(contentLower, content);
        findings.push(...financialFindings);

        // Organizational analysis
        const orgFindings = this.detectOrganizationalContent(contentLower, content);
        findings.push(...orgFindings);

        // Context-aware scoring
        const contextScore = this.calculateContextScore(contentLower);
        if (contextScore.score > 0.7) {
            findings.push({
                type: 'high_context_sensitivity',
                category: 'proprietary',
                severity: 'high',
                confidence: contextScore.score,
                indicators: contextScore.indicators,
                source: 'proprietary_data_detection'
            });
        }

        return findings;
    }

    /**
     * Detect strategic business content
     */
    detectStrategicContent(contentLower, originalContent) {
        const findings = [];
        const matches = [];

        Object.entries(this.strategicKeywords).forEach(([category, keywords]) => {
            keywords.forEach(keyword => {
                if (contentLower.includes(keyword.toLowerCase())) {
                    matches.push({ category, keyword, type: 'strategic' });
                }
            });
        });

        if (matches.length > 0) {
            // Look for document structure indicators
            const hasDocumentStructure = this.hasBusinessDocumentStructure(originalContent);
            const hasConfidentialityMarkers = this.hasConfidentialityMarkers(contentLower);
            
            const severity = this.calculateSeverity(matches.length, hasDocumentStructure, hasConfidentialityMarkers);
            
            findings.push({
                type: 'strategic_business_content',
                category: 'proprietary',
                severity,
                matchCount: matches.length,
                categories: [...new Set(matches.map(m => m.category))],
                sample: matches.slice(0, 3).map(m => m.keyword),
                hasDocumentStructure,
                hasConfidentialityMarkers,
                source: 'proprietary_data_detection'
            });
        }

        return findings;
    }

    /**
     * Detect product and development content
     */
    detectProductContent(contentLower, originalContent) {
        const findings = [];
        const matches = [];

        Object.entries(this.productKeywords).forEach(([category, keywords]) => {
            keywords.forEach(keyword => {
                if (contentLower.includes(keyword.toLowerCase())) {
                    matches.push({ category, keyword, type: 'product' });
                }
            });
        });

        // Look for timeline/date patterns indicating roadmaps
        const timelinePattern = /\b(q[1-4]\s+\d{4}|[a-z]+\s+\d{4}|milestone|deadline|launch date|release date)\b/gi;
        const timelineMatches = originalContent.match(timelinePattern) || [];

        if (matches.length > 0 || timelineMatches.length > 2) {
            const severity = matches.some(m => m.category === 'unreleased') ? 'critical' : 'high';
            
            findings.push({
                type: 'product_development_content',
                category: 'proprietary', 
                severity,
                matchCount: matches.length,
                timelineIndicators: timelineMatches.length,
                categories: [...new Set(matches.map(m => m.category))],
                sample: matches.slice(0, 3).map(m => m.keyword),
                source: 'proprietary_data_detection'
            });
        }

        return findings;
    }

    /**
     * Detect financial content
     */
    detectFinancialContent(contentLower, originalContent) {
        const findings = [];
        const matches = [];

        Object.entries(this.financialKeywords).forEach(([category, keywords]) => {
            keywords.forEach(keyword => {
                if (contentLower.includes(keyword.toLowerCase())) {
                    matches.push({ category, keyword, type: 'financial' });
                }
            });
        });

        // Look for numerical financial data
        const financialPatterns = [
            /\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|k|m|b))?/gi,
            /\d+%\s*(?:growth|margin|increase|decrease|revenue|profit)/gi,
            /(?:fte|headcount):\s*\d+/gi
        ];

        let numericalMatches = 0;
        financialPatterns.forEach(pattern => {
            const patternMatches = originalContent.match(pattern) || [];
            numericalMatches += patternMatches.length;
        });

        if (matches.length > 0 || numericalMatches > 3) {
            findings.push({
                type: 'financial_business_data',
                category: 'proprietary',
                severity: 'critical',
                matchCount: matches.length,
                numericalIndicators: numericalMatches,
                categories: [...new Set(matches.map(m => m.category))],
                sample: matches.slice(0, 3).map(m => m.keyword),
                source: 'proprietary_data_detection'
            });
        }

        return findings;
    }

    /**
     * Detect organizational content
     */
    detectOrganizationalContent(contentLower, originalContent) {
        const findings = [];
        const matches = [];

        Object.entries(this.organizationalKeywords).forEach(([category, keywords]) => {
            keywords.forEach(keyword => {
                if (contentLower.includes(keyword.toLowerCase())) {
                    matches.push({ category, keyword, type: 'organizational' });
                }
            });
        });

        if (matches.length > 0) {
            const severity = matches.some(m => ['compensation', 'performance'].includes(m.category)) ? 'critical' : 'high';
            
            findings.push({
                type: 'organizational_data',
                category: 'proprietary',
                severity,
                matchCount: matches.length,
                categories: [...new Set(matches.map(m => m.category))],
                sample: matches.slice(0, 3).map(m => m.keyword),
                source: 'proprietary_data_detection'
            });
        }

        return findings;
    }

    /**
     * Calculate context-aware score based on document characteristics
     */
    calculateContextScore(contentLower) {
        let score = 0;
        const indicators = [];

        // Document type indicators
        const docTypes = {
            'board deck': 0.9,
            'executive summary': 0.8,
            'confidential memo': 0.9,
            'internal presentation': 0.7,
            'strategy document': 0.8,
            'business plan': 0.8,
            'financial model': 0.9,
            'competitive analysis': 0.8,
            'product spec': 0.6,
            'roadmap': 0.7
        };

        Object.entries(docTypes).forEach(([docType, weight]) => {
            if (contentLower.includes(docType)) {
                score = Math.max(score, weight);
                indicators.push(docType);
            }
        });

        // Confidentiality markers
        const confidentialityMarkers = [
            'confidential', 'internal only', 'do not distribute', 
            'proprietary', 'trade secret', 'classified'
        ];
        
        const confidentialityCount = confidentialityMarkers.filter(marker => 
            contentLower.includes(marker)
        ).length;

        if (confidentialityCount > 0) {
            score = Math.max(score, 0.6 + (confidentialityCount * 0.1));
            indicators.push(`${confidentialityCount} confidentiality markers`);
        }

        return { score, indicators };
    }

    /**
     * Check if content has business document structure
     */
    hasBusinessDocumentStructure(content) {
        const structureIndicators = [
            /^#+\s+/m,  // Markdown headers
            /^\s*\d+\.\s+/m,  // Numbered lists
            /executive summary|key findings|recommendations|next steps/i,
            /agenda|action items|deliverables/i
        ];

        return structureIndicators.some(pattern => pattern.test(content));
    }

    /**
     * Check for confidentiality markers
     */
    hasConfidentialityMarkers(contentLower) {
        const markers = [
            'confidential', 'internal only', 'restricted', 'proprietary',
            'do not share', 'do not distribute', 'for internal use'
        ];
        
        return markers.some(marker => contentLower.includes(marker));
    }

    /**
     * Calculate severity based on various factors
     */
    calculateSeverity(matchCount, hasStructure, hasConfidentiality) {
        if (hasConfidentiality || matchCount >= 3) return 'critical';
        if (hasStructure || matchCount >= 2) return 'high';
        return 'medium';
    }
}