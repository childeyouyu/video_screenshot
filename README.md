## Video Screenshot Tool

### Introduction

Video Screenshot Tool is a Chrome browser extension that displays a screenshot button on web video players, helping users quickly capture video frames.

[English](https://github.com/childeyouyu/video_screenshot/blob/main/README.md) | [中文](https://github.com/childeyouyu/video_screenshot/blob/main/README_CN.md)

### Features

- **One-Click Screenshot** - Click to save current video frame
- **High Quality** - Saves images in original resolution as PNG
- **Smart Detection** - Automatically detects video players on page
- **Multi-language** - Supports Chinese and English
- **Wide Compatibility** - Works with various video websites and players

### Supported Sites

- Bilibili
- YouTube
- Feiniu Video
- Other websites using standard HTML5 video

### Installation

1. Open Chrome browser, go to Extensions page: `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the extension folder

### How to Use

1. Open a webpage with video
2. The "Screenshot" button appears on the right side of the video player
3. Click the button to save the current frame to your download folder

### Language Switch

Click "中文" or "English" button in the popup to switch language. The language setting will be saved automatically.

### Development

For development, please refer to the following file structure:

```
screenshot-extension/
├── manifest.json      # Extension configuration
├── content.js         # Content script (video detection & screenshot)
├── popup.html         # Popup page
├── popup.js           # Popup script (language switch)
├── background.js      # Background script
├── content.css        # Style file
├── icons/             # Icon files
└── _locales/          # Multi-language files
```

### Notes

- Screenshots are saved to the browser's default download folder
- File naming format: `Screenshot_PageTitle_Timestamp.png`
- Some websites may require login to view videos

---

## Version

Current Version: 1.0