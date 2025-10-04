const { test, expect } = require('@playwright/test');

test.describe('MCP Manager Dashboard', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/');
    
    // Sprawdź tytuł strony
    await expect(page).toHaveTitle(/MCP Manager/);
    
    // Sprawdź czy główne elementy są widoczne
    await expect(page.locator('h1:has-text("🚀 MCP Manager")')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.main-content')).toBeVisible();
    await expect(page.locator('.ai-assistant')).toBeVisible();
  });

  test('should display metrics cards', async ({ page }) => {
    await page.goto('/');
    
    // Sprawdź metryki
    await expect(page.locator('.metric-card:has-text("Serwery")')).toBeVisible();
    await expect(page.locator('.metric-card:has-text("Klienci")')).toBeVisible();
    await expect(page.locator('.metric-card:has-text("Połączenia")')).toBeVisible();
    
    // Sprawdź wartości metryk
    const serverCount = await page.locator('#serverCount').textContent();
    expect(serverCount).toBeDefined();
  });

  test('should have all tabs visible', async ({ page }) => {
    await page.goto('/');
    
    // Sprawdź zakładki
    await expect(page.locator('button.tab:has-text("Konfiguracja")')).toBeVisible();
    await expect(page.locator('button.tab:has-text("Prompty")')).toBeVisible();
    await expect(page.locator('button.tab:has-text("Sieć")')).toBeVisible();
    await expect(page.locator('button.tab:has-text("Logi")')).toBeVisible();
    await expect(page.locator('button.tab:has-text("Testowanie")')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/');
    
    // Dodaj przykładową usługę aby móc testować zakładki
    await page.evaluate(() => {
      window.selectedService = { id: 'test-1', name: 'Test Service', endpoint: 'http://test' };
      window.loadServiceConfig(window.selectedService);
    });
    
    // Kliknij zakładkę Prompty
    await page.click('button.tab:has-text("Prompty")');
    await expect(page.locator('#prompts-tab')).toBeVisible();
    
    // Kliknij zakładkę Sieć
    await page.click('button.tab:has-text("Sieć")');
    await expect(page.locator('#network-tab')).toBeVisible();
    await expect(page.locator('.network-map')).toBeVisible();
  });

  test('should display AI assistant chat', async ({ page }) => {
    await page.goto('/');
    
    // Sprawdź komponenty czatu
    await expect(page.locator('.ai-assistant h2:has-text("🤖 Asystent AI")')).toBeVisible();
    await expect(page.locator('.chat-messages')).toBeVisible();
    await expect(page.locator('#chatInput')).toBeVisible();
    
    // Sprawdź początkową wiadomość AI
    await expect(page.locator('.chat-message.ai')).toBeVisible();
  });

  test('should have floating action button', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('.floating-action')).toBeVisible();
  });
});
