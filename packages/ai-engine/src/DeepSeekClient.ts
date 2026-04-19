/**
 * DeepSeek API Client Wrapper
 * 
 * Mandates:
 * 1. response_format: { type: 'json_object' }
 * 2. Timeout: 15 seconds
 * 3. Retries: 3 with exponential backoff (1s, 2s, 4s)
 */

export interface DeepSeekConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export class DeepSeekClient {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;

  constructor(config: DeepSeekConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.deepseek.com/v1';
    this.timeout = config.timeout || 15000;
    this.maxRetries = config.maxRetries || 3;
  }

  async chat(messages: any[]): Promise<any> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        });

        clearTimeout(id);

        if (!response.ok) {
          throw new Error(`DeepSeek API error: ${response.status} ${await response.text()}`);
        }

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
      } catch (error: any) {
        lastError = error;
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}
