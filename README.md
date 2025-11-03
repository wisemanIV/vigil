[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/YOUR_EXTENSION_ID.svg)](https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID)
[![GitHub Stars](https://img.shields.io/github/stars/yourusername/vigil.svg)](https://github.com/yourusername/vigil/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/yourusername/vigil.svg)](https://github.com/yourusername/vigil/issues)
# 🛡️ Vigil - Data Loss Prevention for Chrome

<p align="center">
  <img src="icons/icon128.png" alt="Vigil Logo" width="128" height="128">
</p>

<p align="center">
  <strong>AI-powered data loss prevention that protects your sensitive information from leaking through clipboard, file uploads, and screenshots.</strong>
</p>

<p align="center">
  <a href="https://github.com/wisemanIV/vigil/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
  </a>
  <a href="https://github.com/wisemanIV/vigil/stargazers">
    <img src="https://img.shields.io/github/stars/wisemanIV/vigil?style=social" alt="GitHub Stars">
  </a>
  <a href="https://github.com/wisemanIV/vigil/issues">
    <img src="https://img.shields.io/github/issues/wisemanIV/vigil" alt="GitHub Issues">
  </a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#%EF%B8%8F-development">Development</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>

---

## 🎯 Features

### Core Protection
- ✅ **Clipboard Monitoring** - Real-time analysis of paste operations
- ✅ **File Upload Protection** - Scans documents before upload
- ✅ **Screenshot Protection** 🔥 - Detects and blurs sensitive content during screenshots
- ✅ **AI-Powered Analysis** - TensorFlow.js with Universal Sentence Encoder
- ✅ **Pattern Detection** - Credit cards, SSNs, API keys, passwords, and more
- ✅ **Bulk Data Detection** - Prevents customer lists and database dumps from leaking

### Advanced Features
- 🔍 **Semantic Understanding** - Context-aware analysis using machine learning
- 📊 **Real-time Scanning** - Continuous monitoring of visible content
- 🎯 **Smart Blurring** - Automatically obscures sensitive data during screenshots
- 📝 **Audit Logging** - Complete history of all protection events
- ⚙️ **Configurable Settings** - Customize protection levels and behaviors
- 🔒 **Privacy First** - 100% local processing, no data sent to servers

### Enterprise Ready
- 🏢 **Group Policy Support** - Deploy via GPO or MDM
- 📋 **Managed Configuration** - Centralized policy management
- 📊 **Compliance Logging** - Detailed audit trails for compliance
- 🌐 **Domain Whitelisting** - Different rules for internal vs external sites

## 🚀 Quick Start

### For Users

**Option 1: Install from Release**
1. Download the latest release from [Releases](https://github.com/wisemanIV/vigil/releases)
2. Extract the ZIP file
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top-right)
5. Click "Load unpacked" and select the extracted folder

**Option 2: Build from Source**
```bash