function generateId() {
  return `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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
      capabilities: config.capabilities || [],
      metadata: config.metadata || {}
    };
    
    this.services.set(service.id, service);
    this.startHealthCheck(service.id);
    return service;
  }
  
  getAllServices() {
    return Array.from(this.services.values());
  }
  
  getService(serviceId) {
    return this.services.get(serviceId);
  }
  
  startHealthCheck(serviceId) {
    // Placeholder for health check implementation
    const service = this.services.get(serviceId);
    if (service) {
      service.status = 'active';
    }
  }
  
  async healthCheck(serviceId) {
    // Ping endpoint and update status
    const service = this.services.get(serviceId);
    if (service) {
      service.status = 'active';
      service.lastCheck = new Date().toISOString();
    }
    return service;
  }
}

module.exports = new MCPServiceRegistry();