/**
 * Global Configuration for Vigil DLP Extension
 * 
 * This file contains company-specific settings, risk tolerance levels,
 * and customizable detection patterns for the DLP system.
 */

export class VigilConfig {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Company Information
        this.company = {
            name: 'TechCorp Inc',
            aliases: ['techcorp', 'tech_corp', 'tc_inc'],
            domains: ['techcorp.com', 'company.com'],
            confidentialityMarkers: [
                'confidential',
                'internal',
                'private',
                'restricted',
                'proprietary',
                'classified',
                'sensitive',
                'secret',
                'nda',
                'do_not_share',
                'dni', // Do Not Include
                'techcorp_confidential',
                'tc_internal',
                'company_private'
            ]
        };

        // Risk Tolerance Settings
        this.riskTolerance = {
            // Scoring benchmarks (0-100 scale)
            thresholds: {
                critical: 75,    // >= 75 = CRITICAL risk
                high: 50,        // 50-74 = HIGH risk  
                medium: 25,      // 25-49 = MEDIUM risk
                low: 0           // 0-24 = LOW risk
            },
            
            // Content classification thresholds
            contentClassification: {
                highlyConfidential: 71,  // >= 71 = HIGHLY CONFIDENTIAL
                confidential: 51,        // 51-70 = CONFIDENTIAL
                internal: 31,            // 31-50 = INTERNAL
                public: 0                // 0-30 = PUBLIC
            },

            // File metadata risk thresholds
            fileMetadata: {
                critical: 40,    // >= 40 = CRITICAL file risk
                high: 25,        // 25-39 = HIGH file risk
                medium: 15,      // 15-24 = MEDIUM file risk
                low: 0           // 0-14 = LOW file risk
            },

            // Action policies based on risk levels
            policies: {
                blockCritical: true,
                blockHighToHighRisk: true,
                warnOnMedium: true,
                logAll: true
            }
        };

        // Detection Patterns
        this.detectionPatterns = {
            // Financial data indicators
            financial: {
                keywords: [
                    'financial', 'finance', 'budget', 'revenue', 'profit', 'earnings',
                    'pnl', 'p&l', 'income', 'balance_sheet', 'cash_flow', 'forecast',
                    'projection', 'cost_analysis', 'pricing', 'valuation', 'ebitda',
                    'operating_margin', 'gross_margin', 'net_income', 'quarterly_results'
                ],
                patterns: [
                    /fy\d{2,4}/i, // FY2024, FY24
                    /q[1-4][\s_-]?\d{2,4}/i, // Q1 2024, Q1_24
                    /\d{4}[\s_-]budget/i,
                    /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?[kmb]?/i // Currency amounts
                ],
                score: 20
            },

            // Strategic content indicators
            strategic: {
                keywords: [
                    'strategy', 'roadmap', 'planning', 'strategic', 'business_plan',
                    'market_analysis', 'competitive', 'acquisition', 'merger', 'm&a',
                    'due_diligence', 'board_deck', 'executive', 'leadership', 'vision',
                    'goals', 'objectives', 'kpi', 'metrics', 'performance', 'targets'
                ],
                patterns: [
                    /goals_\d{4}/i,
                    /strategy_\d{4}/i,
                    /roadmap_\d{4}/i
                ],
                score: 20
            },

            // Customer/client data indicators
            customer: {
                keywords: [
                    'customer', 'client', 'contact', 'lead', 'prospect', 'user_data',
                    'account', 'crm', 'database', 'export', 'list', 'directory',
                    'analytics', 'metrics', 'cohort', 'segment', 'persona', 'demographics'
                ],
                patterns: [
                    /customer_id/i,
                    /client_list/i,
                    /user_analytics/i
                ],
                score: 18
            },

            // Employee/HR data indicators
            employee: {
                keywords: [
                    'employee', 'staff', 'personnel', 'hr', 'payroll', 'compensation',
                    'salary', 'performance', 'review', 'evaluation', 'org_chart',
                    'headcount', 'hiring', 'recruitment', 'onboarding', 'benefits',
                    'termination', 'promotion', 'raise'
                ],
                patterns: [
                    /employee_id/i,
                    /staff_directory/i,
                    /payroll_\d{4}/i
                ],
                score: 18
            },

            // Product development indicators
            product: {
                keywords: [
                    'product', 'development', 'feature', 'spec', 'specification',
                    'requirement', 'prd', 'design', 'prototype', 'mockup', 'wireframe',
                    'architecture', 'technical', 'api', 'release', 'version', 'changelog',
                    'alpha', 'beta', 'preview', 'unreleased', 'pipeline', 'backlog'
                ],
                patterns: [
                    /v\d+\.\d+/i, // version numbers
                    /release_\d{4}/i,
                    /feature_\w+/i
                ],
                score: 15
            },

            // Legal/compliance indicators
            legal: {
                keywords: [
                    'legal', 'compliance', 'audit', 'contract', 'agreement', 'policy',
                    'procedure', 'gdpr', 'sox', 'hipaa', 'regulation', 'patent',
                    'trademark', 'copyright', 'license', 'terms', 'privacy', 'lawsuit',
                    'litigation', 'settlement'
                ],
                patterns: [
                    /contract_\d{4}/i,
                    /agreement_\w+/i,
                    /policy_v\d+/i
                ],
                score: 15
            },

            // Version/draft indicators
            drafts: {
                keywords: [
                    'draft', 'rough', 'temp', 'temporary', 'work_in_progress', 'wip',
                    'version', 'revision', 'copy', 'backup', 'preliminary', 'sketch',
                    'outline', 'notes'
                ],
                patterns: [
                    /v\d+/i, // version numbers
                    /rev\d+/i,
                    /_v\d/i,
                    /\(\d+\)/i, // (1), (2), etc.
                    /draft_\d{4}/i
                ],
                score: 10
            }
        };

        // Destination risk classifications
        this.destinationRisks = {
            // High risk destinations (score: 20)
            high: {
                consumerEmail: {
                    patterns: ['mail.google.com', 'outlook.live.com', 'mail.yahoo.com', 'icloud.com'],
                    category: 'Consumer Email',
                    reason: 'Consumer email services lack enterprise security controls'
                },
                aiPlatforms: {
                    patterns: ['chat.openai.com', 'claude.ai', 'bard.google.com', 'character.ai', 'huggingface.co'],
                    category: 'AI/LLM Platforms',
                    reason: 'AI platforms may train on user inputs and retain sensitive data'
                },
                socialMedia: {
                    patterns: ['facebook.com', 'twitter.com', 'linkedin.com', 'discord.com', 'reddit.com', 'instagram.com'],
                    category: 'Social Media',
                    reason: 'Social media platforms are public and lack privacy controls'
                },
                consumerCloud: {
                    patterns: ['drive.google.com', 'dropbox.com', 'onedrive.live.com', 'mega.nz', 'box.com'],
                    category: 'Consumer Cloud Storage',
                    reason: 'Consumer cloud storage may not meet enterprise security standards'
                },
                publicRepos: {
                    patterns: ['github.com', 'gitlab.com', 'bitbucket.org', 'sourceforge.net'],
                    category: 'Public Code Repositories',
                    reason: 'Public repositories expose code and data to the internet'
                },
                pasteServices: {
                    patterns: ['pastebin.com', 'paste.ee', 'gist.github.com', 'hastebin.com'],
                    category: 'Paste/Sharing Services',
                    reason: 'Paste services create publicly searchable content'
                }
            },

            // Medium risk destinations (score: 10)
            medium: {
                businessTools: {
                    patterns: ['workspace.google.com', 'teams.microsoft.com', 'slack.com', 'zoom.us', 'asana.com'],
                    category: 'Business Productivity',
                    reason: 'Business tools generally secure but may have broader access'
                },
                devPlatforms: {
                    patterns: ['replit.com', 'codesandbox.io', 'codepen.io', 'stackblitz.com'],
                    category: 'Development Platforms',
                    reason: 'Development platforms may expose code publicly by default'
                },
                designTools: {
                    patterns: ['figma.com', 'canva.com', 'miro.com', 'lucidchart.com'],
                    category: 'Design/Collaboration Tools',
                    reason: 'Design tools may have sharing features with external visibility'
                }
            },

            // Low risk destinations (score: 0)
            low: {
                enterpriseEmail: {
                    patterns: ['mail.google.com/mail/a/', 'outlook.office365.com', 'outlook.office.com'],
                    category: 'Enterprise Email',
                    reason: 'Enterprise email with proper security controls'
                },
                enterpriseProductivity: {
                    patterns: ['.sharepoint.com', '.slack.com', 'app.slack.com/client/', 'team.notion.so'],
                    category: 'Enterprise Productivity',
                    reason: 'Enterprise productivity tools with security controls'
                },
                corporateIntranets: {
                    patterns: ['intranet.', 'internal.', 'confluence.', 'jira.'],
                    category: 'Corporate Intranets',
                    reason: 'Internal corporate systems with access controls'
                },
                enterpriseCloud: {
                    patterns: ['console.aws.amazon.com', 'portal.azure.com', 'console.cloud.google.com', '.salesforce.com'],
                    category: 'Enterprise Cloud Services',
                    reason: 'Enterprise cloud services with security controls'
                },
                enterpriseAI: {
                    patterns: ['chat.openai.com/team/', 'claude.ai/team/', 'api.openai.com', 'api.anthropic.com'],
                    category: 'Enterprise AI Services',
                    reason: 'Enterprise AI services with data protection agreements'
                }
            }
        };

        // Risk multipliers for content + destination combinations
        this.riskMultipliers = {
            'HIGH_HIGHLY_CONFIDENTIAL': 2.0,
            'HIGH_CONFIDENTIAL': 1.8,
            'HIGH_INTERNAL': 1.5,
            'HIGH_PUBLIC': 1.2,
            'MEDIUM_HIGHLY_CONFIDENTIAL': 1.4,
            'MEDIUM_CONFIDENTIAL': 1.2,
            'MEDIUM_INTERNAL': 1.1,
            'MEDIUM_PUBLIC': 1.0,
            'LOW_HIGHLY_CONFIDENTIAL': 1.1,
            'LOW_CONFIDENTIAL': 1.0,
            'LOW_INTERNAL': 1.0,
            'LOW_PUBLIC': 1.0
        };

        // File type configurations
        this.fileTypeRisks = {
            financial: {
                extensions: ['.xlsx', '.xls', '.xlsm', '.csv', '.ods'],
                mimeTypes: [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    'text/csv'
                ],
                score: 15,
                category: 'Financial Documents'
            },
            presentations: {
                extensions: ['.pptx', '.ppt', '.pptm', '.odp', '.key'],
                mimeTypes: [
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'application/vnd.ms-powerpoint'
                ],
                score: 12,
                category: 'Presentation Files'
            },
            documents: {
                extensions: ['.docx', '.doc', '.docm', '.odt', '.rtf', '.pages'],
                mimeTypes: [
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/msword'
                ],
                score: 8,
                category: 'Text Documents'
            },
            databases: {
                extensions: ['.db', '.sqlite', '.mdb', '.accdb', '.sql', '.dump'],
                mimeTypes: [
                    'application/x-sqlite3',
                    'application/vnd.ms-access',
                    'application/sql'
                ],
                score: 20,
                category: 'Database Files'
            },
            code: {
                extensions: ['.js', '.py', '.java', '.cpp', '.cs', '.rb', '.php', '.go', '.rs'],
                mimeTypes: [
                    'text/javascript',
                    'text/x-python',
                    'text/x-java-source'
                ],
                score: 12,
                category: 'Source Code'
            }
        };

        // File size thresholds
        this.fileSizeThresholds = {
            bulk: 10 * 1024 * 1024,      // 10MB - likely bulk data
            large: 50 * 1024 * 1024,     // 50MB - very large file  
            massive: 100 * 1024 * 1024   // 100MB - massive file
        };

        // Bulk data detection settings
        this.bulkDataSettings = {
            emailThreshold: 3,      // 3+ emails = bulk list
            phoneThreshold: 3,      // 3+ phones = bulk list
            ssnThreshold: 1,        // 1+ SSN = immediate block
            creditCardThreshold: 1, // 1+ CC = immediate block
            densityThreshold: 0.05  // 5% PII density threshold
        };
    }

    // Get company-specific patterns
    getCompanyPatterns() {
        return [
            ...this.company.aliases,
            ...this.company.domains.map(d => d.replace('.', '_')),
            `${this.company.name.toLowerCase().replace(/\s+/g, '_')}`
        ];
    }

    // Get confidentiality markers
    getConfidentialityMarkers() {
        return this.company.confidentialityMarkers;
    }

    // Get risk threshold for classification
    getRiskThreshold(type, level) {
        if (this.riskTolerance[type] && this.riskTolerance[type][level] !== undefined) {
            return this.riskTolerance[type][level];
        }
        return this.riskTolerance.thresholds[level] || 0;
    }

    // Get risk multiplier for destination + content combination
    getRiskMultiplier(destinationRisk, contentClassification) {
        const key = `${destinationRisk}_${contentClassification}`;
        return this.riskMultipliers[key] || 1.0;
    }

    // Check if action should be blocked based on policy
    shouldBlock(riskLevel, contentClass, destinationRisk) {
        const policies = this.riskTolerance.policies;
        
        if (riskLevel === 'CRITICAL' && policies.blockCritical) {
            return true;
        }
        
        if (riskLevel === 'HIGH' && destinationRisk === 'HIGH' && policies.blockHighToHighRisk) {
            return true;
        }
        
        if (['HIGHLY_CONFIDENTIAL', 'CONFIDENTIAL'].includes(contentClass)) {
            return true;
        }
        
        return false;
    }

    // Get detection patterns for a category
    getDetectionPatterns(category) {
        return this.detectionPatterns[category] || { keywords: [], patterns: [], score: 0 };
    }

    // Get destination risk classification
    getDestinationRisk(url) {
        if (!url) return { risk: 'UNKNOWN', category: 'Unknown Destination', score: 0 };

        const hostname = new URL(url).hostname.toLowerCase();
        
        // Check high risk destinations
        for (const [type, config] of Object.entries(this.destinationRisks.high)) {
            if (config.patterns.some(pattern => hostname.includes(pattern))) {
                return {
                    risk: 'HIGH',
                    category: config.category,
                    score: 20,
                    reason: config.reason
                };
            }
        }
        
        // Check medium risk destinations
        for (const [type, config] of Object.entries(this.destinationRisks.medium)) {
            if (config.patterns.some(pattern => hostname.includes(pattern))) {
                return {
                    risk: 'MEDIUM',
                    category: config.category,
                    score: 10,
                    reason: config.reason
                };
            }
        }
        
        // Check low risk destinations
        for (const [type, config] of Object.entries(this.destinationRisks.low)) {
            if (config.patterns.some(pattern => hostname.includes(pattern))) {
                return {
                    risk: 'LOW',
                    category: config.category,
                    score: 0,
                    reason: config.reason
                };
            }
        }
        
        // Unknown destination - default to medium risk
        return {
            risk: 'MEDIUM',
            category: 'Unknown External Service',
            score: 5,
            reason: 'Unknown destination - default to medium risk for safety'
        };
    }

    // Update configuration (for runtime customization)
    updateConfig(path, value) {
        const keys = path.split('.');
        let current = this;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    // Get current configuration as JSON
    exportConfig() {
        return {
            company: this.company,
            riskTolerance: this.riskTolerance,
            detectionPatterns: this.detectionPatterns,
            destinationRisks: this.destinationRisks,
            riskMultipliers: this.riskMultipliers,
            fileTypeRisks: this.fileTypeRisks,
            fileSizeThresholds: this.fileSizeThresholds,
            bulkDataSettings: this.bulkDataSettings
        };
    }

    // Load configuration from JSON
    importConfig(config) {
        Object.assign(this, config);
    }
}

// Create and export global configuration instance
const GlobalConfig = new VigilConfig();

// Export both the class and the singleton instance
export { VigilConfig, GlobalConfig };