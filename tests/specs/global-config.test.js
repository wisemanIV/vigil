import '../load-env.js';
import { VigilConfig, GlobalConfig } from '../../src/config/global-config.js';

describe('Global Configuration System', () => {
    let config;
    
    beforeEach(() => {
        config = new VigilConfig();
    });

    describe('Company Configuration', () => {
        test('should have default company settings', () => {
            expect(config.company.name).toBe('TechCorp Inc');
            expect(config.company.aliases).toContain('techcorp');
            expect(config.company.domains).toContain('techcorp.com');
            expect(config.company.confidentialityMarkers).toContain('confidential');
            expect(config.company.confidentialityMarkers).toContain('techcorp_confidential');
        });

        test('should generate company patterns correctly', () => {
            const patterns = config.getCompanyPatterns();
            expect(patterns).toContain('techcorp');
            expect(patterns).toContain('techcorp_com');
            expect(patterns).toContain('techcorp_inc');
        });

        test('should get confidentiality markers', () => {
            const markers = config.getConfidentialityMarkers();
            expect(markers).toContain('confidential');
            expect(markers).toContain('internal');
            expect(markers).toContain('techcorp_confidential');
            expect(markers.length).toBeGreaterThan(10);
        });
    });

    describe('Risk Tolerance Settings', () => {
        test('should have configured thresholds', () => {
            expect(config.riskTolerance.thresholds.critical).toBe(75);
            expect(config.riskTolerance.thresholds.high).toBe(50);
            expect(config.riskTolerance.thresholds.medium).toBe(25);
            expect(config.riskTolerance.thresholds.low).toBe(0);
        });

        test('should get risk thresholds correctly', () => {
            expect(config.getRiskThreshold('thresholds', 'critical')).toBe(75);
            expect(config.getRiskThreshold('contentClassification', 'highlyConfidential')).toBe(71);
            expect(config.getRiskThreshold('fileMetadata', 'high')).toBe(25);
        });

        test('should have content classification thresholds', () => {
            expect(config.riskTolerance.contentClassification.highlyConfidential).toBe(71);
            expect(config.riskTolerance.contentClassification.confidential).toBe(51);
            expect(config.riskTolerance.contentClassification.internal).toBe(31);
            expect(config.riskTolerance.contentClassification.public).toBe(0);
        });

        test('should have file metadata risk thresholds', () => {
            expect(config.riskTolerance.fileMetadata.critical).toBe(40);
            expect(config.riskTolerance.fileMetadata.high).toBe(25);
            expect(config.riskTolerance.fileMetadata.medium).toBe(15);
            expect(config.riskTolerance.fileMetadata.low).toBe(0);
        });
    });

    describe('Detection Patterns', () => {
        test('should get financial detection patterns', () => {
            const financial = config.getDetectionPatterns('financial');
            expect(financial.keywords).toContain('financial');
            expect(financial.keywords).toContain('revenue');
            expect(financial.score).toBe(20);
            expect(financial.patterns).toContain(/fy\d{2,4}/i);
        });

        test('should get strategic detection patterns', () => {
            const strategic = config.getDetectionPatterns('strategic');
            expect(strategic.keywords).toContain('strategy');
            expect(strategic.keywords).toContain('roadmap');
            expect(strategic.score).toBe(20);
        });

        test('should get customer detection patterns', () => {
            const customer = config.getDetectionPatterns('customer');
            expect(customer.keywords).toContain('customer');
            expect(customer.keywords).toContain('client');
            expect(customer.score).toBe(18);
        });

        test('should get employee detection patterns', () => {
            const employee = config.getDetectionPatterns('employee');
            expect(employee.keywords).toContain('employee');
            expect(employee.keywords).toContain('hr');
            expect(employee.score).toBe(18);
        });

        test('should return empty for unknown pattern category', () => {
            const unknown = config.getDetectionPatterns('unknown_category');
            expect(unknown.keywords).toEqual([]);
            expect(unknown.patterns).toEqual([]);
            expect(unknown.score).toBe(0);
        });
    });

    describe('Destination Risk Classification', () => {
        test('should classify high risk destinations correctly', () => {
            const highRisk = config.getDestinationRisk('https://chat.openai.com/');
            expect(highRisk.risk).toBe('HIGH');
            expect(highRisk.category).toBe('AI/LLM Platforms');
            expect(highRisk.score).toBe(20);
        });

        test('should classify medium risk destinations correctly', () => {
            const mediumRisk = config.getDestinationRisk('https://slack.com/');
            expect(mediumRisk.risk).toBe('MEDIUM');
            expect(mediumRisk.category).toBe('Business Productivity');
            expect(mediumRisk.score).toBe(10);
        });

        test('should classify low risk destinations correctly', () => {
            const lowRisk = config.getDestinationRisk('https://company.sharepoint.com/');
            expect(lowRisk.risk).toBe('LOW');
            expect(lowRisk.category).toBe('Enterprise Productivity');
            expect(lowRisk.score).toBe(0);
        });

        test('should classify unknown destinations as medium risk', () => {
            const unknownRisk = config.getDestinationRisk('https://unknown-service.example.com/');
            expect(unknownRisk.risk).toBe('MEDIUM');
            expect(unknownRisk.category).toBe('Unknown External Service');
            expect(unknownRisk.score).toBe(5);
        });
    });

    describe('Risk Multipliers', () => {
        test('should get risk multipliers correctly', () => {
            expect(config.getRiskMultiplier('HIGH', 'HIGHLY_CONFIDENTIAL')).toBe(2.0);
            expect(config.getRiskMultiplier('HIGH', 'CONFIDENTIAL')).toBe(1.8);
            expect(config.getRiskMultiplier('HIGH', 'INTERNAL')).toBe(1.5);
            expect(config.getRiskMultiplier('HIGH', 'PUBLIC')).toBe(1.2);
            
            expect(config.getRiskMultiplier('MEDIUM', 'CONFIDENTIAL')).toBe(1.2);
            expect(config.getRiskMultiplier('LOW', 'CONFIDENTIAL')).toBe(1.0);
            
            // Test fallback for unknown combinations
            expect(config.getRiskMultiplier('UNKNOWN', 'UNKNOWN')).toBe(1.0);
        });
    });

    describe('Policy Decisions', () => {
        test('should make blocking decisions based on policy', () => {
            // Critical risk should be blocked
            expect(config.shouldBlock('CRITICAL', 'CONFIDENTIAL', 'HIGH')).toBe(true);
            
            // High risk + high destination should be blocked
            expect(config.shouldBlock('HIGH', 'INTERNAL', 'HIGH')).toBe(true);
            
            // Highly confidential should be blocked regardless
            expect(config.shouldBlock('MEDIUM', 'HIGHLY_CONFIDENTIAL', 'LOW')).toBe(true);
            
            // Confidential should be blocked regardless
            expect(config.shouldBlock('MEDIUM', 'CONFIDENTIAL', 'LOW')).toBe(true);
            
            // Medium risk + medium destination should not be blocked
            expect(config.shouldBlock('MEDIUM', 'INTERNAL', 'MEDIUM')).toBe(false);
        });
    });

    describe('Bulk Data Settings', () => {
        test('should have bulk data thresholds configured', () => {
            expect(config.bulkDataSettings.emailThreshold).toBe(3);
            expect(config.bulkDataSettings.phoneThreshold).toBe(3);
            expect(config.bulkDataSettings.ssnThreshold).toBe(1);
            expect(config.bulkDataSettings.creditCardThreshold).toBe(1);
            expect(config.bulkDataSettings.densityThreshold).toBe(0.05);
        });
    });

    describe('File Type Risks', () => {
        test('should have file type configurations', () => {
            expect(config.fileTypeRisks.financial.score).toBe(15);
            expect(config.fileTypeRisks.financial.extensions).toContain('.xlsx');
            expect(config.fileTypeRisks.databases.score).toBe(20);
            expect(config.fileTypeRisks.presentations.score).toBe(12);
        });
    });

    describe('Configuration Updates', () => {
        test('should update configuration values', () => {
            config.updateConfig('company.name', 'Updated Corp');
            expect(config.company.name).toBe('Updated Corp');
            
            config.updateConfig('riskTolerance.thresholds.critical', 80);
            expect(config.riskTolerance.thresholds.critical).toBe(80);
        });

        test('should export and import configuration', () => {
            const exported = config.exportConfig();
            expect(exported.company.name).toBe('TechCorp Inc');
            expect(exported.riskTolerance.thresholds.critical).toBe(75);
            
            const newConfig = new VigilConfig();
            exported.company.name = 'New Company';
            newConfig.importConfig(exported);
            expect(newConfig.company.name).toBe('New Company');
        });
    });

    describe('Global Configuration Instance', () => {
        test('should have global configuration instance available', () => {
            expect(GlobalConfig).toBeDefined();
            expect(GlobalConfig.company.name).toBe('TechCorp Inc');
            expect(GlobalConfig.getCompanyPatterns()).toContain('techcorp');
        });

        test('should be same instance across imports', () => {
            expect(GlobalConfig).toBe(GlobalConfig);
            expect(GlobalConfig.company.name).toBe('TechCorp Inc');
        });
    });
});