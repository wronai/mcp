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