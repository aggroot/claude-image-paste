# Claude Image Paste Extension - Packaging and Deployment Guide

## Prerequisites

1. **Install Node.js and npm** (if not already installed)
2. **Install Visual Studio Code Extension Manager (vsce)**:
   ```bash
   npm install -g @vscode/vsce
   ```

## Packaging the Extension

### 1. Verify Project Structure
Ensure your project has all required files:
```
claude-image-paste/
├── extension.js          # Main extension code
├── package.json         # Extension metadata and configuration
├── icon.png            # Extension icon (128x128 recommended)
├── README.md           # Extension documentation
└── CLAUDE.md           # Development instructions
```

### 2. Update package.json (if needed)
- Set a unique `publisher` name (replace "Claude" with your publisher ID)
- Update version number following semantic versioning
- Verify all metadata fields are correct

### 3. Package the Extension
Run the following command in your project root:
```bash
vsce package
```

This creates a `.vsix` file (e.g., `claude-image-paste-1.0.0.vsix`) that can be installed in VS Code.

## Deployment Options

### Option 1: Local Installation
Install the packaged extension locally:
```bash
code --install-extension claude-image-paste-1.0.0.vsix
```

### Option 2: Share VSIX File
- Upload the `.vsix` file to GitHub releases, file sharing service, or company repository
- Users can install via: `Extensions` → `...` → `Install from VSIX...`

### Option 3: Publish to VS Code Marketplace

#### Setup Publisher Account
1. Create a [Visual Studio Marketplace publisher account](https://marketplace.visualstudio.com/manage)
2. Get a Personal Access Token from Azure DevOps:
   - Go to https://dev.azure.com
   - User settings → Personal access tokens
   - Create token with `Marketplace (manage)` scope

#### Login and Publish
```bash
# Login with your publisher name and token
vsce login your-publisher-name

# Publish to marketplace
vsce publish
```

#### Update Published Extension
```bash
# Increment version and publish
vsce publish patch    # 1.0.0 → 1.0.1
vsce publish minor    # 1.0.0 → 1.1.0 
vsce publish major    # 1.0.0 → 2.0.0
```

### Option 4: Private Registry/Enterprise
For organizations with private extension galleries:
- Upload `.vsix` to your private registry
- Follow your organization's extension deployment process

## Verification Steps

After deployment, verify the extension works:

1. **Installation Check**: Extension appears in installed extensions list
2. **Command Check**: `Ctrl+Shift+P` → "Paste Image for Claude" command exists
3. **Keybind Check**: `Ctrl+Shift+Alt+I` works in terminal
4. **Functionality Check**: Test pasting clipboard images and files

## Troubleshooting

### Common Issues
- **Permission errors**: Ensure proper Azure DevOps permissions
- **Publisher name conflicts**: Use a unique publisher identifier
- **Missing files**: Verify all referenced files exist in package
- **Version conflicts**: Check existing marketplace versions

### Platform Requirements
Remember this extension requires:
- Windows or WSL environment
- PowerShell 7 (pwsh)
- .NET Framework for clipboard access

## Marketplace Guidelines

If publishing publicly, ensure compliance with:
- VS Code Marketplace policies
- Appropriate category selection (`Other`, `Snippets`)
- Clear description and usage instructions
- Quality icon (128x128px recommended)
- Comprehensive README with screenshots/examples

## Automation (Optional)

Consider setting up CI/CD for automatic publishing:
```yaml
# GitHub Actions example
- name: Publish Extension
  run: |
    npm install -g @vscode/vsce
    vsce publish --pat ${{ secrets.VSCE_TOKEN }}
```

---

**Note**: Replace "Claude" publisher name with your own before publishing to avoid conflicts.