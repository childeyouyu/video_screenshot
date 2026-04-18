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

// 加载开关状态 | Load toggle state
function loadToggleState() {
    chrome.storage.sync.get(['screenshotEnabled'], (result) => {
        const toggle = document.getElementById('screenshot-toggle');
        // 默认启用 | Default to enabled
        toggle.checked = result.screenshotEnabled !== false;
    });
}

// 保存开关状态 | Save toggle state
function saveToggleState(enabled) {
    chrome.storage.sync.set({ screenshotEnabled: enabled }, () => {
        console.log('Screenshot feature', enabled ? 'enabled' : 'disabled');
        // 通知content script更新状态 | Notify content script to update state
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateScreenshotState',
                    enabled: enabled
                }).catch(() => {}); // 忽略错误，可能页面未加载content script | Ignore errors, page may not have content script loaded
            });
        });
    });
}

// 加载图标样式 | Load icon style
function loadIconStyle() {
    chrome.storage.sync.get(['iconStyle'], (result) => {
        const selectedIcon = result.iconStyle || 'screenshot.svg';
        const radioButtons = document.querySelectorAll('input[name="icon-style"]');
        const iconOptions = document.querySelectorAll('.icon-option');
        
        radioButtons.forEach(radio => {
            if (radio.value === selectedIcon) {
                radio.checked = true;
                radio.parentElement.classList.add('selected');
            } else {
                radio.parentElement.classList.remove('selected');
            }
        });
    });
}

// 保存图标样式 | Save icon style
function saveIconStyle(iconFile) {
    chrome.storage.sync.set({ iconStyle: iconFile }, () => {
        console.log('Icon style saved:', iconFile);
        // 通知content script更新图标 | Notify content script to update icon
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateIconStyle',
                    iconFile: iconFile
                }).catch(() => {});
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loaded with i18n');
    applyTranslations();
    loadToggleState();
    loadIconStyle();
    
    // 监听开关变化 | Listen for toggle changes
    const toggle = document.getElementById('screenshot-toggle');
    toggle.addEventListener('change', (e) => {
        saveToggleState(e.target.checked);
    });
    
    // 监听图标选择变化 | Listen for icon selection changes
    const iconOptions = document.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const radio = option.querySelector('input[type="radio"]');
            const iconFile = radio.value;
            
            // 更新选中状态 | Update selected state
            iconOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            radio.checked = true;
            
            // 保存选择 | Save selection
            saveIconStyle(iconFile);
        });
    });
});