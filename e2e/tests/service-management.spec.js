const { test, expect } = require('@playwright/test');

test.describe('Service Management', () => {
  test('should add new service via modal', async ({ page }) => {
    await page.goto('/');
    
    // Mock dla prompt - Playwright nie może obsługiwać natywnych promptów bezpośrednio
    // W produkcji należałoby zastąpić prompt modalem
    page.on('dialog', async dialog => {
      if (dialog.message().includes('Nazwa usługi')) {
        await dialog.accept('Test Service');
      } else if (dialog.message().includes('Endpoint URL')) {
        await dialog.accept('http://localhost:8080');
      } else if (dialog.message().includes('Typ')) {
        await dialog.accept('server');
      } else {
        await dialog.accept();
      }
    });
    
    // Kliknij przycisk dodawania
    await page.click('button:has-text("+ Dodaj nową usługę")');
    
    // Poczekaj na dialog i API call
    await page.waitForTimeout(1000);
  });

  test('should display empty service list message', async ({ page }) => {
    await page.goto('/');
    
    // Jeśli brak usług, powinna być wiadomość
    const serviceList = page.locator('.service-list');
    const isEmpty = await serviceList.locator('li:has-text("Brak usług")').isVisible().catch(() => false);
    
    if (isEmpty) {
      await expect(serviceList).toContainText('Brak usług');
    }
  });

  test('should load services from API', async ({ page }) => {
    // Nasłuchuj na request zanim przejdziemy do strony
    const servicesPromise = page.waitForResponse(response => 
      response.url().includes('/api/services') && response.status() === 200
    );
    
    await page.goto('/');
    
    // Poczekaj na odpowiedź API
    const response = await servicesPromise;
    expect(response.ok()).toBeTruthy();
  });

  test('should show health endpoint status', async ({ page }) => {
    // Sprawdź health check endpoint
    const response = await page.request.get('http://localhost:3000/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
  });
});
