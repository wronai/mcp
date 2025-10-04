const promClient = require('prom-client');

const metrics = {
  activeConnections: new promClient.Gauge({
    name: 'mcp_active_connections',
    help: 'Number of active MCP connections',
    labelNames: ['service_type', 'service_name']
  }),
  
  requestDuration: new promClient.Histogram({
    name: 'mcp_request_duration_seconds',
    help: 'MCP request duration in seconds',
    labelNames: ['method', 'status']
  }),
  
  errorRate: new promClient.Counter({
    name: 'mcp_errors_total',
    help: 'Total number of MCP errors',
    labelNames: ['service', 'error_type']
  })
};