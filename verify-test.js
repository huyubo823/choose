const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  let errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
  });
  page.on('pageerror', err => errors.push('PAGE: ' + err.message));

  // Step 1: Load
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('Title:', await page.title());

  // Count word cards
  const wordCards = await page.$$('.word-card');
  console.log('Word cards visible:', wordCards.length);
  if (wordCards.length !== 6) console.log('  ⚠️ Expected 6 cards');

  // Step 2: Click first word
  await wordCards[0].click();
  await page.waitForTimeout(800);

  // Check set cards
  const setCards = await page.$$('.set-card');
  console.log('Set cards visible:', setCards.length);
  if (setCards.length !== 3) console.log('  ⚠️ Expected 3 sets');

  // Step 3: Select first set
  await setCards[0].click();
  await page.waitForTimeout(400);

  // Click generate button
  const genBtn = await page.locator('button:has-text("生成食材清单")');
  await genBtn.click();
  await page.waitForTimeout(800);

  // Step 4: Verify ingredient display
  const ingRows = await page.$$('.ingredient-row');
  console.log('Ingredient rows visible:', ingRows.length);

  let displayBugs = 0;
  for (let i = 0; i < Math.min(5, ingRows.length); i++) {
    const amountEl = await ingRows[i].$('.ingredient-amount');
    if (amountEl) {
      const text = await amountEl.textContent();
      console.log('  [' + (i+1) + ']', text);
      if (text.includes('undefined') || text.includes('NaN') || text.includes('—')) {
        console.log('    ❌ BUG!');
        displayBugs++;
      }
    }
  }

  // Step 5: Test copy
  const copyBtn = await page.locator('button:has-text("复制清单")');
  await copyBtn.click();
  await page.waitForTimeout(600);

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  if (clipboardText) {
    console.log('\nCopy output sample:');
    const lines = clipboardText.split('\n').slice(0, 8);
    console.log(lines.join('\n'));
    if (clipboardText.includes('undefined') || clipboardText.includes('NaN')) {
      console.log('\n❌ COPY HAS BUGS');
    } else {
      console.log('\n✅ Copy format clean');
    }
  } else {
    console.log('\n⚠️ Clipboard empty (headless limitation)');
  }

  // Step 6: Summary
  if (errors.length > 0) {
    console.log('\n❌ JS ERRORS:');
    errors.forEach(e => console.log('  ' + e));
  } else {
    console.log('\n✅ No JS errors');
  }

  if (displayBugs === 0) {
    console.log('✅ All ingredient displays clean');
  }

  await page.screenshot({ path: 'D:/选菜软件/verify-screenshot.png', fullPage: true });
  console.log('\nScreenshot: D:/选菜软件/verify-screenshot.png');

  await browser.close();
})().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
