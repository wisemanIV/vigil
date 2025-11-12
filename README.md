# 🛡️ Vigil - Enterprise Data Loss Prevention for Chrome

<p align="center">
  <img src="icons/icon128.png" alt="Vigil Logo" width="128" height="128">
</p>

<p align="center">
  <strong>Advanced, AI-powered data loss prevention that protects sensitive corporate information from leaking through clipboard operations, file uploads, and screenshots.</strong>
</p>

<p align="center">
  <a href="https://github.com/yourusername/vigil/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
  </a>
  <a href="https://github.com/yourusername/vigil/stargazers">
    <img src="https://img.shields.io/github/stars/yourusername/vigil?style=social" alt="GitHub Stars">
  </a>
  <a href="https://github.com/yourusername/vigil/issues">
    <img src="https://img.shields.io/github/issues/yourusername/vigil" alt="GitHub Issues">
  </a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#%EF%B8%8F-development">Development</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 🎯 Features

### 🔒 **Multi-Layer Protection**
- **📋 Clipboard Monitoring** - Real-time analysis of paste operations with context-aware blocking
- **📁 File Upload Protection** - Comprehensive file metadata and content analysis before uploads
- **📷 Screenshot Protection** - Automatic detection and prevention of sensitive data capture
- **🔍 Content Classification** - 0-100 point scoring system for PUBLIC/INTERNAL/CONFIDENTIAL/HIGHLY CONFIDENTIAL
- **🌐 Destination Risk Analysis** - Smart blocking based on where data is being shared (HIGH/MEDIUM/LOW risk destinations)

### 🧠 **Advanced AI Analysis**
- **Semantic Understanding** - Context-aware analysis using machine learning models
- **Pattern Detection** - Credit cards, SSNs, API keys, passwords, financial data, and proprietary algorithms
- **Bulk Data Detection** - Prevents customer lists, employee databases, and data exports from leaking
- **Company-Specific Intelligence** - Configurable detection of internal terminology, project codes, and confidentiality markers
- **File Metadata Analysis** - Fast risk assessment using filename patterns, file types, size, and recency without reading content

### 🏢 **Enterprise-Grade Features**
- **Configurable Risk Tolerance** - Customizable scoring thresholds and blocking policies per organization
- **Company Customization** - Adaptable to any organization's specific terminology, domains, and confidentiality markers
- **Destination-Aware Blocking** - Different policies for internal vs external sharing destinations
- **Real-time Policy Enforcement** - Dynamic blocking based on content sensitivity + destination risk combinations
- **Comprehensive Audit Logging** - Complete history of all protection events and policy decisions
- **Privacy-First Design** - 100% local processing, no data sent to external servers

### 🎛️ **Flexible Configuration**
- **Global Configuration System** - Centralized management of all detection patterns and risk thresholds
- **Runtime Customization** - Update policies without extension redeployment
- **Multi-Tier Risk Classification** - Separate thresholds for content analysis, file metadata, and destination risks
- **Bulk Data Thresholds** - Configurable limits for email lists, phone numbers, and PII detection
- **Company-Specific Patterns** - Custom detection for internal project names, confidentiality markers, and business terms

## 🚀 Quick Start

### Installation

**Option 1: Install from Release**
1. Download the latest release from [Releases](https://github.com/yourusername/vigil/releases)
2. Extract the ZIP file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top-right corner)
5. Click "Load unpacked" and select the extracted folder
6. Grant necessary permissions when prompted

**Option 2: Build from Source**
```bash
# Clone the repository
git clone https://github.com/yourusername/vigil.git
cd vigil

# Install dependencies
npm install

# Build the extension
npm run build

# Load in Chrome
# Navigate to chrome://extensions/
# Enable Developer mode
# Click "Load unpacked" and select the dist folder
```

### Initial Setup

1. **Configure Company Settings** - Edit `/src/config/global-config.js`:
   ```javascript
   company: {
       name: 'Your Company Name',
       aliases: ['company_alias', 'short_name'],
       domains: ['yourcompany.com', 'internal.company.com'],
       confidentialityMarkers: ['confidential', 'internal', 'yourcompany_confidential']
   }
   ```

2. **Adjust Risk Tolerance** - Customize scoring thresholds:
   ```javascript
   riskTolerance: {
       thresholds: {
           critical: 75,    // Scores >= 75 = CRITICAL risk
           high: 50,        // Scores 50-74 = HIGH risk
           medium: 25,      // Scores 25-49 = MEDIUM risk
           low: 0           // Scores 0-24 = LOW risk
       }
   }
   ```

3. **Test Protection** - Try pasting sensitive content or uploading files to verify blocking works correctly

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content.js    │    │  Background.js  │    │ Global Config   │
│                 │    │                 │    │                 │
│ • Paste Monitor │◄──►│ • Fast Analyzer │◄──►│ • Company Info  │
│ • Upload Monitor│    │ • Hybrid Analyzer│   │ • Risk Tolerance│
│ • Screenshot    │    │ • Decision Logic │   │ • Detection     │
│   Protection    │    │                 │    │   Patterns      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Monitors        │    │ Analyzers       │    │ Configuration   │
│                 │    │                 │    │                 │
│ • Upload        │    │ • Content       │    │ • Risk Thresholds│
│ • Screenshot    │    │   Classification│    │ • Detection     │
│ • Paste Events  │    │ • File Metadata │    │   Patterns      │
│                 │    │ • Destination   │    │ • Bulk Data     │
│                 │    │   Risk Classifier│   │   Settings      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Analysis Pipeline

1. **Content Interception** - Monitors clipboard, uploads, and screen capture attempts
2. **Fast Pattern Analysis** - Immediate detection of obvious sensitive patterns (SSN, credit cards, API keys)
3. **Content Classification** - 0-100 point scoring across 5 categories:
   - Content Sensitivity (0-30 points)
   - Identifier Presence (0-25 points)  
   - Temporal Sensitivity (0-20 points)
   - Competitive Impact (0-15 points)
   - Legal/Regulatory Risk (0-10 points)
4. **File Metadata Analysis** - Fast risk assessment using file properties without reading content
5. **Destination Risk Assessment** - Classification of target websites/services (HIGH/MEDIUM/LOW)
6. **Risk Multiplication** - Content score adjusted based on destination risk
7. **Policy Decision** - Block/allow/warn based on combined risk assessment
8. **User Interaction** - Confirmation dialogs for borderline cases with detailed findings

## ⚙️ Configuration

### Company Configuration

Customize the DLP system for your organization by editing the global configuration:

```javascript
// /src/config/global-config.js

export class VigilConfig {
    constructor() {
        this.company = {
            name: 'Your Company Inc',
            aliases: ['yourcompany', 'your_company', 'yc_inc'],
            domains: ['yourcompany.com', 'internal.company.com'],
            confidentialityMarkers: [
                'confidential', 'internal', 'private', 'restricted',
                'yourcompany_confidential', 'yc_internal', 'company_private'
            ]
        };
        
        this.riskTolerance = {
            // Adjust thresholds based on your security posture
            thresholds: {
                critical: 80,    // More strict
                high: 60,        // More strict
                medium: 30,      // More strict
                low: 0
            },
            policies: {
                blockCritical: true,
                blockHighToHighRisk: true,
                warnOnMedium: true,
                logAll: true
            }
        };
    }
}
```

### Detection Patterns

Add custom detection patterns for your organization:

```javascript
this.detectionPatterns = {
    financial: {
        keywords: [
            'financial', 'revenue', 'profit', 'budget',
            // Add company-specific financial terms
            'fy2024_budget', 'q4_forecast', 'company_financials'
        ],
        patterns: [
            /fy\d{2,4}/i,
            /q[1-4][\s_-]?\d{2,4}/i,
            // Add regex patterns for your financial data formats
            /budget_\d{4}/i
        ],
        score: 25  // Adjust scoring based on sensitivity
    }
}
```

### Risk Tolerance Tuning

Fine-tune blocking behavior:

```javascript
// Stricter organization
riskTolerance: {
    contentClassification: {
        highlyConfidential: 60,  // Lower threshold = more sensitive
        confidential: 40,
        internal: 20,
        public: 0
    },
    policies: {
        blockCritical: true,
        blockHighToHighRisk: true,
        blockMediumToHighRisk: true,  // Additional blocking
        warnOnMedium: true,
        logAll: true
    }
}

// More permissive organization  
riskTolerance: {
    contentClassification: {
        highlyConfidential: 85,  // Higher threshold = less sensitive
        confidential: 65,
        internal: 45,
        public: 0
    },
    policies: {
        blockCritical: true,
        blockHighToHighRisk: false,  // Only warn
        warnOnMedium: false,         // No warnings for medium risk
        logAll: true
    }
}
```

## 📊 Understanding Risk Scoring

### Content Classification Scoring (0-100 points)

| Category | Points | Examples |
|----------|--------|----------|
| **Content Sensitivity** | 0-30 | Financial data, customer lists, trade secrets, strategic plans |
| **Identifier Presence** | 0-25 | Customer names, employee PII, project codes, confidential markings |
| **Temporal Sensitivity** | 0-20 | Future release dates, current quarter data, upcoming announcements |
| **Competitive Impact** | 0-15 | Competitive advantages, market positioning, proprietary methods |
| **Legal/Regulatory Risk** | 0-10 | GDPR data, SOX compliance, NDA violations, export controls |

### File Metadata Scoring

| Risk Factor | Score | Examples |
|-------------|-------|----------|
| **Confidentiality Markers** | 25 | "CONFIDENTIAL_report.pdf", "internal_strategy.docx" |
| **Financial Indicators** | 20 | "Q4_2024_Financial_Report.xlsx", "budget_analysis.csv" |
| **Strategic Content** | 20 | "strategic_roadmap_2025.pptx", "competitive_analysis.xlsx" |
| **Customer Data** | 18 | "customer_database_export.csv", "user_analytics_report.pdf" |
| **File Type Risk** | 5-20 | Spreadsheets (15), Databases (20), Presentations (12) |
| **File Recency** | 5-15 | Modified today (15), This week (10), This month (5) |
| **File Size** | 10-25 | >10MB (10), >50MB (15), >100MB (20), Large CSV/Excel (25) |

### Classification Levels

| Score Range | Classification | Action |
|-------------|----------------|--------|
| **71-100** | HIGHLY CONFIDENTIAL | ❌ Block automatically |
| **51-70** | CONFIDENTIAL | ❌ Block automatically |
| **31-50** | INTERNAL | ⚠️ Block to HIGH risk destinations |
| **0-30** | PUBLIC | ✅ Allow with destination-based warnings |

## 🛠️ Development

### Prerequisites

- Node.js 18+ and npm
- Chrome/Chromium browser
- Git

### Setup Development Environment

```bash
# Clone and setup
git clone https://github.com/yourusername/vigil.git
cd vigil
npm install

# Run tests
npm test

# Run specific test suites
npm test -- chatgpt-paste.test.js
npm test -- file-metadata.test.js
npm test -- global-config.test.js

# Development build (with source maps)
npm run build:dev

# Production build
npm run build
```

### Project Structure

```
vigil/
├── src/
│   ├── analyzers/           # Core analysis engines
│   │   ├── fast-analyzer.js           # Main analyzer orchestrator
│   │   ├── content-classification-detector.js  # 0-100 point content scoring
│   │   ├── destination-risk-classifier.js      # Website risk classification
│   │   ├── file-metadata-analyzer.js          # File metadata analysis
│   │   ├── bulk-data-detector.js              # Bulk PII detection
│   │   └── hybrid-analyzer.js                 # Fast + ML analysis
│   ├── config/
│   │   └── global-config.js          # Central configuration system
│   ├── monitors/            # Data interception
│   │   ├── upload-monitor.js         # File upload monitoring
│   │   └── screenshot-monitor.js     # Screen capture prevention
│   ├── ui/
│   │   └── confirmation-dialog.js    # User confirmation interface
│   ├── content.js          # Content script (main entry)
│   ├── background.js       # Service worker
│   └── manifest.json       # Extension manifest
├── tests/
│   ├── specs/              # Test suites
│   └── helpers/            # Test utilities
└── icons/                  # Extension icons
```

### Adding New Detection Patterns

1. **Edit Global Configuration**:
```javascript
// In /src/config/global-config.js
this.detectionPatterns = {
    newCategory: {
        keywords: ['keyword1', 'keyword2'],
        patterns: [/pattern1/gi, /pattern2/gi],
        score: 15,
        category: 'New Category',
        reason: 'Description of why this is sensitive'
    }
}
```

2. **Update Analyzers** (if needed):
```javascript
// In content-classification-detector.js
const newCategoryConfig = this.config.getDetectionPatterns('newCategory');
```

3. **Add Tests**:
```javascript
// In global-config.test.js
test('should get new category detection patterns', () => {
    const patterns = config.getDetectionPatterns('newCategory');
    expect(patterns.keywords).toContain('keyword1');
    expect(patterns.score).toBe(15);
});
```

### Testing

The extension includes comprehensive test suites covering all major functionality:

- **Unit Tests** - Individual analyzer components
- **Integration Tests** - Full analysis pipeline 
- **Browser Tests** - Real Chrome extension environment testing
- **Configuration Tests** - Global configuration system validation

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test categories
npm test -- --testNamePattern="Content Classification"
npm test -- --testNamePattern="File Metadata"
npm test -- --testNamePattern="Global Configuration"

# Run browser integration tests
npm test -- chatgpt-paste.test.js
npm test -- sheets-paste.test.js
```

## 📈 Performance

- **Fast Analysis**: Pattern detection completes in <10ms
- **File Metadata**: Risk assessment in <5ms without reading file content
- **Memory Efficient**: <50MB RAM usage during active monitoring
- **Local Processing**: No network calls, all analysis happens locally
- **Minimal CPU Impact**: Background analysis optimized for performance

## 🔧 Troubleshooting

### Common Issues

**Extension Not Loading**
```bash
# Check manifest syntax
npm run lint

# Verify all dependencies
npm install

# Check console for errors
# Open chrome://extensions/, click "Errors" button
```

**Tests Failing**
```bash
# Clear jest cache
npx jest --clearCache

# Run tests with verbose output
npm test -- --verbose

# Check for ES module issues
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

**Configuration Not Working**
- Verify JSON syntax in global-config.js
- Check that patterns compile as valid RegExp objects
- Ensure score values are numbers, not strings

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Run test suite: `npm test`
5. Commit changes: `git commit -m "Description"`
6. Push to branch: `git push origin feature-name`
7. Create Pull Request

### Code Standards

- ESNext JavaScript with modules
- Comprehensive JSDoc comments
- Test coverage for all new features
- Configuration-driven design
- Privacy-first implementation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- TensorFlow.js team for machine learning capabilities
- Chrome Extensions documentation and community
- Security research community for DLP best practices

---

<p align="center">
  <strong>Vigil - Protecting your data, preserving your privacy</strong><br>
  Built with ❤️ for enterprise security
</p>