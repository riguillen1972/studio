import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    const email = `test-${Date.now()}@example.com`;
    // Sign up first
    await page.goto('http://localhost:9002/login?action=signup');
    await page.getByText('College Student').click();
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForTimeout(3000);
    
    // Now switch to login mode and try to login
    await page.goto('http://localhost:9002/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await page.waitForTimeout(3000);
    const errorMsg = await page.locator('.text-destructive').textContent().catch(() => null);
    if (errorMsg) {
      console.log('SIGNIN ERROR:', errorMsg);
    } else {
      console.log('SIGNIN SUCCESS - Current URL:', page.url());
    }
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
