# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Generador de Exámenes DAW** is a web-based exam simulator for Spain's "Grado Superior en Desarrollo de Aplicaciones Web" (DAW). Students practice across multiple subjects by selecting a subject/mode; the backend reads `.txt` question files from disk in real-time—no restart needed when adding new content.

## Commands

```bash
# Install dependencies (only Express.js)
npm install

# Development (logs in terminal)
npm run dev

# Production via pm2
npm start
pm2 restart examenes-daw   # after code changes
pm2 logs examenes-daw
pm2 stop examenes-daw
```

Access at **http://localhost:3000**. No build step—runs directly on Node.js.

## Architecture

### Backend (`server.js`)

Express server (~300 lines). Auto-discovers subject directories (`si/`, `prog/`, `ip/`, `lm/`, `ipe/`, etc.)—adding a new folder like `ed/` is enough to add a subject. Key logic:

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
