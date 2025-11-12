// ui/confirmation-dialog.js

import { GlobalConfig } from '../config/global-config.js';

const confirmationDialog = {
    show: async function({ title, message, findings, type }) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.id = 'vigil-confirmation-overlay';
            
            // Helper function to calculate score for findings without explicit scores
            const calculateScore = (finding) => {
                // Return existing score if available
                if (finding.score || finding.adjustedScore) {
                    return finding.score || finding.adjustedScore;
                }
                
                // Calculate score based on severity and type
                const severityScores = {
                    'critical': 20,
                    'high': 15,
                    'medium': 10,
                    'low': 5
                };
                
                const typeScores = {
                    'creditCard': 25,
                    'ssn': 25,
                    'awsKey': 24,
                    'privateKey': 24,
                    'apiKey': 22,
                    'password': 20,
                    'financial_business_data': 20,
                    'strategic_business_content': 19,
                    'organizational_data': 18,
                    'bulk_pii': 18,
                    'high_context_sensitivity': 17,
                    'product_development_content': 16,
                    'bulk_email_addresses': 16,
                    'bulk_phone_numbers': 16,
                    'content_classification': 12,
                    'semantic_similarity': 10,
                    'email': 8,
                    'phone': 8,
                    'ipAddress': 3
                };
                
                // Use type-specific score or severity-based score
                let baseScore = typeScores[finding.type] || severityScores[finding.severity] || 5;
                
                // Adjust for count/frequency
                if (finding.count && finding.count > 1) {
                    baseScore += Math.min(finding.count * 2, 10); // Cap bonus at 10
                }
                
                return baseScore;
            };
            
            // Sort findings by severity (most serious first)
            const sortedFindings = [...findings].sort((a, b) => {
                const scoreA = calculateScore(a);
                const scoreB = calculateScore(b);
                return scoreB - scoreA; // Descending order (highest score first)
            });
            
            // Create findings items with detailed risk categorization
            const findingsHTML = sortedFindings.map(finding => {
                // Enhanced icon mapping for specific detection types
                const icons = {
                    // Pattern-based detections
                    'creditCard': '💳',
                    'ssn': '🆔',
                    'awsKey': '🔐',
                    'apiKey': '🔐',
                    'privateKey': '🔑',
                    'password': '🔑',
                    'email': '📧',
                    'phone': '📱',
                    'ipAddress': '🌐',
                    
                    // Bulk data detections
                    'bulk_email_addresses': '📧',
                    'bulk_phone_numbers': '📱',
                    'Structured Data Export': '📊',
                    'bulk_pii': '👥',
                    
                    // Content classification
                    'content_classification': '🏷️',
                    'semantic_similarity': '🧠',
                    
                    // Proprietary data types
                    'strategic_business_content': '🎯',
                    'product_development_content': '🚀',
                    'financial_business_data': '💰',
                    'organizational_data': '👥',
                    'high_context_sensitivity': '🔐',
                    
                    // File metadata
                    'file_metadata': '📄',
                    'identifier_presence': '🆔',
                    'temporal_sensitivity': '⏱️',
                    'competitive_impact': '⚔️',
                    'legal_risk': '⚖️',
                    
                    // Fallback categories
                    'credentials': '🔑',
                    'pii': '👤',
                    'financial': '💰',
                    'personal_data': '👤',
                    'low_risk_content': '🔍',
                    'default': '⚠️'
                };
                
                // Enhanced label mapping with specific detection types
                const labels = {
                    // Pattern-based detections (specific types)
                    'creditCard': 'Credit Card Number',
                    'ssn': 'Social Security Number',
                    'awsKey': 'AWS Access Key',
                    'apiKey': 'API Key',
                    'privateKey': 'Private Key',
                    'password': 'Password',
                    'email': 'Email Address',
                    'phone': 'Phone Number',
                    'ipAddress': 'IP Address',
                    
                    // Bulk data detections
                    'bulk_email_addresses': 'Multiple Email Addresses',
                    'bulk_phone_numbers': 'Multiple Phone Numbers',
                    'Structured Data Export': 'Structured Data Export',
                    'bulk_pii': 'Bulk Personal Data',
                    
                    // Content classification
                    'content_classification': 'Content Classification',
                    'semantic_similarity': 'Semantic Analysis',
                    
                    // Proprietary data types
                    'strategic_business_content': 'Strategic Business Content',
                    'product_development_content': 'Product Development Information',
                    'financial_business_data': 'Financial Business Data',
                    'organizational_data': 'Organizational Information',
                    'high_context_sensitivity': 'Highly Sensitive Context',
                    
                    // File metadata
                    'file_metadata': 'File Metadata Risk',
                    'identifier_presence': 'Business Identifiers',
                    'temporal_sensitivity': 'Time-Sensitive Data',
                    'competitive_impact': 'Competitive Information',
                    'legal_risk': 'Legal/Regulatory Risk',
                    
                    // Fallback categories
                    'credentials': 'Login Credentials',
                    'pii': 'Personal Information',
                    'financial': 'Financial Data',
                    'personal_data': 'Personal Information',
                    'low_risk_content': 'Low Risk Content'
                };

                // Determine risk level and color based on score
                const getRiskLevel = (score) => {
                    if (score >= 15) return { level: 'HIGH', color: '#dc2626', bgColor: '#fee2e2' };
                    if (score >= 8) return { level: 'MEDIUM', color: '#d97706', bgColor: '#fef3c7' };
                    return { level: 'LOW', color: '#059669', bgColor: '#d1fae5' };
                };
                
                // Get appropriate label and icon
                let label = labels[finding.type] || labels[finding.category] || 'Sensitive Information';
                let icon = icons[finding.type] || icons[finding.category] || icons['default'];
                
                // Handle content classification specially
                if (finding.type === 'content_classification' && finding.classification) {
                    label = `${finding.classification} Content`;
                    icon = '🏷️';
                }
                
                // Handle proprietary data types with detailed information
                if (finding.type === 'strategic_business_content' && finding.categories) {
                    const categoryDetails = finding.categories.join(', ');
                    label = `Strategic Content (${categoryDetails})`;
                } else if (finding.type === 'product_development_content' && finding.categories) {
                    const categoryDetails = finding.categories.join(', ');
                    label = `Product Development (${categoryDetails})`;
                } else if (finding.type === 'financial_business_data' && finding.categories) {
                    const categoryDetails = finding.categories.join(', ');
                    label = `Financial Data (${categoryDetails})`;
                } else if (finding.type === 'organizational_data' && finding.categories) {
                    const categoryDetails = finding.categories.join(', ');
                    label = `Organizational Data (${categoryDetails})`;
                } else if (finding.type === 'high_context_sensitivity' && finding.indicators) {
                    const indicatorDetails = finding.indicators.slice(0, 2).join(', ');
                    label = `Sensitive Context (${indicatorDetails})`;
                }
                
                // Add count or matches info if available
                if (finding.count && finding.count > 1) {
                    label += ` (${finding.count} found)`;
                } else if (finding.matches && finding.matches > 1) {
                    label += ` (${finding.matches} matches)`;
                }
                
                // Get score and risk level
                const score = calculateScore(finding);
                const risk = getRiskLevel(score);
                
                // Create risk badge if score is available
                const riskBadge = score > 0 ? 
                    `<span class="vigil-risk-badge" style="background-color: ${risk.bgColor}; color: ${risk.color};">
                        ${risk.level}
                    </span>` : '';
                
                // Show sample matches if available
                let sampleInfo = '';
                if (finding.sample && finding.sample.length > 0) {
                    const sampleText = Array.isArray(finding.sample) 
                        ? finding.sample.slice(0, 2).join('", "')
                        : finding.sample;
                    sampleInfo = `<div class="vigil-sample">Found: "${sampleText}${finding.sample.length > 2 ? '...' : ''}"</div>`;
                }
                
                return `
                    <div class="vigil-finding-item" style="border-left: 3px solid ${risk.color};">
                        <div class="vigil-finding-header">
                            <span class="vigil-finding-icon">${icon}</span>
                            <span class="vigil-finding-label">${label}</span>
                            ${riskBadge}
                        </div>
                        ${sampleInfo}
                    </div>
                `;
            }).join('');
            
            overlay.innerHTML = `
                <div class="vigil-modal">
                    <div class="vigil-modal-header">
                        <div class="vigil-icon-circle">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h2 class="vigil-modal-title">Sensitive Data Detected</h2>
                        <p class="vigil-modal-subtitle">
                            This content may contain information that is against our 
                            <a href="${GlobalConfig.getDataProtectionPolicyUrl()}" target="_blank" class="vigil-policy-inline-link">
                                data protection policy
                            </a>.
                        </p>
                    </div>
                    
                    <div class="vigil-modal-body">
                        <div class="vigil-findings">
                            ${findingsHTML}
                        </div>
                    </div>
                    
                    <div class="vigil-modal-footer">
                        <div class="vigil-button-group">
                            <button class="vigil-btn vigil-btn-secondary" id="vigil-allow">
                                Allow Anyway
                            </button>
                            <button class="vigil-btn vigil-btn-primary" id="vigil-block">
                                Block
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                #vigil-confirmation-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2147483647;
                    animation: vigil-fadeIn 0.2s ease-out;
                }
                
                @keyframes vigil-fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes vigil-slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .vigil-modal {
                    background: white;
                    border-radius: 16px;
                    max-width: 440px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: vigil-slideUp 0.3s ease-out;
                    overflow: hidden;
                }
                
                .vigil-modal-header {
                    padding: 32px 32px 24px;
                    text-align: center;
                }
                
                .vigil-icon-circle {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    color: white;
                }
                
                .vigil-modal-title {
                    font-size: 24px;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin: 0 0 8px 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .vigil-modal-subtitle {
                    font-size: 15px;
                    color: #666;
                    margin: 0;
                    line-height: 1.5;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .vigil-modal-body {
                    padding: 0 32px 24px;
                }
                
                .vigil-findings {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                }
                
                .vigil-finding-item {
                    padding: 12px;
                    background: white;
                    border-radius: 8px;
                    font-size: 14px;
                    color: #333;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin-bottom: 8px;
                    border-left-width: 3px;
                    border-left-style: solid;
                }
                
                .vigil-finding-item:last-child {
                    margin-bottom: 0;
                }
                
                .vigil-finding-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    justify-content: space-between;
                    flex-wrap: wrap;
                }
                
                .vigil-finding-icon {
                    font-size: 20px;
                    line-height: 1;
                    flex-shrink: 0;
                }
                
                .vigil-finding-label {
                    font-weight: 500;
                    flex-grow: 1;
                    min-width: 0;
                }
                
                .vigil-risk-badge {
                    font-size: 12px;
                    font-weight: 600;
                    padding: 4px 8px;
                    border-radius: 12px;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                
                .vigil-sample {
                    margin-top: 8px;
                    font-size: 12px;
                    color: #666;
                    font-style: italic;
                    padding: 6px 8px;
                    background: #f9fafb;
                    border-radius: 4px;
                    border: 1px solid #e5e7eb;
                }
                
                .vigil-modal-footer {
                    padding: 24px 32px 32px;
                }
                
                .vigil-policy-inline-link {
                    color: #667eea;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    border-bottom: 1px solid rgba(102, 126, 234, 0.3);
                }
                
                .vigil-policy-inline-link:hover {
                    color: #764ba2;
                    border-bottom-color: #764ba2;
                }
                
                .vigil-button-group {
                    display: flex;
                    gap: 12px;
                }
                
                .vigil-btn {
                    flex: 1;
                    padding: 14px 24px;
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .vigil-btn-secondary {
                    background: #f3f4f6;
                    color: #374151;
                }
                
                .vigil-btn-secondary:hover {
                    background: #e5e7eb;
                    transform: translateY(-1px);
                }
                
                .vigil-btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .vigil-btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }
                
                .vigil-btn:active {
                    transform: translateY(0);
                }
            `;
            
            document.head.appendChild(style);
            document.body.appendChild(overlay);
            
            // Event handlers
            const allowBtn = overlay.querySelector('#vigil-allow');
            const blockBtn = overlay.querySelector('#vigil-block');
            
            const cleanup = () => {
                overlay.style.animation = 'vigil-fadeIn 0.2s ease-out reverse';
                setTimeout(() => {
                    overlay.remove();
                    style.remove();
                }, 200);
            };
            
            allowBtn.addEventListener('click', () => {
                cleanup();
                resolve({ allowed: true });
            });
            
            blockBtn.addEventListener('click', () => {
                cleanup();
                resolve({ allowed: false });
            });
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve({ allowed: false });
                }
            });
        });
    },
    
    checkStoredPreference: function(type) {
        // No longer storing preferences
        return null;
    }
};

export default confirmationDialog;