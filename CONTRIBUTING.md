# Contributing to Vigil

Thank you for your interest in contributing to Vigil! 🎉

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to make software better.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs. actual behavior**
- **Screenshots if applicable**
- **Environment** (Chrome version, OS, extension version)

### Suggesting Features

Feature requests are welcome! Please:

- **Check if it's already suggested**
- **Explain the use case**
- **Describe the expected behavior**
- **Consider privacy implications**

### Pull Requests

1. **Fork & Clone**
```bash
   git clone https://github.com/yourusername/vigil.git
```

2. **Create Branch**
```bash
   git checkout -b feature/my-feature
```

3. **Make Changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test**
   - Build the extension: `npm run build`
   - Load in Chrome and test thoroughly
   - Test edge cases

5. **Commit**
```bash
   git commit -m "Add: Brief description of changes"
```
   
   Use prefixes:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for improvements
   - `Remove:` for deletions
   - `Docs:` for documentation

6. **Push & PR**
```bash
   git push origin feature/my-feature
```
   Then open a Pull Request on GitHub.

## Development Guidelines

### Code Style

- Use meaningful variable names
- Keep functions focused and small
- Add JSDoc comments for public functions
- Use `console.log` with `[Vigil]` prefix for debugging

Example:
```javascript
/**
 * Analyzes content for sensitive data
 * @param {string} content - The content to analyze
 * @param {Object} context - Context information (url, domain, etc.)
 * @returns {Promise<Object>} Analysis result with allowed/blocked decision
 */
async function analyze(content, context) {
    // Implementation
}
```

### Testing Checklist

Before submitting a PR, test:

- [ ] Paste detection works on multiple sites
- [ ] File upload detection works
- [ ] No console errors
- [ ] Extension doesn't slow down browsing
- [ ] Notifications appear correctly
- [ ] Blocked content is actually blocked

### Adding New Patterns

When adding new detection patterns to `tf-analyzer.js`:
```javascript
newPattern: {
    regex: /your-pattern/g,
    severity: 'critical', // 'critical', 'high', 'medium', 'low'
    category: 'category',  // 'financial', 'credentials', 'pii', etc.
    validator: this.optionalValidationFunction // Optional
}
```

## Project Structure
```
src/
├── analyzers/          # Detection and analysis logic
├── monitors/           # Event monitoring (paste, upload)
├── background.js       # Service worker
└── content.js         # Content script injected into pages
```

## Questions?

- Open a [Discussion](https://github.com/yourusername/vigil/discussions)
- Comment on relevant issues
- Reach out via email: contributors@yourproject.com

Thank you for contributing! 🙏
