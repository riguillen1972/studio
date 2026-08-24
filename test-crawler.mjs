import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  
  page.on('pageerror', error => {
    console.error('Page Error:', error.message);
    errors.push(error.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Console Error:', msg.text());
      errors.push(msg.text());
    }
  });

  try {
    await page.goto('http://localhost:9002');
    await page.waitForLoadState('networkidle');
    console.log('Homepage loaded');
    
    await page.goto('http://localhost:9002/login');
    await page.waitForLoadState('networkidle');
    console.log('Login loaded');
    
    // Check if there are any specific errors
  } catch (err) {
    console.error('Navigation error:', err);
  } finally {
    await browser.close();
    process.exit(errors.length > 0 ? 1 : 0);
  }
})();
