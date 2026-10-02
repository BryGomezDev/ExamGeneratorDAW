# Resúmenes Interactivos + Restyle Dark Theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the app into two sections (Pruebas Test + Resúmenes Interactivos), restyle with a dark theme, and generate 10 interactive JSON summaries from PDF sources.

**Architecture:** Dark tokens live in a new `public/style.css` shared by both HTML files; `public/index.html` gets a landing screen + dark restyle with no functional changes to test logic; `public/summaries.html` is a new standalone SPA that renders JSON summaries via vanilla JS with event delegation; `server.js` gets one helper function + one field + one endpoint.

**Tech Stack:** Node.js/Express, vanilla JS, CSS custom properties (no frameworks, no build step)

**Spec:** `docs/superpowers/specs/2026-10-02-resumen-interactivo-design.md`

## Global Constraints

- No framework imports — vanilla JS only, same as existing `index.html` pattern
- No hot-reload — restart server manually after `server.js` changes (`npm run dev`)
- No changes to any `.txt` question files, `package.json`, or `vercel.json`
- `--text-subtle` (`#75798c`) is decorative only — never use it on informative text
- All JSON text inserted into `innerHTML` must pass through `esc()` without exception
- `unit` field in JSON is an integer, not a string
- `quiz` has 6–10 items per unit; `objectives`, `glossary`, `quiz` must exist even if `[]`
- Path sanitization: subject `/^[\w.]+$/`, unit `/^\d+$/`
- WCAG AA minimum 4.5:1 for all informative text; `--text-subtle` only for decorative labels
- Two STOP points: end of Fase 2 (pilot review) and end of Fase 4 (pre-push audit)

---

## FASE 1 — Restyle + dos secciones

---

### Task 1: Create `public/style.css`

**Files:**
- Create: `public/style.css`

**Interfaces:**
- Produces: CSS custom properties `--bg`, `--surface`, `--border`, `--text`, `--text-body`, `--text-muted`, `--text-subtle`, `--accent`, `--accent-light`, `--accent-bg`, `--accent-line`, `--error`, `--error-bg`, `--success`, `--success-bg`, `--radius`, `--font` available to any linked HTML file

- [ ] **Step 1: Create the file**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  /* Surface */
  --bg:           #161826;
  --surface:      #232532;
  --border:       #3f424d;

  /* Text */
  --text:         #e9e9ed;
  --text-body:    #cfd3e5;
  --text-muted:   #9397ab;
  --text-subtle:  #75798c;   /* decorative only — never on informative text */

  /* Accent */
  --accent:       #9184d9;
  --accent-light: #b5abfc;
  --accent-bg:    #2b2741;
  --accent-line:  #423a6a;

  /* Error — 6.06:1 on --surface, 5.91:1 on --error-bg */
  --error:        #e08aa8;
  --error-bg:     #3a1f2e;

  /* Success — 7.5:1 on --surface */
  --success:      #4ade80;
  --success-bg:   #0f2e1a;

  --radius: 8px;
  --font:   'Inter', system-ui, sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font); background: var(--bg); color: var(--text); min-height: 100vh; }
::selection { background: var(--accent-line); }
a { color: var(--accent-light); }
a:hover { color: var(--accent); }
:focus-visible { outline: 2px solid var(--accent-light); outline-offset: 2px; }
```

- [ ] **Step 2: Verify the file exists**

Run: `ls public/style.css`  
Expected: file present, ~50 lines

- [ ] **Step 3: Commit**

```bash
git add public/style.css
git commit -m "feat: add shared dark theme CSS tokens"
```

---

### Task 2: Restyle `index.html` — CSS layer

**Files:**
- Modify: `public/index.html` (head + inline `<style>` block, lines 1–530)

**Interfaces:**
- Consumes: `public/style.css` tokens from Task 1
- Produces: dark-themed index.html; all existing JS functions unchanged; `--green`, `--red`, `--purple` aliases still work throughout existing CSS rules

- [ ] **Step 1: Add `<link>` tag and remove Google Fonts import**

In `<head>`, after the `<meta name="viewport">` line (line 5), add:
```html
<link rel="stylesheet" href="style.css">
```

Then inside the `<style>` block, remove the line:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```
(Google Fonts is now loaded from `style.css`.)

- [ ] **Step 2: Replace the `:root` block**

Replace the entire `:root { … }` block (lines 8–29) with:

```css
:root {
  /* Aliases so existing CSS rules keep working */
  --primary:   var(--accent-light);
  --primary-light: var(--accent);
  --card-bg:   var(--surface);
  --green:     var(--success);
  --green-bg:  var(--success-bg);
  --red:       var(--error);
  --red-bg:    var(--error-bg);
  --yellow:    #fbbf24;
  --yellow-bg: #2d2611;
  --purple:    var(--accent);
  --purple-bg: var(--accent-bg);
  --shadow:    0 2px 8px rgba(0,0,0,0.30);
  --shadow-lg: 0 4px 20px rgba(0,0,0,0.40);
  --transition: 0.2s ease;
}
```

Note: `--bg`, `--surface`, `--border`, `--text`, `--text-muted`, `--accent`, `--radius` are now defined in `style.css` — do NOT redeclare them here.

- [ ] **Step 3: Remove the duplicate reset and body rule from inline style**

Remove from the inline `<style>`:
```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}
```
These are now handled by `style.css`.

- [ ] **Step 4: Fix header background**

The header currently uses `background: var(--primary)` which after the alias becomes `#b5abfc` (a light purple). That would put white text on a light background — bad contrast. Change:

```css
header {
  background: var(--surface);   /* was var(--primary) */
  color: var(--text);           /* was #fff */
  ...
}
```

Keep `box-shadow: 0 2px 8px rgba(0,0,0,0.2);` as is.

- [ ] **Step 5: Verify — start dev server and open the app**

Run: `npm run dev`  
Open: `http://localhost:3000`

Expected:
- Dark background (`#161826`)
- Header is dark (`#232532`) with readable text
- Subject cards use `--surface` background (`#232532`)
- Section title text is purple-ish (`var(--accent-light)` = `#b5abfc`)
- No broken layout, no white flash

- [ ] **Step 6: Commit**

```bash
git add public/index.html
git commit -m "feat: dark theme restyle for index.html"
```

---

### Task 3: Landing screen + `loadLanding()`

**Files:**
- Modify: `public/index.html` (HTML structure + JS section)

**Interfaces:**
- Consumes: existing `loadHome()` (subject grid screen), existing `showScreen()`, existing `setBreadcrumb()`
- Produces:
  - HTML: `<div id="landing-screen">` with two section cards
  - JS: `loadLanding()` function
  - Updated `$('btn-home')` click handler → calls `loadLanding` instead of `loadHome`
  - Updated breadcrumbs in `loadHome()`, `loadModeScreen()`, `startUnitExam()` to show "Inicio" → `loadLanding`

- [ ] **Step 1: Add landing screen HTML**

After the closing `</header>` tag (line 540) and before `<!-- ── Screen: Subject selection -->`, insert:

```html
<!-- ── Screen: Landing ─────────────────────────────── -->
<div class="screen" id="landing-screen">
  <div class="container">
    <div class="section-title" style="margin-bottom:8px">Generador de Exámenes DAW</div>
    <div class="section-subtitle">¿Qué quieres hacer hoy?</div>
    <div class="cards-grid" style="grid-template-columns: repeat(auto-fill, minmax(260px,1fr))">
      <div class="card" id="card-test" tabindex="0" role="button" aria-label="Ir a Pruebas Test">
        <div class="card-icon">📝</div>
        <div class="card-title">Pruebas Test</div>
        <div class="card-meta">Pon a prueba tus conocimientos con preguntas tipo test.</div>
        <div style="margin-top:12px;font-size:0.85rem;color:var(--accent-light)">Empezar →</div>
      </div>
      <div class="card" id="card-summaries" tabindex="0" role="button" aria-label="Ir a Resúmenes Interactivos">
        <div class="card-icon">📖</div>
        <div class="card-title">Resúmenes Interactivos</div>
        <div class="card-meta">Repasa el temario con resúmenes visuales e interactivos.</div>
        <div style="margin-top:12px;font-size:0.85rem;color:var(--accent-light)">Explorar →</div>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Make `home-screen` start inactive**

Change `<div class="screen active" id="home-screen">` to `<div class="screen" id="home-screen">`.

The landing screen now starts active (add `active` class to `#landing-screen`):
```html
<div class="screen active" id="landing-screen">
```

- [ ] **Step 3: Add `loadLanding()` function to JS**

In the JS section, after the `loadHome()` function definition (around line 811) and before `loadModeScreen()`, add:

```js
function loadLanding() {
  showScreen('landing-screen');
  setBreadcrumb({ label: 'Inicio' });
  $('card-test').onclick = loadHome;
  $('card-test').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') loadHome(); };
  $('card-summaries').onclick = () => { location.href = 'summaries.html'; };
  $('card-summaries').onkeydown = e => {
    if (e.key === 'Enter' || e.key === ' ') location.href = 'summaries.html';
  };
}
```

- [ ] **Step 4: Update breadcrumbs to route back to landing**

In `loadHome()` (around line 785), change:
```js
setBreadcrumb({ label: 'Inicio' });
```
to:
```js
setBreadcrumb({ label: 'Inicio', onClick: loadLanding }, { label: 'Pruebas Test' });
```

In `loadModeScreen()` (around line 819), change:
```js
setBreadcrumb(
  { label: 'Inicio', onClick: loadHome },
  { label: subjectName(subj.name) }
);
```
to:
```js
setBreadcrumb(
  { label: 'Inicio', onClick: loadLanding },
  { label: subjectName(subj.name) }
);
```

In `startUnitExam()` (around line 912), change:
```js
setBreadcrumb(
  { label: 'Inicio', onClick: loadHome },
  { label: subjectName(subj.name), onClick: () => loadModeScreen(subj) },
  { label }
);
```
to:
```js
setBreadcrumb(
  { label: 'Inicio', onClick: loadLanding },
  { label: subjectName(subj.name), onClick: () => loadModeScreen(subj) },
  { label }
);
```

- [ ] **Step 5: Update `btn-home` event listener**

Find (line 1290):
```js
$('btn-home').addEventListener('click', loadHome);
```
Change to:
```js
$('btn-home').addEventListener('click', loadLanding);
```

- [ ] **Step 6: Verify landing screen**

Run: `npm run dev` (or keep running)  
Open: `http://localhost:3000`

Expected:
- Landing screen shows with two cards: "Pruebas Test" and "Resúmenes Interactivos"
- Clicking "Pruebas Test" → subject grid (existing `loadHome()` flow)
- Clicking "Resúmenes Interactivos" → navigates to `summaries.html` (404 is expected — file doesn't exist yet)
- Header "Histórico" button → history screen
- Clicking "Inicio" in breadcrumb from subject grid → back to landing

---

### Task 4: Deep-link init + Fase 1 commit + verification

**Files:**
- Modify: `public/index.html` (bottom of `<script>` only — last 2 lines)
- Create: `public/summaries.html` (minimal shell so "Explorar" doesn't 404)

**Interfaces:**
- Consumes: `fetchSubjects()` (line 757), `fetchUnitQuestions(subject, filename)` (line 762), `startUnitExam(subj, unitFile, questions)` (line 907), `loadLanding()` (Task 3)
- Produces: deep-link behavior from `index.html?subject=X&unit=N`; Fase 1 commit

- [ ] **Step 1: Replace bottom `loadHome()` call with deep-link IIFE**

Find the very bottom of the `<script>` block (line 1297):
```js
loadHome();
```

Replace with:
```js
(async () => {
  const p = new URLSearchParams(location.search);
  const subj = p.get('subject'), unit = p.get('unit');
  if (subj && unit) {
    history.replaceState({}, '', location.pathname);
    try {
      const subjects = await fetchSubjects();
      const obj = subjects.find(s => s.name === subj);
      if (!obj) { loadLanding(); return; }
      const file = `u${unit}.txt`;
      const questions = await fetchUnitQuestions(obj.name, file);
      startUnitExam(obj, file, questions);
    } catch {
      loadLanding();
    }
    return;
  }
  loadLanding();
})();
```

- [ ] **Step 2: Create minimal `public/summaries.html` shell**

Create `public/summaries.html` with a placeholder that links back:

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Resúmenes Interactivos — DAW</title>
<link rel="stylesheet" href="style.css">
<style>
  .container { max-width: 900px; margin: 0 auto; padding: 48px 20px; }
  h1 { color: var(--accent-light); margin-bottom: 16px; }
  p { color: var(--text-body); }
  a { display: inline-block; margin-top: 24px; }
</style>
</head>
<body>
<div id="app">
  <div class="container">
    <h1>📖 Resúmenes Interactivos</h1>
    <p>Próximamente — el viewer se implementa en Fase 2.</p>
    <a href="index.html">← Volver</a>
  </div>
</div>
</body>
</html>
```

- [ ] **Step 3: Verify full Fase 1**

Run: `npm run dev`

Check these flows in order:
1. `http://localhost:3000` → landing screen ✓
2. "Pruebas Test" card → subject grid → select a subject → select a mode → take a short exam → results → "Volver al inicio" → landing ✓
3. "Resúmenes Interactivos" card → `summaries.html` loads with placeholder ✓
4. `http://localhost:3000?subject=lm&unit=1` → skips landing, starts lm U1 exam directly ✓
5. `http://localhost:3000?subject=fake&unit=1` → falls back to landing ✓
6. Header "Histórico" button → history screen ✓

- [ ] **Step 4: Commit Fase 1**

```bash
git add public/style.css public/index.html public/summaries.html
git commit -m "feat: restyle dark theme + two-section home"
```

---

## FASE 2 — Renderer + backend + piloto lm/u1

---

### Task 5: `server.js` — summary discovery + new endpoint

**Files:**
- Modify: `server.js`

**Interfaces:**
- Consumes: existing `DATA_DIR`, `path`, `fs` — already imported
- Produces:
  - `getSummaryUnits(subject)` → `['u0','u1','u2']` (sorted)
  - `/api/subjects` response gains field `summaryUnits: string[]`
  - `GET /api/summary/:subject/:unit` → JSON content or 400/404

- [ ] **Step 1: Write the failing test (manual)**

With the server running, verify that `/api/subjects` currently does NOT return `summaryUnits`:

```bash
curl http://localhost:3000/api/subjects
```

Expected: objects with `name`, `units`, `hasPs` — no `summaryUnits` field.

- [ ] **Step 2: Add `getSummaryUnits` helper**

In `server.js`, after the `getSubjectFiles` function (around line 177), add:

```js
function getSummaryUnits(subject) {
  const dir = path.join(DATA_DIR, subject);
  return fs.readdirSync(dir)
    .filter(f => /^u\d+\.resumen\.json$/i.test(f))
    .map(f => f.replace('.resumen.json', ''))
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
}
```

- [ ] **Step 3: Add `summaryUnits` to `/api/subjects` map**

In the `/api/subjects` handler (around line 223), inside the `.map(name => { ... })` block, change:
```js
return { name, units, hasPs };
```
to:
```js
return { name, units, hasPs, summaryUnits: getSummaryUnits(name) };
```

- [ ] **Step 4: Add `/api/summary/:subject/:unit` endpoint**

Before `app.listen(...)` (line 299), add:

```js
app.get('/api/summary/:subject/:unit', (req, res) => {
  const { subject, unit } = req.params;
  if (!/^[\w.]+$/.test(subject) || !/^\d+$/.test(unit)) {
    return res.status(400).json({ error: 'Invalid params' });
  }
  try {
    const raw = fs.readFileSync(
      path.join(DATA_DIR, subject, `u${unit}.resumen.json`), 'utf-8'
    );
    res.json(JSON.parse(raw));
  } catch {
    res.status(404).json({ error: 'Summary not found' });
  }
});
```

- [ ] **Step 5: Verify**

Restart the server: `npm run dev`

```bash
# Should return summaryUnits: [] for all subjects (no JSON files yet)
curl http://localhost:3000/api/subjects | python -m json.tool | grep summaryUnits

# Should return 404
curl http://localhost:3000/api/summary/lm/1

# Should return 400
curl "http://localhost:3000/api/summary/../etc/passwd/1"
```

Expected:
- Each subject object has `summaryUnits: []`
- `/api/summary/lm/1` → `{"error":"Summary not found"}` with HTTP 404
- Path traversal attempt → HTTP 400

- [ ] **Step 6: Commit**

```bash
git add server.js
git commit -m "feat: server.js — summary discovery + /api/summary endpoint"
```

---

### Task 6: `summaries.html` — shell with subjects + units screens

**Files:**
- Modify: `public/summaries.html`

**Interfaces:**
- Consumes: `GET /api/subjects` (returns `{ name, units, hasPs, summaryUnits }`)
- Produces:
  - `state` object with all fields
  - `render()` function dispatching to `renderSubjects()` / `renderUnits()` / `renderSummary()`
  - `bindEvents()` with event delegation on `#app`
  - `esc(str)` XSS-safe string escape
  - `renderSubjects()` — shows only subjects with `summaryUnits.length > 0`
  - `renderUnits()` — shows unit cards for `state.subject.summaryUnits`
  - `renderSummary()` — stub returning `<p>Loading…</p>` (full renderer is Task 8)

- [ ] **Step 1: Write the new `summaries.html` (replace placeholder)**

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Resúmenes Interactivos — DAW</title>
<link rel="stylesheet" href="style.css">
<style>
  /* ── Layout ──────────────────────────────────────── */
  header {
    background: var(--surface);
    color: var(--text);
    padding: 0 20px;
    height: 56px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  header h1 { font-size: 1.05rem; font-weight: 600; }
  .btn-ghost {
    margin-left: auto;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.2);
    color: var(--text);
    border-radius: var(--radius);
    padding: 6px 14px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s ease;
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.15); }

  .container { max-width: 900px; margin: 0 auto; padding: 32px 20px; }
  .section-title { font-size: 1.4rem; font-weight: 700; color: var(--accent-light); margin-bottom: 8px; }
  .section-subtitle { color: var(--text-muted); font-size: 0.92rem; margin-bottom: 28px; }

  /* ── Cards ───────────────────────────────────────── */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  .card {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 24px 20px;
    cursor: pointer;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .card:hover, .card:focus-visible {
    border-color: var(--accent);
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    transform: translateY(-2px);
    outline: none;
  }
  .card-icon { font-size: 2rem; }
  .card-title { font-size: 1.05rem; font-weight: 600; color: var(--text); }
  .card-meta { font-size: 0.85rem; color: var(--text-muted); }

  /* ── Loading ──────────────────────────────────────── */
  .loading { display: flex; align-items: center; justify-content: center;
    padding: 60px 0; flex-direction: column; gap: 16px; color: var(--text-muted); }
  .spinner { width: 36px; height: 36px; border: 3px solid var(--border);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Error ────────────────────────────────────────── */
  .error-msg { color: var(--error); padding: 24px 0; }
</style>
</head>
<body>
<header>
  <h1>📖 Resúmenes Interactivos</h1>
  <a href="index.html" class="btn-ghost">← Volver</a>
</header>
<div id="app">
  <div class="loading"><div class="spinner"></div><span>Cargando…</span></div>
</div>
<script>
'use strict';

const SUBJECT_NAMES = {
  si: 'Sistemas Informáticos', ed: 'Entornos de Desarrollo',
  bd: 'Bases de Datos', prog: 'Programación', lm: 'Lenguajes de Marcas',
  ip: 'Inglés Profesional', ipe: 'Itinerario Profesional para la Empleabilidad',
  dwec: 'Desarrollo Web en Entorno Cliente', dwes: 'Desarrollo Web en Entorno Servidor',
};
const SUBJECT_ICONS = {
  si: '🖥️', ed: '🛠️', bd: '🗄️', prog: '💻', lm: '📄',
  dwec: '🌐', dwes: '⚙️', ip: '🇬🇧', ipe: '💼',
};
function subjectName(code) { return SUBJECT_NAMES[code] || code.toUpperCase(); }
function subjectIcon(code) { return SUBJECT_ICONS[code] || '📚'; }

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const state = {
  screen:    'subjects',
  subjects:  [],
  subject:   null,
  unitNum:   null,
  summary:   null,
  section:   'intro',
  open:      {},
  flipped:   {},
  search:    '',
  answers:   {},
  submitted: false,
};

function render() {
  document.getElementById('app').innerHTML =
    state.screen === 'subjects' ? renderSubjects() :
    state.screen === 'units'    ? renderUnits()    :
                                  renderSummary();
  bindEvents();
}

function renderSubjects() {
  const withSummaries = state.subjects.filter(s => s.summaryUnits && s.summaryUnits.length > 0);
  if (withSummaries.length === 0) {
    return `<div class="container"><p class="error-msg">No hay resúmenes disponibles aún.</p></div>`;
  }
  const cards = withSummaries.map(s => `
    <div class="card" data-action="select-subject" data-subject="${esc(s.name)}"
         tabindex="0" role="button" aria-label="${esc(subjectName(s.name))}">
      <div class="card-icon">${esc(subjectIcon(s.name))}</div>
      <div class="card-title">${esc(subjectName(s.name))}</div>
      <div class="card-meta">${s.summaryUnits.length} unidad${s.summaryUnits.length !== 1 ? 'es' : ''}</div>
    </div>
  `).join('');
  return `
    <div class="container">
      <div class="section-title">Resúmenes por asignatura</div>
      <div class="section-subtitle">Selecciona una asignatura para ver sus resúmenes</div>
      <div class="cards-grid">${cards}</div>
    </div>
  `;
}

function renderUnits() {
  const s = state.subject;
  const cards = s.summaryUnits.map(u => {
    const num = u.slice(1);
    return `
      <div class="card" data-action="select-unit" data-unit="${esc(num)}"
           tabindex="0" role="button" aria-label="Unidad ${esc(num)}">
        <div class="card-icon">📄</div>
        <div class="card-title">Unidad ${esc(num)}</div>
        <div class="card-meta">${esc(subjectName(s.name))}</div>
      </div>
    `;
  }).join('');
  return `
    <div class="container">
      <div style="margin-bottom:16px">
        <button class="btn-ghost" data-action="back-subjects" style="margin-left:0">← Asignaturas</button>
      </div>
      <div class="section-title">${esc(subjectName(s.name))}</div>
      <div class="section-subtitle">Selecciona una unidad</div>
      <div class="cards-grid">${cards}</div>
    </div>
  `;
}

function renderSummary() {
  // Stub — full renderer implemented in Task 8
  return `<div class="container"><div class="loading"><div class="spinner"></div><span>Cargando resumen…</span></div></div>`;
}

function bindEvents() {
  const app = document.getElementById('app');
  app.onclick = handleClick;
  app.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') handleClick(e); };
  const searchEl = document.getElementById('glossary-search');
  if (searchEl) {
    searchEl.oninput = e => {
      state.search = e.target.value;
      const list = document.getElementById('glossary-list');
      if (list) list.innerHTML = renderGlossaryItems();
    };
  }
}

function handleClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  if (action === 'select-subject') {
    const subj = state.subjects.find(s => s.name === el.dataset.subject);
    if (!subj) return;
    state.subject = subj;
    state.screen = 'units';
    render();
  } else if (action === 'back-subjects') {
    state.screen = 'subjects';
    state.subject = null;
    render();
  } else if (action === 'select-unit') {
    const num = parseInt(el.dataset.unit, 10);
    state.unitNum = num;
    state.screen = 'summary';
    state.section = 'intro';
    state.open = {}; state.flipped = {};
    state.search = ''; state.answers = {}; state.submitted = false;
    render();
    loadSummary(state.subject.name, num);
  } else if (action === 'nav-section') {
    state.section = el.dataset.section;
    document.getElementById('summary-main').innerHTML = renderActiveSection();
    bindEvents();
  } else if (action === 'toggle-open') {
    const key = el.dataset.key;
    state.open[key] = !state.open[key];
    const body = document.getElementById(`body-${key}`);
    if (body) { body.hidden = !state.open[key]; }
    el.querySelector('.toggle-icon') && (el.querySelector('.toggle-icon').textContent = state.open[key] ? '▲' : '▼');
  } else if (action === 'flip') {
    const key = el.dataset.key;
    state.flipped[key] = !state.flipped[key];
    const inner = document.getElementById(`flip-inner-${key}`);
    if (inner) inner.classList.toggle('is-flipped', state.flipped[key]);
  } else if (action === 'select-answer') {
    if (state.submitted) return;
    const qi = parseInt(el.dataset.qi, 10), oi = parseInt(el.dataset.oi, 10);
    state.answers[qi] = oi;
    const section = document.getElementById('quiz-section');
    if (section) section.innerHTML = renderQuizSection();
    bindEvents();
  } else if (action === 'submit-quiz') {
    state.submitted = true;
    const section = document.getElementById('quiz-section');
    if (section) section.innerHTML = renderQuizSection();
    bindEvents();
  } else if (action === 'retry-quiz') {
    state.answers = {}; state.submitted = false;
    const section = document.getElementById('quiz-section');
    if (section) section.innerHTML = renderQuizSection();
    bindEvents();
  } else if (action === 'back-units') {
    state.screen = 'units'; state.summary = null;
    render();
  }
}

async function loadSummary(subject, unitNum) {
  try {
    const r = await fetch(`/api/summary/${subject}/${unitNum}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    state.summary = await r.json();
    const main = document.getElementById('summary-main');
    if (main) main.innerHTML = renderActiveSection();
    bindEvents();
  } catch (err) {
    const main = document.getElementById('summary-main');
    if (main) main.innerHTML = `<p class="error-msg">Error cargando resumen: ${esc(err.message)}</p>`;
  }
}

function renderGlossaryItems() { return ''; } // stub, overridden in Task 8
function renderActiveSection() { return ''; }  // stub, overridden in Task 8

// ── Init ──────────────────────────────────────────────────────────────
(async () => {
  try {
    const r = await fetch('/api/subjects');
    if (!r.ok) throw new Error('Error cargando asignaturas');
    state.subjects = await r.json();
    render();
  } catch (err) {
    document.getElementById('app').innerHTML =
      `<div class="container"><p class="error-msg">Error: ${esc(err.message)}</p></div>`;
  }
})();
</script>
</body>
</html>
```

- [ ] **Step 2: Verify subjects + units navigation**

Open: `http://localhost:3000/summaries.html`  

Expected (since no `.resumen.json` files exist yet):
- Shows "No hay resúmenes disponibles aún." (summaryUnits is [] for all subjects)
- No JS errors in console
- "← Volver" link goes back to `index.html`

- [ ] **Step 3: Commit**

```bash
git add public/summaries.html
git commit -m "feat: summaries.html shell — subjects + units screens"
```

---

### Task 7: `data/lm/u1.resumen.json` — pilot content

**Files:**
- Create: `data/lm/u1.resumen.json`

**Interfaces:**
- Consumes: PDF sources: `U1 Síntesis (7).pdf`, `U1 DIAPOSITIVAS….pdf`, and main U1 PDF in `C:\Users\BryDev\OneDrive\Desktop\DAW\Bloque 2\lm\`
- Consumes: JS constants in `docs/diseno-resumen-referencia.txt` (already extracted data)
- Produces: valid JSON conforming to the schema in spec section 7

The reference file `docs/diseno-resumen-referencia.txt` already has the data extracted from the PDFs as JS constants: `TIPOS`, `CARACTERISTICAS`, `AMBITOS`, `ERAS`, `FLIPCARDS`, `ORGS`, `GRAMATICAS`, `GLOSARIO`, `QUESTIONS`. Convert these to the JSON schema.

**Schema reminder:**
```
{
  "subject": "lm", "unit": 1,
  "title": "...", "intro": "...", "objectives": [...],
  "sections": [{ "id": "s1", "label": "...", "blocks": [
    { "type": "text|cards|accordion|timeline|flipcards|chips|table|code", ... }
  ]}],
  "glossary": [{ "term": "...", "def": "..." }],
  "quiz": [{ "question": "...", "options": [...], "correct": 0, "explanation": "..." }]
}
```

- [ ] **Step 1: Read source material**

Read `docs/diseno-resumen-referencia.txt` fully — it contains all extracted content.  
Read the PDF files from `C:\Users\BryDev\OneDrive\Desktop\DAW\Bloque 2\lm\` for U1 to fill any gaps.

- [ ] **Step 2: Create `data/lm/u1.resumen.json`**

Map the extracted constants to JSON blocks:
- `TIPOS` → `cards` block (4 items: De procedimiento, De presentación, Descriptivo/semántico, De propósito específico)
- `CARACTERISTICAS` → `accordion` block (características generales)
- `AMBITOS` → `chips` block (ámbitos de uso: web, sindicación, Android, mensajería, etc.)
- `ERAS` → `timeline` block (SGML→GML→HTML→XML→XHTML→HTML5)
- `FLIPCARDS` → `flipcards` block (terminología: etiqueta, atributo, elemento, etc.)
- `ORGS` → `cards` block (organismos: W3C, OASIS, ISO)
- `GRAMATICAS` → `table` block (DTD vs XML Schema vs RELAX NG)
- `GLOSARIO` → `glossary` array
- `QUESTIONS` → `quiz` array (6–10 items)

Add at minimum: one `text` block per section as intro paragraph, one `code` block with a minimal XML example.

Sections suggested:
- `s1`: "1.1 Clasificación y tipos" → types cards + accordion características
- `s2`: "1.2 Ámbitos de uso" → chips
- `s3`: "1.3 Evolución histórica" → timeline
- `s4`: "1.4 Terminología" → flipcards
- `s5`: "1.5 Organismos y gramáticas" → cards orgs + table gramáticas + code example

- [ ] **Step 3: Validate JSON structure**

Run:
```bash
node -e "const d=require('./data/lm/u1.resumen.json'); console.log('unit:', d.unit, 'sections:', d.sections.length, 'quiz:', d.quiz.length, 'glossary:', d.glossary.length);"
```

Expected: `unit: 1 sections: 5 quiz: 6 glossary: >5`

- [ ] **Step 4: Verify via API (after server restart)**

```bash
# Restart dev server first
curl http://localhost:3000/api/subjects | python -m json.tool | grep -A5 '"name":"lm"'
curl http://localhost:3000/api/summary/lm/1 | python -m json.tool | head -20
```

Expected:
- `lm` subject now shows `"summaryUnits": ["u1"]`
- `/api/summary/lm/1` returns the full JSON

---

### Task 8: `summaries.html` — full renderer

**Files:**
- Modify: `public/summaries.html` (JS section only — replace `renderSummary`, `renderActiveSection`, `renderGlossaryItems` stubs and add CSS for viewer)

**Interfaces:**
- Consumes: `state.summary` (loaded by `loadSummary()` in Task 6), all state fields
- Produces: working viewer with sidebar nav, 8 block renderers, quiz with submit/retry, glossary search

- [ ] **Step 1: Add viewer CSS to the `<style>` block**

Append inside the existing `<style>` tag:

```css
/* ── Summary viewer layout ───────────────────────────── */
.summary-wrap { display: grid; grid-template-columns: 220px 1fr; min-height: calc(100vh - 56px); }
.summary-nav {
  background: var(--surface); border-right: 1px solid var(--border);
  padding: 24px 0; position: sticky; top: 56px; align-self: start;
  max-height: calc(100vh - 56px); overflow-y: auto;
}
.nav-item {
  display: block; padding: 10px 20px; font-size: 0.88rem; color: var(--text-muted);
  cursor: pointer; border-left: 3px solid transparent; transition: all 0.15s ease;
  background: none; border-right: none; border-top: none; border-bottom: none;
  width: 100%; text-align: left;
}
.nav-item:hover { color: var(--text); background: var(--accent-bg); }
.nav-item.active { color: var(--accent-light); border-left-color: var(--accent-light); background: var(--accent-bg); }
.summary-main { padding: 32px 28px; max-width: 720px; }

/* ── Summary header ───────────────────────────────────── */
.summary-header { margin-bottom: 32px; }
.summary-kicker { font-size: 0.78rem; font-weight: 600; letter-spacing: 0.06em;
  color: var(--accent-light); text-transform: uppercase; margin-bottom: 6px; }
.summary-title { font-size: 1.5rem; font-weight: 700; color: var(--text); line-height: 1.3; }
.summary-intro { color: var(--text-body); margin-top: 12px; line-height: 1.65; }

/* ── Blocks ──────────────────────────────────────────── */
.block + .block { margin-top: 24px; }

/* text */
.block-text { color: var(--text-body); line-height: 1.65; }

/* cards */
.block-cards { display: flex; flex-wrap: wrap; gap: 12px; }
.block-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px; flex: 1 1 180px; min-width: 160px;
}
.block-card .kicker { font-size: 0.72rem; font-weight: 600; color: var(--accent-light);
  text-transform: uppercase; letter-spacing: 0.05em; }
.block-card .card-h { font-weight: 600; color: var(--text); margin: 4px 0 6px; }
.block-card .card-d { font-size: 0.88rem; color: var(--text-body); }
.block-card .card-ex { font-size: 0.82rem; color: var(--text-muted); margin-top: 4px; font-style: italic; }

/* accordion */
.accordion-row { border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 6px; }
.accordion-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; cursor: pointer; font-weight: 500; color: var(--text);
  background: none; border: none; width: 100%; text-align: left;
}
.accordion-header:hover { background: var(--accent-bg); }
.toggle-icon { color: var(--text-muted); font-size: 0.8rem; }
.accordion-body { padding: 12px 16px; color: var(--text-body); line-height: 1.6; border-top: 1px solid var(--border); }

/* timeline */
.timeline { padding-left: 20px; border-left: 2px solid var(--accent-line); }
.timeline-item { position: relative; padding: 0 0 20px 20px; }
.timeline-item::before {
  content: ''; position: absolute; left: -7px; top: 4px;
  width: 12px; height: 12px; background: var(--accent); border-radius: 50%;
}
.timeline-year { font-size: 0.78rem; font-weight: 700; color: var(--accent-light); }
.timeline-label { font-weight: 600; color: var(--text); }
.timeline-detail { font-size: 0.88rem; color: var(--text-body); margin-top: 2px; }

/* flipcards */
.flipcards-grid { display: flex; flex-wrap: wrap; gap: 12px; }
.flipcard { width: 160px; height: 100px; perspective: 600px; cursor: pointer; }
.flipcard-inner {
  position: relative; width: 100%; height: 100%;
  transition: transform 0.45s; transform-style: preserve-3d;
}
.flipcard-inner.is-flipped { transform: rotateY(180deg); }
.flipcard-front, .flipcard-back {
  position: absolute; width: 100%; height: 100%;
  backface-visibility: hidden; border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  padding: 12px; text-align: center; font-size: 0.88rem;
  border: 1px solid var(--border);
}
.flipcard-front { background: var(--surface); color: var(--text); font-weight: 600; }
.flipcard-back { background: var(--accent-bg); color: var(--accent-light); transform: rotateY(180deg); }

/* chips */
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  background: var(--accent-bg); color: var(--accent-light);
  border-radius: 99px; padding: 5px 14px; font-size: 0.83rem; font-weight: 500;
}

/* table */
.block-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.block-table th {
  background: var(--accent-bg); color: var(--accent-light);
  padding: 10px 14px; text-align: left; font-weight: 600; border-bottom: 1px solid var(--border);
}
.block-table td { padding: 10px 14px; color: var(--text-body); border-bottom: 1px solid var(--border); }
.block-table tr:last-child td { border-bottom: none; }
.table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius); }

/* code */
.code-block {
  background: var(--surface); border: 1px solid var(--accent-line);
  border-radius: var(--radius); padding: 16px; overflow-x: auto;
}
.code-block pre { margin: 0; }
.code-block code { font-family: 'Consolas','Courier New',monospace; font-size: 0.85rem; color: var(--text-body); }

/* objectives */
.objectives { padding: 16px 20px; background: var(--accent-bg); border-radius: var(--radius);
  border-left: 3px solid var(--accent-light); margin-bottom: 24px; }
.objectives h3 { font-size: 0.82rem; font-weight: 700; color: var(--accent-light);
  text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
.objectives ul { padding-left: 18px; }
.objectives li { color: var(--text-body); font-size: 0.9rem; line-height: 1.6; }

/* section heading */
.section-h { font-size: 1.15rem; font-weight: 700; color: var(--text); margin-bottom: 16px; }

/* glossary */
.glossary-search {
  width: 100%; background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 10px 14px; color: var(--text);
  font-size: 0.9rem; margin-bottom: 16px;
}
.glossary-search::placeholder { color: var(--text-subtle); }
.glossary-search:focus { border-color: var(--accent); outline: none; }
.glossary-item { padding: 12px 0; border-bottom: 1px solid var(--border); }
.glossary-item:last-child { border-bottom: none; }
.glossary-term { font-weight: 600; color: var(--accent-light); }
.glossary-def { color: var(--text-body); font-size: 0.9rem; margin-top: 3px; }

/* quiz */
.quiz-item { margin-bottom: 28px; }
.quiz-q { font-weight: 600; color: var(--text); margin-bottom: 10px; }
.quiz-option {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: var(--radius); margin-bottom: 6px;
  border: 1.5px solid var(--border); background: var(--surface);
  cursor: pointer; font-size: 0.9rem; color: var(--text-body);
  transition: border-color 0.15s, background 0.15s;
}
.quiz-option:hover:not(.submitted) { border-color: var(--accent); background: var(--accent-bg); }
.quiz-option.selected { border-color: var(--accent); background: var(--accent-bg); color: var(--text); }
.quiz-option.correct  { border-color: var(--success); background: var(--success-bg); color: var(--text); }
.quiz-option.wrong    { border-color: var(--error);   background: var(--error-bg);   color: var(--text); }
.quiz-badge { font-size: 0.78rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-bottom: 6px; }
.quiz-badge.correct-badge { background: var(--success-bg); color: var(--success); }
.quiz-badge.wrong-badge   { background: var(--error-bg);   color: var(--error); }
.quiz-explanation { font-size: 0.85rem; color: var(--text-muted); margin-top: 6px; padding-left: 4px; }
.quiz-footer { display: flex; align-items: center; gap: 16px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); }
.quiz-score { font-size: 1rem; font-weight: 600; color: var(--text); }
.btn-primary {
  background: var(--accent); color: var(--bg); border: none; border-radius: var(--radius);
  padding: 10px 20px; font-weight: 600; cursor: pointer; font-size: 0.9rem;
  transition: background 0.15s;
}
.btn-primary:hover { background: var(--accent-light); }
.btn-secondary {
  background: var(--surface); color: var(--text-muted); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 10px 20px; font-weight: 600; cursor: pointer;
  font-size: 0.9rem; transition: border-color 0.15s;
}
.btn-secondary:hover { border-color: var(--accent); color: var(--text); }

/* back button */
.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--text-muted); font-size: 0.88rem; cursor: pointer;
  background: none; border: none; margin-bottom: 16px; padding: 0;
}
.back-btn:hover { color: var(--accent-light); }

/* mobile */
@media (max-width: 640px) {
  .summary-wrap { grid-template-columns: 1fr; }
  .summary-nav { position: static; display: flex; overflow-x: auto; border-right: none; border-bottom: 1px solid var(--border); padding: 8px 0; }
  .nav-item { white-space: nowrap; border-left: none; border-bottom: 3px solid transparent; }
  .nav-item.active { border-bottom-color: var(--accent-light); border-left-color: transparent; }
  .summary-main { padding: 20px 16px; }
}
```

- [ ] **Step 2: Replace `renderSummary()` stub**

Replace the stub `renderSummary()` function with:

```js
function renderSummary() {
  if (!state.summary) {
    return `
      <div class="summary-wrap">
        <nav class="summary-nav"></nav>
        <main class="summary-main" id="summary-main">
          <div class="loading"><div class="spinner"></div><span>Cargando…</span></div>
        </main>
      </div>`;
  }
  const d = state.summary;
  const navItems = [
    { id: 'intro', label: 'Introducción' },
    ...d.sections.map(s => ({ id: s.id, label: s.label })),
    { id: 'glossary', label: 'Glosario' },
    { id: 'quiz', label: 'Quiz' },
  ];
  const navHtml = navItems.map(n => `
    <button class="nav-item${state.section === n.id ? ' active' : ''}"
      data-action="nav-section" data-section="${esc(n.id)}">${esc(n.label)}</button>
  `).join('');

  return `
    <div class="summary-wrap">
      <nav class="summary-nav">${navHtml}</nav>
      <main class="summary-main" id="summary-main">
        ${renderActiveSection()}
      </main>
    </div>`;
}
```

- [ ] **Step 3: Replace `renderActiveSection()` stub**

```js
function renderActiveSection() {
  const d = state.summary;
  if (!d) return '';

  if (state.section === 'intro') {
    const objItems = d.objectives.map(o => `<li>${esc(o)}</li>`).join('');
    const objHtml = d.objectives.length ? `
      <div class="objectives">
        <h3>Objetivos</h3>
        <ul>${objItems}</ul>
      </div>` : '';
    return `
      <div class="summary-header">
        <div class="summary-kicker">${esc(SUBJECT_NAMES[d.subject] || d.subject.toUpperCase())} · Unidad ${esc(String(d.unit))}</div>
        <div class="summary-title">${esc(d.title)}</div>
        <p class="summary-intro">${esc(d.intro)}</p>
      </div>
      ${objHtml}`;
  }

  if (state.section === 'glossary') {
    return `
      <h2 class="section-h">Glosario</h2>
      <input type="search" id="glossary-search" class="glossary-search"
        placeholder="Buscar término…" value="${esc(state.search)}" autocomplete="off">
      <div id="glossary-list">${renderGlossaryItems()}</div>`;
  }

  if (state.section === 'quiz') {
    return `<div id="quiz-section">${renderQuizSection()}</div>`;
  }

  const sec = state.summary.sections.find(s => s.id === state.section);
  if (!sec) return '<p class="error-msg">Sección no encontrada.</p>';
  const blocks = sec.blocks.map((b, i) =>
    `<div class="block">${renderBlock(b, sec.id, i)}</div>`
  ).join('');
  return `<h2 class="section-h">${esc(sec.label)}</h2>${blocks}`;
}
```

- [ ] **Step 4: Replace `renderGlossaryItems()` stub**

```js
function renderGlossaryItems() {
  const q = state.search.toLowerCase().trim();
  const items = q
    ? state.summary.glossary.filter(g =>
        g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q))
    : state.summary.glossary;
  if (items.length === 0) return `<p style="color:var(--text-muted)">Sin resultados.</p>`;
  return items.map(g => `
    <div class="glossary-item">
      <div class="glossary-term">${esc(g.term)}</div>
      <div class="glossary-def">${esc(g.def)}</div>
    </div>`).join('');
}
```

- [ ] **Step 5: Add `renderQuizSection()` function**

```js
function renderQuizSection() {
  const d = state.summary;
  const items = d.quiz.map((q, qi) => {
    const badge = state.submitted
      ? (state.answers[qi] === q.correct
          ? `<div class="quiz-badge correct-badge">✓ Acertada</div>`
          : `<div class="quiz-badge wrong-badge">✗ Fallida</div>`)
      : '';
    const opts = q.options.map((opt, oi) => {
      let cls = 'quiz-option';
      if (state.submitted) {
        if (oi === q.correct) cls += ' correct';
        else if (oi === state.answers[qi]) cls += ' wrong';
        cls += ' submitted';
      } else if (state.answers[qi] === oi) {
        cls += ' selected';
      }
      const clickAttr = state.submitted ? '' : `data-action="select-answer" data-qi="${qi}" data-oi="${oi}"`;
      return `<div class="${cls}" ${clickAttr}>${esc(opt)}</div>`;
    }).join('');
    const expl = state.submitted && q.explanation
      ? `<div class="quiz-explanation">${esc(q.explanation)}</div>` : '';
    return `
      <div class="quiz-item">
        ${badge}
        <div class="quiz-q">${qi + 1}. ${esc(q.question)}</div>
        ${opts}
        ${expl}
      </div>`;
  }).join('');

  let footer = '';
  if (state.submitted) {
    const correct = d.quiz.filter((q, qi) => state.answers[qi] === q.correct).length;
    const testLink = state.subject && state.unitNum !== null
      ? `<a href="index.html?subject=${esc(state.subject.name)}&unit=${esc(String(state.unitNum))}"
           class="btn-primary" style="text-decoration:none">Hacer el test →</a>`
      : '';
    footer = `
      <div class="quiz-footer">
        <span class="quiz-score">Resultado: ${correct} / ${d.quiz.length}</span>
        <button class="btn-secondary" data-action="retry-quiz">Reintentar</button>
        ${testLink}
      </div>`;
  } else {
    const answered = Object.keys(state.answers).length;
    footer = `
      <div class="quiz-footer">
        <span style="color:var(--text-muted);font-size:0.88rem">${answered} / ${d.quiz.length} respondidas</span>
        <button class="btn-primary" data-action="submit-quiz"
          ${answered === 0 ? 'disabled' : ''}>Comprobar respuestas</button>
      </div>`;
  }
  return `<h2 class="section-h">Quiz de autoevaluación</h2>${items}${footer}`;
}
```

- [ ] **Step 6: Add `renderBlock()` function**

```js
function renderBlock(block, sectionId, blockIdx) {
  switch (block.type) {
    case 'text':
      return `<p class="block-text">${esc(block.content)}</p>`;

    case 'cards':
      return `<div class="block-cards">${block.items.map(item => `
        <div class="block-card">
          ${item.kicker ? `<div class="kicker">${esc(item.kicker)}</div>` : ''}
          <div class="card-h">${esc(item.title)}</div>
          ${item.desc ? `<div class="card-d">${esc(item.desc)}</div>` : ''}
          ${item.example ? `<div class="card-ex">Ej: ${esc(item.example)}</div>` : ''}
        </div>`).join('')}</div>`;

    case 'accordion':
      return block.items.map((item, i) => {
        const key = `${sectionId}-${blockIdx}-${i}`;
        return `
          <div class="accordion-row">
            <button class="accordion-header" data-action="toggle-open" data-key="${esc(key)}">
              <span>${esc(item.title)}</span>
              <span class="toggle-icon">${state.open[key] ? '▲' : '▼'}</span>
            </button>
            <div class="accordion-body" id="body-${esc(key)}" ${state.open[key] ? '' : 'hidden'}>
              ${esc(item.content)}
            </div>
          </div>`;
      }).join('');

    case 'timeline':
      return `<div class="timeline">${block.items.map(item => `
        <div class="timeline-item">
          <div class="timeline-year">${esc(item.year)}</div>
          <div class="timeline-label">${esc(item.label)}</div>
          ${item.detail ? `<div class="timeline-detail">${esc(item.detail)}</div>` : ''}
        </div>`).join('')}</div>`;

    case 'flipcards':
      return `<div class="flipcards-grid">${block.items.map((item, i) => {
        const key = `${sectionId}-${blockIdx}-${i}`;
        return `
          <div class="flipcard" data-action="flip" data-key="${esc(key)}"
               tabindex="0" role="button" aria-label="Voltear: ${esc(item.term)}">
            <div class="flipcard-inner" id="flip-inner-${esc(key)}">
              <div class="flipcard-front">${esc(item.term)}</div>
              <div class="flipcard-back">${esc(item.def)}</div>
            </div>
          </div>`;
      }).join('')}</div>`;

    case 'chips':
      return `<div class="chips">${block.items.map(c =>
        `<span class="chip">${esc(c)}</span>`).join('')}</div>`;

    case 'table':
      return `<div class="table-wrap"><table class="block-table">
        <thead><tr>${block.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${block.rows.map(row =>
          `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`
        ).join('')}</tbody>
      </table></div>`;

    case 'code':
      return `<div class="code-block"><pre><code>${esc(block.content)}</code></pre></div>`;

    default:
      return `<p class="error-msg">Bloque desconocido: ${esc(block.type)}</p>`;
  }
}
```

- [ ] **Step 7: Verify full pilot**

Open: `http://localhost:3000/summaries.html`

Check:
1. lm subject card appears (because `u1.resumen.json` now exists)
2. Click lm → unit card for "Unidad 1" appears
3. Click Unidad 1 → viewer loads with sidebar + intro section
4. Navigate to each section via sidebar — all 5 sections load with blocks
5. Open/close accordion items — animation works, no full re-render
6. Flip a flipcard — rotateY animation works
7. Type in glossary search — filters without losing focus
8. Answer quiz questions → "Comprobar respuestas" → badges show, explanation shows
9. "Hacer el test →" link → navigates to `index.html?subject=lm&unit=1` → LM U1 exam starts
10. "Reintentar" clears answers
11. Mobile (resize browser to <640px) — nav scrolls horizontally

---

### Task 9: Fase 2 verification + commit + STOP

**Files:**
- No new files — verification and commit only

- [ ] **Step 1: Full regression test**

Run: `npm run dev`

Test ALL of the following:
1. All test modes for at least one subject (por unidad, conjunto, simulacro if ps.txt exists)
2. History screen works
3. "← Inicio" breadcrumb from exam goes back to landing
4. summaries.html: lm U1 all 8 block types render correctly
5. Deep-link: `http://localhost:3000?subject=lm&unit=1` → exam starts directly
6. No JS console errors anywhere

- [ ] **Step 2: Commit Fase 2**

```bash
git add server.js public/summaries.html data/lm/u1.resumen.json
git commit -m "feat: summary renderer + backend + pilot lm/u1"
```

- [ ] **Step 3: STOP — pilot review**

**⛔ STOP. Do not proceed to Fase 3.**

Show the pilot to the user:
- Start server: `npm run dev`
- Open `http://localhost:3000/summaries.html`
- Navigate to lm → Unidad 1

Ask for explicit approval before continuing to Fase 3.

---

## FASE 3 — Resto de unidades

*(Start only after explicit approval from pilot review)*

Tasks 10–13 run in **parallel** — one agent per subject. Each agent reads its PDFs and writes its JSON files independently.

---

### Task 10: `agente-lm` — `data/lm/u0.resumen.json` + `data/lm/u2.resumen.json`

**Files:**
- Create: `data/lm/u0.resumen.json`
- Create: `data/lm/u2.resumen.json`

**Interfaces:**
- Consumes PDFs from `C:\Users\BryDev\OneDrive\Desktop\DAW\Bloque 2\lm\`
  - U0: `U0 Introducción a los lenguajes de marcas.pdf` (ignore `(práctica).pdf`)
  - U2: PDF principal + `U2 Síntesis (6).pdf` + `Diapositivas del directo lunes 28….pdf`

**Schema:** same as Task 7 — `{ subject, unit, title, intro, objectives, sections, glossary, quiz }`

Content guidelines:
- `unit: 0` and `unit: 2` (integers, not strings)
- 6–10 quiz items per file
- Ignorar: `.docx`, `Temporalización PDFs`
- ⚠ mark any unclear content with `"⚠ Ojo: …"` in a `text` block
- Minimum: one `text` intro per section, at least 4 block types across the unit

- [ ] **Step 1: Read PDFs and extract content for U0**

Read each source PDF fully.  
Identify: title, key concepts, classification, key terms (for glossary), and question-worthy facts.

- [ ] **Step 2: Create `data/lm/u0.resumen.json`**

Structure:
- `"subject": "lm"`, `"unit": 0`
- 3–5 sections covering the U0 content
- At minimum: cards, timeline (if evolutionary content), flipcards or accordion
- `glossary`: 6+ terms
- `quiz`: 6–8 items

- [ ] **Step 3: Read PDFs and extract content for U2**

Read all 3 U2 PDF sources. Note: U2 synthesis + diapositivas may overlap — merge without duplication.

- [ ] **Step 4: Create `data/lm/u2.resumen.json`**

Structure:
- `"subject": "lm"`, `"unit": 2`
- Include at least one `code` block (XML/DTD/Schema example)
- Include `table` if there are comparison items (e.g., DTD vs Schema)
- `quiz`: 6–10 items

- [ ] **Step 5: Validate both files**

```bash
node -e "
  const u0 = require('./data/lm/u0.resumen.json');
  const u2 = require('./data/lm/u2.resumen.json');
  console.log('u0: unit='+u0.unit+' sections='+u0.sections.length+' quiz='+u0.quiz.length);
  console.log('u2: unit='+u2.unit+' sections='+u2.sections.length+' quiz='+u2.quiz.length);
"
```

Expected: both unit values are integers, sections ≥ 3, quiz ≥ 6 for each.

---

### Task 11: `agente-prog` — `data/prog/u{0,1,2}.resumen.json`

**Files:**
- Create: `data/prog/u0.resumen.json`
- Create: `data/prog/u1.resumen.json`
- Create: `data/prog/u2.resumen.json`

**Interfaces:**
- Consumes PDFs from `C:\Users\BryDev\OneDrive\Desktop\DAW\Bloque 2\prog\`
  - U0: PDF principal (ignore duplicate `(1)` if byte-for-byte identical)
  - U1: PDF principal + `RESUMEN` PDF + `U1 Diagrama de flujo.pdf` (read BOTH the main PDF and its `(1)` duplicate — different sizes mean different content; merge both into the JSON)
  - U2: PDF principal + `RESUMEN` PDF (read BOTH main and `(1)` duplicate for U2 as well; merge)

Important for U1 and U2 duplicates:
- Open BOTH files
- If content differs, merge the additional content into the JSON
- If there is a contradiction, note it in a `text` block as `"⚠ Ojo: Las dos versiones del PDF difieren en …"`

Content guidelines for prog:
- U0: pseudocode, data types, variables, operators — use `code` blocks with pseudocode examples
- U1: flowcharts (describe in text/cards since images can't be in JSON), sequence/selection/iteration — use `accordion` for structure types
- U2: arrays, functions, recursion — use `table` for comparisons, `code` for examples

- [ ] **Step 1: Read all U0 PDFs → create `u0.resumen.json`**

- [ ] **Step 2: Read all U1 PDFs (both copies) → merge → create `u1.resumen.json`**

- [ ] **Step 3: Read all U2 PDFs (both copies) → merge → create `u2.resumen.json`**

- [ ] **Step 4: Validate all three files**

```bash
node -e "
  ['u0','u1','u2'].forEach(u => {
    const d = require('./data/prog/'+u+'.resumen.json');
    console.log('prog/'+u+': unit='+d.unit+' sections='+d.sections.length+' quiz='+d.quiz.length);
  });
"
```

---

### Task 12: `agente-ip` — `data/ip/u{1,2}.resumen.json`

**Files:**
- Create: `data/ip/u1.resumen.json`
- Create: `data/ip/u2.resumen.json`

**Interfaces:**
- Consumes PDFs from `C:\Users\BryDev\OneDrive\Desktop\DAW\Bloque 2\ip\`
  - U1: `U1 Living in the Present.pdf` + `Summary U1….pdf` + `Present Simple.pdf` + `U1 Adverbs of frequency.pdf` + `Verb To Be….pdf` + `Verb Have got….pdf` + `U1 RESUMEN Present Simple….pdf` + `U1 Vocabulary Living in the Present.pdf`
  - U2: `U2 What do you like.pdf` + `Summary U2….pdf` + grammar PDFs for U2 (`Like and dislike verbs`, `Prepositions of time`, `Pronouns and Possessive forms`, `There is and there are`, `Connectors`, `WH-Question`) + `U2 Prepositions of time.pdf` + `U2 Vocabulary….pdf`

Content guidelines for ip:
- Grammar rules explained in **Spanish** (it's a DAW course, not an English course)
- Vocabulary lists, example sentences, and grammar examples are in **English**
- Use `table` blocks for conjugation tables (subject, form)
- Use `flipcards` for vocabulary: English term → Spanish translation or definition
- Use `accordion` for grammar rules with examples
- Use `chips` for vocabulary groupings (family of words, collocations)
- Ignore: `Grammar exercises Answer key`, `How to write an essay…docx`

- [ ] **Step 1: Read all U1 PDFs → create `u1.resumen.json`**

- [ ] **Step 2: Read all U2 PDFs → create `u2.resumen.json`**

- [ ] **Step 3: Validate both files**

```bash
node -e "
  ['u1','u2'].forEach(u => {
    const d = require('./data/ip/'+u+'.resumen.json');
    console.log('ip/'+u+': unit='+d.unit+' sections='+d.sections.length+' quiz='+d.quiz.length);
  });
"
```

---

### Task 13: `agente-ipe` — `data/ipe/u{1,2}.resumen.json`

**Files:**
- Create: `data/ipe/u1.resumen.json`
- Create: `data/ipe/u2.resumen.json`

**Interfaces:**
- Consumes PDFs from `C:\Users\BryDev\OneDrive\Desktop\DAW\Bloque 2\ipe\`
  - U1: `U1 Economía y administración nociones básicas.pdf` + `U1 Síntesis….pdf` + `U1 DIAPOSITIVAS….pdf` + `Infografía - U1 Personas jurídicas.pdf`
  - U2: `U2 El sistema fiscal.pdf` + `U2 Síntesis….pdf` + `U2 DIAPOSITIVAS….pdf` + `Resumen_IRPF. Preguntas más comunes.pdf`

Content guidelines for ipe:
- Economic and administrative concepts → `cards` + `accordion`
- Tax structures, types, percentages → `table` blocks
- Key terms (PIB, IRPF, IVA, etc.) → `flipcards` (term → definition) or `glossary`
- Ignore: `MSTeamsSetup.exe`, `pseint-w64-*`

- [ ] **Step 1: Read all U1 PDFs → create `u1.resumen.json`**

- [ ] **Step 2: Read all U2 PDFs → create `u2.resumen.json`**

- [ ] **Step 3: Validate both files**

```bash
node -e "
  ['u1','u2'].forEach(u => {
    const d = require('./data/ipe/'+u+'.resumen.json');
    console.log('ipe/'+u+': unit='+d.unit+' sections='+d.sections.length+' quiz='+d.quiz.length);
  });
"
```

---

### Task 14: Fase 3 commit

**Files:**
- No new files — commit of all 9 JSON files created in Tasks 10–13

- [ ] **Step 1: Verify all 9 JSON files exist and parse cleanly**

```bash
node -e "
  const files = [
    'data/lm/u0.resumen.json', 'data/lm/u2.resumen.json',
    'data/prog/u0.resumen.json', 'data/prog/u1.resumen.json', 'data/prog/u2.resumen.json',
    'data/ip/u1.resumen.json', 'data/ip/u2.resumen.json',
    'data/ipe/u1.resumen.json', 'data/ipe/u2.resumen.json',
  ];
  files.forEach(f => {
    const d = require('./'+f);
    console.log(f+': sections='+d.sections.length+' quiz='+d.quiz.length);
  });
"
```

Expected: all 9 files parse, sections ≥ 3, quiz ≥ 6 each.

- [ ] **Step 2: Verify viewer shows all subjects**

Open: `http://localhost:3000/summaries.html`

Expected: lm, prog, ip, ipe all appear as subject cards (they all now have summaryUnits > 0).  
Click a few and verify units appear correctly.

- [ ] **Step 3: Commit Fase 3**

```bash
git add data/lm/u0.resumen.json data/lm/u2.resumen.json \
        data/prog/u0.resumen.json data/prog/u1.resumen.json data/prog/u2.resumen.json \
        data/ip/u1.resumen.json data/ip/u2.resumen.json \
        data/ipe/u1.resumen.json data/ipe/u2.resumen.json
git commit -m "feat: resúmenes todas las unidades"
```

---

## FASE 4 — Revisión y preparación de despliegue

---

### Task 15: Accessibility audit

**Files:**
- Modify: `public/summaries.html` (fix any issues found)
- Modify: `public/index.html` (fix any issues found)

**Interfaces:**
- Consumes: running server at `localhost:3000`
- Produces: all interactive elements keyboard-accessible, all informative text at WCAG AA

Dispatch the `Accessibility Auditor` agent with instructions to check:
1. All interactive elements have `tabindex` or are natively focusable
2. `:focus-visible` ring is visible on all interactive elements
3. `--text-subtle` is only used for decorative text (never informative)
4. Color-only information never used (quiz correct/wrong also has ✓/✗ text)
5. `aria-label` on icon-only buttons
6. `role="button"` and keyboard handlers on non-button interactive elements (cards)
7. All images/icons are decorative (emoji) — no `alt` needed, confirmed

- [ ] **Step 1: Run Accessibility Auditor**

Dispatch agent: `Accessibility Auditor` targeting `public/summaries.html` and `public/index.html`.

Check specifically:
- Landing screen cards: `tabindex="0"` ✓ (Task 3 added these) — also add `Enter`/`Space` key handlers
- Summary nav items: `<button>` elements ✓ (natively focusable)
- Accordion headers: `<button>` ✓
- Flipcards: `tabindex="0"` + `role="button"` ✓ (Task 8 added) — verify `Enter`/`Space` work via `bindEvents`
- Quiz options: `data-action="select-answer"` on `<div>` — ADD `tabindex="0"` and `role="radio"` to each option
- "Comprobar respuestas" / "Reintentar" / "Hacer el test": `<button>` and `<a>` — ✓

Fix any issues found inline.

- [ ] **Step 2: Verify contrast**

Confirm these do NOT use `--text-subtle` for informative text:
- Question text in quiz: uses `--text` ✓
- Explanation text: uses `--text-muted` ✓ (5.2:1 on `--bg`)
- Card meta descriptions: uses `--text-muted` ✓
- Error messages: use `--error` ✓ (6.06:1)

---

### Task 16: API endpoint tests

**Files:**
- No file changes — test only

- [ ] **Step 1: Test all summary endpoints**

With server running (`npm run dev`):

```bash
# All subjects have summaryUnits populated
curl -s http://localhost:3000/api/subjects | node -e "
  const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));
  d.forEach(s=>console.log(s.name, s.summaryUnits));
"

# All 10 summary files accessible
for subj_unit in lm/0 lm/1 lm/2 prog/0 prog/1 prog/2 ip/1 ip/2 ipe/1 ipe/2; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/summary/${subj_unit/\//\/}")
  echo "$subj_unit: $code"
done
```

Expected: all 10 return HTTP 200.

```bash
# Security: path traversal returns 400
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/summary/../server/1"
# Expected: 400

# Non-existent unit returns 404
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/summary/lm/99"
# Expected: 404
```

- [ ] **Step 2: Test existing question endpoints still work**

```bash
curl -s http://localhost:3000/api/questions/lm/u1.txt | node -e "
  const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));
  console.log('lm/u1.txt questions:', d.length);
"
```

Expected: same count as before Fase 2 changes.

---

### Task 17: Update `CLAUDE.md` and `README.md`

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Produces: accurate documentation of new endpoints, file formats, and both HTML files

- [ ] **Step 1: Update CLAUDE.md**

Add to the **API endpoints** table:
```
| `GET /api/summary/:subject/:unit` | JSON summary for a unit (`data/<s>/u<N>.resumen.json`) |
```

Add a **Resúmenes Interactivos** section after the existing architecture section:

```markdown
### Resúmenes (`public/summaries.html`)

Standalone SPA. Same vanilla JS + event delegation pattern as `index.html`.

- **State**: single `state` object; `render()` swaps `#app` only on screen change
- **Partial updates**: accordion/flipcard toggle CSS classes in-place; glossary re-renders only `#glossary-list`
- **XSS**: all JSON text passes through `esc()` before `innerHTML`
- **Screen flow**: subjects → units → summary viewer (sidebar nav + section blocks)

**Summary JSON**: `data/<asig>/u<N>.resumen.json`
- 8 block types: `text`, `cards`, `accordion`, `timeline`, `flipcards`, `chips`, `table`, `code`
- `quiz`: 6–10 items with `correct` (0-based index), optional `explanation`
- `glossary`, `objectives`: required arrays (can be `[]`)
- `unit`: integer (not string) — "Unidad 0" works without special case

**Deep-link from summaries to test**: quiz footer links to `index.html?subject=<asig>&unit=<N>`
```

- [ ] **Step 2: Commit CLAUDE.md**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for summaries feature"
```

---

### Task 18: Fase 4 commit + STOP before push

**Files:**
- No new files — final verification and STOP

- [ ] **Step 1: Full regression test**

Run: `npm run dev`

Verify ALL criteria from spec section 11:
- [ ] `npm run dev` starts without errors
- [ ] All test modes (por unidad, conjunto, simulacro, histórico) work as before
- [ ] `summaries.html` renders all 8 block types without console errors
- [ ] Quiz shows ✓/✗ per question with explanation; success/error colors distinct from accent
- [ ] "Hacer el test" launches correct exam from quiz footer
- [ ] `unit: 0` displays as "Unidad 0" (no special case in code)
- [ ] Keyboard navigation: all interactive elements focusable, Enter/Space work
- [ ] No `--text-subtle` on informative text

- [ ] **Step 2: Commit Fase 4**

```bash
git add public/index.html public/summaries.html CLAUDE.md
git commit -m "fix: revisión accesibilidad y docs"
```

- [ ] **Step 3: Generate final report**

Output a summary including:
- 10 units generated: lm/u0, lm/u1, lm/u2, prog/u0, prog/u1, prog/u2, ip/u1, ip/u2, ipe/u1, ipe/u2
- Any ⚠ notes found in the JSON content
- Any content gaps (sections omitted due to unclear PDFs)
- Vercel config status: confirm `vercel.json` exists and is unchanged

- [ ] **Step 4: STOP — pre-push audit**

**⛔ STOP. Do NOT push or deploy.**

Notify the user:
```
Fase 4 completa. Todos los cambios están commiteados localmente.
El servidor funciona en http://localhost:3000

Para el despliegue, ejecuta la auditoría externa y confirma con:
  git push
  vercel --prod
```

Wait for explicit user approval before any `git push` or `vercel` command.

---

## Spec Coverage Self-Review

| Spec Requirement | Task |
|---|---|
| `public/style.css` with dark tokens | Task 1 |
| `index.html` restyle — replace `:root`, link style.css | Task 2 |
| Landing screen with two section cards | Task 3 |
| `loadLanding()` + breadcrumb updates | Task 3 |
| Deep-link `?subject=&unit=` | Task 4 |
| `getSummaryUnits()` + `summaryUnits` field | Task 5 |
| `GET /api/summary/:subject/:unit` | Task 5 |
| `summaries.html` state + render + bindEvents | Task 6 |
| `esc()` on all JSON text | Tasks 6, 8 |
| All 8 block types rendered | Task 8 |
| Accordion/flipcard partial DOM update | Tasks 6, 8 |
| Glossary search partial re-render | Task 8 |
| Quiz with ✓/✗ + explanation + retry + test link | Task 8 |
| Mobile nav collapse at 640px | Task 8 |
| `data/lm/u1.resumen.json` pilot | Task 7 |
| 9 remaining JSON files | Tasks 10–13 |
| WCAG AA + keyboard focus | Task 15 |
| API + security tests | Task 16 |
| CLAUDE.md updated | Task 17 |
| STOP at Fase 2 (pilot) | Task 9 |
| STOP at Fase 4 (pre-push) | Task 18 |
