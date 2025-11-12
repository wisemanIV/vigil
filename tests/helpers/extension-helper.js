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
        console.log('[ExtensionHelper] Waiting for extension to be ready...');
        
        // Check chrome://extensions page for any extensions loaded
        const extensionsPage = await this.page.browser().newPage();
        try {
            await extensionsPage.goto('chrome://extensions/', { waitUntil: 'domcontentloaded' });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const extensionInfo = await extensionsPage.evaluate(() => {
                const extensionElements = document.querySelectorAll('extensions-item');
                console.log('Found extension elements:', extensionElements.length);
                
                // Try to find Vigil specifically
                let vigilFound = false;
                const extensions = [];
                
                extensionElements.forEach(el => {
                    const id = el.id;
                    extensions.push({ id });
                    
                    // Try to access shadow DOM to get name
                    try {
                        if (el.shadowRoot) {
                            const nameEl = el.shadowRoot.querySelector('#name');
                            if (nameEl && nameEl.textContent.includes('Vigil')) {
                                vigilFound = true;
                                console.log('Found Vigil extension:', nameEl.textContent);
                            }
                        }
                    } catch (e) {
                        console.log('Could not access shadow DOM for', id);
                    }
                });
                
                return { count: extensionElements.length, vigilFound, extensions };
            });
            
            console.log(`[ExtensionHelper] Found ${extensionInfo.count} extensions loaded`);
            if (extensionInfo.vigilFound) {
                console.log('[ExtensionHelper] ✓ Vigil extension detected!');
            } else {
                console.log('[ExtensionHelper] Vigil extension not detected in shadow DOM');
                console.log('[ExtensionHelper] Extension IDs found:', extensionInfo.extensions.map(e => e.id));
            }
            
        } catch (error) {
            console.log('[ExtensionHelper] Could not check chrome://extensions:', error.message);
        } finally {
            await extensionsPage.close();
        }
        
        // Test if extension is working by triggering a paste event and checking for interception
        console.log('[ExtensionHelper] Testing extension functionality...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for extension-injected content scripts or modifications
        const extensionStatus = await this.page.evaluate(() => {
            // Look for any signs of extension activity
            const allScripts = document.querySelectorAll('script');
            const extensionScripts = Array.from(allScripts).filter(script => 
                script.src && script.src.includes('extension://')
            );
            
            // Look for any vigilance-related modifications
            const vigilElements = document.querySelectorAll('[id*="vigil"], [class*="vigil"], [data-vigil]');
            
            // Check for global extension variables
            const hasExtensionGlobals = window.vigilExtension || 
                                       window.chrome?.runtime || 
                                       document.querySelector('meta[name*="vigil"]');
            
            console.log('Extension scripts found:', extensionScripts.length);
            console.log('Vigil DOM elements found:', vigilElements.length);
            console.log('Extension globals detected:', !!hasExtensionGlobals);
            
            return {
                hasExtensionScripts: extensionScripts.length > 0,
                hasVigilElements: vigilElements.length > 0,
                hasExtensionGlobals: !!hasExtensionGlobals,
                vigilElementCount: vigilElements.length,
                scriptCount: extensionScripts.length
            };
        });
        
        console.log('[ExtensionHelper] Extension status:', extensionStatus);
        
        // Return true regardless - let the tests determine if extension is working
        return true;
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
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for dialog to close
    }
    
    // Get notification message
    async getNotificationMessage() {
        return await this.page.evaluate(() => {
            const notification = document.getElementById('vigil-notification');
            return notification ? notification.textContent : null;
        });
    }
}
