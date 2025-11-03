export const customerDataPatterns = {
    // CRM export formats
    salesforce: {
        regex: /\b(Account|Contact|Lead|Opportunity)\s+(Name|Email|Phone)/gi,
        severity: 'critical',
        category: 'crm_export'
    },
    
    // Excel export indicators
    excelExport: {
        regex: /\bA\d+\s+B\d+\s+C\d+/g, // Cell references
        severity: 'high',
        category: 'spreadsheet_export'
    },
    
    // Multiple contact entries
    vcardMultiple: {
        regex: /(BEGIN:VCARD.*?END:VCARD.*?){3,}/gs,
        severity: 'critical',
        category: 'bulk_contacts'
    },
    
    // Email distribution lists
    mailtoList: {
        regex: /(mailto:[^\s]+[,;\s]+){3,}/gi,
        severity: 'high',
        category: 'email_list'
    }
};
