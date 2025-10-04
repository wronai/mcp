import { MCPServer } from '@modelcontextprotocol/sdk';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const server = new MCPServer({
  name: 'database-server',
  version: '1.0.0'
});

server.addTool({
  name: 'query',
  description: 'Execute a SQL query',
  inputSchema: {
    type: 'object',
    properties: {
      sql: { type: 'string' },
      params: { type: 'array', optional: true }
    },
    required: ['sql']
  },
  handler: async ({ sql, params = [] }) => {
    // Bezpieczeństwo: sprawdź czy to SELECT
    if (!/^\s*SELECT/i.test(sql)) {
      throw new Error('Only SELECT queries are allowed');
    }
    
    const result = await pool.query(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount
    };
  }
});

server.addTool({
  name: 'list_tables',
  description: 'List all tables in database',
  handler: async () => {
    const result = await pool.query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    return { tables: result.rows };
  }
});

server.start();