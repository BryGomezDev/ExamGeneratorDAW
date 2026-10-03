'use strict';
/**
 * Playwright QA — Fase 3
 * Opens each resumen unit, traverses all nav sections, glossary, and autoevaluacion.
 * Fails on console errors, "undefined", or "NaN" visible in page text.
 * Screenshots saved to docs/qa/fase3/
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT  = path.join(__dirname, '..', 'docs', 'qa', 'fase3');
const UNITS = [
  { subject: 'ip',   unit: '1' },
  { subject: 'ip',   unit: '2' },
  { subject: 'ipe',  unit: '1' },
  { subject: 'ipe',  unit: '2' },
  { subject: 'lm',   unit: '0' },
  { subject: 'lm',   unit: '1' },
  { subject: 'lm',   unit: '2' },
  { subject: 'prog', unit: '0' },
  { subject: 'prog', unit: '1' },
  { subject: 'prog', unit: '2' },
];

fs.mkdirSync(OUT, { recursive: true });

const PROBLEMS_RE = /\bundefined\b|\bNaN\b/;

async function checkUnit(page, subject, unit, errors) {
  const tag = `${subject}-u${unit}`;
  const url  = `${BASE}/summaries.html?subject=${subject}&unit=${unit}`;
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for nav to be populated
  await page.waitForSelector('.summary-nav', { timeout: 8000 }).catch(() => {});

  // Screenshot: intro / first section
  await page.screenshot({ path: path.join(OUT, `${tag}-intro.png`), fullPage: false });

  // Check page text for undefined/NaN
  const bodyText = await page.innerText('body').catch(() => '');
  if (PROBLEMS_RE.test(bodyText)) {
    errors.push(`${tag}: "undefined" or "NaN" found in page text`);
  }

  // Traverse every nav item
  const navItems = await page.$$('.summary-nav .nav-item, .summary-nav [data-section], .summary-nav button, .summary-nav a');
  for (let i = 0; i < navItems.length; i++) {
    try {
      await navItems[i].click({ timeout: 3000 });
      await page.waitForTimeout(300);
      const t = await page.innerText('body').catch(() => '');
      if (PROBLEMS_RE.test(t)) {
        const label = await navItems[i].innerText().catch(() => String(i));
        errors.push(`${tag} nav[${i}] "${label.trim()}": "undefined" or "NaN" in text`);
      }
    } catch (_) {}
  }

  await page.screenshot({ path: path.join(OUT, `${tag}-sections.png`), fullPage: true });

  // Click Glosario tab if present
  const glosBtn = await page.$('[data-tab="glossary"], button:has-text("Glosario"), [href="#glossary"]');
  if (glosBtn) {
    await glosBtn.click().catch(() => {});
    await page.waitForTimeout(300);
    const t = await page.innerText('body').catch(() => '');
    if (PROBLEMS_RE.test(t)) errors.push(`${tag} glosario: "undefined" or "NaN" in text`);
    await page.screenshot({ path: path.join(OUT, `${tag}-glosario.png`), fullPage: false });
  }

  // Click Autoevaluacion tab if present
  const quizBtn = await page.$('[data-tab="quiz"], button:has-text("Autoevaluaci"), [href="#quiz"]');
  if (quizBtn) {
    await quizBtn.click().catch(() => {});
    await page.waitForTimeout(400);
    const t = await page.innerText('body').catch(() => '');
    if (PROBLEMS_RE.test(t)) errors.push(`${tag} autoevaluacion: "undefined" or "NaN" in text`);
    await page.screenshot({ path: path.join(OUT, `${tag}-quiz.png`), fullPage: false });

    // Answer first question
    const firstOpt = await page.$('.quiz-option, .option-btn, [data-option]');
    if (firstOpt) {
      await firstOpt.click().catch(() => {});
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT, `${tag}-quiz-answered.png`), fullPage: false });
    }
  }

  if (consoleErrors.length) {
    errors.push(`${tag} console errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
  }

  console.log(`  ${tag} — ${errors.filter(e => e.startsWith(tag)).length === 0 ? 'OK' : 'FAIL'}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const allErrors = [];

  for (const { subject, unit } of UNITS) {
    const page = await browser.newPage();
    await checkUnit(page, subject, unit, allErrors).catch(err => {
      allErrors.push(`${subject}-u${unit} CRASH: ${err.message}`);
      console.log(`  ${subject}-u${unit} — CRASH`);
    });
    await page.close();
  }

  await browser.close();

  console.log('\n--- QA REPORT ---');
  if (allErrors.length === 0) {
    console.log('PASS: all 10 units clean.');
  } else {
    allErrors.forEach(e => console.error('FAIL:', e));
    console.log(`\n${allErrors.length} issue(s) found.`);
    process.exit(1);
  }
})();
