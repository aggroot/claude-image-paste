// Required VS Code and Node.js modules
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');

// Convert exec to promise-based function for async/await usage
const execPromise = util.promisify(exec);

// Constants
const EXTENSION_NAME = 'Claude Image Paste';
const CONFIG_SECTION = 'claudeImagePaste';
const COMMAND_TIMEOUT = 10000; // 10 seconds
const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif'];

// ==================== HELPER FUNCTIONS ====================

/**
 * Shows an error message with the extension name prefix
 * @param {string} message - The error message to display
 */
function showErrorMessage(message) {
    vscode.window.showErrorMessage(`${EXTENSION_NAME}: ${message}`);
}

/**
 * Shows a success message with file information
 * @param {string} filePath - Path to the successfully processed file
 */
function showSuccessMessage(filePath) {
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    vscode.window.showInformationMessage(
        `${EXTENSION_NAME}: Inserted ${path.basename(filePath)} (${sizeKB}KB)`
    );
}

/**
 * Handles moving the image to a custom save directory if configured
 * @param {string} tempImagePath - Path to the temporary image file
 * @returns {Promise<string>} - Final path where the image was saved
 */
async function handleCustomSaveDirectory(tempImagePath) {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const customDirectory = config.get('saveDirectory');
    let finalPath = tempImagePath;
    
    // If custom directory is set, move the file there
    if (customDirectory && customDirectory.trim() !== '') {
        let expandedDir = customDirectory.replace(/^~/, os.homedir());
        
        // If path is relative, make it relative to workspace root
        if (!path.isAbsolute(expandedDir)) {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                expandedDir = path.join(workspaceFolder.uri.fsPath, expandedDir);
            } else {
                // Fallback to current working directory if no workspace
                expandedDir = path.resolve(expandedDir);
            }
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(expandedDir)) {
            fs.mkdirSync(expandedDir, { recursive: true });
        }
        
        const fileName = path.basename(tempImagePath);
        finalPath = path.join(expandedDir, fileName);
        
        // Use copy + delete instead of rename for cross-filesystem moves (WSL/Windows)
        try {
            fs.copyFileSync(tempImagePath, finalPath);
            fs.unlinkSync(tempImagePath);
        } catch (error) {
            throw new Error(`Failed to move file to custom directory: ${error.message}`);
        }
    }
    
    return finalPath;
}

/**
 * Prompts the user to rename the file if desired
 * @param {string} currentPath - Current path of the file
 * @returns {Promise<string>} - Final path after potential rename
 */
async function promptForFileRename(currentPath) {
    const currentName = path.basename(currentPath);
    
    const newName = await vscode.window.showInputBox({
        prompt: 'Enter a new name for the image (or press Enter to keep current name)',
        value: currentName,
        validateInput: (value) => {
            if (!value) return null;
            // Check for invalid filename characters (Windows/Linux compatible)
            const invalidChars = /[<>:"|?*]/;
            if (invalidChars.test(value)) {
                return 'File name contains invalid characters';
            }
            return null;
        }
    });
    
    // If user provided a new name, rename the file
    if (newName && newName !== currentName) {
        const dir = path.dirname(currentPath);
        const newPath = path.join(dir, newName);
        fs.renameSync(currentPath, newPath);
        return newPath;
    }
    
    return currentPath;
}

/**
 * Main extension activation function
 * Registers the paste image command and sets up event handlers
 * @param {vscode.ExtensionContext} context - VS Code extension context
 */
function activate(context) {
    // Register the main command for pasting images
    let disposable = vscode.commands.registerCommand('claude-image-paste.pasteImage', async () => {
        try {
            // Step 1: Validate platform compatibility (Windows or WSL only)
            const platform = getPlatform();
            if (!platform) {
                showErrorMessage('Only supported on Windows and WSL environments');
                return;
            }

            // Step 2: Ensure there's an active terminal to paste into
            const activeTerminal = vscode.window.activeTerminal;
            if (!activeTerminal) {
                showErrorMessage('No active terminal found. Please open a terminal first.');
                return;
            }

            // Step 3: Execute the main image processing workflow with progress indicator
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Retrieving image from clipboard...',
                cancellable: false
            }, async (progress) => {
                try {
                    // Step 3a: Extract image from clipboard using PowerShell
                    const tempImagePath = await getImageFromClipboard(platform);
                    
                    if (tempImagePath) {
                        // Step 3b: Convert Windows path to WSL format if needed
                        const convertedTempPath = convertPathForTerminal(tempImagePath, platform, activeTerminal);
                        
                        // Step 3c: Move to custom directory if user has configured one
                        let finalPath = await handleCustomSaveDirectory(convertedTempPath);
                        
                        // Step 3d: Give user opportunity to rename the file
                        finalPath = await promptForFileRename(finalPath);
                        
                        // Step 3e: Insert the file path into the active terminal with @ prefix for Claude Code
                        activeTerminal.sendText(`@${finalPath}`, false);
                        
                        // Step 3f: Show success notification with file details
                        showSuccessMessage(finalPath);
                    }
                } catch (error) {
                    // Re-throw to be caught by outer error handler
                    throw error;
                }
            });
            
        } catch (error) {
            // Handle any errors that occur during the process
            showErrorMessage(error.message);
        }
    });

    // Register the command with VS Code for cleanup on deactivation
    context.subscriptions.push(disposable);
}

// ==================== CORE FUNCTIONS ====================

/**
 * Determines the current platform and checks compatibility
 * @returns {string|null} 'windows' for native Windows, 'wsl' for Windows Subsystem for Linux, or null if unsupported
 */
function getPlatform() {
    // Check if running on native Windows
    if (process.platform === 'win32') {
        return 'windows';
    }
    
    // Check if running on WSL (Linux with Windows mount point)
    if (process.platform === 'linux' && fs.existsSync('/mnt/c/Windows')) {
        return 'wsl';
    }
    
    // Unsupported platform (e.g., macOS, other Linux distributions)
    return null;
}

/**
 * Extracts image from clipboard using PowerShell and saves it to temp directory
 * Handles both copied image files and screenshot/bitmap data from clipboard
 * @param {string} platform - 'windows' or 'wsl' 
 * @returns {Promise<string>} Path to the saved image file
 */
async function getImageFromClipboard(platform) {
    // PowerShell script that handles both file drops and bitmap clipboard data
    const psScript = `
# Set error handling to stop on any error
$ErrorActionPreference = 'Stop'

# Load required .NET assemblies for clipboard and image operations
try {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
} catch {
    Write-Error "Failed to load required .NET assemblies. Ensure .NET Framework is installed."
    exit 1
}

# Strategy 1: Check if user copied an image file from Windows Explorer
$files = [System.Windows.Forms.Clipboard]::GetFileDropList()
if ($files -and $files.Count -gt 0) {
    $sourceFile = $files[0]
    
    # Verify the source file exists
    if (-not (Test-Path $sourceFile)) {
        Write-Error "Source file not found: $sourceFile"
        exit 1
    }
    
    # Check if the file has a supported image extension
    $imageExtensions = @('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif')
    $extension = [System.IO.Path]::GetExtension($sourceFile).ToLower()
    
    if ($imageExtensions -contains $extension) {
        # Create timestamp-based filename and copy to temp directory
        $dateString = Get-Date -Format "yyyyMMdd_HHmmss"
        $tempPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "img_$dateString$extension")
        try {
            Copy-Item -Path $sourceFile -Destination $tempPath -Force -ErrorAction Stop
            Write-Output $tempPath
            exit 0
        } catch {
            Write-Error "Failed to copy file: $_"
            exit 1
        }
    } else {
        Write-Error "Clipboard contains a non-image file: $sourceFile"
        exit 1
    }
}

# Strategy 2: Check for bitmap/screenshot data in clipboard
try {
    $image = [System.Windows.Forms.Clipboard]::GetImage()
    if ($image -eq $null) {
        Write-Error "No image found in clipboard. Copy an image or image file and try again."
        exit 1
    }
    
    # Save bitmap data as PNG with timestamp-based filename
    $dateString = Get-Date -Format "yyyyMMdd_HHmmss"
    $tempPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "img_$dateString.png")
    $image.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $image.Dispose()
    Write-Output $tempPath
} catch {
    Write-Error "Failed to save clipboard image: $_"
    exit 1
}
    `.trim();


    // Build PowerShell command with proper escaping based on platform
    let command;
    if (platform === 'wsl') {
        // From WSL: Must escape special characters for bash shell
        const escapedScript = psScript
            .replace(/\$/g, '\\$')      // Escape dollar signs
            .replace(/"/g, '\\"')       // Escape double quotes  
            .replace(/`/g, '\\`');      // Escape backticks
        command = `powershell.exe -NoProfile -Command "${escapedScript}"`;
    } else {
        // From Windows: Only need to escape quotes
        const escapedScript = psScript.replace(/"/g, '\\"');
        command = `powershell -NoProfile -Command "${escapedScript}"`;
    }

    // Execute PowerShell command with timeout protection
    const { stdout, stderr } = await execPromise(command, {
        timeout: COMMAND_TIMEOUT
    });
    
    // Check for PowerShell errors
    if (stderr) {
        throw new Error(stderr.trim());
    }

    // Return the path to the saved image file
    return stdout.trim();
}

/**
 * Converts Windows-style paths to the appropriate format for the current terminal
 * This is essential for WSL compatibility where paths need to be in Unix format
 * @param {string} windowsPath - The Windows path (e.g., "C:\Users\...")
 * @param {string} platform - Current platform: 'windows' or 'wsl'
 * @param {vscode.Terminal} terminal - The active VS Code terminal instance
 * @returns {string} The converted path suitable for the terminal environment
 */
function convertPathForTerminal(windowsPath, platform, terminal) {
    // Check if we need WSL-style paths (either platform is WSL or terminal is WSL)
    if (platform === 'wsl' || 
        (terminal.name && terminal.name.toLowerCase().includes('wsl'))) {
        // Convert Windows path to WSL format:
        // C:\Users\... becomes /mnt/c/Users/...
        return windowsPath
            .replace(/\\/g, '/')                                    // Convert backslashes to forward slashes
            .replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`); // Convert drive letters
    }
    
    // For native Windows terminals, return path unchanged
    return windowsPath;
}

// ==================== EXTENSION LIFECYCLE ====================

/**
 * Called when the extension is deactivated
 * Clean up any resources if needed
 */
function deactivate() {
    // Currently no cleanup needed, but this is where we'd add it if required
}

// Export the main functions for VS Code to use
module.exports = {
    activate,
    deactivate
}