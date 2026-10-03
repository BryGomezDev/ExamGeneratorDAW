'use strict';
/**
 * Playwright QA — Resúmenes Interactivos
 *
 * Navigates via UI clicks (subjects → unit → sections → glossary → quiz).
 * Checks:
 *   - .summary-unit shows "Unidad N"
 *   - .section-h changes with every nav click
 *   - No "undefined" or "NaN" in visible text
 *   - Quiz submit renders .quiz-score-card
 *   - No console errors
 *   - No duplicate screenshot hashes (intro ≠ quiz-revisada, and across units)
 * Screenshots saved as docs/qa/fase3/<subj>-u<N>-intro.png and -quiz-revisada.png
 */
const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE = 'http://localhost:3000';
const OUT  = path.join(__dirname, '..', 'docs', 'qa', 'fase3');
const PROBLEMS_RE = /\bundefined\b|\bNaN\b/;

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

function sha(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function qaUnit(browser, subject, unit, errors) {
  const tag = `${subject}-u${unit}`;
  const page = await browser.newPage();
  const consoleErrs = [];

  page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text()); });
  page.on('pageerror', e => consoleErrs.push(e.message));

  // ── 1. Subjects screen ────────────────────────────────────────────────
  await page.goto(BASE + '/summaries.html', { waitUntil: 'networkidle' });

  // ── 2. Click subject card ─────────────────────────────────────────────
  const subjectCard = page.locator(`[data-action="select-subject"][data-subject="${subject}"]`);
  await subjectCard.waitFor({ state: 'visible', timeout: 8000 });
  await subjectCard.click();

  // ── 3. Click unit card ────────────────────────────────────────────────
  const unitCard = page.locator(`[data-action="select-unit"][data-unit="${unit}"]`);
  await unitCard.waitFor({ state: 'visible', timeout: 8000 });
  await unitCard.click();

  // ── 4. Wait for summary to load (spinner gone, .summary-unit present) ─
  const summaryUnit = page.locator('.summary-unit');
  await summaryUnit.waitFor({ state: 'visible', timeout: 12000 });
  const unitText = (await summaryUnit.textContent()).trim();
  if (!unitText.includes(`Unidad ${unit}`)) {
    errors.push(`${tag}: .summary-unit shows "${unitText}", expected "Unidad ${unit}"`);
  }

  // Check intro for undefined/NaN
  const introMainText = await page.locator('#summary-main').textContent().catch(() => '');
  if (PROBLEMS_RE.test(introMainText)) {
    errors.push(`${tag} intro: "undefined" or "NaN" found in text`);
  }

  // ── 5. Screenshot intro ───────────────────────────────────────────────
  await page.waitForTimeout(300);
  const introBuf = await page.screenshot({ path: path.join(OUT, `${tag}-intro.png`) });
  const introHash = sha(introBuf);

  // ── 6. Traverse all nav sections (skip 'intro', already on it) ────────
  const navLocator = page.locator('.nav-item[data-action="nav-section"]');
  const navCount = await navLocator.count();
  let prevH2 = null;

  for (let i = 0; i < navCount; i++) {
    const btn = navLocator.nth(i);
    const sectionId = await btn.getAttribute('data-section');
    if (sectionId === 'intro') continue;

    await btn.click();
    await page.waitForTimeout(350);

    // h2 must exist and change
    const h2 = await page.locator('.section-h').textContent().catch(() => null);
    if (!h2) {
      errors.push(`${tag} section "${sectionId}": .section-h not found`);
    } else if (h2 === prevH2) {
      errors.push(`${tag} section "${sectionId}": h2 "${h2}" same as previous — content did not change`);
    }
    prevH2 = h2;

    // undefined/NaN check
    const sText = await page.locator('#summary-main').textContent().catch(() => '');
    if (PROBLEMS_RE.test(sText)) {
      errors.push(`${tag} section "${sectionId}": "undefined" or "NaN" in text`);
    }
  }

  // ── 7. Go to quiz ─────────────────────────────────────────────────────
  const quizNav = page.locator('[data-action="nav-section"][data-section="quiz"]');
  await quizNav.click();
  await page.waitForTimeout(400);

  // ── 8. Answer every question (select option 0) ────────────────────────
  const quizItems = page.locator('.quiz-item');
  const qCount = await quizItems.count();
  if (qCount === 0) {
    errors.push(`${tag}: no .quiz-item elements found`);
  }
  for (let qi = 0; qi < qCount; qi++) {
    // Re-query after each re-render triggered by previous answer click
    const opt = page.locator(`[data-action="select-answer"][data-qi="${qi}"][data-oi="0"]`);
    await opt.waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
    await opt.click({ timeout: 3000 }).catch(() => {
      errors.push(`${tag} quiz q${qi}: could not click option 0`);
    });
    await page.waitForTimeout(150);
  }

  // ── 9. Click "Comprobar respuestas" ───────────────────────────────────
  const submitBtn = page.locator('[data-action="submit-quiz"]');
  await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click();
  await page.waitForTimeout(600);

  // Score card must appear
  const scoreCount = await page.locator('.quiz-score-card').count();
  if (scoreCount === 0) {
    errors.push(`${tag}: .quiz-score-card not found after submitting quiz`);
  }

  // undefined/NaN in quiz result
  const quizText = await page.locator('#summary-main').textContent().catch(() => '');
  if (PROBLEMS_RE.test(quizText)) {
    errors.push(`${tag} quiz-revisada: "undefined" or "NaN" in text`);
  }

  // ── 10. Screenshot quiz revisada ──────────────────────────────────────
  const quizBuf = await page.screenshot({ path: path.join(OUT, `${tag}-quiz-revisada.png`) });
  const quizHash = sha(quizBuf);

  // Must differ from intro
  if (introHash === quizHash) {
    errors.push(`${tag}: intro and quiz-revisada have identical hash — screenshots did not change`);
  }

  // Console errors
  if (consoleErrs.length > 0) {
    errors.push(`${tag} console: ${consoleErrs.slice(0, 3).join(' | ')}`);
  }

  await page.close();

  const unitFails = errors.filter(e => e.startsWith(tag));
  console.log(
    `  ${tag}  ${unitFails.length === 0 ? 'OK' : `FAIL(${unitFails.length})`}` +
    `  intro:${introHash.slice(0, 8)}  quiz:${quizHash.slice(0, 8)}`
  );
  return { tag, introHash, quizHash };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const allErrors = [];
  const results = [];

  for (const { subject, unit } of UNITS) {
    const r = await qaUnit(browser, subject, unit, allErrors).catch(err => {
      allErrors.push(`${subject}-u${unit} CRASH: ${err.message}`);
      console.log(`  ${subject}-u${unit}  CRASH: ${err.message}`);
      return null;
    });
    if (r) results.push(r);
  }

  await browser.close();

  // Global duplicate hash check (across all units)
  const seen = new Map();
  for (const { tag, introHash, quizHash } of results) {
    for (const [label, h] of [[`${tag}-intro`, introHash], [`${tag}-quiz-revisada`, quizHash]]) {
      if (seen.has(h)) {
        allErrors.push(`${label}: same hash as ${seen.get(h)} — duplicate screenshot`);
      } else {
        seen.set(h, label);
      }
    }
  }

  console.log('\n--- QA REPORT ---');
  if (allErrors.length === 0) {
    console.log(`PASS — ${results.length * 2} screenshots, all unique. 0 errors.`);
  } else {
    allErrors.forEach(e => console.error('FAIL:', e));
    process.exit(1);
  }
})();
