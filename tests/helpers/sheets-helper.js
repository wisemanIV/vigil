export class SheetsHelper {
    constructor(page) {
        this.page = page;
    }
    
    async createNewSheet() {
        // Navigate to create new sheet
        await this.page.goto('https://docs.google.com/spreadsheets/create', { 
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        console.log('[Sheets Helper] Created new sheet');
    }
    
    async waitForLoaded() {
        try {
            // Wait for the spreadsheet grid to load
            await this.page.waitForSelector('.docs-sheet-container', { timeout: 15000 });
            await this.page.waitForTimeout(2000); // Extra wait for full load
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
        
        await this.page.waitForTimeout(500);
    }
    
    async pasteContent(content) {
        // Write to clipboard
        await this.page.evaluate((text) => {
            navigator.clipboard.writeText(text);
        }, content);
        
        await this.page.waitForTimeout(200);
        
        // Paste with Ctrl+V / Cmd+V
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
        console.log('[Sheets Helper] Pasted content');
    }
    
    async getCellValue(row = 0, col = 0) {
        await this.clickCell(row, col);
        
        // Get value from formula bar
        const formulaBar = await this.page.$('#t-formula-bar-input');
        if (formulaBar) {
            const value = await this.page.evaluate(el => el.value, formulaBar);
            return value;
        }
        
        // Fallback: try to get from active cell
        const activeCell = await this.page.$('div[role="gridcell"][class*="cell-selected"]');
        if (activeCell) {
            const value = await this.page.evaluate(el => el.textContent, activeCell);
            return value;
        }
        
        return '';
    }
    
    async clearCell(row = 0, col = 0) {
        await this.clickCell(row, col);
        await this.page.keyboard.press('Delete');
        await this.page.waitForTimeout(300);
        console.log(`[Sheets Helper] Cleared cell [${row},${col}]`);
    }
}
