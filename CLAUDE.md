# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Generador de Exámenes DAW** is a web-based exam simulator for Spain's "Grado Superior en Desarrollo de Aplicaciones Web" (DAW). Students practice across multiple subjects by selecting a subject/mode; the backend reads `.txt` question files from disk in real-time—no restart needed when adding new content.

## Commands

```bash
# Install dependencies (only Express.js)
npm install

# Development (logs in terminal) — identical to npm start, no hot-reload
npm run dev

# Production via pm2
pm2 start server.js --name examenes-daw   # first time only
pm2 restart examenes-daw                  # after code changes
pm2 logs examenes-daw
pm2 stop examenes-daw

# Data validation & QA
npm run validate    # validates all data/*/u*.resumen.json files
npm run qa          # Playwright click-through QA of all resumen units
```

Access at **http://localhost:3000**. No build step—runs directly on Node.js.

Both `npm run dev` and `npm start` execute `node server.js`; code changes always require a manual restart.

## Deployment

`vercel.json` is configured — `vercel deploy` works out of the box (routes everything through `server.js`).

## Architecture

### Backend (`server.js`)

Express server (~300 lines). Auto-discovers subject directories inside `data/` (`data/si/`, `data/prog/`, `data/ip/`, `data/lm/`, `data/ipe/`, etc.)—adding a new folder like `data/ed/` is enough to add a subject. Key logic:

- **`isNewFormat(content)`** — detects `PREGUNTA:` vs Moodle format
- **`parseQuestionsNew()`** — parses the preferred `PREGUNTA:` format
- **`parseQuestions()`** — parses legacy Moodle export format (anchor-based)
- **`deduplicateByQuestion()`** — normalizes question text to remove duplicates

**API endpoints:**
| Endpoint | Purpose |
|---|---|
| `GET /api/subjects` | List subjects with unit counts |
| `GET /api/questions/:subject/:file` | Single unit (e.g., `si/u1.txt`) |
| `GET /api/questions/:subject` | All units combined + deduplicated |
| `GET /api/final/:subject` | 25 from `ps.txt` + 15 from units |

### Frontend (`public/index.html`)

Single file (~1,650 lines) with no framework. Contains all HTML, CSS, and JS.

- **6 screens:** home → mode-selection → exam → results → review → history
- **State object:** tracks current subject, mode, questions, answers, penalty mode
- **LocalStorage:** persists exam history (timestamps, scores)
- **Responsive:** single-column layout at 600px breakpoint

### Frontend (`public/summaries.html`)

Resúmenes Interactivos viewer (~906 lines). Single file, no framework.

- **3 screens:** subjects → units → visor
- **Key functions:** `renderSummary()`, `renderBlock()`, `renderQuizSection()`, `loadSummary()`
- **Block types:** `text`, `cards`, `accordion`, `timeline`, `flipcards`, `chips`, `table`, `code`
- Reads `data/<subject>/u<N>.resumen.json` via the same Express server

## Resumen JSON Schema

Files live at `data/<subject>/u<N>.resumen.json`.

```json
{
  "subject": "lm",
  "unit": 1,
  "title": "Full unit title",
  "intro": "Introductory paragraph (no Markdown)",
  "objectives": ["string", "…"],
  "sections": [
    {
      "id": "s1",
      "label": "Full section title (matches PDF index)",
      "short": "Nav label, max 25 chars",
      "blocks": [ /* Block[] — see types below */ ]
    }
  ],
  "glossary": [{ "term": "string", "def": "string" }],
  "quiz": [
    {
      "question": "string",
      "options": ["string", "…"],
      "correct": 0,
      "explanation": "string"
    }
  ],
  "_sources": { "s1": "PDF page reference" }
}
```

**Block types** (all have `"type"` discriminator):

| Type | Required fields |
|------|----------------|
| `text` | `content` (string) |
| `cards` | `items[]` — each `{title, kicker?, desc?, example?}` |
| `accordion` | `items[]` — each `{title, content}` |
| `timeline` | `items[]` — each `{year, label, detail?}` |
| `flipcards` | `items[]` — each `{term, def}` |
| `chips` | `items[]` (string array) |
| `table` | `headers[]`, `rows[][]` |
| `code` | `content` (string) |

`quiz` must contain 6–10 items. `correct` is a 0-based index into `options`.

## How to add a resumen unit

1. Create `data/<subject>/u<N>.resumen.json` following the schema above.
2. Run `npm run validate` — fix any reported errors before continuing.
3. Restart the server (`pm2 restart examenes-daw` or `npm run dev`).
4. Open `http://localhost:3000/summaries.html` and verify the unit appears.
5. Run `npm run qa` to confirm no console errors, undefined values, or NaN.

## Question File Format

**Preferred format (PREGUNTA:):**
```
PREGUNTA: Question text?
A: Option A
B: Option B
C: Option C
D: Option D
RESPUESTA: B
EXPLICACION: Optional explanation
```

**Legacy Moodle format** is auto-detected and still supported.

**File naming convention:**
- `u1.txt`, `u2.txt`, … — unit files (sorted numerically)
- `ps.txt` — optional prueba semestral (enables final exam mode)

## Exam Modes & Scoring

**Mode 1 — Por unidad:** all questions from a single file, shuffled  
**Mode 2 — Examen conjunto:** all units combined, deduplicated, penalty scoring  
**Mode 3 — Simulacro final:** 25 from `ps.txt` + 15 from units (requires `ps.txt`)

**Penalty mode** (mixed/final exams): correct +0.25, wrong −0.25/3, blank 0; scaled to 10  
**No-penalty mode** (single unit files): correct/total × 10
