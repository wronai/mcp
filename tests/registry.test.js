describe('MCP Service Registry', () => {
  test('should register new service', async () => {
    const service = await registry.registerService({
      name: 'Test Server',
      type: 'server',
      endpoint: 'http://localhost:8080'
    });
    
    expect(service.id).toBeDefined();
    expect(service.status).toBe('pending');
  });
});