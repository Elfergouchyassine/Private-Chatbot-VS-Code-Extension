import fs from 'fs';
import path from 'path';

export interface LLMConfig {
  apiUrl: string;
  apiToken: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  requestTimeout: number;
  enableLogging: boolean;
}

export interface AppConfig {
  llm: LLMConfig;
  server: {
    port: number;
    host: string;
  };
}

export class ConfigService {
  private config: Partial<LLMConfig> = {};
  private readonly configPath: string;

  constructor() {
    // Store config in user's home directory for security
    const homeDir = require('os').homedir();
    const configDir = path.join(homeDir, '.vscode-chatbot-extension');
    this.configPath = path.join(configDir, 'config.json');
    
    this.ensureConfigDirectory();
    this.loadConfig();
  }

  /**
   * Ensure the config directory exists
   */
  private ensureConfigDirectory(): void {
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  /**
   * Load configuration from file
   */
  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(configData);
        console.log('✅ Configuration loaded successfully');
      } else {
        console.log('📝 No configuration file found, using defaults');
        this.initializeDefaultConfig();
      }
    } catch (error) {
      console.error('❌ Error loading configuration:', error);
      this.initializeDefaultConfig();
    }
  }

  /**
   * Initialize default configuration
   */
  private initializeDefaultConfig(): void {
    this.config = {
      apiUrl: process.env.LLM_API_URL || '',
      apiToken: process.env.LLM_API_TOKEN || '',
      defaultModel: process.env.LLM_DEFAULT_MODEL || 'meta-llama/Meta-Llama-3-8B',
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '150'),
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3'),
      requestTimeout: parseInt(process.env.LLM_REQUEST_TIMEOUT || '30000'),
      enableLogging: process.env.LLM_ENABLE_LOGGING === 'true'
    };
    
    this.saveConfig();
  }

  /**
   * Save configuration to file
   */
  private saveConfig(): void {
    try {
      const configData = JSON.stringify(this.config, null, 2);
      fs.writeFileSync(this.configPath, configData, 'utf8');
      console.log('✅ Configuration saved successfully');
    } catch (error) {
      console.error('❌ Error saving configuration:', error);
      throw new Error('Failed to save configuration');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): LLMConfig {
    const defaultConfig: LLMConfig = {
      apiUrl: '',
      apiToken: '',
      defaultModel: 'meta-llama/Meta-Llama-3-8B',
      maxTokens: 150,
      temperature: 0.3,
      requestTimeout: 30000,
      enableLogging: false
    };

    return { ...defaultConfig, ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LLMConfig>): void {
    // Validate configuration
    this.validateConfig(newConfig);
    
    // Merge with existing config
    this.config = { ...this.config, ...newConfig };
    
    // Save to file
    this.saveConfig();
    
    console.log('✅ Configuration updated successfully');
  }

  /**
   * Set API configuration
   */
  setApiConfig(apiUrl: string, apiToken: string): void {
    if (!apiUrl || !apiUrl.startsWith('http')) {
      throw new Error('Invalid API URL. Must start with http:// or https://');
    }

    if (!apiToken || apiToken.trim().length === 0) {
      throw new Error('API token is required');
    }

    this.updateConfig({
      apiUrl: apiUrl.trim(),
      apiToken: apiToken.trim()
    });
  }

  /**
   * Validate configuration values
   */
  private validateConfig(config: Partial<LLMConfig>): void {
    if (config.apiUrl !== undefined) {
      if (config.apiUrl && !config.apiUrl.startsWith('http')) {
        throw new Error('API URL must start with http:// or https://');
      }
    }

    if (config.maxTokens !== undefined) {
      if (config.maxTokens < 1 || config.maxTokens > 4000) {
        throw new Error('maxTokens must be between 1 and 4000');
      }
    }

    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 2) {
        throw new Error('temperature must be between 0 and 2');
      }
    }

    if (config.requestTimeout !== undefined) {
      if (config.requestTimeout < 1000 || config.requestTimeout > 120000) {
        throw new Error('requestTimeout must be between 1000ms and 120000ms');
      }
    }
  }

  /**
   * Check if configuration is valid
   */
  isConfigured(): boolean {
    const config = this.getConfig();
    return !!(config.apiUrl && config.apiToken);
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { configured: boolean; missingFields: string[] } {
    const config = this.getConfig();
    const missingFields: string[] = [];

    if (!config.apiUrl) missingFields.push('apiUrl');
    if (!config.apiToken) missingFields.push('apiToken');

    return {
      configured: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.config = {};
    this.initializeDefaultConfig();
    console.log('🔄 Configuration reset to defaults');
  }

  /**
   * Get masked configuration (for logging/display purposes)
   */
  getMaskedConfig(): any {
    const config = this.getConfig();
    return {
      ...config,
      apiToken: config.apiToken ? `${config.apiToken.substring(0, 10)}...` : '',
      apiUrl: config.apiUrl || '[Not configured]'
    };
  }
}
