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
        },

        strategicPlan: {
            name: 'Strategic Business Plan',
            content: `CONFIDENTIAL - Q4 2024 Strategic Plan
INTERNAL ONLY - DO NOT DISTRIBUTE

# Executive Summary
Our go-to-market strategy for the new AI product line focuses on competitive advantage through proprietary machine learning algorithms. 

# Competitive Analysis
- Competitor A has 35% market share, vulnerable in enterprise segment
- Our pricing strategy undercuts by 20% while maintaining 60% profit margins
- Acquisition target: TechCorp (valuation $50M, due diligence in progress)

# Financial Projections
- Q4 Revenue: $2.3M (15% growth)
- Development costs: $800K
- Expected profit margin: 42%

# Product Roadmap
- Alpha release: November 2024
- Beta features: December 2024  
- Public launch: Q1 2025`,
            expectedBlocked: true,
            expectedFindings: ['proprietary', 'strategic']
        },

        productRoadmap: {
            name: 'Product Development Roadmap',
            content: `Product Roadmap - INTERNAL ONLY

# Upcoming Release Timeline
## Q4 2024 Milestones
- Feature specification: AI-powered analytics
- Technical specification for new architecture
- User stories for enterprise features

## Q1 2025 Roadmap  
- Beta version of machine learning engine
- Pre-release testing with select customers
- Implementation plan for cloud migration

# Pricing Model
- Freemium tier: $0 (limited features)
- Professional: $99/month 
- Enterprise: $499/month (custom pricing for 1000+ users)

## Unreleased Features
- Advanced predictive analytics
- Real-time collaboration tools
- Custom integration APIs`,
            expectedBlocked: true,
            expectedFindings: ['proprietary', 'product']
        },

        financialData: {
            name: 'Financial Performance Report',
            content: `Q3 Financial Results - CONFIDENTIAL

# Revenue Metrics
- Total Revenue: $12.5M (22% growth YoY)
- Recurring Revenue: $8.2M 
- New Customer Revenue: $2.1M
- Profit margins: 38% (up from 31% last quarter)

# Cost Analysis
- Operational costs: $4.2M
- Personnel costs: $5.8M (120 FTE)
- Infrastructure costs: $1.1M
- Development costs: $900K

# Key Performance Indicators
- Customer acquisition cost: $1,200
- Customer lifetime value: $15,000
- Monthly churn rate: 3.2%
- Revenue per employee: $104K

# Contract Analysis
- Enterprise deals pending: $3.2M pipeline
- Average deal size: $250K
- Sales cycle: 4.2 months`,
            expectedBlocked: true,
            expectedFindings: ['proprietary', 'financial']
        },

        organizationalData: {
            name: 'Employee Performance Data',
            content: `Internal Memo - Performance Review Summary

# Team Structure Updates
## Engineering Team (45 FTE)
- Senior Engineers: $150K-$180K salary range
- Mid-level: $120K-$140K + equity grants
- Junior: $90K-$110K

# Q3 Performance Reviews
## Promotion Candidates
- John Smith (Senior SWE): Promotion to Staff level
- Sarah Johnson (PM): Moving to Senior PM role
- Mike Chen (Designer): Lead Designer promotion

# Hiring Plan Q4 2024
- 12 new engineering hires
- 3 product managers  
- 5 sales representatives
- Target headcount: 150 by end of year

# Compensation Analysis
- Average salary increase: 8.5%
- Bonus pool: $2.1M allocated
- Equity refresh grants: 15% of employees eligible

# All-Hands Meeting Notes
- Leadership team restructuring announced
- New reporting structure effective January 1st`,
            expectedBlocked: true,
            expectedFindings: ['proprietary', 'organizational']
        },

        // Classification Test Cases
        highlyConfidential: {
            name: 'Highly Confidential (71-100 points)',
            content: `CONFIDENTIAL - M&A Discussion
DO NOT DISTRIBUTE

# Acquisition Analysis: TechCorp
Customer: Enterprise Corp with 500K users
Valuation: $150M (competitive advantage through proprietary algorithms)
Due diligence reveals revenue: $45M annually with 60% profit margins
Trade secret: Machine learning secret sauce gives direct competitive advantage

# Financial Data
- Q4 2025 forecast: $25M revenue (unreleased projections)
- Customer list includes Fortune 500 accounts
- API key: AKIA1234567890ABCDEF
- Employee SSN: 123-45-6789

# Strategic Impact
Would give competitors direct advantage if disclosed
GDPR concerns with personal data included
SOX compliance required for financial disclosure`,
            expectedClassification: 'HIGHLY CONFIDENTIAL',
            expectedScore: { min: 71, max: 100 }
        },

        confidential: {
            name: 'Confidential (51-70 points)', 
            content: `INTERNAL ONLY - Product Roadmap Q1 2025

# Unreleased Features
- Beta version launching next year
- Customer: TechStart Inc requesting early access
- Proprietary methodology for data processing
- Competitive positioning against market leader

# Development Timeline
Q1 2025: Alpha release of AI engine
Current quarter: Technical specification completion
Internal project: Operation Phoenix

# Financial Impact
Expected revenue impact: $5M annually
Development costs: $2M allocated`,
            expectedClassification: 'CONFIDENTIAL',
            expectedScore: { min: 51, max: 70 }
        },

        internal: {
            name: 'Internal (31-50 points)',
            content: `Internal Process Documentation

# Workflow Updates
New internal process for customer onboarding
Standard operating procedure for support escalation
Customer analytics showing engagement patterns
Compensation structure updates for Q4

# Project Updates  
Current year initiative: improve user experience
This quarter deliverables include process improvements
Vendor contract pricing updated for next renewal`,
            expectedClassification: 'INTERNAL', 
            expectedScore: { min: 31, max: 50 }
        },

        public: {
            name: 'Public (0-30 points)',
            content: `Company Policy Update

# General Guidelines
Updated employee handbook with new remote work policy
Code of conduct training scheduled for all employees
Public marketing materials ready for next campaign
Industry best practices for customer service

# Published Research
Whitepaper on software development practices
Blog post about company culture initiatives
Press release about new office opening
Public announcement of community partnership`,
            expectedClassification: 'PUBLIC',
            expectedScore: { min: 0, max: 30 }
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