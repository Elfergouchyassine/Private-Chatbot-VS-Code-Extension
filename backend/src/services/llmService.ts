import axios, { AxiosResponse } from 'axios';
import { ConfigService } from './configService';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface LLMRequest {
  model: string;
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  messages?: ChatMessage[];
}

export interface LLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    text?: string;
    message?: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LLMService {
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  /**
   * Send a chat completion request to the configured LLM API
   */
  async sendChatCompletion(request: LLMRequest): Promise<LLMResponse> {
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
        max_tokens: request.max_tokens || config.maxTokens || 150,
        temperature: request.temperature || config.temperature || 0.3
      };

      const response: AxiosResponse<LLMResponse> = await axios.post(
        config.apiUrl,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${config.apiToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'VS-Code-ChatBot-Extension/1.0.0'
          },
          timeout: config.requestTimeout || 30000, // 30 seconds default
          validateStatus: (status: number) => status < 500 // Accept 4xx errors for better error handling
        }
      );

      if (response.status >= 400) {
        throw new Error(`LLM API returned error: ${response.status} - ${response.statusText}`);
      }

      console.log(`✅ LLM response received (${response.data.usage?.total_tokens || 'unknown'} tokens)`);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ LLM API Error:', error.message);
      
      if (error.response) {
        // API responded with error status
        const errorMessage = error.response.data?.error?.message || error.response.statusText;
        throw new Error(`LLM API Error (${error.response.status}): ${errorMessage}`);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('LLM API is not responding. Please check the API URL and network connection.');
      } else {
        // Something else happened
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  /**
   * Send a simple text completion request
   */
  async sendCompletion(prompt: string, maxTokens?: number): Promise<string> {
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
  async testConnection(): Promise<{ success: boolean; message: string; responseTime?: number }> {
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
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Validate request parameters
   */
  validateRequest(request: LLMRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

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
