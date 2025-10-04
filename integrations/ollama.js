class OllamaManager {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.models = [];
  }
  
  async listModels() {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    return response.json();
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
}