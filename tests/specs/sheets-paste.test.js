import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { ExtensionHelper } from '../helpers/extension-helper.js';
import { DialogHelper } from '../helpers/dialog-helper.js';
import { SheetsHelper } from '../helpers/sheets-helper.js';
import { testDatasets } from '../test-data/datasets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Vigil - Google Sheets Paste Detection', () => {
    let browser;
    let page;
    let extensionHelper;
    let dialogHelper;
    let sheetsHelper;
    
    beforeAll(async () => {
        const extensionPath = path.join(__dirname, '../../');
        
        browser = await puppeteer.launch({
            headless: false,
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
                '--no-sandbox',
                '--disable-setuid-sandbox'
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
        
        // Create new sheet
        await sheetsHelper.createNewSheet();
        await sheetsHelper.waitForLoaded();
        
        // Wait for extension
        await extensionHelper.waitForExtensionReady();
        
        console.log('✓ Google Sheets test suite ready');
    }, 60000);
    
    afterAll(async () => {
        await browser.close();
    });
    
    afterEach(async () => {
        // Clear cell between tests
        try {
            await sheetsHelper.clearCell(0, 0);
        } catch (error) {
            console.log('Could not clear cell:', error.message);
        }
    });
    
    test('should detect bulk emails in sheet paste', async () => {
        const dataset = testDatasets.blocked.bulkEmails;
        console.log(`Testing: ${dataset.name} in Google Sheets`);
        
        // Click cell A1
        await sheetsHelper.clickCell(0, 0);
        
        // Paste content
        await sheetsHelper.pasteContent(dataset.content);
        
        // Wait for dialog (complex app mode - paste happens first)
        const dialogShown = await dialogHelper.waitForDialog(5000);
        expect(dialogShown).toBe(true);
        
        // Verify findings
        const findings = await dialogHelper.getFindings();
        expect(findings.length).toBeGreaterThan(0);
        
        console.log('✓ Findings in Sheets:', findings.map(f => f.label));
        
        // Click Block (should undo)
        await dialogHelper.clickBlock();
        await page.waitForTimeout(1000);
        
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
        
        // Dialog should NOT appear
        await page.waitForTimeout(2000);
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
        await page.waitForTimeout(1000);
        
        // Verify content remains in cell
        const cellValue = await sheetsHelper.getCellValue(0, 0);
        expect(cellValue.length).toBeGreaterThan(0);
        
        console.log('✓ User approval works in Sheets');
    }, 30000);
});
