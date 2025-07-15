"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMService = void 0;
const axios_1 = __importDefault(require("axios"));
class LLMService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    /**
     * Send a chat completion request to the configured LLM API
     */
    async sendChatCompletion(request) {
        const config = this.configService.getConfig();
        if (!config.apiUrl) {
            throw new Error('LLM API URL not configured');
        }
        if (!config.apiToken) {
            throw new Error('LLM API token not configured');
        }
        try {
            console.log(`🤖 Sending request to LLM: ${config.apiUrl}`);
            // Prepare request payload based on API format
            const payload = {
                model: request.model || config.defaultModel || 'meta-llama/Meta-Llama-3-8B',
                prompt: request.prompt,
                max_tokens: request.max_tokens || config.maxTokens || 100,
                temperature: request.temperature || config.temperature || 0.7
            };
            const response = await axios_1.default.post(config.apiUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${config.apiToken}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'VS-Code-ChatBot-Extension/1.0.0'
                },
                timeout: config.requestTimeout || 30000, // 30 seconds default
                validateStatus: (status) => status < 500 // Accept 4xx errors for better error handling
            });
            if (response.status >= 400) {
                throw new Error(`LLM API returned error: ${response.status} - ${response.statusText}`);
            }
            console.log(`✅ LLM response received (${response.data.usage?.total_tokens || 'unknown'} tokens)`);
            return response.data;
        }
        catch (error) {
            console.error('❌ LLM API Error:', error.message);
            if (error.response) {
                // API responded with error status
                const errorMessage = error.response.data?.error?.message || error.response.statusText;
                throw new Error(`LLM API Error (${error.response.status}): ${errorMessage}`);
            }
            else if (error.request) {
                // Request was made but no response received
                throw new Error('LLM API is not responding. Please check the API URL and network connection.');
            }
            else {
                // Something else happened
                throw new Error(`Request failed: ${error.message}`);
            }
        }
    }
    /**
     * Send a simple text completion request
     */
    async sendCompletion(prompt, maxTokens) {
        const response = await this.sendChatCompletion({
            model: '', // Will use default from config
            prompt,
            max_tokens: maxTokens
        });
        // Extract text from response
        if (response.choices && response.choices.length > 0) {
            const choice = response.choices[0];
            return choice.text || choice.message?.content || '';
        }
        throw new Error('No response from LLM');
    }
    /**
     * Test the LLM connection
     */
    async testConnection() {
        const startTime = Date.now();
        try {
            const testPrompt = "Hello, this is a connection test. Please respond with 'Connection successful'.";
            const response = await this.sendCompletion(testPrompt, 20);
            const responseTime = Date.now() - startTime;
            return {
                success: true,
                message: `Connection successful! Response: ${response.substring(0, 100)}...`,
                responseTime
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Connection failed: ${error.message}`
            };
        }
    }
    /**
     * Validate request parameters
     */
    validateRequest(request) {
        const errors = [];
        if (!request.prompt || request.prompt.trim().length === 0) {
            errors.push('Prompt is required and cannot be empty');
        }
        if (request.prompt && request.prompt.length > 10000) {
            errors.push('Prompt is too long (maximum 10,000 characters)');
        }
        if (request.max_tokens && (request.max_tokens < 1 || request.max_tokens > 4000)) {
            errors.push('max_tokens must be between 1 and 4000');
        }
        if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
            errors.push('temperature must be between 0 and 2');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
exports.LLMService = LLMService;
//# sourceMappingURL=llmService.js.map