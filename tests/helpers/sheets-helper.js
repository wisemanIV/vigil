export class SheetsHelper {
    constructor(page) {
        this.page = page;
    }
    
    async login() {
        const email = process.env.GOOGLE_EMAIL;
        const password = process.env.GOOGLE_PASSWORD;
        
        if (!email) {
            throw new Error('GOOGLE_EMAIL environment variable is required');
        }
        
        console.log('[Sheets Helper] Starting login process');
        
        // Add some random delay to appear more human
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
        
        // Go to Google Sheets sign-in
        await this.page.goto('https://accounts.google.com/signin', { 
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Add human-like delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
        
        // Enter email with human-like typing
        await this.page.waitForSelector('input[type="email"]', { timeout: 15000 });
        
        // Check for CAPTCHA on email page first
        await new Promise(resolve => setTimeout(resolve, 2000));
        const emailCaptcha = await this.page.$('#captcha, .captcha, [data-captcha], iframe[src*="recaptcha"], [role="presentation"][src*="recaptcha"]');
        if (emailCaptcha) {
            console.log('[Sheets Helper] CAPTCHA detected on email page - manual intervention required');
            console.log('[Sheets Helper] Please solve the CAPTCHA manually and continue...');
            // Wait longer for user to solve CAPTCHA
            await new Promise(resolve => setTimeout(resolve, 60000));
        }
        
        const emailInput = await this.page.$('input[type="email"]');
        await emailInput.click();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 500));
        
        // Type email character by character with random delays (even slower to appear more human)
        for (let i = 0; i < email.length; i++) {
            await this.page.keyboard.type(email[i]);
            await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
        
        // Check for CAPTCHA again before clicking Next
        const captchaBeforeNext = await this.page.$('#captcha, .captcha, [data-captcha], iframe[src*="recaptcha"]');
        if (captchaBeforeNext) {
            console.log('[Sheets Helper] CAPTCHA appeared after email entry - manual intervention required');
            console.log('[Sheets Helper] Please solve the CAPTCHA manually before we proceed...');
            // Wait for user to solve CAPTCHA
            await new Promise(resolve => setTimeout(resolve, 60000));
        }
        
        await this.page.click('#identifierNext');
        
        // Wait for password field and enter password (if provided)
        if (password) {
            try {
                // Wait to see what Google shows us
                await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 3000));
                
                // Check for CAPTCHA first
                const captchaElement = await this.page.$('#captcha, .captcha, [data-captcha], iframe[src*="recaptcha"]');
                if (captchaElement) {
                    console.log('[Sheets Helper] CAPTCHA detected - manual intervention required');
                    console.log('[Sheets Helper] Please solve the CAPTCHA manually...');
                    // Wait for user to solve CAPTCHA
                    await new Promise(resolve => setTimeout(resolve, 30000));
                }
                
                // Check if we see "Try another way" or similar button using text content
                const tryAnotherWay = await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button, [role="button"], span[role="button"], div[role="button"]'));
                    return buttons.find(btn => {
                        const text = btn.textContent?.toLowerCase() || '';
                        return text.includes('try another way') || 
                               text.includes('use your password') || 
                               text.includes('more options') ||
                               text.includes('different method') ||
                               text.includes('password') ||
                               text.includes('other way');
                    });
                });
                
                if (tryAnotherWay) {
                    console.log('[Sheets Helper] Found "Try another way" button, clicking it');
                    // Add mouse movement before clicking
                    const box = await tryAnotherWay.boundingBox();
                    if (box) {
                        await this.page.mouse.move(box.x + box.width/2, box.y + box.height/2);
                        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
                    }
                    await this.page.evaluate((button) => button.click(), tryAnotherWay);
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 2000));
                }
                
                // Now wait for password field
                await this.page.waitForSelector('input[type="password"]', { timeout: 15000 });
                await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
                
                // Click password field and type with human-like behavior
                const passwordInput = await this.page.$('input[type="password"]');
                await passwordInput.click();
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Type password character by character with random delays
                for (let i = 0; i < password.length; i++) {
                    await this.page.keyboard.type(password[i]);
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 120 + 80));
                }
                
                await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
                
                // Look for the correct next button with multiple selectors
                const nextButtonSelectors = [
                    '#passwordNext',
                    'button[type="submit"]',
                    '[data-action="sign in"]',
                    '[role="button"][jsname]',
                    'button[jsname]'
                ];
                
                let nextButton = null;
                for (const selector of nextButtonSelectors) {
                    nextButton = await this.page.$(selector);
                    if (nextButton) {
                        console.log(`[Sheets Helper] Found next button with selector: ${selector}`);
                        break;
                    }
                }
                
                // If no button found by selector, try finding by text content
                if (!nextButton) {
                    nextButton = await this.page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
                        return buttons.find(btn => {
                            const text = btn.textContent?.toLowerCase() || '';
                            return text.includes('next') || text.includes('continue') || text.includes('sign in');
                        });
                    });
                }
                
                if (nextButton) {
                    // Add mouse movement before clicking
                    const box = await nextButton.boundingBox();
                    if (box) {
                        await this.page.mouse.move(box.x + box.width/2, box.y + box.height/2);
                        await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
                    }
                    await nextButton.click();
                } else {
                    // Last resort: try keyboard enter
                    await this.page.keyboard.press('Enter');
                }
                
                // Wait for potential 2FA or final redirect
                await new Promise(resolve => setTimeout(resolve, 5000));
                
            } catch (error) {
                console.log('[Sheets Helper] Login error:', error.message);
                console.log('[Sheets Helper] Continuing with manual intervention...');
                // Continue anyway in case user wants to manually complete
            }
        } else {
            console.log('[Sheets Helper] Waiting for manual password entry...');
            // Wait for user to manually enter password and continue
            await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
        }
        
        console.log('[Sheets Helper] Login completed');
    }
    
    async createNewSheet() {
        try {
            // Add delay after login
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check current URL first
            const currentUrl = this.page.url();
            console.log('[Sheets Helper] Current URL after login:', currentUrl);
            
            // Navigate to create new sheet
            console.log('[Sheets Helper] Navigating to create new sheet...');
            await this.page.goto('https://docs.google.com/spreadsheets/create', { 
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            // Check final URL
            const finalUrl = this.page.url();
            console.log('[Sheets Helper] Final URL:', finalUrl);
            console.log('[Sheets Helper] Created new sheet');
        } catch (error) {
            console.log('[Sheets Helper] Error creating sheet:', error.message);
            // Try alternative approach - go to sheets home first
            await this.page.goto('https://docs.google.com/spreadsheets/', { 
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.page.goto('https://docs.google.com/spreadsheets/create', { 
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            console.log('[Sheets Helper] Created new sheet (fallback method)');
        }
    }
    
    async waitForLoaded() {
        try {
            // Wait for the spreadsheet grid to load
            await this.page.waitForSelector('.docs-sheet-container', { timeout: 15000 });
            await new Promise(resolve => setTimeout(resolve, 2000)); // Extra wait for full load
            console.log('[Sheets Helper] Google Sheets loaded');
            return true;
        } catch (error) {
            console.error('[Sheets Helper] Failed to load:', error);
            return false;
        }
    }
    
    async clickCell(row = 0, col = 0) {
        // Wait for grid
        await this.page.waitForSelector('.docs-sheet-container');
        
        // Google Sheets cells are in a complex structure
        // Try to click the first cell
        const cellSelector = `div[role="gridcell"][aria-rowindex="${row + 1}"][aria-colindex="${col + 1}"]`;
        
        try {
            await this.page.waitForSelector(cellSelector, { timeout: 5000 });
            await this.page.click(cellSelector);
            console.log(`[Sheets Helper] Clicked cell [${row},${col}]`);
        } catch (error) {
            // Fallback: click anywhere in the sheet and navigate with arrow keys
            await this.page.click('.docs-sheet-container');
            
            // Navigate to top-left
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('Home');
            await this.page.keyboard.up('Control');
            
            // Navigate to desired cell
            for (let i = 0; i < row; i++) {
                await this.page.keyboard.press('ArrowDown');
            }
            for (let i = 0; i < col; i++) {
                await this.page.keyboard.press('ArrowRight');
            }
            
            console.log(`[Sheets Helper] Navigated to cell [${row},${col}]`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    async pasteContent(content) {
        try {
            // Use the same ClipboardEvent approach as ChatGPT helper
            const result = await this.page.evaluate((text) => {
                console.log('[Sheets Helper] Starting paste evaluation with text length:', text.length);
                
                // Dispatch paste event on document since Google Sheets uses complex UI
                // The extension listens for paste events with capture=true on document
                const pasteEvent = new ClipboardEvent('paste', {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: new DataTransfer()
                });
                
                // Set clipboard data
                pasteEvent.clipboardData.setData('text/plain', text);
                
                console.log('[Vigil] Dispatching paste event on document');
                
                // Dispatch the event on document (this is what the extension listens for)
                const eventResult = document.dispatchEvent(pasteEvent);
                console.log('[Vigil] Paste event dispatched on document, not prevented:', eventResult);
                
                // For Google Sheets, check for dialog after a delay
                setTimeout(() => {
                    const hasDialog = document.getElementById('vigil-confirmation-overlay');
                    if (!hasDialog) {
                        console.log('[Vigil] No dialog detected, paste should proceed in Sheets');
                    } else {
                        console.log('[Vigil] Dialog detected in Sheets, extension intercepted paste');
                    }
                }, 500);
                
                return eventResult;
            }, content);
            
            console.log('[Sheets Helper] Page evaluate result:', result);
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('[Sheets Helper] Pasted content');
        } catch (error) {
            console.error('[Sheets Helper] Paste failed:', error);
            throw error;
        }
    }
    
    async getCellValue(row = 0, col = 0) {
        await this.clickCell(row, col);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            // Try multiple methods to get cell value
            
            // Method 1: Formula bar
            const formulaBar = await this.page.$('#t-formula-bar-input');
            if (formulaBar) {
                const value = await this.page.evaluate(el => el.value, formulaBar);
                if (value) return value;
            }
            
            // Method 2: Active cell with various selectors
            const activeCellSelectors = [
                'div[role="gridcell"].cell-selected',
                'div[role="gridcell"][class*="selected"]',
                'div[role="gridcell"][aria-selected="true"]'
            ];
            
            for (const selector of activeCellSelectors) {
                const activeCell = await this.page.$(selector);
                if (activeCell) {
                    const value = await this.page.evaluate(el => el.textContent?.trim() || '', activeCell);
                    if (value) return value;
                }
            }
            
            // Method 3: Use keyboard to select all and copy
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const clipboardValue = await this.page.evaluate(async () => {
                try {
                    return await navigator.clipboard.readText();
                } catch (error) {
                    return '';
                }
            });
            
            return clipboardValue || '';
            
        } catch (error) {
            console.error('[Sheets Helper] Error getting cell value:', error);
            return '';
        }
    }
    
    async clearCell(row = 0, col = 0) {
        await this.clickCell(row, col);
        await this.page.keyboard.press('Delete');
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log(`[Sheets Helper] Cleared cell [${row},${col}]`);
    }
}
