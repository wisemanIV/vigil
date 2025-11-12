export class ChatGPTHelper {
    constructor(page) {
        this.page = page;
        this.baseUrl = 'https://chatgpt.com/';
    }
    
    async navigate() {
        await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
        console.log('[ChatGPT Helper] Navigated to ChatGPT');
    }
    
    async waitForLoaded() {
        try {
            // Handle cookie consent modal first
            await this.handleCookieConsent();
            
            // Wait for the main prompt input (updated selector for current ChatGPT)
            await this.page.waitForSelector('#prompt-textarea, div[contenteditable="true"]', { timeout: 10000 });
            console.log('[ChatGPT Helper] ChatGPT interface loaded');
            return true;
        } catch (error) {
            console.error('[ChatGPT Helper] Failed to load:', error);
            return false;
        }
    }
    
    async handleCookieConsent() {
        try {
            // Try the specific ChatGPT cookie button first
            const chatGPTCookieSelector = 'div.flex.items-center.justify-center:has-text("Accept all")';
            
            try {
                await this.page.waitForSelector(chatGPTCookieSelector, { timeout: 3000 });
                await this.page.click(chatGPTCookieSelector);
                console.log('[ChatGPT Helper] Accepted cookies using ChatGPT-specific selector');
                await new Promise(resolve => setTimeout(resolve, 1000));
                return;
            } catch (e) {
                // Try alternative approach
                const elements = await this.page.$$('div');
                for (let element of elements) {
                    const text = await this.page.evaluate(el => el.textContent, element);
                    if (text && text.trim() === 'Accept all') {
                        await element.click();
                        console.log('[ChatGPT Helper] Accepted cookies by text match');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return;
                    }
                }
            }
            
            // Fallback to common selectors
            const cookieSelectors = [
                'button[data-testid="accept-cookies"]',
                'button:contains("Accept")',
                'button:contains("Accept all")',
                '.cookie-consent button'
            ];
            
            for (const selector of cookieSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 1000 });
                    await this.page.click(selector);
                    console.log('[ChatGPT Helper] Accepted cookies with selector:', selector);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return;
                } catch (e) {
                    // Continue to next selector
                }
            }
            
            console.log('[ChatGPT Helper] No cookie consent modal found');
        } catch (error) {
            console.log('[ChatGPT Helper] Cookie consent handling failed:', error.message);
        }
    }
    
    async getPromptTextarea() {
        // ChatGPT uses a contenteditable div or textarea
        const selectors = [
            '#prompt-textarea',
            'div[contenteditable="true"]',
            'textarea[data-id="root"]',
            'textarea[placeholder*="Message"]'
        ];
        
        for (const selector of selectors) {
            const element = await this.page.$(selector);
            if (element) {
                console.log(`[ChatGPT Helper] Found input with selector: ${selector}`);
                return element;
            }
        }
        
        throw new Error('Could not find ChatGPT prompt input');
    }
    
    async focusPromptInput() {
        const textarea = await this.getPromptTextarea();
        await textarea.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[ChatGPT Helper] Focused prompt input');
    }
    
    async pasteContent(content) {
        await this.focusPromptInput();
        
        // Write content to clipboard first
        await this.page.evaluate((text) => {
            navigator.clipboard.writeText(text);
        }, content);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Trigger actual paste event that extensions can intercept
        const eventDispatched = await this.page.evaluate((text) => {
            const textarea = document.querySelector('#prompt-textarea');
            if (textarea) {
                // Focus first
                textarea.focus();
                
                // Create and dispatch a proper paste event
                const pasteEvent = new ClipboardEvent('paste', {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: new DataTransfer()
                });
                
                // Set clipboard data
                pasteEvent.clipboardData.setData('text/plain', text);
                
                // Dispatch the event
                const eventResult = textarea.dispatchEvent(pasteEvent);
                console.log('Paste event dispatched, not prevented:', eventResult);
                
                // Only manually set content if paste event was not prevented by extension
                // If extension shows a dialog, don't override it
                setTimeout(() => {
                    const hasDialog = document.getElementById('vigil-confirmation-overlay');
                    if (!hasDialog && (textarea.value === '' || textarea.textContent === '')) {
                        console.log('No content detected and no dialog, setting manually');
                        textarea.value = text;
                        textarea.textContent = text;
                        
                        // Trigger input event to notify any listeners
                        const inputEvent = new InputEvent('input', {
                            bubbles: true,
                            cancelable: false,
                            data: text
                        });
                        textarea.dispatchEvent(inputEvent);
                    } else if (hasDialog) {
                        console.log('Dialog detected, extension handling paste');
                    }
                }, 100);
                
                return eventResult;
            }
            return false;
        }, content);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[ChatGPT Helper] Pasted content');
    }
    
    async getPromptValue() {
        const textarea = await this.getPromptTextarea();
        
        // Try different methods to get value
        const value = await this.page.evaluate((el) => {
            if (el.value !== undefined) return el.value;
            if (el.textContent) return el.textContent;
            if (el.innerText) return el.innerText;
            return '';
        }, textarea);
        
        return value;
    }
    
    async clearPrompt() {
        const textarea = await this.getPromptTextarea();
        await textarea.click();
        
        // Select all and delete
        const isMac = await this.page.evaluate(() => navigator.platform.includes('Mac'));
        
        if (isMac) {
            await this.page.keyboard.down('Meta');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Meta');
        } else {
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
        }
        
        await this.page.keyboard.press('Backspace');
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('[ChatGPT Helper] Cleared prompt');
    }
}
