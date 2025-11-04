export const testDatasets = {
    blocked: {
        bulkEmails: {
            name: 'Bulk Email Export',
            content: `john.doe@company.com
jane.smith@company.com
bob.wilson@company.com
alice.brown@company.com
charlie.davis@company.com
emma.jones@company.com
frank.miller@company.com`,
            expectedBlocked: true,
            expectedFindings: ['email', 'bulk']
        },
        
        credentials: {
            name: 'API Keys and Passwords',
            content: `Database Credentials:
API_KEY=sk_live_51HqK2jABCDEFGHIJKLMNOP
password=SuperSecret123!
AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE`,
            expectedBlocked: true,
            expectedFindings: ['credentials', 'api']
        }
    },
    
    allowed: {
        normalText: {
            name: 'Normal Business Text',
            content: `Hey team, let's meet tomorrow at 2pm to discuss the quarterly review. We should cover the new product features and customer feedback. Looking forward to seeing everyone!`,
            expectedBlocked: false
        },
        
        singleEmail: {
            name: 'Single Email in Context',
            content: `Please contact our support team at support@company.com for any questions about the new product features.`,
            expectedBlocked: false
        }
    }
};