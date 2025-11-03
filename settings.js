// Load current settings
chrome.storage.local.get(['screenshotProtection'], (data) => {
    const settings = data.screenshotProtection || {
        enabled: true,
        autoBlur: true,
        logAttempts: true
    };
    
    document.getElementById('screenshotEnabled').checked = settings.enabled;
    document.getElementById('autoBlur').checked = settings.autoBlur;
    document.getElementById('logAttempts').checked = settings.logAttempts;
});

// Save settings
document.getElementById('save').addEventListener('click', () => {
    const settings = {
        enabled: document.getElementById('screenshotEnabled').checked,
        autoBlur: document.getElementById('autoBlur').checked,
        logAttempts: document.getElementById('logAttempts').checked
    };
    
    chrome.storage.local.set({ screenshotProtection: settings }, () => {
        const message = document.getElementById('savedMessage');
        message.style.display = 'inline';
        setTimeout(() => {
            message.style.display = 'none';
        }, 2000);
    });
});
