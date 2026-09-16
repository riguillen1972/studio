import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:9002/login?action=signup');
    await page.waitForLoadState('networkidle');
    console.log('Login page loaded in signup mode');
    
    // Check if we are on the role selection screen
    const roleText = await page.getByText('College Student').isVisible();
    console.log('Role selection visible:', roleText);
    
    if (roleText) {
      await page.getByText('College Student').click();
      await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
      await page.fill('input[type="password"]', 'password123');
      await page.getByRole('button', { name: 'Create Account' }).click();
      
      // Wait for success or error
      await page.waitForTimeout(3000);
      const errorMsg = await page.locator('.text-destructive').textContent().catch(() => null);
      if (errorMsg) {
        console.log('SIGNUP ERROR:', errorMsg);
      } else {
        const successMsg = await page.locator('.text-green-600').textContent().catch(() => null);
        console.log('SIGNUP SUCCESS:', successMsg);
      }
    }
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
