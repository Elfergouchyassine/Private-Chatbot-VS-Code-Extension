# Private ChatBot Extension for VS Code

A secure, private alternative to GitHub Copilot that gives you complete control over your AI assistant while protecting your sensitive code and data.

## The Problem

GitHub Copilot and similar cloud-based AI coding assistants present significant risks for organizations:

### **Data Privacy Concerns**
- Your code, comments, and context are sent to external servers
- Sensitive business logic and proprietary algorithms may be exposed
- No control over where your data is stored or processed

### **Compliance & Security Risks**
- GDPR, HIPAA, and other regulations may prohibit sending code to third parties
- Enterprise environments often require air-gapped or on-premises solutions
- Audit trails and data lineage become difficult to maintain

### **Limited Customization**
- Cannot fine-tune models for your specific domain or codebase
- Generic responses that may not align with your coding standards
- No control over model behavior or response filtering

### **Cost & Dependency**
- Subscription fees can be significant for large teams
- Vendor lock-in limits flexibility
- Service outages impact developer productivity

## The Solution

This VS Code extension provides a **private, secure, and customizable AI coding assistant** that addresses all these concerns:

### **Complete Privacy**
- All processing happens within your infrastructure
- Your code never leaves your network
- Full control over data storage and processing

### **API-Agnostic Design**
- Connect to any LLM API (Hugging Face, OpenAI-compatible, local models)
- Switch between providers without changing your workflow
- Support for both cloud and on-premises models

### **Enterprise-Ready**
- Configurable security policies
- Rate limiting and resource management
- Comprehensive logging and monitoring

### **Seamless Integration**
- Native VS Code chat interface
- Familiar command palette integration
- Sidebar and webview support

## Architecture

The solution consists of two main components working together:

```
┌─────────────────────────────────────────────────────────┐
│                    VS Code Extension                    │
├─────────────────┬───────────────────┬───────────────────┤
│   Chat WebView  │  Command Palette  │  Configuration UI │
│                 │    Integration    │                   │
└─────────────────┴───────────────────┴───────────────────┘
                              │
                    HTTP/HTTPS (Local Network)
                              │
┌─────────────────────────────────────────────────────────┐
│                   Backend API Server                   │
├─────────────────┬───────────────────┬───────────────────┤
│  Security &     │   Configuration   │   LLM Service     │
│  Rate Limiting  │   Management      │   Integration     │
└─────────────────┴───────────────────┴───────────────────┘
                              │
                    HTTPS (Configurable)
                              │
┌─────────────────────────────────────────────────────────┐
│                 Your Choice of LLM                     │
├─────────────────┬───────────────────┬───────────────────┤
│ Hugging Face    │    Local Models   │   OpenAI-Compatible│
│   (Llama)       │   (Ollama, etc.)  │     APIs          │
└─────────────────┴───────────────────┴───────────────────┘
```

### **Component Details**

#### **VS Code Extension (Frontend)**
- **Location**: `src/extension.ts`
- **Purpose**: User interface and VS Code integration
- **Features**:
  - Chat webview with modern UI
  - Command palette commands
  - Sidebar integration
  - Configuration management
  - Secure communication with backend

#### **Backend API Server**
- **Location**: `backend/src/`
- **Purpose**: Secure proxy and request management
- **Features**:
  - Express.js server with security middleware
  - Rate limiting and CORS protection
  - Configuration management
  - LLM API abstraction layer
  - Request/response logging

#### **Key Services**

1. **LLM Service** (`backend/src/services/llmService.ts`)
   - API-agnostic LLM communication
   - Support for multiple providers
   - Error handling and retry logic

2. **Config Service** (`backend/src/services/configService.ts`)
   - Secure configuration storage
   - Environment variable management
   - Runtime configuration updates

3. **Chat Routes** (`backend/src/routes/chat.ts`)
   - RESTful chat endpoints
   - Message validation
   - Response streaming support

## Step-by-Step Setup Guide

### Prerequisites

- **Node.js** (v16 or higher)
- **VS Code** (v1.74.0 or higher)
- **LLM API Access** (Hugging Face, local model, or OpenAI-compatible API)

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/Elfergouchyassine/Private-VS-Code-Extension.git
cd Private-VS-Code-Extension

# Install extension dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### Step 2: Configure Your LLM API

#### Option A: Environment Variables (Recommended for Production)

```bash
# In the backend directory
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# For Hugging Face Llama
LLM_API_URL=https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf
LLM_API_TOKEN=hf_your_token_here
LLM_DEFAULT_MODEL=meta-llama/Llama-2-7b-chat-hf

# For local Ollama
LLM_API_URL=http://localhost:11434/api/generate
LLM_API_TOKEN=
LLM_DEFAULT_MODEL=llama2

# For OpenAI-compatible APIs
LLM_API_URL=https://your-api-endpoint.com/v1/completions
LLM_API_TOKEN=your_api_token
LLM_DEFAULT_MODEL=gpt-3.5-turbo
```

#### Option B: VS Code Extension Configuration

You can also configure the API through the VS Code interface (Step 5).

### Step 3: Start the Backend Server

```bash
cd backend
npm start
```

You should see:
```
🚀 Server running on http://localhost:3004
📊 Health check available at http://localhost:3004/health
```

### Step 4: Launch the Extension in Development Mode

1. Open the project root in VS Code
2. Press `F5` to launch the Extension Development Host
3. A new VS Code window will open with the extension loaded

### Step 5: Configure and Test the Extension

In the new VS Code window:

1. **Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)

2. **Configure API Settings**:
   ```
   Private ChatBot: Configure API Settings
   ```
   - Enter your API URL
   - Enter your API token
   - Select your model

3. **Test Connection**:
   ```
   Private ChatBot: Test LLM Connection
   ```
   - Verify your configuration is working

4. **Start Chatting**:
   ```
   Private ChatBot: Open Chat
   ```
   - Opens the chat interface
   - Or click the ChatBot icon in the Explorer sidebar


## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LLM_API_URL` | LLM API endpoint | - | Yes |
| `LLM_API_TOKEN` | API authentication token | - | Depends on API |
| `LLM_DEFAULT_MODEL` | Default model name | - | Yes |
| `PORT` | Backend server port | 3004 | No |
| `NODE_ENV` | Environment mode | development | No |

### VS Code Settings

Configure in VS Code settings (`settings.json`):

```json
{
  "privateChatbot.apiUrl": "http://localhost:3004",
  "privateChatbot.defaultModel": "meta-llama/Llama-2-7b-chat-hf",
  "privateChatbot.maxTokens": 1000,
  "privateChatbot.temperature": 0.7,
  "privateChatbot.backendPort": 3004
}
```

### Supported LLM Providers

#### 🤗 Hugging Face
```bash
LLM_API_URL=https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf
LLM_API_TOKEN=hf_your_token_here
LLM_DEFAULT_MODEL=meta-llama/Llama-2-7b-chat-hf
```

#### 🦙 Local Ollama
```bash
LLM_API_URL=http://localhost:11434/api/generate
LLM_API_TOKEN=
LLM_DEFAULT_MODEL=llama2
```

#### 🤖 OpenAI-Compatible
```bash
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_TOKEN=sk-your-api-key
LLM_DEFAULT_MODEL=gpt-3.5-turbo
```

## Available Commands

Access these through the Command Palette (`Ctrl+Shift+P`):

- **`Private ChatBot: Open Chat`** - Open the main chat interface
- **`Private ChatBot: Configure API Settings`** - Set up your LLM API
- **`Private ChatBot: Test LLM Connection`** - Verify API connectivity
- **`Private ChatBot: Clear Chat History`** - Reset conversation history
- **`Private ChatBot: Show Configuration`** - View current settings

### Project Structure

```
ChatBotExtensionApp/
├── src/                          # VS Code Extension
│   ├── extension.ts             # Main extension file
│   └── test/                    # Extension tests
├── backend/                     # API Server
│   ├── src/
│   │   ├── server.ts           # Express server
│   │   ├── routes/             # API routes
│   │   │   ├── chat.ts         # Chat endpoints
│   │   │   └── config.ts       # Configuration endpoints
│   │   └── services/           # Business logic
│   │       ├── llmService.ts   # LLM integration
│   │       └── configService.ts # Config management
│   ├── .env.example           # Environment template
│   └── package.json           # Backend dependencies
├── package.json               # Extension dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```
