class MCPAssistant {
  constructor(ollamaClient) {
    this.ollama = ollamaClient;
    this.context = [];
  }
  
  async suggestConfiguration(serviceType) {
    const prompt = `
      Generate MCP server configuration for ${serviceType}.
      Include: endpoint, capabilities, prompts, and best practices.
      Format: JSON
    `;
    
    const response = await this.ollama.generate({
      model: 'llama3.2',
      prompt: prompt,
      format: 'json'
    });
    
    return JSON.parse(response.response);
  }
  
  async debugConnection(error, config) {
    // Analiza błędu i sugestie rozwiązań
    const analysis = await this.analyzeError(error, config);
    return {
      issue: analysis.issue,
      solutions: analysis.solutions,
      commands: analysis.debugCommands
    };
  }
}