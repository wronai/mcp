app.get('/api/services', async (req, res) => {
  const services = await registry.getAllServices();
  res.json(services);
});

app.post('/api/services', async (req, res) => {
  const service = await registry.registerService(req.body);
  io.emit('service:registered', service);
  res.json(service);
});

app.ws('/monitor', (ws, req) => {
  // WebSocket dla monitoringu real-time
  ws.on('message', async (msg) => {
    const data = JSON.parse(msg);
    if (data.type === 'subscribe') {
      subscribeToMetrics(data.serviceId, ws);
    }
  });
});