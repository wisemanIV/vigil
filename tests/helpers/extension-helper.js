import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ExtensionHelper {
    constructor(page) {
        this.page = page;
    }
    
    // Load extension in browser
    static async loadExtension(browser) {
        const extensionPath = path.join(__dirname, '../../'); // Root of extension
        
        // Get background page
        const targets = await browser.targets();
        const extensionTarget = targets.find(target => 
            target.type() === 'background_page' || 
            target.type() === 'service_worker'
        );
        
        const backgroundPage = extensionTarget ? await extensionTarget.page() : null;
        
        return { extensionPath, backgroundPage };
    }
    
    // Wait for extension to be ready
    async waitForExtensionReady(timeout = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const ready = await this.page.evaluate(() => {
                return new Promise((resolve) => {
                    if (window.chrome && window.chrome.runtime) {
                        chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
                            resolve(response?.ready || false);
                        });
                    } else {
                        resolve(false);
                    }
                });
            });
            
            if (ready) return true;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        throw new Error('Extension not ready after timeout');
    }
    
    // Check if Vigil dialog is visible
    async isVigilDialogVisible() {
        return await this.page.evaluate(() => {
            const overlay = document.getElementById('vigil-confirmation-overlay');
            return overlay !== null && overlay.style.display !== 'none';
        });
    }
    
    // Get dialog findings
    async getDialogFindings() {
        return await this.page.evaluate(() => {
            const findings = document.querySelectorAll('.vigil-finding-label');
            return Array.from(findings).map(f => f.textContent);
        });
    }
    
    // Click dialog button
    async clickDialogButton(buttonType) {
        const selector = buttonType === 'allow' ? '#vigil-allow' : '#vigil-block';
        await this.page.waitForSelector(selector, { timeout: 5000 });
        await this.page.click(selector);
        await this.page.waitForTimeout(500); // Wait for dialog to close
    }
    
    // Get notification message
    async getNotificationMessage() {
        return await this.page.evaluate(() => {
            const notification = document.getElementById('vigil-notification');
            return notification ? notification.textContent : null;
        });
    }
}
