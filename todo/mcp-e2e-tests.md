# 🧪 Testy E2E i Biblioteka Usług MCP

## 📋 Testy End-to-End z Playwright

### Struktura testów
```typescript
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
```

### Test Suite: Zarządzanie Serwerami
```typescript
// e2e/tests/server-management.spec.ts
import { test, expect } from '@playwright/test';
import { MCPTestHelper } from '../helpers/mcp-helper';

test.describe('MCP Server Management', () => {
  let helper: MCPTestHelper;
  
  test.beforeEach(async ({ page }) => {
    helper = new MCPTestHelper(page);
    await helper.login();
    await page.goto('/dashboard');
  });

  test('should add new Ollama server', async ({ page }) => {
    // Kliknij przycisk dodawania usługi
    await page.click('button:has-text("+ Dodaj nową usługę")');
    
    // Wypełnij formularz
    await page.fill('input[name="serverName"]', 'Test Ollama Server');
    await page.fill('input[name="endpoint"]', 'http://localhost:11434');
    await page.selectOption('select[name="serverType"]', 'ollama');
    await page.selectOption('select[name="model"]', 'llama3.2');
    
    // Zapisz
    await page.click('button:has-text("Zapisz")');
    
    // Sprawdź czy serwer pojawił się na liście
    await expect(page.locator('.service-item:has-text("Test Ollama Server")')).toBeVisible();
    
    // Sprawdź status
    const status = await page.locator('.service-item:has-text("Test Ollama Server") .service-status');
    await expect(status).toHaveClass(/status-online/, { timeout: 10000 });
  });

  test('should test server connection', async ({ page }) => {
    // Wybierz istniejący serwer
    await page.click('.service-item:first-child');
    
    // Przejdź do zakładki testowania
    await page.click('button:has-text("Testowanie")');
    
    // Wprowadź zapytanie testowe
    await page.fill('input[placeholder="Wpisz zapytanie testowe..."]', 'Hello, are you working?');
    
    // Uruchom test
    await page.click('button:has-text("🧪 Uruchom test")');
    
    // Sprawdź rezultat
    await expect(page.locator('text=Test zakończony pomyślnie!')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Response:')).toBeVisible();
  });

  test('should handle server failure gracefully', async ({ page }) => {
    // Dodaj serwer z błędnym endpoint
    await helper.addServer({
      name: 'Invalid Server',
      endpoint: 'http://invalid-endpoint:9999',
      type: 'ollama'
    });
    
    // Sprawdź status offline
    const status = await page.locator('.service-item:has-text("Invalid Server") .service-status');
    await expect(status).toHaveClass(/status-offline/, { timeout: 5000 });
    
    // Sprawdź komunikat błędu
    await page.click('.service-item:has-text("Invalid Server")');
    await expect(page.locator('.error-message')).toContainText('Connection refused');
  });
});
```

### Test Suite: Edytor Promptów
```typescript
// e2e/tests/prompt-editor.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Prompt Editor', () => {
  test('should save and apply prompt template', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wybierz serwer
    await page.click('.service-item:first-child');
    
    // Przejdź do promptów
    await page.click('button:has-text("Prompty")');
    
    // Edytuj system prompt
    const promptText = 'You are a specialized coding assistant with deep knowledge of TypeScript.';
    await page.fill('textarea.form-control', promptText);
    
    // Zapisz
    await page.click('button:has-text("💾 Zapisz zmiany")');
    
    // Sprawdź powiadomienie
    await expect(page.locator('.notification:has-text("Prompt zapisany")')).toBeVisible();
    
    // Odśwież stronę i sprawdź czy prompt się zachował
    await page.reload();
    await page.click('.service-item:first-child');
    await page.click('button:has-text("Prompty")');
    
    const savedPrompt = await page.inputValue('textarea.form-control');
    expect(savedPrompt).toBe(promptText);
  });

  test('should apply prompt template', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('.service-item:first-child');
    await page.click('button:has-text("Prompty")');
    
    // Wybierz szablon
    await page.selectOption('select.form-control', 'Asystent programisty');
    await page.click('button:has-text("Zastosuj szablon")');
    
    // Sprawdź czy prompt się zmienił
    const templatePrompt = await page.inputValue('textarea.form-control');
    expect(templatePrompt).toContain('programming');
  });
});
```

### Test Suite: AI Assistant
```typescript
// e2e/tests/ai-assistant.spec.ts
import { test, expect } from '@playwright/test';

test.describe('AI Assistant Chat', () => {
  test('should respond to user questions', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wpisz pytanie
    await page.fill('#chatInput', 'Jak skonfigurować nowy serwer MCP?');
    await page.click('button:has-text("Wyślij")');
    
    // Czekaj na odpowiedź
    await expect(page.locator('.chat-message.ai').last()).toBeVisible({ timeout: 10000 });
    
    // Sprawdź czy odpowiedź zawiera pomocne informacje
    const response = await page.locator('.chat-message.ai .message-bubble').last().textContent();
    expect(response).toContain('serwer');
    expect(response?.length).toBeGreaterThan(50);
  });

  test('should provide contextual help', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Symuluj błąd połączenia
    await page.click('.service-item:has-text("MCP Database")');
    
    // Zapytaj asystenta o błąd
    await page.fill('#chatInput', 'Dlaczego mój serwer database jest offline?');
    await page.click('button:has-text("Wyślij")');
    
    // Sprawdź odpowiedź z sugestiami debugowania
    await expect(page.locator('.chat-message.ai:has-text("sprawdź")')).toBeVisible({ timeout: 10000 });
  });
});
```

### Test Suite: Network Monitoring
```typescript
// e2e/tests/network-monitoring.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Network Visualization', () => {
  test('should display network topology', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('.service-item:first-child');
    await page.click('button:has-text("Sieć")');
    
    // Sprawdź czy mapa sieci się wyświetla
    await expect(page.locator('.network-map')).toBeVisible();
    
    // Sprawdź nodes
    const nodes = await page.locator('.node').count();
    expect(nodes).toBeGreaterThan(0);
    
    // Sprawdź interakcję
    await page.hover('.node:first-child');
    await expect(page.locator('.tooltip')).toBeVisible();
  });

  test('should show real-time connection status', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Obserwuj zmiany statusu
    const initialStatus = await page.locator('.service-status').first().getAttribute('class');
    
    // Czekaj na zmianę (symulowane w aplikacji)
    await page.waitForTimeout(6000);
    
    const updatedStatus = await page.locator('.service-status').first().getAttribute('class');
    // Status powinien się zmienić w ciągu 6 sekund (based on setInterval in the app)
    expect(initialStatus).not.toBe(updatedStatus);
  });
});
```

### Helper Functions
```typescript
// e2e/helpers/mcp-helper.ts
import { Page } from '@playwright/test';

export class MCPTestHelper {
  constructor(private page: Page) {}
  
  async login(username = 'admin', password = 'admin123') {
    await this.page.goto('/login');
    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard');
  }
  
  async addServer(config: {
    name: string;
    endpoint: string;
    type: string;
  }) {
    await this.page.click('button:has-text("+ Dodaj nową usługę")');
    await this.page.fill('input[name="serverName"]', config.name);
    await this.page.fill('input[name="endpoint"]', config.endpoint);
    await this.page.selectOption('select[name="serverType"]', config.type);
    await this.page.click('button:has-text("Zapisz")');
  }
  
  async waitForServerStatus(serverName: string, expectedStatus: string) {
    const selector = `.service-item:has-text("${serverName}") .service-status`;
    await this.page.waitForSelector(`${selector}.status-${expectedStatus}`, {
      timeout: 30000
    });
  }
}
```

## 🚀 Biblioteka Gotowych Usług MCP

### 1. **File System Server** 📁
```yaml
# services/filesystem/docker-compose.yml
version: '3.8'

services:
  mcp-filesystem:
    image: mcp-manager/filesystem-server:latest
    container_name: mcp-filesystem
    ports:
      - "8001:8001"
    volumes:
      - ./workspace:/workspace:rw
      - ./config:/config:ro
    environment:
      - MCP_PORT=8001
      - ALLOWED_PATHS=/workspace
      - READ_ONLY=false
      - MAX_FILE_SIZE=10MB
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Konfiguracja MCP:**
```javascript
// services/filesystem/server.js
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
```

### 2. **Web Scraper Server** 🌐
```yaml
# services/webscraper/docker-compose.yml
version: '3.8'

services:
  mcp-webscraper:
    image: mcp-manager/webscraper-server:latest
    container_name: mcp-webscraper
    ports:
      - "8002:8002"
    environment:
      - MCP_PORT=8002
      - PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
      - RATE_LIMIT=10
      - CACHE_TTL=3600
    cap_add:
      - SYS_ADMIN
    restart: unless-stopped
```

**Implementacja:**
```javascript
// services/webscraper/server.js
import { MCPServer } from '@modelcontextprotocol/sdk';
import puppeteer from 'puppeteer';
import cheerio from 'cheerio';

const server = new MCPServer({
  name: 'webscraper-server',
  version: '1.0.0'
});

let browser;

server.on('initialize', async () => {
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
});

server.addTool({
  name: 'scrape_webpage',
  description: 'Scrape content from a webpage',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      selector: { type: 'string', optional: true },
      waitFor: { type: 'number', optional: true }
    },
    required: ['url']
  },
  handler: async ({ url, selector, waitFor = 0 }) => {
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      if (waitFor > 0) await page.waitForTimeout(waitFor);
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      if (selector) {
        const elements = $(selector).map((i, el) => $(el).text()).get();
        return { data: elements };
      }
      
      return {
        title: $('title').text(),
        body: $('body').text().substring(0, 5000),
        links: $('a').map((i, el) => $(el).attr('href')).get()
      };
    } finally {
      await page.close();
    }
  }
});

server.start();
```

### 3. **Database Query Server** 🗄️
```yaml
# services/database/docker-compose.yml
version: '3.8'

services:
  mcp-database:
    image: mcp-manager/database-server:latest
    container_name: mcp-database
    ports:
      - "8003:8003"
    environment:
      - MCP_PORT=8003
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=mcp_data
      - DB_USER=mcp_user
      - DB_PASSWORD=secure_password
      - MAX_QUERY_RESULTS=1000
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=mcp_data
      - POSTGRES_USER=mcp_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Server Implementation:**
```javascript
// services/database/server.js
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
```

### 4. **Python Code Executor** 🐍
```yaml
# services/python-executor/docker-compose.yml
version: '3.8'

services:
  mcp-python:
    image: mcp-manager/python-executor:latest
    container_name: mcp-python
    ports:
      - "8004:8004"
    environment:
      - MCP_PORT=8004
      - EXECUTION_TIMEOUT=30
      - MAX_MEMORY=512M
      - ALLOWED_MODULES=numpy,pandas,matplotlib,requests,beautifulsoup4
    volumes:
      - ./notebooks:/notebooks
      - ./outputs:/outputs
    restart: unless-stopped
```

**Implementation:**
```python
# services/python-executor/server.py
from mcp import MCPServer
import subprocess
import tempfile
import os
import json
import sys

server = MCPServer(
    name="python-executor",
    version="1.0.0"
)

@server.tool("execute_python")
async def execute_python(code: str, pip_install: list = None):
    """Execute Python code safely in a sandboxed environment"""
    
    # Install packages if needed
    if pip_install:
        for package in pip_install:
            if package in os.environ.get('ALLOWED_MODULES', '').split(','):
                subprocess.run([sys.executable, '-m', 'pip', 'install', package])
    
    # Create temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        temp_file = f.name
    
    try:
        # Execute with timeout
        result = subprocess.run(
            [sys.executable, temp_file],
            capture_output=True,
            text=True,
            timeout=int(os.environ.get('EXECUTION_TIMEOUT', 30))
        )
        
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    finally:
        os.unlink(temp_file)

@server.tool("create_notebook")
async def create_notebook(name: str, cells: list):
    """Create a Jupyter notebook"""
    
    notebook = {
        "cells": [
            {
                "cell_type": cell.get("type", "code"),
                "source": cell.get("content", ""),
                "metadata": {}
            }
            for cell in cells
        ],
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 4
    }
    
    path = f"/notebooks/{name}.ipynb"
    with open(path, 'w') as f:
        json.dump(notebook, f, indent=2)
    
    return {"path": path, "success": True}

if __name__ == "__main__":
    server.start()
```

### 5. **Email Server** 📧
```yaml
# services/email/docker-compose.yml
version: '3.8'

services:
  mcp-email:
    image: mcp-manager/email-server:latest
    container_name: mcp-email
    ports:
      - "8005:8005"
    environment:
      - MCP_PORT=8005
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=587
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - IMAP_HOST=${IMAP_HOST}
      - IMAP_PORT=993
    restart: unless-stopped
```

### 6. **Git Operations Server** 🔧
```yaml
# services/git/docker-compose.yml
version: '3.8'

services:
  mcp-git:
    image: mcp-manager/git-server:latest
    container_name: mcp-git
    ports:
      - "8006:8006"
    volumes:
      - ~/.ssh:/root/.ssh:ro
      - ./repos:/repos
    environment:
      - MCP_PORT=8006
      - GIT_USER_NAME=MCP Bot
      - GIT_USER_EMAIL=mcp@example.com
    restart: unless-stopped
```

### 7. **Weather & Location Server** 🌦️
```yaml
# services/weather/docker-compose.yml
version: '3.8'

services:
  mcp-weather:
    image: mcp-manager/weather-server:latest
    container_name: mcp-weather
    ports:
      - "8007:8007"
    environment:
      - MCP_PORT=8007
      - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
      - DEFAULT_UNITS=metric
    restart: unless-stopped
```

### 8. **Docker Management Server** 🐳
```yaml
# services/docker-manager/docker-compose.yml
version: '3.8'

services:
  mcp-docker:
    image: mcp-manager/docker-server:latest
    container_name: mcp-docker
    ports:
      - "8008:8008"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - MCP_PORT=8008
      - DOCKER_HOST=unix:///var/run/docker.sock
    restart: unless-stopped
```

### 9. **Calendar & Tasks Server** 📅
```yaml
# services/calendar/docker-compose.yml
version: '3.8'

services:
  mcp-calendar:
    image: mcp-manager/calendar-server:latest
    container_name: mcp-calendar
    ports:
      - "8009:8009"
    environment:
      - MCP_PORT=8009
      - CALDAV_URL=${CALDAV_URL}
      - CALDAV_USER=${CALDAV_USER}
      - CALDAV_PASS=${CALDAV_PASS}
    restart: unless-stopped
```

### 10. **Crypto & Blockchain Server** 💰
```yaml
# services/crypto/docker-compose.yml
version: '3.8'

services:
  mcp-crypto:
    image: mcp-manager/crypto-server:latest
    container_name: mcp-crypto
    ports:
      - "8010:8010"
    environment:
      - MCP_PORT=8010
      - ETHERSCAN_API_KEY=${ETHERSCAN_API_KEY}
      - INFURA_PROJECT_ID=${INFURA_PROJECT_ID}
    restart: unless-stopped
```

## 🎯 Master Docker Compose - Wszystkie Usługi

```yaml
# docker-compose.all-services.yml
version: '3.8'

services:
  # Core MCP Manager
  mcp-manager:
    build: .
    container_name: mcp-manager-core
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://mcp:mcp123@postgres:5432/mcp_manager
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - mcp-network
    restart: unless-stopped

  # Ollama for AI
  ollama:
    image: ollama/ollama:latest
    container_name: mcp-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    networks:
      - mcp-network
    restart: unless-stopped

  # All MCP Services
  mcp-filesystem:
    extends:
      file: ./services/filesystem/docker-compose.yml
      service: mcp-filesystem
    networks:
      - mcp-network

  mcp-webscraper:
    extends:
      file: ./services/webscraper/docker-compose.yml
      service: mcp-webscraper
    networks:
      - mcp-network

  mcp-database:
    extends:
      file: ./services/database/docker-compose.yml
      service: mcp-database
    networks:
      - mcp-network

  mcp-python:
    extends:
      file: ./services/python-executor/docker-compose.yml
      service: mcp-python
    networks:
      - mcp-network

  mcp-email:
    extends:
      file: ./services/email/docker-compose.yml
      service: mcp-email
    networks:
      - mcp-network

  mcp-git:
    extends:
      file: ./services/git/docker-compose.yml
      service: mcp-git
    networks:
      - mcp-network

  mcp-weather:
    extends:
      file: ./services/weather/docker-compose.yml
      service: mcp-weather
    networks:
      - mcp-network

  mcp-docker:
    extends:
      file: ./services/docker-manager/docker-compose.yml
      service: mcp-docker
    networks:
      - mcp-network

  mcp-calendar:
    extends:
      file: ./services/calendar/docker-compose.yml
      service: mcp-calendar
    networks:
      - mcp-network

  mcp-crypto:
    extends:
      file: ./services/crypto/docker-compose.yml
      service: mcp-crypto
    networks:
      - mcp-network

  # Supporting Services
  postgres:
    image: postgres:15
    container_name: mcp-postgres
    environment:
      - POSTGRES_USER=mcp
      - POSTGRES_PASSWORD=mcp123
      - POSTGRES_DB=mcp_manager
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - mcp-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: mcp-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - mcp-network
    restart: unless-stopped

  # Monitoring Stack
  prometheus:
    image: prom/prometheus:latest
    container_name: mcp-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - mcp-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: mcp-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=redis-datasource
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    networks:
      - mcp-network
    restart: unless-stopped

networks:
  mcp-network:
    driver: bridge

volumes:
  ollama_models:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

## 🚀 Quick Start Script

```bash
#!/bin/bash
# setup-mcp.sh

echo "🚀 MCP Manager - Instalacja i konfiguracja"
echo "=========================================="

# Sprawdź Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nie jest zainstalowany. Instaluję..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

# Sprawdź Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose nie jest zainstalowany. Instaluję..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Klonuj repozytorium
echo "📦 Pobieram MCP Manager..."
git clone https://github.com/mcp-manager/app.git mcp-manager
cd mcp-manager

# Konfiguracja środowiska
echo "⚙️ Konfiguruję środowisko..."
cp .env.example .env

# Pytaj o usługi do włączenia
echo "🎯 Które usługi chcesz włączyć?"
echo "1) Podstawowe (Manager + Ollama)"
echo "2) Rozszerzone (+ File, Web, Database)"
echo "3) Pełne (Wszystkie usługi)"
read -p "Wybierz opcję (1-3): " choice

case $choice in
    1)
        docker-compose up -d mcp-manager ollama postgres redis
        ;;
    2)
        docker-compose up -d mcp-manager ollama postgres redis \
            mcp-filesystem mcp-webscraper mcp-database
        ;;
    3)
        docker-compose -f docker-compose.all-services.yml up -d
        ;;
    *)
        echo "Nieprawidłowa opcja"
        exit 1
        ;;
esac

# Pobierz modele Ollama
echo "📥 Pobieram modele AI..."
docker exec mcp-ollama ollama pull llama3.2
docker exec mcp-ollama ollama pull codellama

# Sprawdź status
echo "✅ Sprawdzam status usług..."
docker-compose ps

echo ""
echo "🎉 Instalacja zakończona!"
echo "📍 Aplikacja dostępna pod adresem: http://localhost:3000"
echo "📊 Monitoring (Grafana): http://localhost:3001"
echo "🔐 Domyślne dane logowania: admin/admin123"
echo ""
echo "📚 Dokumentacja: https://github.com/mcp-manager/docs"
echo "💬 Wsparcie: https://discord.gg/mcp-manager"
```

## 📊 Monitoring Dashboard Config

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'mcp-services'
    static_configs:
      - targets:
          - 'mcp-manager:3000'
          - 'mcp-filesystem:8001'
          - 'mcp-webscraper:8002'
          - 'mcp-database:8003'
          - 'mcp-python:8004'
          - 'mcp-email:8005'
          - 'mcp-git:8006'
          - 'mcp-weather:8007'
          - 'mcp-docker:8008'
          - 'mcp-calendar:8009'
          - 'mcp-crypto:8010'
    metrics_path: '/metrics'
    
  - job_name: 'ollama'
    static_configs:
      - targets: ['ollama:11434']
    metrics_path: '/api/metrics'
```

## 🧪 Uruchamianie testów E2E

```bash
# Instalacja Playwright
npm install -D @playwright/test

# Instalacja przeglądarek
npx playwright install

# Uruchom wszystkie testy
npm run test:e2e

# Uruchom konkretny test suite
npm run test:e2e -- --grep "Server Management"

# Tryb debug z UI
npm run test:e2e -- --debug

# Generowanie raportu HTML
npm run test:e2e -- --reporter=html

# CI/CD Pipeline
npm run test:e2e:ci
```

## 📝 Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test:e2e": "playwright test",
    "test:e2e:ci": "playwright test --reporter=junit",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:ui": "playwright test --ui",
    "services:start": "docker-compose up -d",
    "services:stop": "docker-compose down",
    "services:logs": "docker-compose logs -f",
    "services:status": "docker-compose ps",
    "setup": "./scripts/setup-mcp.sh"
  }
}
```