# ChatBot Extension Backend API

This is the backend API server for the Private ChatBot VS Code Extension. It provides a secure proxy to communicate with LLM models like Llama without exposing sensitive data to external services.

## Features

- 🔒 **Secure Configuration**: API tokens and endpoints stored locally
- 🚀 **Fast API**: Express.js with TypeScript for reliable performance
- 🛡️ **Security**: Rate limiting, CORS, helmet protection
- 🔧 **Configurable**: Support for multiple LLM providers
- 📊 **Monitoring**: Health checks and request logging
- ✅ **Validated**: Input validation and error handling

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your LLM API configuration
# For Llama via Hugging Face:
LLM_API_URL=https://router.huggingface.co/featherless-ai/v1/completions
LLM_API_TOKEN=your_huggingface_token_here
```

### 3. Build and Run
```bash
# Build TypeScript
npm run build

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

### 4. Test the API
```bash
# Health check
curl http://localhost:3002/health

# Test LLM connection
curl -X POST http://localhost:3002/api/chat/test \
  -H "Content-Type: application/json"
```

## API Endpoints

### Health Check
- **GET** `/health` - Server health status

### Configuration
- **GET** `/api/config` - Get current configuration (masked)
- **POST** `/api/config` - Update configuration
- **POST** `/api/config/api` - Set API URL and token
- **GET** `/api/config/status` - Get configuration status
- **POST** `/api/config/reset` - Reset to default configuration

### Chat/LLM
- **POST** `/api/chat/completion` - Full LLM completion request
- **POST** `/api/chat/simple` - Simple text completion
- **POST** `/api/chat/test` - Test LLM connection

## Example Requests

### Simple Text Completion
```bash
curl -X POST http://localhost:3002/api/chat/simple \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is artificial intelligence?",
    "maxTokens": 100
  }'
```

### Full LLM Request
```bash
curl -X POST http://localhost:3002/api/chat/completion \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Meta-Llama-3-8B",
    "prompt": "Explain machine learning in simple terms",
    "max_tokens": 150,
    "temperature": 0.7
  }'
```

### Configure API
```bash
curl -X POST http://localhost:3002/api/config/api \
  -H "Content-Type: application/json" \
  -d '{
    "apiUrl": "https://router.huggingface.co/featherless-ai/v1/completions",
    "apiToken": "hf_your_token_here"
  }'
```

## Configuration

The backend supports configuration through:
1. Environment variables (`.env` file)
2. REST API endpoints
3. Configuration file (`~/.vscode-chatbot-extension/config.json`)

### Supported LLM Providers

#### Hugging Face (Llama)
```bash
LLM_API_URL=https://router.huggingface.co/featherless-ai/v1/completions
LLM_API_TOKEN=hf_your_token_here
LLM_DEFAULT_MODEL=meta-llama/Meta-Llama-3-8B
```

#### OpenAI Compatible APIs
```bash
LLM_API_URL=https://api.openai.com/v1/completions
LLM_API_TOKEN=sk-your_token_here
LLM_DEFAULT_MODEL=gpt-3.5-turbo
```

#### Local Models (Ollama, etc.)
```bash
LLM_API_URL=http://localhost:11434/api/generate
LLM_API_TOKEN=not_required_for_local
LLM_DEFAULT_MODEL=llama2
```

## Security

- API tokens are stored securely in the user's home directory
- CORS is configured for VS Code webviews only
- Rate limiting prevents abuse
- Input validation on all endpoints
- No sensitive data logging

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests (when implemented)
npm test
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3002 |
| `NODE_ENV` | Environment | development |
| `LLM_API_URL` | LLM API endpoint | - |
| `LLM_API_TOKEN` | LLM API token | - |
| `LLM_DEFAULT_MODEL` | Default model | meta-llama/Meta-Llama-3-8B |
| `LLM_MAX_TOKENS` | Max tokens per request | 100 |
| `LLM_TEMPERATURE` | Response creativity | 0.7 |
| `LLM_REQUEST_TIMEOUT` | Request timeout (ms) | 30000 |
| `LLM_ENABLE_LOGGING` | Enable request logging | false |

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid API token)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Support

For issues and questions:
1. Check the configuration with `/api/config/status`
2. Test the LLM connection with `/api/chat/test`
3. Review the server logs for detailed error messages
4. Ensure your API token has the necessary permissions
