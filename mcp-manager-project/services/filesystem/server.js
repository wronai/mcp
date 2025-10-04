import { MCPServer } from '@modelcontextprotocol/sdk';
import fs from 'fs/promises';
import path from 'path';

const server = new MCPServer({
  name: 'filesystem-server',
  version: '1.0.0',
  capabilities: {
    tools: {
      list: true,
      call: true
    }
  }
});

server.addTool({
  name: 'read_file',
  description: 'Read contents of a file',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' }
    },
    required: ['path']
  },
  handler: async ({ path: filePath }) => {
    const content = await fs.readFile(filePath, 'utf-8');
    return { content };
  }
});

server.addTool({
  name: 'write_file',
  description: 'Write content to a file',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      content: { type: 'string' }
    },
    required: ['path', 'content']
  },
  handler: async ({ path: filePath, content }) => {
    await fs.writeFile(filePath, content);
    return { success: true };
  }
});

server.addTool({
  name: 'list_directory',
  description: 'List contents of a directory',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' }
    },
    required: ['path']
  },
  handler: async ({ path: dirPath }) => {
    const files = await fs.readdir(dirPath);
    const detailed = await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(dirPath, file);
        const stats = await fs.stat(fullPath);
        return {
          name: file,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime
        };
      })
    );
    return { files: detailed };
  }
});

server.start();