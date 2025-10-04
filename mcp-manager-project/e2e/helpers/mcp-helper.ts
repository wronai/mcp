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