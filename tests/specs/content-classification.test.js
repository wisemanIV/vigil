import '../load-env.js';
import { ContentClassificationDetector } from '../../src/analyzers/content-classification-detector.js';
import { testDatasets } from '../test-data/dataset.js';

describe('Content Classification System', () => {
    let detector;
    
    beforeEach(() => {
        detector = new ContentClassificationDetector();
    });

    describe('Classification Levels', () => {
        test('should classify HIGHLY CONFIDENTIAL content (71-100 points)', () => {
            const dataset = testDatasets.blocked.highlyConfidential;
            const result = detector.analyze(dataset.content);
            
            expect(result.classification).toBe('HIGHLY CONFIDENTIAL');
            expect(result.totalScore).toBeGreaterThanOrEqual(71);
            expect(result.totalScore).toBeLessThanOrEqual(100);
            expect(result.severity).toBe('critical');
            expect(result.recommendation).toContain('Restricted access');
        });

        test('should classify CONFIDENTIAL content (51-70 points)', () => {
            const dataset = testDatasets.blocked.confidential;
            const result = detector.analyze(dataset.content);
            
            expect(result.classification).toBe('CONFIDENTIAL');
            expect(result.totalScore).toBeGreaterThanOrEqual(51);
            expect(result.totalScore).toBeLessThanOrEqual(70);
            expect(result.severity).toBe('high');
            expect(result.recommendation).toContain('Limited distribution');
        });

        test('should classify INTERNAL content (31-50 points)', () => {
            const dataset = testDatasets.blocked.internal;
            const result = detector.analyze(dataset.content);
            
            expect(result.classification).toBe('INTERNAL');
            expect(result.totalScore).toBeGreaterThanOrEqual(31);
            expect(result.totalScore).toBeLessThanOrEqual(50);
            expect(result.severity).toBe('medium');
            expect(result.recommendation).toContain('Company-wide only');
        });

        test('should classify PUBLIC content (0-30 points)', () => {
            const dataset = testDatasets.blocked.public;
            const result = detector.analyze(dataset.content);
            
            expect(result.classification).toBe('PUBLIC');
            expect(result.totalScore).toBeGreaterThanOrEqual(0);
            expect(result.totalScore).toBeLessThanOrEqual(30);
            expect(result.severity).toBe('low');
            expect(result.recommendation).toContain('Safe to share');
        });
    });

    describe('Content Sensitivity Scoring (0-30 points)', () => {
        test('should detect high-risk financial data (30 points)', () => {
            const content = `Revenue: $12.5M with 42% profit margins
            Q4 forecast: $15M revenue growth
            Financial statements show strong performance`;
            
            const result = detector.analyze(content);
            const sensitivityScore = result.scoreBreakdown.contentSensitivity;
            
            expect(sensitivityScore.score).toBe(30);
            expect(sensitivityScore.findings).toHaveLength(1);
            expect(sensitivityScore.findings[0].type).toBe('financial');
        });

        test('should detect high-risk customer data (30 points)', () => {
            const content = `Customer list with usage data:
            Enterprise Corp - 500K active users
            Customer contact information database
            Churn analysis for top accounts`;
            
            const result = detector.analyze(content);
            const sensitivityScore = result.scoreBreakdown.contentSensitivity;
            
            expect(sensitivityScore.score).toBe(30);
            expect(sensitivityScore.findings[0].type).toBe('customerData');
        });

        test('should detect unreleased product information (30 points)', () => {
            const content = `Unreleased features for Q1 2025:
            Alpha version of new AI engine
            Beta release scheduled for next month
            Product roadmap includes secret features`;
            
            const result = detector.analyze(content);
            const sensitivityScore = result.scoreBreakdown.contentSensitivity;
            
            expect(sensitivityScore.score).toBe(30);
            expect(sensitivityScore.findings[0].type).toBe('unreleased');
        });

        test('should detect trade secrets (30 points)', () => {
            const content = `Our proprietary algorithm gives us competitive advantage
            Trade secret methodology for data processing
            Patent pending on machine learning secret sauce`;
            
            const result = detector.analyze(content);
            const sensitivityScore = result.scoreBreakdown.contentSensitivity;
            
            expect(sensitivityScore.score).toBe(30);
            expect(sensitivityScore.findings[0].type).toBe('tradeSecrets');
        });

        test('should detect M&A and strategic content (30 points)', () => {
            const content = `M&A discussion: acquiring TechCorp for $50M
            Competitive strategy against market leaders
            Strategic plan for market entry`;
            
            const result = detector.analyze(content);
            const sensitivityScore = result.scoreBreakdown.contentSensitivity;
            
            expect(sensitivityScore.score).toBe(30);
            expect(sensitivityScore.findings[0].type).toBe('strategy');
        });
    });

    describe('Identifier Presence Scoring (0-25 points)', () => {
        test('should detect customer names (10 points)', () => {
            const content = `Customer: Enterprise Solutions Inc
            Client: TechStart LLC requesting access
            Account: Global Corp partnership`;
            
            const result = detector.analyze(content);
            const identifierScore = result.scoreBreakdown.identifierPresence;
            
            expect(identifierScore.score).toBe(10);
            expect(identifierScore.findings[0].type).toBe('customerNames');
        });

        test('should detect employee PII (15 points)', () => {
            const content = `Employee SSN: 123-45-6789
            Address: 123 Main Street, Anytown
            Medical information for health insurance`;
            
            const result = detector.analyze(content);
            const identifierScore = result.scoreBreakdown.identifierPresence;
            
            expect(identifierScore.score).toBe(15);
            expect(identifierScore.findings[0].type).toBe('employeePII');
        });

        test('should detect project codes (5 points)', () => {
            const content = `Project Alpha is progressing well
            Codename: Phoenix for new initiative
            Operation Stealth launching next quarter`;
            
            const result = detector.analyze(content);
            const identifierScore = result.scoreBreakdown.identifierPresence;
            
            expect(identifierScore.score).toBe(5);
            expect(identifierScore.findings[0].type).toBe('projectCodes');
        });

        test('should detect confidential markings (10 points)', () => {
            const content = `CONFIDENTIAL - Internal document
            DO NOT DISTRIBUTE outside team
            RESTRICTED access required`;
            
            const result = detector.analyze(content);
            const identifierScore = result.scoreBreakdown.identifierPresence;
            
            expect(identifierScore.score).toBe(10);
            expect(identifierScore.findings[0].type).toBe('confidentialMarkings');
        });

        test('should detect credentials (15 points)', () => {
            const content = `API key: AKIA1234567890ABCDEF
            Database password: secret123
            Access token for production system`;
            
            const result = detector.analyze(content);
            const identifierScore = result.scoreBreakdown.identifierPresence;
            
            expect(identifierScore.score).toBe(15);
            expect(identifierScore.findings[0].type).toBe('credentials');
        });
    });

    describe('Temporal Sensitivity Scoring (0-20 points)', () => {
        test('should detect future releases (20 points)', () => {
            const content = `Launching in 2025 with new features
            Upcoming product release next year
            Scheduled for Q2 2025 rollout`;
            
            const result = detector.analyze(content);
            const temporalScore = result.scoreBreakdown.temporalSensitivity;
            
            expect(temporalScore.score).toBe(20);
            expect(temporalScore.findings[0].type).toBe('futureReleases');
        });

        test('should detect current quarter content (15 points)', () => {
            const content = `Q4 2024 deliverables include new features
            This quarter we're focusing on performance
            By end of current quarter launch is expected`;
            
            const result = detector.analyze(content);
            const temporalScore = result.scoreBreakdown.temporalSensitivity;
            
            expect(temporalScore.score).toBe(15);
            expect(temporalScore.findings[0].type).toBe('currentQuarter');
        });

        test('should detect current year content (10 points)', () => {
            const content = `2024 annual planning session
            This year's budget allocation
            By year end we expect completion`;
            
            const result = detector.analyze(content);
            const temporalScore = result.scoreBreakdown.temporalSensitivity;
            
            expect(temporalScore.score).toBe(10);
            expect(temporalScore.findings[0].type).toBe('currentYear');
        });
    });

    describe('Competitive Impact Scoring (0-15 points)', () => {
        test('should detect direct competitive advantage (15 points)', () => {
            const content = `Our competitive advantage comes from proprietary algorithms
            Secret sauce that differentiates us from competitors
            Unique approach gives us market positioning edge`;
            
            const result = detector.analyze(content);
            const competitiveScore = result.scoreBreakdown.competitiveImpact;
            
            expect(competitiveScore.score).toBe(15);
            expect(competitiveScore.findings[0].type).toBe('directAdvantage');
        });

        test('should detect strategic positioning (10 points)', () => {
            const content = `Market strategy for competitive positioning
            Our market approach differs from competitors
            Strategic positioning in enterprise segment`;
            
            const result = detector.analyze(content);
            const competitiveScore = result.scoreBreakdown.competitiveImpact;
            
            expect(competitiveScore.score).toBe(10);
            expect(competitiveScore.findings[0].type).toBe('strategicPositioning');
        });
    });

    describe('Legal/Regulatory Risk Scoring (0-10 points)', () => {
        test('should detect GDPR privacy risk (10 points)', () => {
            const content = `Personal data processing for EU customers
            GDPR compliance review needed
            Privacy violation concerns with data handling`;
            
            const result = detector.analyze(content);
            const legalScore = result.scoreBreakdown.legalRisk;
            
            expect(legalScore.score).toBe(10);
            expect(legalScore.findings[0].type).toBe('gdpr');
        });

        test('should detect financial compliance risk (10 points)', () => {
            const content = `SOX compliance for financial reporting
            Earnings disclosure requirements
            Financial reporting standards must be met`;
            
            const result = detector.analyze(content);
            const legalScore = result.scoreBreakdown.legalRisk;
            
            expect(legalScore.score).toBe(10);
            expect(legalScore.findings[0].type).toBe('financial');
        });

        test('should detect NDA/contract risk (8 points)', () => {
            const content = `NDA violation if disclosed externally
            Non-disclosure agreement covers this information
            Confidentiality agreement prohibits sharing`;
            
            const result = detector.analyze(content);
            const legalScore = result.scoreBreakdown.legalRisk;
            
            expect(legalScore.score).toBe(8);
            expect(legalScore.findings[0].type).toBe('contractual');
        });

        test('should detect export control risk (10 points)', () => {
            const content = `ITAR controlled technology information
            Export control restrictions apply
            EAR regulated technical specifications`;
            
            const result = detector.analyze(content);
            const legalScore = result.scoreBreakdown.legalRisk;
            
            expect(legalScore.score).toBe(10);
            expect(legalScore.findings[0].type).toBe('export');
        });
    });

    describe('Comprehensive Scoring', () => {
        test('should accumulate multiple scoring categories correctly', () => {
            const content = `CONFIDENTIAL - Q4 2025 Financial Forecast
            
            Revenue projection: $50M (proprietary methodology)
            Customer: Enterprise Corp (Fortune 500 account)
            API key: AKIA1234567890ABCDEF
            Competitive advantage through trade secrets
            GDPR compliance required for EU data`;
            
            const result = detector.analyze(content);
            
            // Should score high across multiple categories
            expect(result.totalScore).toBeGreaterThan(70);
            expect(result.classification).toBe('HIGHLY CONFIDENTIAL');
            
            // Verify individual scores contribute
            expect(result.scoreBreakdown.contentSensitivity.score).toBeGreaterThan(0);
            expect(result.scoreBreakdown.identifierPresence.score).toBeGreaterThan(0);
            expect(result.scoreBreakdown.temporalSensitivity.score).toBeGreaterThan(0);
            expect(result.scoreBreakdown.competitiveImpact.score).toBeGreaterThan(0);
            expect(result.scoreBreakdown.legalRisk.score).toBeGreaterThan(0);
        });

        test('should handle normal business content with low scores', () => {
            const content = `Team meeting notes from yesterday
            Discussed general project updates
            Next sprint planning session scheduled
            Code review feedback shared with team`;
            
            const result = detector.analyze(content);
            
            expect(result.totalScore).toBeLessThan(31);
            expect(result.classification).toBe('PUBLIC');
            expect(result.severity).toBe('low');
        });
    });
});