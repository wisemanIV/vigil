// ui/confirmation-dialog.js

const confirmationDialog = {
    show: async function({ title, message, findings, type }) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.id = 'vigil-confirmation-overlay';
            
            // Create findings items with proper mappings
            const findingsHTML = findings.map(finding => {
                const icons = {
                    'credentials': '🔑',
                    'api_key': '🔐',
                    'api_keys': '🔐',
                    'personal_data': '👤',
                    'pii': '👤',
                    'bulk_pii': '📧',
                    'financial': '💳',
                    'email': '📧',
                    'bulk_email_addresses': '📧',
                    'ssn': '🆔',
                    'credit_card': '💳',
                    'phone': '📱',
                    'default': '⚠️'
                };
                
                const labels = {
                    'credentials': 'Login Credentials',
                    'api_key': 'API Key',
                    'api_keys': 'API Keys',
                    'personal_data': 'Personal Information',
                    'pii': 'Personal Information',
                    'bulk_pii': 'Bulk Personal Data',
                    'financial': 'Financial Data',
                    'email': 'Email Address',
                    'bulk_email_addresses': 'Multiple Email Addresses',
                    'ssn': 'Social Security Number',
                    'credit_card': 'Credit Card',
                    'phone': 'Phone Number',
                    'Structured Data Export': 'Structured Data Export'
                };
                
                // Get label and icon based on type first, then category as fallback
                let label = labels[finding.type] || labels[finding.category] || 'Sensitive Information';
                let icon = icons[finding.type] || icons[finding.category] || icons['default'];
                
                // Add count if available
                if (finding.count && finding.count > 1) {
                    label += ` (${finding.count} found)`;
                }
                
                return `
                    <div class="vigil-finding-item">
                        <span class="vigil-finding-icon">${icon}</span>
                        <span class="vigil-finding-label">${label}</span>
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
                        <p class="vigil-modal-subtitle">This content may contain information that shouldn't be shared</p>
                    </div>
                    
                    <div class="vigil-modal-body">
                        <div class="vigil-findings">
                            ${findingsHTML}
                        </div>
                    </div>
                    
                    <div class="vigil-modal-footer">
                        <div class="vigil-button-group">
                            <button class="vigil-btn vigil-btn-secondary" id="vigil-block">
                                Block
                            </button>
                            <button class="vigil-btn vigil-btn-primary" id="vigil-allow">
                                Allow Anyway
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
                    gap: 12px;
                }
                
                .vigil-finding-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    background: white;
                    border-radius: 8px;
                    font-size: 14px;
                    color: #333;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .vigil-finding-icon {
                    font-size: 20px;
                    line-height: 1;
                }
                
                .vigil-finding-label {
                    font-weight: 500;
                }
                
                .vigil-modal-footer {
                    padding: 24px 32px 32px;
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