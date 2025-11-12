import '../load-env.js';
import { FileMetadataAnalyzer } from '../../src/analyzers/file-metadata-analyzer.js';

// Mock File objects for testing
class MockFile {
    constructor(name, size, type, lastModified = Date.now()) {
        this.name = name;
        this.size = size;
        this.type = type;
        this.lastModified = lastModified;
        this.lastModifiedDate = new Date(lastModified);
    }
}

describe('File Metadata Analysis', () => {
    let analyzer;
    
    beforeEach(() => {
        analyzer = new FileMetadataAnalyzer();
    });

    describe('Filename Pattern Detection', () => {
        test('should detect confidential markers in filenames', () => {
            const testFiles = [
                new MockFile('CONFIDENTIAL_report.pdf', 1024, 'application/pdf'),
                new MockFile('internal_strategy.docx', 2048, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
                new MockFile('restricted_access_data.xlsx', 4096, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                new MockFile('proprietary_algorithm.py', 512, 'text/x-python'),
                new MockFile('secret_project_details.pptx', 8192, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
            ];

            testFiles.forEach(file => {
                const result = analyzer.analyzeFileMetadata(file);
                
                expect(result.findings.some(f => f.category === 'Confidential Markers')).toBe(true);
                expect(result.riskLevel).toBeOneOf(['HIGH', 'CRITICAL']);
                expect(result.totalScore).toBeGreaterThanOrEqual(25);
            });
        });

        test('should detect financial data indicators', () => {
            const testFiles = [
                new MockFile('Q4_2024_Financial_Report.xlsx', 5120, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                new MockFile('FY24_Budget_Analysis.csv', 2048, 'text/csv'),
                new MockFile('revenue_forecast_2024.xlsx', 3072, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                new MockFile('profit_margin_analysis.docx', 1536, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
                new MockFile('cash_flow_projection.pptx', 4096, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
            ];

            testFiles.forEach(file => {
                const result = analyzer.analyzeFileMetadata(file);
                
                expect(result.findings.some(f => f.category === 'Financial Data')).toBe(true);
                expect(result.totalScore).toBeGreaterThanOrEqual(20);
            });
        });

        test('should detect strategic content indicators', () => {
            const testFiles = [
                new MockFile('strategic_roadmap_2025.pptx', 6144, 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
                new MockFile('business_plan_draft.docx', 2048, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
                new MockFile('competitive_analysis.xlsx', 3072, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                new MockFile('board_deck_Q3.pptx', 8192, 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
                new MockFile('acquisition_due_diligence.pdf', 4096, 'application/pdf')
            ];

            testFiles.forEach(file => {
                const result = analyzer.analyzeFileMetadata(file);
                
                expect(result.findings.some(f => f.category === 'Strategic Content')).toBe(true);
                expect(result.totalScore).toBeGreaterThanOrEqual(20);
            });
        });

        test('should detect customer data indicators', () => {
            const testFiles = [
                new MockFile('customer_database_export.csv', 10240, 'text/csv'),
                new MockFile('client_contact_list.xlsx', 5120, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                new MockFile('user_analytics_report.pdf', 2048, 'application/pdf'),
                new MockFile('crm_data_backup.sql', 15360, 'application/sql'),
                new MockFile('lead_prospect_analysis.docx', 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            ];

            testFiles.forEach(file => {
                const result = analyzer.analyzeFileMetadata(file);
                
                expect(result.findings.some(f => f.category === 'Customer Data')).toBe(true);
                expect(result.totalScore).toBeGreaterThanOrEqual(18);
            });
        });

        test('should detect employee/HR data indicators', () => {
            const testFiles = [
                new MockFile('employee_directory.xlsx', 3072, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                new MockFile('payroll_data_Q4.csv', 8192, 'text/csv'),
                new MockFile('performance_reviews_2024.docx', 4096, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
                new MockFile('hr_compensation_analysis.pdf', 2048, 'application/pdf'),
                new MockFile('org_chart_updated.pptx', 1024, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
            ];

            testFiles.forEach(file => {
                const result = analyzer.analyzeFileMetadata(file);
                
                expect(result.findings.some(f => f.category === 'Employee Data')).toBe(true);
                expect(result.totalScore).toBeGreaterThanOrEqual(18);
            });
        });

        test('should detect draft/version indicators', () => {
            const testFiles = [
                new MockFile('draft_proposal_v3.docx', 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
                new MockFile('presentation_rough_draft.pptx', 2048, 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
                new MockFile('document_backup_copy.pdf', 512, 'application/pdf'),
                new MockFile('report_wip_version2.xlsx', 1536, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                new MockFile('analysis_temp_file.csv', 1024, 'text/csv')
            ];

            testFiles.forEach(file => {
                const result = analyzer.analyzeFileMetadata(file);
                
                expect(result.findings.some(f => f.category === 'Draft/Work in Progress')).toBe(true);
                expect(result.totalScore).toBeGreaterThanOrEqual(10);
            });
        });
    });

    describe('File Type Risk Classification', () => {
        test('should classify financial file types as high risk', () => {
            const financialFiles = [
                new MockFile('data.xlsx', 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                new MockFile('report.xls', 1024, 'application/vnd.ms-excel'),
                new MockFile('export.csv', 1024, 'text/csv'),
                new MockFile('analysis.ods', 1024, 'application/vnd.oasis.opendocument.spreadsheet')
            ];

            financialFiles.forEach(file => {
                const result = analyzer.analyzeFileMetadata(file);
                
                expect(result.findings.some(f => f.category === 'Financial Documents')).toBe(true);
                expect(result.findings.find(f => f.category === 'Financial Documents').score).toBe(15);
            });
        });

        test('should classify presentation files appropriately', () => {
            const presentationFiles = [
                new MockFile('slides.pptx', 2048, 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
                new MockFile('deck.ppt', 1024, 'application/vnd.ms-powerpoint'),
                new MockFile('presentation.odp', 1536, 'application/vnd.oasis.opendocument.presentation'),
                new MockFile('keynote.key', 2048, 'application/vnd.apple.keynote')
            ];

            presentationFiles.forEach(file => {
                const result = analyzer.analyzeFileMetadata(file);
                
                expect(result.findings.some(f => f.category === 'Presentation Files')).toBe(true);
                expect(result.findings.find(f => f.category === 'Presentation Files').score).toBe(12);
            });
        });

        test('should classify database files as very high risk', () => {
            const databaseFiles = [
                new MockFile('backup.sql', 50000, 'application/sql'),
                new MockFile('data.sqlite', 25000, 'application/x-sqlite3'),
                new MockFile('database.db', 75000, 'application/x-sqlite3'),
                new MockFile('export.dump', 100000, 'application/octet-stream')
            ];

            databaseFiles.forEach(file => {
                const result = analyzer.analyzeFileMetadata(file);
                
                expect(result.findings.some(f => f.category === 'Database Files')).toBe(true);
                expect(result.findings.find(f => f.category === 'Database Files').score).toBe(20);
            });
        });

        test('should classify source code files appropriately', () => {
            const codeFiles = [
                new MockFile('algorithm.py', 1024, 'text/x-python'),
                new MockFile('service.js', 512, 'text/javascript'),
                new MockFile('model.java', 2048, 'text/x-java-source'),
                new MockFile('processor.cpp', 1536, 'text/x-c++src')
            ];

            codeFiles.forEach(file => {
                const result = analyzer.analyzeFileMetadata(file);
                
                expect(result.findings.some(f => f.category === 'Source Code')).toBe(true);
                expect(result.findings.find(f => f.category === 'Source Code').score).toBe(12);
            });
        });
    });

    describe('File Recency Analysis', () => {
        test('should score recent files higher', () => {
            const now = Date.now();
            const oneDayAgo = now - (24 * 60 * 60 * 1000);
            const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
            const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
            const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);

            const files = [
                new MockFile('today.xlsx', 1024, 'text/csv', now),
                new MockFile('yesterday.xlsx', 1024, 'text/csv', oneDayAgo),
                new MockFile('last_week.xlsx', 1024, 'text/csv', oneWeekAgo),
                new MockFile('last_month.xlsx', 1024, 'text/csv', oneMonthAgo),
                new MockFile('last_year.xlsx', 1024, 'text/csv', oneYearAgo)
            ];

            const results = files.map(file => analyzer.analyzeFileMetadata(file));

            // Most recent file should have highest recency score
            expect(results[0].findings.some(f => f.type === 'file_recency' && f.score === 15)).toBe(true);
            expect(results[1].findings.some(f => f.type === 'file_recency' && f.score === 10)).toBe(true);
            expect(results[2].findings.some(f => f.type === 'file_recency' && f.score === 5)).toBe(true);
            
            // Older files should have no recency score
            expect(results[3].findings.some(f => f.type === 'file_recency')).toBe(false);
            expect(results[4].findings.some(f => f.type === 'file_recency')).toBe(false);
        });
    });

    describe('File Size Analysis', () => {
        test('should detect bulk data based on file size', () => {
            const smallFile = new MockFile('small.txt', 1024, 'text/plain'); // 1KB
            const mediumFile = new MockFile('medium.csv', 15 * 1024 * 1024, 'text/csv'); // 15MB
            const largeFile = new MockFile('large.xlsx', 75 * 1024 * 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); // 75MB
            const massiveFile = new MockFile('massive.sql', 150 * 1024 * 1024, 'application/sql'); // 150MB

            const smallResult = analyzer.analyzeFileMetadata(smallFile);
            const mediumResult = analyzer.analyzeFileMetadata(mediumFile);
            const largeResult = analyzer.analyzeFileMetadata(largeFile);
            const massiveResult = analyzer.analyzeFileMetadata(massiveFile);

            // Small file should have no size-based findings
            expect(smallResult.findings.some(f => f.type === 'file_size')).toBe(false);

            // Medium file should be flagged as bulk data
            expect(mediumResult.findings.some(f => f.type === 'file_size')).toBe(true);
            expect(mediumResult.findings.find(f => f.type === 'file_size').score).toBe(10);

            // Large file should be flagged with higher score
            expect(largeResult.findings.some(f => f.type === 'file_size')).toBe(true);
            expect(largeResult.findings.find(f => f.type === 'file_size').score).toBe(15);

            // Massive file should be flagged with highest score
            expect(massiveResult.findings.some(f => f.type === 'file_size')).toBe(true);
            expect(massiveResult.findings.find(f => f.type === 'file_size').score).toBe(20);
        });

        test('should detect large spreadsheet as likely bulk export', () => {
            const largeCsv = new MockFile('export.csv', 25 * 1024 * 1024, 'text/csv'); // 25MB CSV
            const largeExcel = new MockFile('data.xlsx', 30 * 1024 * 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); // 30MB Excel

            const csvResult = analyzer.analyzeFileMetadata(largeCsv);
            const excelResult = analyzer.analyzeFileMetadata(largeExcel);

            // Both should be flagged as bulk data exports
            expect(csvResult.findings.some(f => f.type === 'bulk_data_export')).toBe(true);
            expect(csvResult.findings.find(f => f.type === 'bulk_data_export').score).toBe(25);

            expect(excelResult.findings.some(f => f.type === 'bulk_data_export')).toBe(true);
            expect(excelResult.findings.find(f => f.type === 'bulk_data_export').score).toBe(25);
        });
    });

    describe('Risk Level Calculation', () => {
        test('should calculate CRITICAL risk correctly', () => {
            // File with multiple high-risk indicators
            const criticalFile = new MockFile(
                'CONFIDENTIAL_Q4_Financial_Report.xlsx', 
                50 * 1024 * 1024, // 50MB
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                Date.now() // Recent
            );

            const result = analyzer.analyzeFileMetadata(criticalFile);
            
            expect(result.riskLevel).toBe('CRITICAL');
            expect(result.totalScore).toBeGreaterThanOrEqual(40);
            expect(result.severity).toBe('critical');
        });

        test('should calculate HIGH risk correctly', () => {
            const highFile = new MockFile(
                'financial_analysis_draft.xlsx',
                5 * 1024 * 1024, // 5MB
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                Date.now() - (2 * 24 * 60 * 60 * 1000) // 2 days ago
            );

            const result = analyzer.analyzeFileMetadata(highFile);
            
            expect(result.riskLevel).toBe('HIGH');
            expect(result.totalScore).toBeGreaterThanOrEqual(25);
            expect(result.totalScore).toBeLessThan(40);
            expect(result.severity).toBe('high');
        });

        test('should calculate MEDIUM risk correctly', () => {
            const mediumFile = new MockFile(
                'product_spec_v2.docx',
                2 * 1024 * 1024, // 2MB
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                Date.now() - (10 * 24 * 60 * 60 * 1000) // 10 days ago
            );

            const result = analyzer.analyzeFileMetadata(mediumFile);
            
            expect(result.riskLevel).toBe('MEDIUM');
            expect(result.totalScore).toBeGreaterThanOrEqual(15);
            expect(result.totalScore).toBeLessThan(25);
            expect(result.severity).toBe('medium');
        });

        test('should calculate LOW risk correctly', () => {
            const lowFile = new MockFile(
                'meeting_notes.txt',
                1024, // 1KB
                'text/plain',
                Date.now() - (100 * 24 * 60 * 60 * 1000) // 100 days ago
            );

            const result = analyzer.analyzeFileMetadata(lowFile);
            
            expect(result.riskLevel).toBe('LOW');
            expect(result.totalScore).toBeLessThan(15);
            expect(result.severity).toBe('low');
        });
    });

    describe('Recommendations', () => {
        test('should provide appropriate recommendations based on risk level', () => {
            const files = [
                {
                    file: new MockFile('CONFIDENTIAL_customer_database.sql', 100 * 1024 * 1024, 'application/sql', Date.now()),
                    expectedLevel: 'CRITICAL',
                    expectedMessage: 'CRITICAL RISK'
                },
                {
                    file: new MockFile('financial_report_Q4.xlsx', 10 * 1024 * 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', Date.now()),
                    expectedLevel: 'HIGH',
                    expectedMessage: 'HIGH RISK'
                },
                {
                    file: new MockFile('draft_presentation.pptx', 5 * 1024 * 1024, 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
                    expectedLevel: 'MEDIUM',
                    expectedMessage: 'MEDIUM RISK'
                },
                {
                    file: new MockFile('readme.txt', 1024, 'text/plain'),
                    expectedLevel: 'LOW',
                    expectedMessage: 'LOW RISK'
                }
            ];

            files.forEach(({ file, expectedLevel, expectedMessage }) => {
                const result = analyzer.analyzeFileMetadata(file);
                
                expect(result.riskLevel).toBe(expectedLevel);
                expect(result.recommendation).toContain(expectedMessage);
            });
        });
    });

    describe('Edge Cases', () => {
        test('should handle null/undefined file gracefully', () => {
            const result = analyzer.analyzeFileMetadata(null);
            
            expect(result.allowed).toBe(true);
            expect(result.reason).toContain('No file provided');
            expect(result.findings).toEqual([]);
        });

        test('should handle file with no extension', () => {
            const fileWithoutExt = new MockFile('README', 1024, 'text/plain');
            
            const result = analyzer.analyzeFileMetadata(fileWithoutExt);
            
            expect(result).toBeDefined();
            expect(result.metadata.extension).toBe('');
        });

        test('should handle very old files', () => {
            const veryOldFile = new MockFile(
                'archive.txt',
                1024,
                'text/plain',
                Date.now() - (10 * 365 * 24 * 60 * 60 * 1000) // 10 years ago
            );

            const result = analyzer.analyzeFileMetadata(veryOldFile);
            
            expect(result).toBeDefined();
            expect(result.findings.some(f => f.type === 'file_recency')).toBe(false);
        });
    });

    describe('Company Patterns Customization', () => {
        test('should allow adding custom company patterns', () => {
            analyzer.addCompanyPatterns(['acme_corp', 'enterprise_solutions', 'techstart']);

            const file = new MockFile('acme_corp_analysis.xlsx', 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            const result = analyzer.analyzeFileMetadata(file);

            expect(result.findings.some(f => f.category === 'Company References')).toBe(true);
        });
    });
});