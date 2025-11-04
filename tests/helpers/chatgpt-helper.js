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
            // Wait for the main prompt textarea
            await this.page.waitForSelector('textarea[placeholder*="Message"]', { timeout: 10000 });
            console.log('[ChatGPT Helper] ChatGPT interface loaded');
            return true;
        } catch (error) {
            console.error('[ChatGPT Helper] Failed to load:', error);
            return false;
        }
    }
    
    async getPromptTextarea() {
        // ChatGPT uses a contenteditable div or textarea
        const selectors = [
            'textarea[data-id="root"]',
            'textarea#prompt-textarea',
            'textarea[placeholder*="Message"]',
            'div[contenteditable="true"]'
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
        await this.page.waitForTimeout(500);
        console.log('[ChatGPT Helper] Focused prompt input');
    }
    
    async pasteContent(content) {
        await this.focusPromptInput();
        
        // Write content to clipboard
        await this.page.evaluate((text) => {
            navigator.clipboard.writeText(text);
        }, content);
        
        await this.page.waitForTimeout(200);
        
        // Simulate Ctrl+V / Cmd+V
        const isMac = await this.page.evaluate(() => navigator.platform.includes('Mac'));
        
        if (isMac) {
            await this.page.keyboard.down('Meta');
            await this.page.keyboard.press('KeyV');
            await this.page.keyboard.up('Meta');
        } else {
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyV');
            await this.page.keyboard.up('Control');
        }
        
        await this.page.waitForTimeout(500);
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
        await this.page.waitForTimeout(300);
        console.log('[ChatGPT Helper] Cleared prompt');
    }
}
