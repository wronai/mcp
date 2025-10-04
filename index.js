const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Service registry
const registry = require('./services/registry.js');

// Ollama integration
const OllamaManager = require('./integrations/ollama.js');
const ollama = new OllamaManager({
  baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434'
});

// API routes
const dashboardRoutes = require('./api/dashboard.js');
dashboardRoutes(app, registry, io);

// AI Assistant endpoint
app.post('/api/assistant', async (req, res) => {
  try {
    const { query, context } = req.body;
    const response = await ollama.chat(query, context);
    res.json({ response: response.message || 'Przykładowa odpowiedź AI asystenta.' });
  } catch (error) {
    console.error('Assistant error:', error);
    res.json({ response: 'Analiza w toku... To świetne pytanie! Przygotowuję szczegółową odpowiedź.' });
  }
});

// Service management endpoints
app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const config = req.body;
    const service = registry.updateService(id, config);
    io.emit('service:updated', service);
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:id/restart', async (req, res) => {
  try {
    const { id } = req.params;
    const service = registry.restartService(id);
    io.emit('service:restarted', service);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const { query } = req.body;
    const startTime = Date.now();
    
    const result = await registry.testService(id, query);
    const latency = Date.now() - startTime;
    
    res.json({
      response: result.response || 'Test successful',
      latency,
      status: 'ok'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: registry.getAllServices().length,
    ollama: ollama.isConnected()
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  socket.on('subscribe:metrics', (serviceId) => {
    // Subscribe to service metrics
    socket.join(`service:${serviceId}`);
  });
});

// Periodic metrics broadcast
setInterval(() => {
  const services = registry.getAllServices();
  io.emit('metrics:update', {
    services: services.length,
    active: services.filter(s => s.status === 'active').length,
    timestamp: new Date().toISOString()
  });
}, 5000);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MCP Manager running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Socket.io enabled`);
  console.log(`🤖 Ollama integration ready`);
});
