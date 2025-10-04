const { test, expect } = require('@playwright/test');

test.describe('AI Assistant', () => {
  test('should display initial AI message', async ({ page }) => {
    await page.goto('/');
    
    // Sprawdź czy jest początkowa wiadomość
    const aiMessage = page.locator('.chat-message.ai .message-bubble').first();
    await expect(aiMessage).toBeVisible();
    await expect(aiMessage).toContainText('Cześć! Jestem Twoim asystentem MCP');
  });

  test('should send message and receive response', async ({ page }) => {
    await page.goto('/');
    
    // Wpisz wiadomość
    await page.fill('#chatInput', 'Jak dodać nowy serwer?');
    
    // Wyślij
    await page.click('button:has-text("Wyślij")');
    
    // Sprawdź czy wiadomość użytkownika się pojawiła
    await expect(page.locator('.chat-message.user').last()).toContainText('Jak dodać nowy serwer?');
    
    // Poczekaj na odpowiedź AI (użyj waitFor zamiast timeout)
    await page.waitForFunction(() => {
      const aiMessages = document.querySelectorAll('.chat-message.ai');
      return aiMessages.length >= 2;
    }, { timeout: 5000 });
    
    // Sprawdź czy pojawiła się odpowiedź
    const aiMessages = page.locator('.chat-message.ai');
    const count = await aiMessages.count();
    expect(count).toBeGreaterThanOrEqual(2); // Początkowa + nowa odpowiedź
  });

  test('should send message with Enter key', async ({ page }) => {
    await page.goto('/');
    
    const chatInput = page.locator('#chatInput');
    await chatInput.fill('Test Enter key');
    await chatInput.press('Enter');
    
    // Sprawdź czy wiadomość została wysłana
    await expect(page.locator('.chat-message.user').last()).toContainText('Test Enter key');
  });

  test('should have quick action buttons', async ({ page }) => {
    await page.goto('/');
    
    // Sprawdź przyciski szybkich akcji
    await expect(page.locator('button:has-text("📝 Generuj config")')).toBeVisible();
    await expect(page.locator('button:has-text("🐛 Debug")')).toBeVisible();
    await expect(page.locator('button:has-text("📊 Analiza")')).toBeVisible();
    await expect(page.locator('button:has-text("🔧 Optymalizuj")')).toBeVisible();
  });

  test('should trigger quick action', async ({ page }) => {
    await page.goto('/');
    
    // Kliknij quick action
    await page.click('button:has-text("🐛 Debug")');
    
    // Sprawdź czy pojawiła się wiadomość w czacie
    await page.waitForTimeout(500);
    const lastMessage = page.locator('.chat-message.ai').last();
    await expect(lastMessage).toContainText('debugowanie');
  });

  test('should scroll chat to bottom on new message', async ({ page }) => {
    await page.goto('/');
    
    // Wyślij wiadomość
    await page.fill('#chatInput', 'Test scroll');
    await page.click('button:has-text("Wyślij")');
    
    // Sprawdź scroll
    await page.waitForTimeout(500);
    const chatMessages = page.locator('.chat-messages');
    const scrollTop = await chatMessages.evaluate(el => el.scrollTop);
    const scrollHeight = await chatMessages.evaluate(el => el.scrollHeight);
    const clientHeight = await chatMessages.evaluate(el => el.clientHeight);
    
    // Scroll powinien być na dole (lub blisko)
    expect(scrollTop + clientHeight).toBeGreaterThanOrEqual(scrollHeight - 50);
  });
});
