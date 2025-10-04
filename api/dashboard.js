module.exports = (app, registry) => {
  app.get('/api/services', async (req, res) => {
    try {
      const services = await registry.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/services', async (req, res) => {
    try {
      const service = await registry.registerService(req.body);
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
};