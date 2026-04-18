(function () {
    'use strict';
    // 常量定义 | Constant definitions
    const STYLE_ID = 'clipzo-styles'; // 样式表ID | Stylesheet ID
    const BUTTON_CLASS = 'clipzo-btn'; // 按钮类名 | Button class name
    const PROCESSED_PLAYERS = new WeakSet(); // 已处理的播放器集合 | Processed players set
    function getMessage(key) {
        return chrome.i18n.getMessage(key) || key;
    }

    // 注入CSS样式 | Inject CSS styles
    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .${BUTTON_CLASS} {
                position: absolute;
                top: 50%;
                right: 10px;
                transform: translateY(-50%);
                z-index: 999999;
                background: rgba(0, 0, 0, 0.7);
                border: none;
                border-radius: 4px;
                padding: 8px 12px;
                color: white;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s ease;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            
            .${BUTTON_CLASS}:hover {
                background: rgba(255, 102, 0, 0.9);
                transform: translateY(-50%) scale(1.05);
            }
            
            .${BUTTON_CLASS} svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }
            
            .${BUTTON_CLASS}.position-top {
                bottom: auto;
                top: 10px;
            }
            
            .${BUTTON_CLASS}.position-right {
                right: 60px;
            }
            
            .video-container {
                position: relative !important;
            }
            
            .video-screenshot-toast {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 10000000;
                font-size: 14px;
                animation: screenshotToastFade 2s ease forwards;
            }
            
            @keyframes screenshotToastFade {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }

    // 创建截图按钮 | Create screenshot button
    function createScreenshotButton() {
        const btn = document.createElement('button');
        btn.className = BUTTON_CLASS;
        btn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <span class="btn-text">${getMessage('button_screenshot')}</span>
        `;

        return btn;
    }

    // 显示提示消息 | Show toast message
    function showToast(message) {
        // 移除已存在的提示 | Remove existing toast
        const existingToast = document.querySelector('.video-screenshot-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'video-screenshot-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 2000);
    }

    // 辅助函数：处理图片下载和命名 | Helper: Handle image download and naming
    function downloadImage(canvas, callback) {
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // 生成文件名:截图_页面标题_时间戳.png | Generate filename: screenshot_pageTitle_timestamp.png
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const pageTitle = document.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 30);
            link.download = `${getMessage('screenshot')}_${pageTitle}_${timestamp}.png`;

            // 触发下载并释放对象URL | Trigger download and revoke object URL
            link.click();
            URL.revokeObjectURL(url);

            if (callback) callback();
        }, 'image/png');
    }

    // 捕获视频截图 | Capture video screenshot
    function captureVideoScreenshot(videoElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 设置画布尺寸为视频尺寸 | Set canvas size to video dimensions
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        // 绘制视频帧到画布 | Draw video frame to canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // 使用辅助函数下载 | Use helper function to download
        downloadImage(canvas, () => {
            showToast(getMessage('saved')); // 显示保存成功提示 | Show save success toast
        });
    }

    // 捕获Canvas截图 | Capture canvas screenshot
    function captureCanvasScreenshot(canvasElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 设置画布尺寸 | Set canvas dimensions
        canvas.width = canvasElement.width;
        canvas.height = canvasElement.height;

        // 绘制源Canvas内容 | Draw source canvas content
        ctx.drawImage(canvasElement, 0, 0);

        // 使用辅助函数下载 | Use helper function to download
        downloadImage(canvas, () => {
            showToast(getMessage('saved')); // 显示保存成功提示 | Show save success toast
        });
    }

    // 为标准视频附加按钮 | Attach button to standard video
    function attachButtonToStandardVideo(videoElement) {
        let container = videoElement.parentElement;

        // 如果已在视频容器中，直接添加按钮 | If already in video container, add button directly
        if (container && container.classList.contains('video-container')) {
            const existingBtn = container.querySelector(`.${BUTTON_CLASS}`);
            if (!existingBtn) {
                const btn = createScreenshotButton();
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止事件冒泡 | Prevent event bubbling
                    captureVideoScreenshot(videoElement);
                });
                container.appendChild(btn);
            }
            return;
        }

        // 向上查找具有定位属性的父容器 | Find parent container with positioning upward
        while (container && container !== document.body) {
            const computedStyle = window.getComputedStyle(container);
            const position = computedStyle.getPropertyValue('position');

            // 找到相对/绝对/固定定位的容器 | Find relative/absolute/fixed positioned container
            if (position === 'relative' || position === 'absolute' || position === 'fixed') {
                container.classList.add('video-container');
                const btn = createScreenshotButton();
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    captureVideoScreenshot(videoElement);
                });
                container.appendChild(btn);
                return;
            }

            container = container.parentElement;
        }

        // 如果没有合适的容器，创建新的包装器 | If no suitable container, create new wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'video-container';
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';

        // 将视频移入包装器 | Move video into wrapper
        videoElement.parentNode.insertBefore(wrapper, videoElement);
        wrapper.appendChild(videoElement);
        const btn = createScreenshotButton();
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            captureVideoScreenshot(videoElement);
        });
        wrapper.appendChild(btn);
    }

    // 为西瓜播放器附加按钮 | Attach button to Xigua Player
    function attachButtonToXgPlayer(playerContainer) {
        // 避免重复处理 | Avoid duplicate processing
        if (PROCESSED_PLAYERS.has(playerContainer)) {
            return;
        }
        PROCESSED_PLAYERS.add(playerContainer);

        // 检查是否已有按钮 | Check if button already exists
        const existingBtn = playerContainer.querySelector(`.${BUTTON_CLASS}`);
        if (existingBtn) return;

        // 查找视频或Canvas元素 | Find video or canvas element
        const videoElement = playerContainer.querySelector('video');
        const canvasElement = playerContainer.querySelector('canvas');

        const btn = createScreenshotButton();

        // 根据可用元素类型绑定点击事件 | Bind click event based on available element type
        if (videoElement && videoElement.readyState >= 2) {
            // 视频已就绪 | Video is ready
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                captureVideoScreenshot(videoElement);
            });
        } else if (canvasElement) {
            // 使用Canvas渲染 | Use canvas rendering
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                captureCanvasScreenshot(canvasElement);
            });
        } else {
            // 延迟检测元素 | Delayed element detection
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const video = playerContainer.querySelector('video');
                const canvas = playerContainer.querySelector('canvas');
                if (video) {
                    captureVideoScreenshot(video);
                } else if (canvas) {
                    captureCanvasScreenshot(canvas);
                } else {
                    showToast(getMessage('captureFailed')); // 显示失败提示 | Show failure toast
                }
            });
        }

        // 确保容器可定位并添加按钮 | Ensure container is positionable and add button
        playerContainer.style.position = 'relative';
        playerContainer.appendChild(btn);
    }

    // 查找并处理标准视频元素 | Find and process standard video elements
    function findAndProcessStandardVideos() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            // 跳过西瓜播放器和YouTube中的视频，避免重复 | Skip videos in Xigua/YouTube players to avoid duplicates
            if (video.closest('.xgplayer, [class*="xgplayer"], .xg-player, .html5-video-player')) {
                return;
            }
            // 检查视频是否已加载数据 | Check if video has loaded data
            if (video.readyState >= 2) {
                if (!PROCESSED_PLAYERS.has(video)) {
                    PROCESSED_PLAYERS.add(video);
                    attachButtonToStandardVideo(video);
                }
            } else {
                // 监听视频加载完成事件 | Listen for video load completion
                video.addEventListener('loadeddata', () => {
                    if (!PROCESSED_PLAYERS.has(video)) {
                        PROCESSED_PLAYERS.add(video);
                        attachButtonToStandardVideo(video);
                    }
                });
            }
        });
    }

    // 查找并处理西瓜播放器 | Find and process Xigua players
    function findAndProcessXgPlayers() {
        // 匹配西瓜播放器的多种类名 | Match various Xigua player class names
        const xgPlayers = document.querySelectorAll('.xgplayer, [class*="xgplayer"], .xg-player');
        xgPlayers.forEach(player => {
            // 确保包含视频或Canvas元素 | Ensure contains video or canvas element
            if (player.querySelector('video') || player.querySelector('canvas')) {
                attachButtonToXgPlayer(player);
            }
        });
    }

    // 查找并处理YouTube播放器 | Find and process YouTube players
    function findAndProcessYouTubePlayers() {
        const players = document.querySelectorAll('.html5-video-player');
        players.forEach(player => {
            // 跳过已添加按钮的播放器 | Skip players with button already added
            const existingBtn = player.querySelector(`.${BUTTON_CLASS}`);
            if (existingBtn) return;

            const videoElement = player.querySelector('video');
            if (!videoElement) return;

            // 避免重复处理 | Avoid duplicate processing
            if (PROCESSED_PLAYERS.has(videoElement)) return;
            PROCESSED_PLAYERS.add(videoElement);

            const btn = createScreenshotButton();

            // 绑定点击事件处理截图 | Bind click event for screenshot
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (videoElement && videoElement.readyState >= 2) {
                    captureVideoScreenshot(videoElement);
                } else {
                    showToast(getMessage('notReady')); // 显示未就绪提示 | Show not ready toast
                }
            });

            player.style.position = 'relative';
            player.appendChild(btn);
        });
    }

    // 查找并处理所有类型的播放器 | Find and process all types of players
    function findAndProcessAll() {
        findAndProcessStandardVideos();
        findAndProcessXgPlayers();
        findAndProcessYouTubePlayers();
    }

    // 监听新元素添加 | Observe new element additions
    function observeNewElements() {
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;

            mutations.forEach(mutation => {
                // 如果有新节点添加，标记需要检查 | Mark for check if new nodes added
                if (mutation.addedNodes.length > 0) {
                    shouldCheck = true;
                }
            });

            if (shouldCheck) {
                // 延迟检查以避免频繁触发 | Delay check to avoid frequent triggering
                setTimeout(findAndProcessAll, 500);
            }
        });

        // 观察body及其子树的变化 | Observe body and subtree changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 初始化函数 | Initialization function
    function init() {
        injectStyles(); // 注入样式 | Inject styles

        // 首次处理现有元素 | Process existing elements first time
        findAndProcessAll();
        // 开始监听新元素 | Start observing new elements
        observeNewElements();

        // 多次重试以确保动态加载的内容被处理 | Retry multiple times to ensure dynamically loaded content is processed
        setTimeout(findAndProcessAll, 1000);
        setTimeout(findAndProcessAll, 2000);
        setTimeout(findAndProcessAll, 3000);
    }

    // 根据文档加载状态决定初始化时机 | Decide initialization timing based on document load state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();