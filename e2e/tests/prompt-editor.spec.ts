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