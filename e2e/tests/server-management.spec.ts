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