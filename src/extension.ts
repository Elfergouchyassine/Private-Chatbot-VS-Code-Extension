import * as vscode from 'vscode';
import axios from 'axios';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  messages: ChatMessage[];
  id: string;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 Private ChatBot Extension activated!');

  // Track current webview panel
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  let currentSession: ChatSession = {
    messages: [],
    id: generateSessionId()
  };

  // Register commands
  const openChatCommand = vscode.commands.registerCommand('privateChatbot.openChat', () => {
    openChatPanel(context);
  });

  const configureCommand = vscode.commands.registerCommand('privateChatbot.configure', () => {
    configureApiSettings();
  });

  const testConnectionCommand = vscode.commands.registerCommand('privateChatbot.testConnection', () => {
    testLLMConnection();
  });

  // Register tree data provider for sidebar
  const chatTreeProvider = new ChatTreeProvider();
  vscode.window.registerTreeDataProvider('privateChatbot.chatView', chatTreeProvider);

  context.subscriptions.push(openChatCommand, configureCommand, testConnectionCommand);

  /**
   * Open the chat panel webview
   */
  function openChatPanel(context: vscode.ExtensionContext) {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (currentPanel) {
      currentPanel.reveal(columnToShowIn);
    } else {
      currentPanel = vscode.window.createWebviewPanel(
        'privateChatbot',
        'Private ChatBot',
        columnToShowIn || vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
        }
      );

      currentPanel.webview.html = getChatWebviewContent();

      // Handle messages from webview
      currentPanel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case 'sendMessage':
              await handleSendMessage(message.text);
              break;
            case 'clearChat':
              handleClearChat();
              break;
            case 'configure':
              configureApiSettings();
              break;
          }
        },
        undefined,
        context.subscriptions
      );

      // Reset when panel is closed
      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        null,
        context.subscriptions
      );
    }
  }

  /**
   * Handle sending a message to the LLM
   */
  async function handleSendMessage(userMessage: string) {
    if (!currentPanel) return;

    // Add user message to session
    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    currentSession.messages.push(userMsg);

    // Update UI with user message
    currentPanel.webview.postMessage({
      command: 'addMessage',
      message: userMsg
    });

    // Show loading state
    currentPanel.webview.postMessage({
      command: 'setLoading',
      loading: true
    });

    try {
      // Send to backend API
      const config = vscode.workspace.getConfiguration('privateChatbot');
      const backendPort = config.get<number>('backendPort', 3002);
      
      const response = await axios.post(`http://localhost:${backendPort}/api/chat/simple`, {
        prompt: userMessage,
        maxTokens: config.get<number>('maxTokens', 100)
      });

      if (response.data.success) {
        // Add assistant response to session
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date()
        };
        currentSession.messages.push(assistantMsg);

        // Update UI with assistant response
        currentPanel.webview.postMessage({
          command: 'addMessage',
          message: assistantMsg
        });
      } else {
        throw new Error(response.data.message || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Show error message
      currentPanel.webview.postMessage({
        command: 'addMessage',
        message: {
          role: 'assistant',
          content: `❌ Error: ${error.message}\n\nPlease check your configuration or try again.`,
          timestamp: new Date()
        }
      });

      // Show configuration suggestion
      vscode.window.showErrorMessage(
        'Failed to send message to ChatBot. Would you like to configure the API settings?',
        'Configure'
      ).then(selection => {
        if (selection === 'Configure') {
          configureApiSettings();
        }
      });
    } finally {
      // Hide loading state
      if (currentPanel) {
        currentPanel.webview.postMessage({
          command: 'setLoading',
          loading: false
        });
      }
    }
  }

  /**
   * Clear the chat session
   */
  function handleClearChat() {
    currentSession = {
      messages: [],
      id: generateSessionId()
    };
    
    if (currentPanel) {
      currentPanel.webview.postMessage({
        command: 'clearMessages'
      });
    }
  }

  /**
   * Configure API settings
   */
  async function configureApiSettings() {
    const config = vscode.workspace.getConfiguration('privateChatbot');

    // Get API URL
    const apiUrl = await vscode.window.showInputBox({
      prompt: 'Enter LLM API URL',
      value: config.get<string>('apiUrl', 'https://router.huggingface.co/featherless-ai/v1/completions'),
      placeHolder: 'https://router.huggingface.co/featherless-ai/v1/completions'
    });

    if (!apiUrl) return;

    // Get API Token
    const apiToken = await vscode.window.showInputBox({
      prompt: 'Enter API Token',
      password: true,
      placeHolder: 'hf_...'
    });

    if (!apiToken) return;

    try {
      // Update backend configuration
      const backendPort = config.get<number>('backendPort', 3002);
      const response = await axios.post(`http://localhost:${backendPort}/api/config/api`, {
        apiUrl,
        apiToken
      });

      if (response.data.success) {
        // Update VS Code settings
        await config.update('apiUrl', apiUrl, vscode.ConfigurationTarget.Global);
        
        vscode.window.showInformationMessage('✅ API configuration updated successfully!');
      } else {
        throw new Error(response.data.message || 'Configuration failed');
      }
    } catch (error: any) {
      console.error('Configuration error:', error);
      vscode.window.showErrorMessage(`Failed to configure API: ${error.message}`);
    }
  }

  /**
   * Test LLM connection
   */
  async function testLLMConnection() {
    const config = vscode.workspace.getConfiguration('privateChatbot');
    const backendPort = config.get<number>('backendPort', 3002);

    try {
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Testing LLM connection...",
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 0 });

        const response = await axios.post(`http://localhost:${backendPort}/api/chat/test`);
        
        progress.report({ increment: 100 });

        if (response.data.success) {
          vscode.window.showInformationMessage(
            `✅ Connection successful! Response time: ${response.data.responseTime}ms`
          );
        } else {
          throw new Error(response.data.message || 'Connection test failed');
        }
      });
    } catch (error: any) {
      console.error('Connection test error:', error);
      vscode.window.showErrorMessage(`❌ Connection test failed: ${error.message}`);
    }
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Tree data provider for the chat sidebar
 */
class ChatTreeProvider implements vscode.TreeDataProvider<ChatTreeItem> {
  constructor() {}

  getTreeItem(element: ChatTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ChatTreeItem): Thenable<ChatTreeItem[]> {
    if (!element) {
      return Promise.resolve([
        new ChatTreeItem(
          'Open Chat Window',
          vscode.TreeItemCollapsibleState.None,
          'privateChatbot.openChat'
        ),
        new ChatTreeItem(
          'Configure API',
          vscode.TreeItemCollapsibleState.None,
          'privateChatbot.configure'
        ),
        new ChatTreeItem(
          'Test Connection',
          vscode.TreeItemCollapsibleState.None,
          'privateChatbot.testConnection'
        )
      ]);
    }
    return Promise.resolve([]);
  }
}

class ChatTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly commandId?: string
  ) {
    super(label, collapsibleState);
    
    if (commandId) {
      this.command = {
        command: commandId,
        title: label
      };
    }

    // Set icons based on the label
    if (label.includes('Chat')) {
      this.iconPath = new vscode.ThemeIcon('comment-discussion');
    } else if (label.includes('Configure')) {
      this.iconPath = new vscode.ThemeIcon('settings-gear');
    } else if (label.includes('Test')) {
      this.iconPath = new vscode.ThemeIcon('pulse');
    }
  }
}

/**
 * Generate the HTML content for the chat webview
 */
function getChatWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Private ChatBot</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background-color: var(--vscode-titleBar-activeBackground);
            color: var(--vscode-titleBar-activeForeground);
            padding: 10px 15px;
            border-bottom: 1px solid var(--vscode-widget-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .header-buttons {
            display: flex;
            gap: 8px;
        }
        
        .btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 8px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .message {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            max-width: 85%;
            animation: fadeIn 0.3s ease-in;
        }
        
        .message.user {
            align-self: flex-end;
            flex-direction: row-reverse;
        }
        
        .message.assistant {
            align-self: flex-start;
        }
        
        .message-avatar {
            width: 24px;
            height: 24px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            flex-shrink: 0;
        }
        
        .message.user .message-avatar {
            background-color: var(--vscode-debugTokenExpression-name);
            color: var(--vscode-debugTokenExpression-value);
        }
        
        .message.assistant .message-avatar {
            background-color: var(--vscode-debugTokenExpression-string);
            color: var(--vscode-debugTokenExpression-value);
        }
        
        .message-content {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 8px;
            padding: 8px 12px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .message.user .message-content {
            background-color: var(--vscode-inputOption-activeBorder);
            color: var(--vscode-input-background);
        }
        
        .message-time {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        
        .input-container {
            padding: 15px;
            border-top: 1px solid var(--vscode-widget-border);
            background-color: var(--vscode-input-background);
        }
        
        .input-row {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }
        
        .message-input {
            flex: 1;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 8px 12px;
            font-family: inherit;
            font-size: inherit;
            resize: vertical;
            min-height: 20px;
            max-height: 120px;
        }
        
        .message-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
            border-color: var(--vscode-focusBorder);
        }
        
        .send-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            font-weight: 500;
        }
        
        .send-btn:hover:not(:disabled) {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .send-btn:disabled {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: not-allowed;
        }
        
        .loading {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
        
        .loading-dots {
            display: inline-block;
        }
        
        .loading-dots::after {
            content: '';
            animation: dots 1.5s steps(5, end) infinite;
        }
        
        .welcome-message {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            margin-top: 50px;
            padding: 20px;
        }
        
        .welcome-message h2 {
            margin-bottom: 10px;
            color: var(--vscode-foreground);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes dots {
            0%, 20% { content: ''; }
            40% { content: '.'; }
            60% { content: '..'; }
            80%, 100% { content: '...'; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 Private ChatBot</h1>
        <div class="header-buttons">
            <button class="btn btn-secondary" onclick="clearChat()">Clear</button>
            <button class="btn" onclick="configure()">Configure</button>
        </div>
    </div>
    
    <div class="chat-container">
        <div class="messages" id="messages">
            <div class="welcome-message">
                <h2>Welcome to your Private ChatBot!</h2>
                <p>This is a secure, private alternative to GitHub Copilot.</p>
                <p>Your conversations stay within your organization's infrastructure.</p>
                <p>Start by typing a message below or configure your API settings.</p>
            </div>
        </div>
        
        <div class="input-container">
            <div class="input-row">
                <textarea 
                    id="messageInput" 
                    class="message-input" 
                    placeholder="Ask me anything... (Press Ctrl+Enter to send)"
                    rows="1"
                ></textarea>
                <button id="sendBtn" class="send-btn" onclick="sendMessage()">Send</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const messagesContainer = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        let isLoading = false;

        // Handle keyboard shortcuts
        messageInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });

        // Auto-resize textarea
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'addMessage':
                    addMessage(message.message);
                    break;
                case 'setLoading':
                    setLoading(message.loading);
                    break;
                case 'clearMessages':
                    clearMessages();
                    break;
            }
        });

        function sendMessage() {
            const text = messageInput.value.trim();
            if (!text || isLoading) return;
            
            vscode.postMessage({
                command: 'sendMessage',
                text: text
            });
            
            messageInput.value = '';
            messageInput.style.height = 'auto';
        }

        function addMessage(message) {
            // Remove welcome message if it exists
            const welcomeMsg = messagesContainer.querySelector('.welcome-message');
            if (welcomeMsg) {
                welcomeMsg.remove();
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${message.role}\`;
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = message.role === 'user' ? 'U' : '🤖';
            
            const content = document.createElement('div');
            content.className = 'message-content';
            content.textContent = message.content;
            
            const time = document.createElement('div');
            time.className = 'message-time';
            time.textContent = new Date(message.timestamp).toLocaleTimeString();
            
            const messageBody = document.createElement('div');
            messageBody.appendChild(content);
            messageBody.appendChild(time);
            
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(messageBody);
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function setLoading(loading) {
            isLoading = loading;
            sendBtn.disabled = loading;
            sendBtn.textContent = loading ? 'Sending...' : 'Send';
            
            if (loading) {
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'loading';
                loadingDiv.id = 'loading-indicator';
                loadingDiv.innerHTML = '🤖 is typing<span class="loading-dots"></span>';
                messagesContainer.appendChild(loadingDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } else {
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
            }
        }

        function clearChat() {
            vscode.postMessage({
                command: 'clearChat'
            });
        }

        function configure() {
            vscode.postMessage({
                command: 'configure'
            });
        }

        function clearMessages() {
            messagesContainer.innerHTML = \`
                <div class="welcome-message">
                    <h2>Chat Cleared!</h2>
                    <p>Start a new conversation below.</p>
                </div>
            \`;
        }

        // Focus on input when loaded
        messageInput.focus();
    </script>
</body>
</html>`;
}

export function deactivate() {
  console.log('🔻 Private ChatBot Extension deactivated');
}
