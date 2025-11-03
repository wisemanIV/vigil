class BulkDataDetector {
    constructor() {
        this.thresholds = {
            emails: 3,           // 3+ emails = bulk data
            names: 5,            // 5+ names = bulk data
            phones: 3,           // 3+ phone numbers
            addresses: 3,        // 3+ addresses
            structuredRows: 10   // 10+ rows of structured data
        };
    }
    
    analyze(content) {
        const findings = [];
        
        // Detect multiple emails
        const emailFindings = this.detectBulkEmails(content);
        if (emailFindings) findings.push(emailFindings);
        
        // Detect multiple names
        const nameFindings = this.detectBulkNames(content);
        if (nameFindings) findings.push(nameFindings);
        
        // Detect structured data (CSV, tables)
        const structuredFindings = this.detectStructuredData(content);
        if (structuredFindings) findings.push(structuredFindings);
        
        // Detect list patterns
        const listFindings = this.detectListPatterns(content);
        if (listFindings) findings.push(listFindings);
        
        // Detect contact database dumps
        const databaseFindings = this.detectDatabaseDump(content);
        if (databaseFindings) findings.push(databaseFindings);
        
        return findings;
    }
    
    detectBulkEmails(content) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = content.match(emailRegex) || [];
        
        // Remove duplicates
        const uniqueEmails = [...new Set(emails)];
        
        if (uniqueEmails.length >= this.thresholds.emails) {
            // Check if they look like a customer list
            const domains = uniqueEmails.map(e => e.split('@')[1]);
            const uniqueDomains = [...new Set(domains)];
            
            // Multiple emails from multiple domains = likely customer list
            const isCustomerList = uniqueDomains.length > 1;
            
            return {
                type: 'bulk_email_addresses',
                category: 'bulk_pii',
                severity: isCustomerList ? 'critical' : 'high',
                count: uniqueEmails.length,
                uniqueDomains: uniqueDomains.length,
                isCustomerList: isCustomerList,
                sample: uniqueEmails.slice(0, 3),
                source: 'bulk_data_detection'
            };
        }
        
        return null;
    }
    
    detectBulkNames(content) {
        // Detect capitalized name patterns
        // Pattern: First Last (capitalized words)
        const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
        const potentialNames = content.match(namePattern) || [];
        
        // Remove common false positives
        const commonWords = ['New York', 'Los Angeles', 'San Francisco', 'United States'];
        const names = potentialNames.filter(name => !commonWords.includes(name));
        
        const uniqueNames = [...new Set(names)];
        
        if (uniqueNames.length >= this.thresholds.names) {
            return {
                type: 'bulk_personal_names',
                category: 'bulk_pii',
                severity: 'high',
                count: uniqueNames.length,
                sample: uniqueNames.slice(0, 3),
                source: 'bulk_data_detection'
            };
        }
        
        return null;
    }
    
    detectStructuredData(content) {
        const lines = content.split('\n');
        
        // Detect CSV-like structure
        const csvLikeLines = lines.filter(line => {
            const commas = (line.match(/,/g) || []).length;
            const tabs = (line.match(/\t/g) || []).length;
            return commas >= 2 || tabs >= 2;
        });
        
        if (csvLikeLines.length >= this.thresholds.structuredRows) {
            // Analyze the structure
            const firstLine = csvLikeLines[0];
            const delimiter = firstLine.includes('\t') ? '\t' : ',';
            const columns = firstLine.split(delimiter).length;
            
            // Check if headers suggest customer data
            const customerHeaders = [
                'name', 'email', 'phone', 'address', 'customer',
                'contact', 'user', 'client', 'firstname', 'lastname'
            ];
            
            const headerLine = csvLikeLines[0].toLowerCase();
            const hasCustomerHeaders = customerHeaders.some(h => 
                headerLine.includes(h)
            );
            
            return {
                type: 'structured_data_export',
                category: 'bulk_pii',
                severity: hasCustomerHeaders ? 'critical' : 'high',
                rows: csvLikeLines.length,
                columns: columns,
                hasCustomerHeaders: hasCustomerHeaders,
                delimiter: delimiter,
                source: 'bulk_data_detection'
            };
        }
        
        return null;
    }
    
    detectListPatterns(content) {
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        
        // Detect numbered or bulleted lists with emails/names
        const listItemPattern = /^[\s]*[\d\-\*\•]+[\.\):\s]+(.+)$/;
        let listItems = 0;
        let itemsWithEmails = 0;
        let itemsWithNames = 0;
        
        lines.forEach(line => {
            const match = line.match(listItemPattern);
            if (match) {
                listItems++;
                
                const itemContent = match[1];
                
                // Check if contains email
                if (/@/.test(itemContent)) {
                    itemsWithEmails++;
                }
                
                // Check if contains name pattern
                if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(itemContent)) {
                    itemsWithNames++;
                }
            }
        });
        
        if (listItems >= 5 && (itemsWithEmails >= 3 || itemsWithNames >= 5)) {
            return {
                type: 'formatted_contact_list',
                category: 'bulk_pii',
                severity: 'high',
                totalItems: listItems,
                itemsWithEmails: itemsWithEmails,
                itemsWithNames: itemsWithNames,
                source: 'bulk_data_detection'
            };
        }
        
        return null;
    }
    
    detectDatabaseDump(content) {
        // Detect patterns that look like database exports
        const dbPatterns = [
            /INSERT\s+INTO/gi,
            /SELECT\s+\*\s+FROM/gi,
            /CREATE\s+TABLE/gi,
            /\bID\b.*\bName\b.*\bEmail\b/gi,
            /"id":\s*\d+,\s*"name":/gi,  // JSON arrays
            /<customer>.*<email>/gi       // XML
        ];
        
        let matchedPatterns = 0;
        const matchedTypes = [];
        
        dbPatterns.forEach((pattern, idx) => {
            if (pattern.test(content)) {
                matchedPatterns++;
                
                const types = ['SQL INSERT', 'SQL SELECT', 'SQL CREATE', 
                              'Database Schema', 'JSON Export', 'XML Export'];
                matchedTypes.push(types[idx]);
            }
        });
        
        if (matchedPatterns > 0) {
            return {
                type: 'database_dump',
                category: 'bulk_pii',
                severity: 'critical',
                matchedPatterns: matchedPatterns,
                formats: matchedTypes,
                source: 'bulk_data_detection'
            };
        }
        
        return null;
    }
    
    // Check data density - ratio of personal data to total content
    analyzeDensity(content) {
        const words = content.split(/\s+/).length;
        
        const emailCount = (content.match(/@/g) || []).length;
        const nameCount = (content.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g) || []).length;
        const phoneCount = (content.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || []).length;
        
        const dataPoints = emailCount + nameCount + phoneCount;
        const density = words > 0 ? dataPoints / words : 0;
        
        // If more than 30% of content is personal data = suspicious
        if (density > 0.3 && dataPoints > 10) {
            return {
                type: 'high_pii_density',
                category: 'bulk_pii',
                severity: 'high',
                density: density,
                dataPoints: dataPoints,
                source: 'bulk_data_detection'
            };
        }
        
        return null;
    }
}

export default BulkDataDetector;
