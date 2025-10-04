const fetch = require('node-fetch');

class OllamaManager {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.models = [];
    this.connected = false;
    this.checkConnection();
  }
  
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (response.ok) {
        this.connected = true;
        const data = await response.json();
        this.models = data.models || [];
      }
    } catch (error) {
      console.log('Ollama not connected:', error.message);
      this.connected = false;
    }
  }
  
  isConnected() {
    return this.connected;
  }
  
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }
  
  async chat(query, context) {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: query,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error('Ollama request failed');
      }
      
      const data = await response.json();
      return { message: data.response };
    } catch (error) {
      console.error('Ollama chat error:', error);
      return { 
        message: 'Przepraszam, nie mogę się połączyć z Ollama. Sprawdź czy serwer jest uruchomiony na ' + this.baseUrl 
      };
    }
  }
  
  async createMCPServer(model, systemPrompt) {
    return {
      endpoint: `${this.baseUrl}/v1/chat`,
      config: {
        model: model,
        system: systemPrompt,
        stream: true
      }
    };
  }
  
  async generate(options) {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model || 'llama3.2',
          prompt: options.prompt,
          format: options.format,
          stream: false
        })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Generate error:', error);
      throw error;
    }
  }
}

module.exports = OllamaManager;