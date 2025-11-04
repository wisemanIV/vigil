import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { ExtensionHelper } from '../helpers/extension-helper.js';
import { DialogHelper } from '../helpers/dialog-helper.js';
import { ChatGPTHelper } from '../helpers/chatgpt-helper.js';
import { testDatasets } from '../test-data/datasets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Vigil - ChatGPT Paste Detection', () => {
    let browser;
    let page;
    let extensionHelper;
    let dialogHelper;
    let chatgptHelper;
    
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
        chatgptHelper = new ChatGPTHelper(page);
        
        // Navigate to ChatGPT
        await chatgptHelper.navigate();
        await chatgptHelper.waitForLoaded();
        
        // Wait for extension to be ready
        await extensionHelper.waitForExtensionReady();
        
        console.log('✓ ChatGPT test suite ready');
    }, 60000); // 60 second timeout for initial setup
    
    afterAll(async () => {
        await browser.close();
    });
    
    afterEach(async () => {
        // Clear input between tests
        try {
            await chatgptHelper.clearPrompt();
        } catch (error) {
            console.log('Could not clear prompt:', error.message);
        }
    });
    
    test('should block bulk email paste and show dialog', async () => {
        const dataset = testDatasets.blocked.bulkEmails;
        console.log(`Testing: ${dataset.name}`);
        
        // Paste content
        await chatgptHelper.pasteContent(dataset.content);
        
        // Wait for Vigil dialog
        const dialogShown = await dialogHelper.waitForDialog(5000);
        expect(dialogShown).toBe(true);
        
        // Verify dialog title
        const title = await dialogHelper.getDialogTitle();
        expect(title).toContain('Sensitive Data Detected');
        
        // Verify findings
        const findings = await dialogHelper.getFindings();
        expect(findings.length).toBeGreaterThan(0);
        expect(findings.some(f => f.label.toLowerCase().includes('email'))).toBe(true);
        
        console.log('✓ Findings:', findings.map(f => f.label));
        
        // Click Block
        await dialogHelper.clickBlock();
        
        // Verify content was not pasted
        await page.waitForTimeout(500);
        const promptValue = await chatgptHelper.getPromptValue();
        expect(promptValue).not.toContain(dataset.content.split('\n')[0]);
        
        console.log('✓ Paste was blocked successfully');
    }, 30000);
    
    test('should block credentials paste', async () => {
        const dataset = testDatasets.blocked.credentials;
        console.log(`Testing: ${dataset.name}`);
        
        await chatgptHelper.pasteContent(dataset.content);
        
        const dialogShown = await dialogHelper.waitForDialog(5000);
        expect(dialogShown).toBe(true);
        
        const findings = await dialogHelper.getFindings();
        expect(findings.length).toBeGreaterThan(0);
        
        console.log('✓ Credentials detected, findings:', findings.map(f => f.label));
        
        // Click Block
        await dialogHelper.clickBlock();
        
        console.log('✓ Credentials paste was blocked');
    }, 30000);
    
    test('should allow normal text paste', async () => {
        const dataset = testDatasets.allowed.normalText;
        console.log(`Testing: ${dataset.name}`);
        
        await chatgptHelper.pasteContent(dataset.content);
        
        // Dialog should NOT appear
        await page.waitForTimeout(2000);
        const dialogShown = await extensionHelper.isVigilDialogVisible();
        expect(dialogShown).toBe(false);
        
        // Verify content was pasted
        const promptValue = await chatgptHelper.getPromptValue();
        expect(promptValue).toContain('quarterly review');
        
        console.log('✓ Normal text paste was allowed');
    }, 30000);
    
    test('should allow paste when user clicks Allow', async () => {
        const dataset = testDatasets.blocked.bulkEmails;
        console.log(`Testing: User approval flow`);
        
        await chatgptHelper.pasteContent(dataset.content);
        
        // Wait for dialog
        await dialogHelper.waitForDialog();
        
        // Click Allow
        await dialogHelper.clickAllow();
        await page.waitForTimeout(500);
        
        // Verify content was pasted
        const promptValue = await chatgptHelper.getPromptValue();
        expect(promptValue.length).toBeGreaterThan(0);
        
        console.log('✓ User approval flow works correctly');
    }, 30000);
});
