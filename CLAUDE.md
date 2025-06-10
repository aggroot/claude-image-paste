# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension called "Claude Image Paste" that enables users to paste images into VS Code terminals for use in Claude Code conversations. The extension handles both clipboard screenshots and copied image files, with automatic path conversion for WSL environments.

## Architecture

The extension follows a simple single-file architecture:
- **extension.js**: Contains all extension logic including clipboard access via PowerShell, path conversion between Windows/WSL formats, and VS Code terminal integration
- Uses PowerShell scripts for Windows clipboard access (requires PowerShell 7/pwsh)
- Saves images to system temp folder, overwriting previous pastes
- Supports formats: PNG, JPG, JPEG, GIF, BMP, WebP, SVG, ICO, TIFF

## Development Commands

This project has no build process or compilation steps. It's pure JavaScript that runs directly in VS Code's Node.js environment.

To develop:
1. Open the project in VS Code
2. Press F5 to launch a new VS Code window with the extension loaded
3. Test the extension using Ctrl+Shift+Alt+I or the command palette

## Key Technical Details

- Command ID: `claude-image-paste.pasteImage`
- Keyboard shortcut: Ctrl+Shift+Alt+I
- Minimum VS Code version: 1.74.0
- Platform requirements: Windows or WSL with PowerShell 7 and .NET Framework
- Images are saved as `claude_paste.png` (or with original extension) in the system temp folder