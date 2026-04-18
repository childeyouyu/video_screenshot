function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
        const key = element.dataset.i18n;
        const message = chrome.i18n.getMessage(key);
        if (message) {
            element.textContent = message;
        }
    });
    
    document.title = chrome.i18n.getMessage('extension_title');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loaded with i18n');
    applyTranslations();
});