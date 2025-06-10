# Claude Image Paste for VS Code

A VS Code extension designed for Windows with WSL that enables seamless image pasting into terminals for Claude Code conversations. Optimized for WSL environments, it works with both clipboard screenshots and copied image files, with advanced features like custom save directories and file renaming!

## ✨ Features

- 📋 **Clipboard Images**: Paste screenshots directly from your clipboard
- 📁 **File Support**: Copy image files from Explorer and paste their paths
- 🖼️ **Multiple Formats**: Supports PNG, JPG, JPEG, GIF, BMP, WebP, SVG, ICO, TIFF
- 🔄 **Smart Path Conversion**: Automatically converts paths for WSL terminals
- 📊 **Progress Feedback**: Shows file size and status notifications
- ✏️ **File Renaming**: Interactive rename dialog for every pasted image
- 📂 **Custom Save Directory**: Configure where images are saved (supports relative and absolute paths)
- 📅 **Smart Naming**: Auto-generates timestamped filenames (img_YYYYMMDD_HHMMSS)

## 🚀 Installation

### From Source
1. Clone or download this extension to `G:\Claude\vscode-claude-image-paste`
2. Open VS Code
3. Open the command palette
4. Select `Developer: Install Extension from Location...`
5. Navigate to the extension folder
6. Restart VS Code

### For WSL Users (Recommended Setup)
1. Install the extension in Windows VS Code first
2. Open your WSL workspace in VS Code
3. Open the Extensions menu (Ctrl + Shift + X)
4. Find the extension and click "Install in WSL" to enable in WSL terminals
5. The extension will now handle automatic path conversion between Windows and WSL formats

## 📖 Usage

1. **Copy an image**:
   - Take a screenshot (Win+Shift+S, PrintScreen, etc.)
   - OR copy an image file from File Explorer
   - OR right-click an image in browser → Copy image

2. **In your terminal**:
   - Press `Ctrl+Shift+Alt+I` (keyboard shortcut, can be changed in Keyboard Shortcuts)
   - OR Press `Ctrl+Shift+P` → Type "Paste Image for Claude" → Enter

3. **Rename if desired**:
   - A dialog will appear asking if you want to rename the file
   - Press Enter to keep the auto-generated name, or type a new name

4. **The image path is inserted** and you can send it to Claude!

## ⚙️ Configuration

### Custom Save Directory

You can configure where images are saved by going to VS Code Settings (`Ctrl+,`) and searching for "Claude Image Paste":

- **Empty** (default): Uses system temp directory
- **Absolute path**: `/home/user/images` or `C:\Users\Name\Pictures`
- **Relative path**: `images` or `assets/screenshots` (relative to workspace root)
- **Home directory**: `~/Screenshots` (expands to your home directory)

### Examples:
- `images` → saves to `[workspace]/images/`
- `~/Screenshots` → saves to your home directory's Screenshots folder
- `/home/user/my-images` → saves to absolute path

## 🛠️ Requirements

**This extension is specifically designed for Windows with WSL environments:**

- **Windows 10/11** with **WSL2** installed and configured
- **PowerShell 7** (pwsh) - required for clipboard access
- **.NET Framework** - required for Windows clipboard operations
- **VS Code 1.74.0 or higher**

**Note**: While the extension may work on pure Windows environments, it's optimized for WSL workflows where path conversion between Windows and Linux formats is essential for Claude Code integration.

## 💡 Tips

- Images are automatically named with timestamps: `img_20231209_143052.png`
- Files copied from Explorer preserve their original extension
- Screenshots are saved as PNG files
- Relative paths in settings are resolved relative to your workspace root
- Works great with Claude Code conversations like:
  ```
  "Can you help me with this error?"
  /mnt/c/Users/YourName/AppData/Local/Temp/img_20231209_143052.png
  ```

## 🐛 Troubleshooting

**"No active terminal found"**
- Make sure you have a terminal open in VS Code

**"No image found in clipboard"**
- Ensure you've copied an image (not just selected it)
- Try copying again

**"File name contains invalid characters"**
- When renaming, avoid characters like `< > : " | ? *`
- Use alphanumeric characters, spaces, hyphens, and underscores

**"Failed to move file to custom directory"**
- Check that the custom directory path is valid
- Ensure you have write permissions to the target directory
- Try using an absolute path instead of a relative one

**PowerShell errors**
- Make sure you have PowerShell 7 installed
- Check that .NET Framework is installed
- On WSL, ensure PowerShell.exe is accessible from the Windows PATH

**Settings not working**
- Restart VS Code after changing settings
- Check that the setting name is exactly `claudeImagePaste.saveDirectory`

## 👥 Authors

Created with 💜 by Claude

## 📝 License

This extension is provided as-is for the Claude Code community!