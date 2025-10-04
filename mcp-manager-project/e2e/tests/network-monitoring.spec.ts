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