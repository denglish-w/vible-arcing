// Run against the app served by `npm start` at READER_URL (default http://127.0.0.1:4321; start it with PORT=4321).
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
    await page.locator('[lang="grc"]').first().waitFor();
    assert.equal(await page.getByText('Text not available', { exact: true }).count(), 0);
    await page.getByRole('link', { name: 'Next chapter: Mark 1' }).last().click();
    await page.waitForURL(/\/read\/mrk\/1\/?$/);
    await page.goto(`${base}/credits`);
    // Three dataset credits plus the Method section.
    assert.equal(await page.locator('.credits section').count(), 4);
    for (const name of ['SBL Greek New Testament', 'MACULA Greek Linguistic Datasets', 'Berean Interlinear Bible']) {
      assert.equal(await page.getByText(name, { exact: true }).count() > 0, true, name);
    }
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

    // Learning mode (spec 010). The served Learning page holds no answers (SC-002).
    const answerKeys = /\\?"(lemma|gloss|pos)\\?"\s*:/;
    const learningPage = async chapter => (await fetch(`${base}/read/php/${chapter}`, { headers: { Cookie: 'vible.mode=learning' } })).text();
    // Philippians 2 has no attempts, so any of these keys would be a word fact.
    assert(!answerKeys.test(await learningPage(2)), 'Learning HTML carries word facts');
    // Philippians 1 may carry the user's own earlier answers (FR-026), never the source's.
    const learningHtml = await learningPage(1);
    assert(!/\\?"gloss\\?"\s*:/.test(learningHtml), 'Learning HTML carries a gloss');
    assert(!learningHtml.includes('εὐχαριστέω'), 'Learning HTML carries a lemma');
    const readingHtml = await (await fetch(`${base}/read/php/1`)).text();
    assert(answerKeys.test(readingHtml), 'Reading HTML lost its word facts');

    const learn = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const learnErrors = [];
    learn.on('pageerror', error => learnErrors.push(error.message));
    await learn.goto(`${base}/read/php/1`);
    await learn.locator('.word').first().waitFor();
    await learn.getByRole('button', { name: 'Display settings', exact: true }).click();
    await learn.getByRole('switch', { name: 'Colour words', exact: true }).click();
    await learn.keyboard.press('Escape');
    const display = () => learn.evaluate(() => localStorage.getItem('vible.display'));
    const displayBefore = await display();
    await learn.locator('#n50001003001').click();
    await learn.getByRole('dialog').waitFor();
    await learn.keyboard.press('Escape');
    await learn.getByRole('button', { name: 'Learning', exact: true }).click();
    await learn.getByText('Learning mode is on. Select a word to parse it.').waitFor();
    // Colouring, legend and word details are withheld (FR-004); settings untouched (SC-009).
    assert.equal(await learn.locator('.legend').count(), 0);
    assert.equal(await learn.locator('.word[style]').count(), 0);
    assert.equal(await display(), displayBefore);
    // The word selected in Reading mode is still selected: in view and focused (FR-006).
    await learn.waitForFunction(() => document.activeElement?.id === 'n50001003001');
    // Keyboard only: Enter on a word, type, choose, check (SC-003, US5).
    const verb = learn.locator('#n50001003001');
    await verb.focus();
    await learn.keyboard.press('Enter');
    const lemma = learn.getByLabel('Dictionary form');
    await lemma.waitFor();
    assert(await lemma.evaluate(el => el === document.activeElement));
    await lemma.fill(''); // pre-filled when an earlier run left an attempt
    await learn.keyboard.type('euxaristew');
    assert.equal(await lemma.inputValue(), 'ευχαριστεω');
    const choose = async (label, value) => { await learn.getByLabel(label, { exact: true }).focus(); await learn.getByLabel(label, { exact: true }).selectOption(value); };
    await choose('Part of speech', 'verb');
    await choose('Mood', 'indicative');
    await choose('Tense', 'aorist');
    await choose('Voice', 'active');
    await choose('Person', 'first');
    await choose('Number', 'singular');
    assert.equal(await learn.getByLabel('Case', { exact: true }).count(), 0);
    await learn.getByRole('button', { name: 'Check', exact: true }).focus();
    await learn.keyboard.press('Enter');
    await learn.getByText('1 field differs from the source.').waitFor();
    assert.equal(await learn.locator('.comparison tbody tr[data-outcome="differs"]').count(), 1);
    assert.equal(await learn.locator('.comparison tbody tr[data-outcome="differs"] th').innerText(), 'Tense');
    assert.equal(await learn.locator('output').innerText(), '1 field differs from the source');
    await learn.screenshot({ path: `${dir}/learning-compared.png` });
    // Next word crosses into the next word and moves focus to the dictionary form (FR-029).
    await learn.getByRole('button', { name: 'Next word' }).click();
    await learn.getByRole('dialog', { name: 'Parse τῷ' }).waitFor();
    assert(await learn.getByLabel('Dictionary form').evaluate(el => el === document.activeElement));
    await learn.keyboard.press('Escape');
    await learn.waitForFunction(() => document.activeElement?.id === 'n50001003002');
    // With answers pre-entered from the last attempt, selecting to comparison is fast (SC-001).
    const started = Date.now();
    await verb.click();
    await learn.getByText(/Checked before on .*: 1 differed/).waitFor();
    await learn.getByRole('button', { name: 'Check', exact: true }).click();
    await learn.locator('.comparison').waitFor();
    assert(Date.now() - started < 1000, `select to comparison took ${Date.now() - started} ms`);
    await learn.getByRole('button', { name: 'Close parsing form' }).click();
    // The end of the chapter offers the next one (FR-031).
    await learn.locator('.word').last().click();
    await learn.getByRole('button', { name: 'Next word' }).click();
    await learn.getByText('End of the chapter').waitFor();
    assert.equal(await learn.getByRole('link', { name: 'Continue with Philippians 2' }).count(), 1);
    await learn.keyboard.press('Escape');
    // Attempts survive a reload and pre-fill without source values (FR-026).
    await learn.reload();
    await verb.click();
    await learn.getByText(/Checked before on .*: 1 differed/).waitFor();
    assert.equal(await learn.getByLabel('Tense', { exact: true }).inputValue(), 'aorist');
    assert.equal(await learn.getByText('εὐχαριστέω').count(), 0);
    await learn.keyboard.press('Escape');
    // Phone width: the form is a bottom sheet with its actions reachable (FR-035).
    await learn.setViewportSize({ width: 390, height: 844 });
    await learn.locator('#n50001003003').tap().catch(() => learn.locator('#n50001003003').click());
    await learn.getByLabel('Dictionary form').waitFor();
    for (const name of ['Check', 'Next word', 'Previous word', 'Close parsing form']) {
      const box = await learn.getByRole('button', { name, exact: true }).boundingBox();
      assert(box && box.y >= 0 && box.y + box.height <= 844, `${name} out of reach`);
    }
    assert(await learn.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await learn.screenshot({ path: `${dir}/learning-mobile.png` });
    await learn.setViewportSize({ width: 1440, height: 1000 });
    await learn.getByRole('button', { name: 'Close parsing form' }).click();
    // The history downloads with references (FR-028).
    const exported = await learn.evaluate(async () => (await fetch('/api/attempts/export')).json());
    assert.equal(exported.format, 'parse-attempts-export');
    assert(exported.attempts.some(a => a.reference === 'Philippians 1:3' && a.surface === 'Εὐχαριστῶ'));
    // Back to Reading: colouring returns and settings are unchanged (SC-009).
    await learn.getByRole('button', { name: 'Reading', exact: true }).click();
    await learn.locator('.legend').waitFor();
    assert.equal(await learn.locator('.legend span').count(), 11);
    assert.equal(await display(), displayBefore);
    assert.deepEqual(learnErrors, []);
    console.log('Reader and Learning-mode scenarios passed; screenshots in .impeccable/review.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
