const { test, expect } = require('@playwright/test');

test.describe('API Endpoints', () => {
  test('GET /health should return ok status', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('services');
    expect(data).toHaveProperty('ollama');
  });

  test('GET /api/services should return array', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/services');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('POST /api/services should create new service', async ({ request }) => {
    const newService = {
      name: 'Test API Service',
      endpoint: 'http://localhost:9000',
      type: 'server'
    };
    
    const response = await request.post('http://localhost:3000/api/services', {
      data: newService
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe(newService.name);
    expect(data.endpoint).toBe(newService.endpoint);
  });

  test('POST /api/assistant should return AI response', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/assistant', {
      data: {
        query: 'Test query',
        context: null
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('response');
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
  });
});
