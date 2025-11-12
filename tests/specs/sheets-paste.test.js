import '../load-env.js';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { ExtensionHelper } from '../helpers/extension-helper.js';
import { DialogHelper } from '../helpers/dialog-helper.js';
import { SheetsHelper } from '../helpers/sheets-helper.js';
import { testDatasets } from '../test-data/dataset.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Vigil - Google Sheets Paste Detection', () => {
    let browser;
    let page;
    let extensionHelper;
    let dialogHelper;
    let sheetsHelper;
    
    beforeAll(async () => {
        const extensionPath = path.resolve(__dirname, '../../dist');
        console.log('[Test] Extension path:', extensionPath);
        
        // Use same browser config as ChatGPT tests
        browser = await puppeteer.launch({
            headless: false,
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--no-first-run',
                '--disable-features=VizDisplayCompositor',
                '--enable-extensions',
                '--disable-dev-shm-usage',
                '--disable-infobars',
                '--disable-notifications',
                '--ignore-certificate-errors',
                '--disable-component-extensions-with-background-pages',
                '--disable-default-apps',
                '--disable-background-timer-throttling'
            ],
            defaultViewport: {
                width: 1280,
                height: 800
            }
        });
        
        page = await browser.newPage();
        
        extensionHelper = new ExtensionHelper(page);
        dialogHelper = new DialogHelper(page);
        sheetsHelper = new SheetsHelper(page);
        
        // Access public test sheet directly with better error handling
        console.log('[Sheets Helper] Navigating to public test sheet...');
        
        try {
            await page.goto('https://docs.google.com/spreadsheets/d/1xSqXaxwxqHv4fYlXqYTrAxcTru5pIZjZmXsopsZDfhs/edit?usp=sharing', { 
                waitUntil: 'domcontentloaded',
                timeout: 45000 
            });
            
            // Wait for page to load and check for errors
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const currentUrl = page.url();
            console.log('[Sheets Helper] Current URL:', currentUrl);
            
            // Check if we got an error page
            const pageTitle = await page.title();
            console.log('[Sheets Helper] Page title:', pageTitle);
            
            if (pageTitle.includes('Error') || currentUrl.includes('error')) {
                throw new Error('Google Sheets returned an error page');
            }
            
            console.log('[Sheets Helper] Public test sheet loaded successfully');
            
        } catch (error) {
            console.log('[Sheets Helper] Error accessing sheet:', error.message);
            console.log('[Sheets Helper] Trying alternative approach...');
            
            // Fallback: try without URL parameters
            await page.goto('https://docs.google.com/spreadsheets/d/1xSqXaxwxqHv4fYlXqYTrAxcTru5pIZjZmXsopsZDfhs/', { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });
            await new Promise(resolve => setTimeout(resolve, 3000));
            console.log('[Sheets Helper] Fallback navigation completed');
        }
        
        // Wait for extension
        await extensionHelper.waitForExtensionReady();
        
        // Add delay to ensure extension fully initializes
        console.log('Waiting 30 seconds for extension to fully initialize...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        console.log('✓ Google Sheets test suite ready');
    }, 120000); // 2 minute timeout for login with new test account
    
    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    }, 10000);
    
    afterEach(async () => {
        // Clear cell between tests
        try {
            if (page && !page.isClosed()) {
                await sheetsHelper.clearCell(0, 0);
            }
        } catch (error) {
            console.log('Could not clear cell:', error.message);
        }
    }, 10000);
    
    test('should detect bulk emails in sheet paste', async () => {
        const dataset = testDatasets.blocked.bulkEmails;
        console.log(`Testing: ${dataset.name} in Google Sheets`);
        
        // Click cell A1
        await sheetsHelper.clickCell(0, 0);
        
        // Wait longer for Google Sheets to properly focus the cell
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Paste content
        await sheetsHelper.pasteContent(dataset.content);
        
        // Wait for dialog (complex app mode - paste happens first)
        // In complex apps like Google Sheets, extension uses paste-then-intercept mode
        // Need longer timeout for analysis to complete
        console.log('[Test] Waiting for dialog to appear...');
        const dialogShown = await dialogHelper.waitForDialog(15000);
        
        if (!dialogShown) {
            // Debug: Check if any Vigil elements exist
            const vigilElements = await page.$$eval('*', () => {
                const elements = document.querySelectorAll('[id*="vigil"], [class*="vigil"]');
                return Array.from(elements).map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    classes: el.className
                }));
            });
            console.log('[Test] Vigil elements found:', vigilElements);
            
            // Check console for any errors
            const logs = await page.evaluate(() => {
                return window.console._logs || [];
            });
            console.log('[Test] Recent logs:', logs.slice(-5));
        }
        
        expect(dialogShown).toBe(true);
        
        // Verify findings
        const findings = await dialogHelper.getFindings();
        expect(findings.length).toBeGreaterThan(0);
        
        console.log('✓ Findings in Sheets:', findings.map(f => f.label));
        
        // Click Block (should undo)
        await dialogHelper.clickBlock();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify cell was cleared/undone
        const cellValue = await sheetsHelper.getCellValue(0, 0);
        expect(cellValue).not.toContain('john.doe@company.com');
        
        console.log('✓ Paste was undone successfully');
    }, 30000);
    
    test('should allow normal text in sheet', async () => {
        const dataset = testDatasets.allowed.normalText;
        console.log(`Testing: ${dataset.name} in Google Sheets`);
        
        await sheetsHelper.clickCell(0, 0);
        await sheetsHelper.pasteContent(dataset.content);
        
        // Dialog should NOT appear - wait with timeout
        await new Promise(resolve => setTimeout(resolve, 2000));
        const dialogShown = await extensionHelper.isVigilDialogVisible();
        expect(dialogShown).toBe(false);
        
        // Verify content is in cell
        const cellValue = await sheetsHelper.getCellValue(0, 0);
        expect(cellValue.length).toBeGreaterThan(0);
        
        console.log('✓ Normal text paste was allowed in Sheets');
    }, 30000);
    
    test('should allow paste in sheet when user approves', async () => {
        const dataset = testDatasets.blocked.credentials;
        console.log(`Testing: User approval in Google Sheets`);
        
        await sheetsHelper.clickCell(0, 0);
        await sheetsHelper.pasteContent(dataset.content);
        
        // Wait for dialog
        await dialogHelper.waitForDialog();
        
        // Click Allow
        await dialogHelper.clickAllow();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify content remains in cell
        const cellValue = await sheetsHelper.getCellValue(0, 0);
        expect(cellValue.length).toBeGreaterThan(0);
        
        console.log('✓ User approval works in Sheets');
    }, 30000);
});
