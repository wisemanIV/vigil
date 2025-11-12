import '../load-env.js';
import { DestinationRiskClassifier } from '../../src/analyzers/destination-risk-classifier.js';
import { ContentClassificationDetector } from '../../src/analyzers/content-classification-detector.js';

describe('Destination Risk Classification', () => {
    let classifier;
    let contentDetector;
    
    beforeEach(() => {
        classifier = new DestinationRiskClassifier();
        contentDetector = new ContentClassificationDetector();
    });

    describe('High Risk Destinations', () => {
        test('should classify consumer email services as HIGH risk', () => {
            const urls = [
                'https://mail.google.com/mail/',
                'https://outlook.live.com/',
                'https://mail.yahoo.com/',
                'https://icloud.com/mail'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('HIGH');
                expect(result.category).toBe('Consumer Email');
                expect(result.score).toBe(20);
            });
        });

        test('should classify AI platforms as HIGH risk', () => {
            const urls = [
                'https://chat.openai.com/',
                'https://claude.ai/',
                'https://bard.google.com/',
                'https://character.ai/',
                'https://huggingface.co/chat'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('HIGH');
                expect(result.category).toBe('AI/LLM Platforms');
                expect(result.score).toBe(20);
                expect(result.reason).toContain('train on user inputs');
            });
        });

        test('should classify social media as HIGH risk', () => {
            const urls = [
                'https://facebook.com/',
                'https://twitter.com/',
                'https://linkedin.com/',
                'https://discord.com/',
                'https://reddit.com/'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('HIGH');
                expect(result.category).toBe('Social Media');
                expect(result.score).toBe(20);
            });
        });

        test('should classify consumer cloud storage as HIGH risk', () => {
            const urls = [
                'https://drive.google.com/',
                'https://dropbox.com/',
                'https://onedrive.live.com/',
                'https://mega.nz/'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('HIGH');
                expect(result.category).toBe('Consumer Cloud Storage');
                expect(result.score).toBe(20);
            });
        });

        test('should classify public code repositories as HIGH risk', () => {
            const urls = [
                'https://github.com/',
                'https://gitlab.com/',
                'https://bitbucket.org/',
                'https://sourceforge.net/'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('HIGH');
                expect(result.category).toBe('Public Code Repositories');
                expect(result.score).toBe(20);
                expect(result.reason).toContain('expose code and data to the internet');
            });
        });

        test('should classify paste services as HIGH risk', () => {
            const urls = [
                'https://pastebin.com/',
                'https://paste.ee/',
                'https://gist.github.com/',
                'https://hastebin.com/'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('HIGH');
                expect(result.category).toBe('Paste/Sharing Services');
                expect(result.score).toBe(20);
                expect(result.reason).toContain('publicly searchable');
            });
        });
    });

    describe('Medium Risk Destinations', () => {
        test('should classify business productivity tools as MEDIUM risk', () => {
            const urls = [
                'https://workspace.google.com/',
                'https://teams.microsoft.com/',
                'https://slack.com/',
                'https://zoom.us/',
                'https://asana.com/'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('MEDIUM');
                expect(result.category).toBe('Business Productivity');
                expect(result.score).toBe(10);
            });
        });

        test('should classify development platforms as MEDIUM risk', () => {
            const urls = [
                'https://replit.com/',
                'https://codesandbox.io/',
                'https://codepen.io/',
                'https://stackblitz.com/'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('MEDIUM');
                expect(result.category).toBe('Development Platforms');
                expect(result.score).toBe(10);
                expect(result.reason).toContain('expose code publicly by default');
            });
        });

        test('should classify design tools as MEDIUM risk', () => {
            const urls = [
                'https://figma.com/',
                'https://canva.com/',
                'https://miro.com/',
                'https://lucidchart.com/'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('MEDIUM');
                expect(result.category).toBe('Design/Collaboration Tools');
                expect(result.score).toBe(10);
            });
        });
    });

    describe('Low Risk Destinations', () => {
        test('should classify enterprise email as LOW risk', () => {
            const urls = [
                'https://mail.google.com/mail/a/company.com',
                'https://outlook.office365.com/',
                'https://outlook.office.com/'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('LOW');
                expect(result.category).toBe('Enterprise Email');
                expect(result.score).toBe(0);
            });
        });

        test('should classify enterprise productivity as LOW risk', () => {
            const urls = [
                'https://company.sharepoint.com/',
                'https://company.slack.com/',
                'https://app.slack.com/client/',
                'https://team.notion.so/'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('LOW');
                expect(result.category).toBe('Enterprise Productivity');
                expect(result.score).toBe(0);
            });
        });

        test('should classify corporate intranets as LOW risk', () => {
            const urls = [
                'https://intranet.company.com/',
                'https://internal.corp.com/',
                'https://confluence.company.com/',
                'https://jira.company.com/'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('LOW');
                expect(result.category).toBe('Corporate Intranets');
                expect(result.score).toBe(0);
            });
        });

        test('should classify enterprise cloud services as LOW risk', () => {
            const urls = [
                'https://console.aws.amazon.com/',
                'https://portal.azure.com/',
                'https://console.cloud.google.com/',
                'https://company.salesforce.com/'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('LOW');
                expect(result.category).toBe('Enterprise Cloud Services');
                expect(result.score).toBe(0);
            });
        });

        test('should classify enterprise AI services as LOW risk', () => {
            const urls = [
                'https://chat.openai.com/team/',
                'https://claude.ai/team/',
                'https://api.openai.com/',
                'https://api.anthropic.com/'
            ];
            
            urls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('LOW');
                expect(result.category).toBe('Enterprise AI Services');
                expect(result.score).toBe(0);
            });
        });
    });

    describe('Risk Multipliers', () => {
        test('should apply correct risk multipliers for different combinations', () => {
            // HIGHLY CONFIDENTIAL + HIGH risk destination = 2.0x multiplier
            expect(classifier.getRiskMultiplier('HIGH', 'HIGHLY CONFIDENTIAL')).toBe(2.0);
            
            // CONFIDENTIAL + HIGH risk destination = 1.8x multiplier
            expect(classifier.getRiskMultiplier('HIGH', 'CONFIDENTIAL')).toBe(1.8);
            
            // INTERNAL + HIGH risk destination = 1.5x multiplier
            expect(classifier.getRiskMultiplier('HIGH', 'INTERNAL')).toBe(1.5);
            
            // PUBLIC + HIGH risk destination = 1.2x multiplier
            expect(classifier.getRiskMultiplier('HIGH', 'PUBLIC')).toBe(1.2);
            
            // HIGHLY CONFIDENTIAL + LOW risk destination = 1.1x multiplier
            expect(classifier.getRiskMultiplier('LOW', 'HIGHLY CONFIDENTIAL')).toBe(1.1);
            
            // CONFIDENTIAL + LOW risk destination = 1.0x (no change)
            expect(classifier.getRiskMultiplier('LOW', 'CONFIDENTIAL')).toBe(1.0);
        });
    });

    describe('URL Sanitization', () => {
        test('should sanitize URLs for logging', () => {
            const urls = [
                { 
                    input: 'https://chat.openai.com/c/abc123?model=gpt-4', 
                    expected: 'https://chat.openai.com/c/abc123' 
                },
                { 
                    input: 'https://gmail.com/mail?token=secret#inbox', 
                    expected: 'https://gmail.com/mail' 
                },
                { 
                    input: 'https://company.slack.com/messages?channel=secret', 
                    expected: 'https://company.slack.com/messages' 
                }
            ];
            
            urls.forEach(({ input, expected }) => {
                const sanitized = classifier.sanitizeUrl(input);
                expect(sanitized).toBe(expected);
            });
        });

        test('should handle invalid URLs gracefully', () => {
            const invalidUrls = [
                'not-a-url',
                'ftp://example.com',
                'javascript:alert(1)'
            ];
            
            invalidUrls.forEach(url => {
                const sanitized = classifier.sanitizeUrl(url);
                expect(sanitized).toBeDefined();
                expect(typeof sanitized).toBe('string');
            });
        });
    });

    describe('Integration with Content Classification', () => {
        test('should adjust classification based on destination risk - HIGH risk scenario', () => {
            const content = `CONFIDENTIAL - Financial Data
            Q4 Revenue: $12.5M with 35% profit margins`;
            
            const context = { url: 'https://chat.openai.com/' };
            const result = contentDetector.analyze(content, context);
            
            expect(result.destination.risk).toBe('HIGH');
            expect(result.destination.category).toBe('AI/LLM Platforms');
            expect(result.riskMultiplier).toBe(1.8); // CONFIDENTIAL + HIGH risk
            expect(result.adjustedScore).toBeGreaterThan(result.baseScore);
            expect(result.recommendation).toContain('HIGH RISK DESTINATION');
        });

        test('should adjust classification based on destination risk - LOW risk scenario', () => {
            const content = `CONFIDENTIAL - Financial Data
            Q4 Revenue: $12.5M with 35% profit margins`;
            
            const context = { url: 'https://company.sharepoint.com/' };
            const result = contentDetector.analyze(content, context);
            
            expect(result.destination.risk).toBe('LOW');
            expect(result.destination.category).toBe('Enterprise Productivity');
            expect(result.riskMultiplier).toBe(1.0); // CONFIDENTIAL + LOW risk
            expect(result.adjustedScore).toBe(result.baseScore);
            expect(result.recommendation).toContain('LOW RISK DESTINATION');
        });

        test('should escalate INTERNAL content to blocked when destination is HIGH risk', () => {
            const content = `Internal process documentation
            Customer analytics showing engagement patterns`;
            
            // Same content, different destinations
            const highRiskContext = { url: 'https://chat.openai.com/' };
            const lowRiskContext = { url: 'https://company.slack.com/' };
            
            const highRiskResult = contentDetector.analyze(content, highRiskContext);
            const lowRiskResult = contentDetector.analyze(content, lowRiskContext);
            
            // High risk destination should escalate the score significantly
            expect(highRiskResult.destination.risk).toBe('HIGH');
            expect(highRiskResult.adjustedScore).toBeGreaterThan(lowRiskResult.adjustedScore);
            
            // Low risk destination should not escalate much
            expect(lowRiskResult.destination.risk).toBe('LOW');
        });

        test('should provide appropriate recommendations based on destination', () => {
            const content = `Strategic plan for Q4 2024`;
            
            const contexts = [
                { url: 'https://gmail.com/', expectedRisk: 'HIGH' },
                { url: 'https://slack.com/', expectedRisk: 'MEDIUM' },
                { url: 'https://company.sharepoint.com/', expectedRisk: 'LOW' }
            ];
            
            contexts.forEach(({ url, expectedRisk }) => {
                const result = contentDetector.analyze(content, { url });
                expect(result.destination.risk).toBe(expectedRisk);
                expect(result.recommendation).toContain(`${expectedRisk} RISK DESTINATION`);
            });
        });
    });

    describe('Unknown Destinations', () => {
        test('should classify unknown destinations as MEDIUM risk', () => {
            const unknownUrls = [
                'https://unknown-service.com/',
                'https://new-startup.io/',
                'https://random-domain.xyz/'
            ];
            
            unknownUrls.forEach(url => {
                const result = classifier.classifyDestination(url);
                expect(result.risk).toBe('MEDIUM');
                expect(result.category).toBe('Unknown External Service');
                expect(result.score).toBe(5);
                expect(result.reason).toContain('default to medium risk for safety');
            });
        });

        test('should handle missing URL gracefully', () => {
            const result = classifier.classifyDestination();
            expect(result.risk).toBe('UNKNOWN');
            expect(result.category).toBe('Unknown Destination');
            expect(result.score).toBe(0);
        });
    });
});