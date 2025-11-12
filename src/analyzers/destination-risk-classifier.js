import { GlobalConfig } from '../config/global-config.js';

/**
 * Destination Risk Classifier
 * Classifies websites/services as high, medium, or low risk for data sharing
 * Uses global configuration for destination risk patterns
 */
export class DestinationRiskClassifier {
    constructor() {
        this.config = GlobalConfig;
    }

    initializeDestinationPatterns() {
        // High Risk Destinations (Public/Consumer Services)
        this.highRiskDestinations = {
            consumerEmail: {
                patterns: [
                    /gmail\.com/i,
                    /yahoo\.com/i,
                    /hotmail\.com/i,
                    /outlook\.com/i,
                    /aol\.com/i,
                    /icloud\.com/i,
                    /mail\.ru/i,
                    /protonmail\.com/i
                ],
                category: 'Consumer Email',
                risk: 'HIGH',
                reason: 'Consumer email services lack enterprise security controls and data governance'
            },
            aiPlatforms: {
                patterns: [
                    /chat\.openai\.com/i,
                    /claude\.ai/i,
                    /bard\.google\.com/i,
                    /character\.ai/i,
                    /huggingface\.co/i,
                    /replicate\.com/i,
                    /cohere\.ai/i,
                    /anthropic\.com\/claude/i,
                    /poe\.com/i,
                    /writesonic\.com/i,
                    /jasper\.ai/i,
                    /copy\.ai/i
                ],
                category: 'AI/LLM Platforms',
                risk: 'HIGH',
                reason: 'AI platforms may train on user inputs, creating IP and confidentiality risks'
            },
            socialMedia: {
                patterns: [
                    /facebook\.com/i,
                    /twitter\.com/i,
                    /x\.com/i,
                    /linkedin\.com/i,
                    /instagram\.com/i,
                    /tiktok\.com/i,
                    /snapchat\.com/i,
                    /reddit\.com/i,
                    /discord\.gg/i,
                    /discord\.com/i,
                    /telegram\.org/i,
                    /whatsapp\.com/i,
                    /pinterest\.com/i
                ],
                category: 'Social Media',
                risk: 'HIGH',
                reason: 'Social platforms are designed for public sharing and lack business data controls'
            },
            publicCloudStorage: {
                patterns: [
                    /drive\.google\.com/i,
                    /dropbox\.com/i,
                    /onedrive\.live\.com/i,
                    /icloud\.com\/iclouddrive/i,
                    /mega\.nz/i,
                    /mediafire\.com/i,
                    /4shared\.com/i,
                    /box\.com/i // Consumer version
                ],
                category: 'Consumer Cloud Storage',
                risk: 'HIGH',
                reason: 'Consumer cloud storage lacks enterprise data loss prevention and compliance features'
            },
            codeRepositories: {
                patterns: [
                    /github\.com/i,
                    /gitlab\.com/i,
                    /bitbucket\.org/i,
                    /sourceforge\.net/i,
                    /codeberg\.org/i,
                    /gitea\.com/i
                ],
                category: 'Public Code Repositories',
                risk: 'HIGH',
                reason: 'Public repositories expose code and data to the internet permanently'
            },
            pasteServices: {
                patterns: [
                    /pastebin\.com/i,
                    /paste\.ee/i,
                    /hastebin\.com/i,
                    /dpaste\.org/i,
                    /gist\.github\.com/i,
                    /justpaste\.it/i,
                    /ideone\.com/i
                ],
                category: 'Paste/Sharing Services',
                risk: 'HIGH',
                reason: 'Paste services often make content publicly searchable and indexable'
            },
            personalProductivity: {
                patterns: [
                    /notion\.so/i,
                    /evernote\.com/i,
                    /onenote\.com/i,
                    /todoist\.com/i,
                    /trello\.com/i,
                    /airtable\.com/i // Personal plans
                ],
                category: 'Personal Productivity Tools',
                risk: 'HIGH',
                reason: 'Personal accounts lack enterprise security and data governance policies'
            }
        };

        // Medium Risk Destinations (Business Tools, may have enterprise features)
        this.mediumRiskDestinations = {
            businessProductivity: {
                patterns: [
                    /workspace\.google\.com/i,
                    /teams\.microsoft\.com/i,
                    /slack\.com/i, // Could be enterprise
                    /zoom\.us/i,
                    /webex\.com/i,
                    /gotomeeting\.com/i,
                    /asana\.com/i,
                    /monday\.com/i,
                    /clickup\.com/i,
                    /basecamp\.com/i
                ],
                category: 'Business Productivity',
                risk: 'MEDIUM',
                reason: 'Business tools may have enterprise features but configuration varies'
            },
            cloudDevelopment: {
                patterns: [
                    /replit\.com/i,
                    /codesandbox\.io/i,
                    /codepen\.io/i,
                    /jsfiddle\.net/i,
                    /stackblitz\.com/i,
                    /glitch\.com/i,
                    /heroku\.com/i,
                    /vercel\.com/i,
                    /netlify\.com/i
                ],
                category: 'Development Platforms',
                risk: 'MEDIUM',
                reason: 'Development platforms may expose code publicly by default'
            },
            designTools: {
                patterns: [
                    /figma\.com/i,
                    /sketch\.com/i,
                    /canva\.com/i,
                    /miro\.com/i,
                    /lucidchart\.com/i,
                    /draw\.io/i,
                    /whimsical\.com/i
                ],
                category: 'Design/Collaboration Tools',
                risk: 'MEDIUM',
                reason: 'Design tools often default to public/shared visibility'
            },
            analyticsTools: {
                patterns: [
                    /analytics\.google\.com/i,
                    /tableau\.com/i,
                    /powerbi\.microsoft\.com/i,
                    /datastudio\.google\.com/i,
                    /metabase\.com/i,
                    /grafana\.com/i
                ],
                category: 'Analytics Platforms',
                risk: 'MEDIUM',
                reason: 'Analytics tools handle sensitive business data but may lack granular controls'
            },
            marketingTools: {
                patterns: [
                    /mailchimp\.com/i,
                    /hubspot\.com/i,
                    /salesforce\.com/i,
                    /marketo\.com/i,
                    /pardot\.com/i,
                    /constantcontact\.com/i
                ],
                category: 'Marketing/CRM Tools',
                risk: 'MEDIUM',
                reason: 'Marketing tools handle customer data but may have varying security controls'
            }
        };

        // Low Risk Destinations (Enterprise/Corporate Services)
        this.lowRiskDestinations = {
            enterpriseEmail: {
                patterns: [
                    /mail\.google\.com.*\/a\/[^\/]+/i, // Google Workspace
                    /outlook\.office365\.com/i,
                    /outlook\.office\.com/i,
                    /mail\.protonmail\.com.*business/i,
                    /fastmail\.com.*business/i
                ],
                category: 'Enterprise Email',
                risk: 'LOW',
                reason: 'Enterprise email services have proper security controls and compliance'
            },
            enterpriseProductivity: {
                patterns: [
                    /[^\/]*\.sharepoint\.com/i,
                    /[^\/]*\.slack\.com/i, // Workspace-specific Slack
                    /app\.slack\.com\/client/i,
                    /[^\/]*\.monday\.com/i,
                    /[^\/]*\.asana\.com/i,
                    /[^\/]*\.notion\.so/i // Team workspaces
                ],
                category: 'Enterprise Productivity',
                risk: 'LOW',
                reason: 'Enterprise configurations typically include proper access controls'
            },
            corporateIntranets: {
                patterns: [
                    /intranet\./i,
                    /internal\./i,
                    /corp\./i,
                    /employee\./i,
                    /staff\./i,
                    /sharepoint\./i,
                    /confluence\./i,
                    /jira\./i,
                    /gitlab-ce\./i, // Self-hosted
                    /github\.com\/[^\/]+\/[^\/]+/i // Private repos
                ],
                category: 'Corporate Intranets',
                risk: 'LOW',
                reason: 'Internal corporate systems have enterprise security and access controls'
            },
            enterpriseCloud: {
                patterns: [
                    /[^\/]*\.box\.com/i, // Enterprise Box
                    /console\.aws\.amazon\.com/i,
                    /portal\.azure\.com/i,
                    /console\.cloud\.google\.com/i,
                    /app\.snowflake\.com/i,
                    /[^\/]*\.salesforce\.com/i,
                    /[^\/]*\.workday\.com/i
                ],
                category: 'Enterprise Cloud Services',
                risk: 'LOW',
                reason: 'Enterprise cloud services include compliance and data governance features'
            },
            aiEnterprise: {
                patterns: [
                    /chat\.openai\.com.*\/team/i,
                    /claude\.ai.*\/team/i,
                    /bard\.google\.com.*workspace/i,
                    /api\.openai\.com/i, // API usage
                    /api\.anthropic\.com/i
                ],
                category: 'Enterprise AI Services',
                risk: 'LOW',
                reason: 'Enterprise AI subscriptions include data privacy and retention controls'
            }
        };
    }

    /**
     * Classify destination risk based on URL using global configuration
     * @param {string} url - The destination URL
     * @returns {Object} Risk classification with details
     */
    classifyDestination(url) {
        return this.config.getDestinationRisk(url);
    }

    /**
     * Check if URL matches any of the given patterns
     * @param {string} url - URL to check
     * @param {RegExp[]} patterns - Array of regex patterns
     * @returns {boolean} True if URL matches any pattern
     */
    matchesPatterns(url, patterns) {
        return patterns.some(pattern => pattern.test(url));
    }

    /**
     * Get destination risk score for content classification
     * @param {string} url - Destination URL
     * @returns {Object} Destination risk analysis
     */
    analyzeDestination(url) {
        const classification = this.classifyDestination(url);
        
        return {
            type: 'destination_risk',
            risk: classification.risk,
            category: classification.category,
            score: classification.score,
            maxScore: 20,
            reason: classification.reason,
            destinationType: classification.destinationType || 'unknown',
            url: this.sanitizeUrl(url),
            source: 'destination_risk_analysis'
        };
    }

    /**
     * Sanitize URL for logging (remove sensitive params)
     * @param {string} url - Original URL
     * @returns {string} Sanitized URL
     */
    sanitizeUrl(url) {
        if (!url) return 'unknown';
        
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
        } catch (error) {
            // If URL parsing fails, just return the domain part
            const domainMatch = url.match(/https?:\/\/([^\/\?\#]+)/i);
            return domainMatch ? domainMatch[1] : 'unknown';
        }
    }

    /**
     * Get risk multiplier based on destination and content classification using global config
     * @param {string} destinationRisk - HIGH/MEDIUM/LOW
     * @param {string} contentClassification - HIGHLY CONFIDENTIAL/CONFIDENTIAL/INTERNAL/PUBLIC
     * @returns {number} Risk multiplier (1.0 = no change, >1.0 = increase risk)
     */
    getRiskMultiplier(destinationRisk, contentClassification) {
        return this.config.getRiskMultiplier(destinationRisk, contentClassification);
    }
}