# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Context
This is a VS Code extension project for creating a secure, private chatbot that communicates with custom LLM models (like Llama) instead of GitHub Copilot. The extension should:

1. Allow configuration of custom LLM API endpoints and authentication tokens
2. Provide a chat interface within VS Code
3. Keep all data private and secure within the organization's infrastructure
4. Replace GitHub Copilot functionality with custom LLM responses

## Key Technologies
- TypeScript
- VS Code Extension API
- Node.js backend API for LLM communication
- WebView for chat interface
- Secure configuration management

## Architecture
- **Frontend**: VS Code extension with webview-based chat interface
- **Backend**: Local API server that communicates with external LLM services
- **Configuration**: Secure storage of API endpoints and tokens
- **Communication**: Message passing between extension and webview

## Development Guidelines
- Use the get_vscode_api with a query as input to fetch the latest VS Code API references
- Follow VS Code extension best practices for security and performance
- Implement proper error handling and user feedback
- Use TypeScript for type safety
- Follow the existing project structure and conventions

## Security Considerations
- Never log or expose authentication tokens
- Validate all user inputs
- Use secure communication protocols
- Implement proper content security policies for webviews
