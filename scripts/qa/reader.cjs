// Run against the static export served at READER_URL (default http://127.0.0.1:4321).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = process.env.READER_URL || 'http://127.0.0.1:4321';
    const dir = '.impeccable/review';
    fs.mkdirSync(dir, { recursive: true });
    const capture = name => page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
    await page.goto(`${base}/read/php/1`);
    const first = page.locator('.word').first();
    await first.waitFor();
    assert.equal(await page.locator('.word').count(), 501);
    await capture('desktop');
    await page.screenshot({path: `${dir}/desktop-viewport.png`});
    await first.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('dialog').waitFor();
    await capture('word-desktop');
    const second = page.locator('.word').nth(1);
    await second.click();
    assert.equal(await page.getByRole('dialog').count(), 1);
    assert((await page.getByRole('dialog').innerText()).includes(await second.innerText()));
    await page.keyboard.press('Escape');
    await page.waitForFunction(id => document.activeElement?.getAttribute('data-word-id') === id, await second.getAttribute('data-word-id'));
    await first.click();
    await page.keyboard.press('Escape');
    assert(await first.evaluate(el => el === document.activeElement));
    const menu = () => page.getByRole('button', { name: 'Display settings', exact: true }).click();
    await menu();
    await page.getByRole('button', { name: 'Sepia', exact: true }).click();
    await page.keyboard.press('Escape');
    // Record the <html> classes when <body> is first parsed, before any React code runs.
    await page.addInitScript(() => {
      new MutationObserver((_, observer) => {
        if (!document.body) return;
        window.__firstPaintClasses = document.documentElement.className;
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await page.reload();
    await first.waitFor();
    assert.match(await page.evaluate(() => window.__firstPaintClasses), /\bsepia\b/);
    assert(await page.locator('html').evaluate(el => el.classList.contains('sepia')));
    await capture('sepia-desktop');
    await menu();
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await page.getByRole('switch', { name: 'Colour words', exact: true }).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.legend span').count(), 11);
    await capture('dark-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    // The wordmark is visually hidden on phones but must still name the logo link.
    assert.equal(await page.getByRole('link', { name: '[Product Name]', exact: true }).count(), 1);
    await capture('mobile');
    await first.click();
    await capture('word-mobile');
    await page.screenshot({path: `${dir}/word-mobile-viewport.png`});
    console.log('mobile bubble', await page.getByRole('dialog').boundingBox());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.keyboard.press('Escape');
    await menu(); await capture('menu-mobile'); await page.keyboard.press('Escape');
    await page.goto(`${base}/read/mat/28`);
    await page.getByText('Text not yet available', { exact: true }).waitFor();
    await page.getByRole('link', { name: 'Next chapter: Mark 1' }).last().click();
    await page.waitForURL(/\/read\/mrk\/1\/?$/);
    await page.goto(`${base}/credits`);
    assert.equal(await page.locator('.credits section').count(), 3);
    await capture('credits-mobile');
    await page.goto(base);
    assert.equal(await page.locator('.book-row').count(), 27);
    await capture('contents-mobile');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await capture('contents-desktop');
    await page.goto(`${base}/book/php`); await capture('book-desktop');
    await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
    await page.goto(`${base}/read/php/1`); await first.waitFor();
    assert.equal(await page.locator('.word').count(), 501);
    assert.deepEqual(errors, []);
    console.log('Reader static-export scenarios passed; screenshots in .impeccable/review.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
