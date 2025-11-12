export class DialogHelper {
    constructor(page) {
        this.page = page;
    }
    
    async waitForDialog(timeout = 5000) {
        try {
            await this.page.waitForSelector('#vigil-confirmation-overlay', { 
                visible: true, 
                timeout 
            });
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async getDialogTitle() {
        return await this.page.$eval('.vigil-modal-title', el => el.textContent);
    }
    
    async getDialogSubtitle() {
        return await this.page.$eval('.vigil-modal-subtitle', el => el.textContent);
    }
    
    async getFindings() {
        const findings = await this.page.$$eval('.vigil-finding-item', items => {
            return items.map(item => ({
                icon: item.querySelector('.vigil-finding-icon')?.textContent,
                label: item.querySelector('.vigil-finding-label')?.textContent
            }));
        });
        return findings;
    }
    
    async clickAllow() {
        await this.page.click('#vigil-allow');
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    async clickBlock() {
        await this.page.click('#vigil-block');
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    async isDialogClosed() {
        const overlay = await this.page.$('#vigil-confirmation-overlay');
        return overlay === null;
    }
}
