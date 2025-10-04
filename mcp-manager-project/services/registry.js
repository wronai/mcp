class MCPServiceRegistry {
  constructor() {
    this.services = new Map();
    this.connections = new Map();
  }
  
  registerService(config) {
    const service = {
      id: generateId(),
      name: config.name,
      type: config.type, // 'server' | 'client'
      endpoint: config.endpoint,
      status: 'pending',
      capabilities: config.capabilities,
      metadata: config.metadata
    };
    
    this.services.set(service.id, service);
    this.startHealthCheck(service.id);
    return service;
  }
  
  async healthCheck(serviceId) {
    // Ping endpoint i aktualizuj status
  }
}