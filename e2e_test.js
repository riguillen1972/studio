const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting E2E Tool Test...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error] ${msg.text()}`);
      console.log(`[Console Error] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[Page Error] ${err.toString()}`);
    console.log(`[Page Error] ${err.toString()}`);
  });
  page.on('requestfailed', request => {
    errors.push(`[Network Error] ${request.url()} - ${request.failure()?.errorText}`);
    console.log(`[Network Error] ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
    
    // Fill login form
    console.log('Logging in as alexis@gmail.com...');
    await page.type('input[type="email"]', 'alexis@gmail.com');
    await page.type('input[type="password"]', 'Miva0505');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('Logged in successfully. URL:', page.url());

    // Deep Test 1: Flashcards Tool
    console.log('Testing Flashcards Generator...');
    await page.goto('http://localhost:3001/flashcards', { waitUntil: 'networkidle0' });
    
    // Fill flashcard form
    await page.type('input[name="topic"]', 'The Solar System');
    
    // Select subject (shadcn Select component requires clicking trigger then item)
    await page.click('button[role="combobox"]');
    await new Promise(r => setTimeout(r, 500)); // wait for dropdown animation
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[role="option"]'));
      const scienceNode = items.find(item => item.textContent.includes('Science'));
      if (scienceNode) scienceNode.click();
    });
    
    // Select grade level
    await new Promise(r => setTimeout(r, 500));
    const triggers = await page.$$('button[role="combobox"]');
    if (triggers.length > 1) {
      await triggers[1].click();
      await new Promise(r => setTimeout(r, 500));
      await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('[role="option"]'));
        const gradeNode = items.find(item => item.textContent.includes('High School'));
        if (gradeNode) gradeNode.click();
      });
    }

    // Submit form and wait for AI generation
    console.log('Submitting Flashcards request (Waiting for Genkit API)...');
    await page.click('form button[type="submit"]');
    
    // Wait for the resulting flashcard grid to mount
    try {
      await page.waitForSelector('.grid.grid-cols-1.md\\:grid-cols-2', { timeout: 45000 });
      console.log('✅ Flashcards successfully generated without errors!');
    } catch (e) {
      console.log('❌ Flashcards generation timed out or failed.');
    }

    // Deep Test 2: AI Summarizer
    console.log('Testing Text Summarizer...');
    await page.goto('http://localhost:3001/summarizer', { waitUntil: 'networkidle0' });
    await page.type('textarea[name="text"]', 'Apollo 11 was the spaceflight that first landed humans on the Moon. Commander Neil Armstrong and lunar module pilot Buzz Aldrin formed the American crew that landed the Apollo Lunar Module Eagle on July 20, 1969.');
    await page.click('form button[type="submit"]');
    try {
      // The output text area should be populated eventually
      await page.waitForSelector('.prose.dark\\:prose-invert', { timeout: 45000 });
      console.log('✅ Summarizer successfully generated without errors!');
    } catch (e) {
      console.log('❌ Summarizer generation timed out or failed.');
    }

    console.log('Done deep testing key AI generation tools.');

  } catch (error) {
    console.error('Test script failed:', error);
  } finally {
    await browser.close();
    console.log('E2E Test Complete. Captured Errors:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:\n', errors.join('\n'));
    }
  }
})();
