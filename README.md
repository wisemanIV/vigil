[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/YOUR_EXTENSION_ID.svg)](https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID)
[![GitHub Stars](https://img.shields.io/github/stars/yourusername/vigil.svg)](https://github.com/yourusername/vigil/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/yourusername/vigil.svg)](https://github.com/yourusername/vigil/issues)
# 🛡️ Vigil - Data Loss Prevention for Chrome

<p align="center">
  <img src="icons/icon128.png" alt="Vigil Logo" width="128" height="128">
</p>

<p align="center">
  <strong>AI-powered data loss prevention that protects your sensitive information from leaking through clipboard and file uploads.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## 🎯 Features

- ✅ **Clipboard Monitoring** - Intercepts and analyzes paste operations in real-time
- ✅ **File Upload Protection** - Scans documents before they're uploaded
- ✅ **AI-Powered Analysis** - Uses TensorFlow.js with Universal Sentence Encoder for semantic understanding
- ✅ **Pattern Detection** - Identifies credit cards, SSNs, API keys, passwords, and more
- ✅ **Bulk Data Detection** - Prevents customer lists and database exports from leaking
- ✅ **Zero Server Requirements** - All processing happens locally in your browser
- ✅ **Privacy First** - No data sent to external servers
- ✅ **Enterprise Ready** - Supports Group Policy and MDM deployment

## 🚀 Quick Start

### Installation

#### For Users
1. Download the latest release from [Releases](https://github.com/yourusername/vigil/releases)
2. Extract the ZIP file
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the extracted folder

#### For Enterprises
See [Enterprise Deployment Guide](docs/ENTERPRISE_DEPLOYMENT.md)

## 🔍 How It Works

Vigil uses a multi-layered approach to detect sensitive data:

1. **Pattern Matching** - Fast regex-based detection for known formats (SSN, credit cards, etc.)
2. **Semantic Analysis** - TensorFlow.js analyzes content meaning and context
3. **Bulk Data Detection** - Identifies lists, CSV exports, and database dumps
4. **Contextual Rules** - Different policies for internal vs. external domains

### What Vigil Detects

| Category | Examples |
|----------|----------|
| **Financial** | Credit cards, SSNs, bank accounts |
| **Credentials** | Passwords, API keys, private keys, tokens |
| **PII** | Email addresses, phone numbers, addresses |
| **Bulk Data** | Customer lists, email distributions, database exports |
| **Confidential** | Documents marked confidential, proprietary info |

## 📊 Performance

- **Clipboard Analysis**: 10-50ms average
- **File Parsing**: 100-500ms depending on size
- **Memory Usage**: ~150MB (includes TensorFlow models)
- **Offline Capable**: Yes, all processing is local

## 🛠️ Development

### Prerequisites

- Node.js 16+ and npm
- Chrome/Chromium browser

### Setup
```bash
