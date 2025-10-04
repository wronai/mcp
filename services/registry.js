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
  
  updateService(serviceId, config) {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }
    
    Object.assign(service, config);
    service.updatedAt = new Date().toISOString();
    this.services.set(serviceId, service);
    return service;
  }
  
  restartService(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }
    
    service.status = 'pending';
    setTimeout(() => {
      service.status = 'active';
      service.restartedAt = new Date().toISOString();
    }, 2000);
    
    return service;
  }
  
  async testService(serviceId, query) {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }
    
    // Simulate test
    return {
      response: `Test successful for ${service.name}`,
      status: 'ok',
      serviceId: serviceId
    };
  }
  
  deleteService(serviceId) {
    return this.services.delete(serviceId);
  }
}

module.exports = new MCPServiceRegistry();