const registry = require('../services/registry.js');

describe('MCP Service Registry', () => {
  beforeEach(() => {
    // Clear services before each test
    registry.services.clear();
  });

  test('should register new service', () => {
    const service = registry.registerService({
      name: 'Test Server',
      type: 'server',
      endpoint: 'http://localhost:8080'
    });
    
    expect(service.id).toBeDefined();
    expect(service.name).toBe('Test Server');
    expect(service.status).toBe('active'); // startHealthCheck sets it to active
  });

  test('should get all services', () => {
    registry.registerService({
      name: 'Service 1',
      type: 'server',
      endpoint: 'http://localhost:8001'
    });
    
    registry.registerService({
      name: 'Service 2',
      type: 'client',
      endpoint: 'http://localhost:8002'
    });
    
    const services = registry.getAllServices();
    expect(services).toHaveLength(2);
    expect(services[0].name).toBe('Service 1');
    expect(services[1].name).toBe('Service 2');
  });

  test('should get service by id', () => {
    const service = registry.registerService({
      name: 'Test Service',
      type: 'server',
      endpoint: 'http://localhost:8080'
    });
    
    const retrieved = registry.getService(service.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.name).toBe('Test Service');
  });

  test('should update service', () => {
    const service = registry.registerService({
      name: 'Original Name',
      type: 'server',
      endpoint: 'http://localhost:8080'
    });
    
    const updated = registry.updateService(service.id, {
      name: 'Updated Name',
      endpoint: 'http://localhost:9090'
    });
    
    expect(updated.name).toBe('Updated Name');
    expect(updated.endpoint).toBe('http://localhost:9090');
    expect(updated.updatedAt).toBeDefined();
  });

  test('should delete service', () => {
    const service = registry.registerService({
      name: 'To Delete',
      type: 'server',
      endpoint: 'http://localhost:8080'
    });
    
    const deleted = registry.deleteService(service.id);
    expect(deleted).toBe(true);
    
    const retrieved = registry.getService(service.id);
    expect(retrieved).toBeUndefined();
  });

  test('should test service', async () => {
    const service = registry.registerService({
      name: 'Test Service',
      type: 'server',
      endpoint: 'http://localhost:8080'
    });
    
    const result = await registry.testService(service.id, 'test query');
    expect(result).toHaveProperty('response');
    expect(result).toHaveProperty('status', 'ok');
  });
});