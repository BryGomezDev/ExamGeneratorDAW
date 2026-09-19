const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ── Parser ─────────────────────────────────────────────────────────────────

function isNewFormat(content) {
  return /^PREGUNTA:/m.test(content);
}

function parseQuestionsNew(content) {
  const questions = [];
  const raw = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = raw.split(/\n(?=PREGUNTA:)/);

  for (const block of blocks) {
    const lines = block.split('\n');
    const fields = {};
    let currentKey = null;

    for (const line of lines) {
      const m = line.match(/^(PREGUNTA|A|B|C|D|RESPUESTA|EXPLICACION):\s*(.*)/);
      if (m) {
        currentKey = m[1];
        fields[currentKey] = m[2].trim();
      } else if (currentKey && line.trim()) {
        fields[currentKey] += ' ' + line.trim();
      }
    }

    if (!fields.PREGUNTA || !fields.A || !fields.RESPUESTA) continue;

    const opts = ['A', 'B', 'C', 'D'].map(k => fields[k] || null).filter(Boolean);
    const respLetter = fields.RESPUESTA.trim().toUpperCase();
    const correctIdx = ['A', 'B', 'C', 'D'].indexOf(respLetter);

    questions.push({
      question: fields.PREGUNTA,
      options: opts,
      correct: correctIdx === -1 ? 0 : correctIdx,
      explanation: fields.EXPLICACION || null,
    });
  }

  return questions;
}

function parseQuestions(content) {
  const raw = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = raw.split('\n').map(l => l.trim());
  const questions = [];

  // Find all "Pregunta NRespuesta" anchors
  const anchors = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^Pregunta \d+Respuesta$/.test(lines[i])) {
      anchors.push(i);
    }
  }

  const SKIP = /^(Calificación|Correcta|Incorrecta|Marcar pregunta|Enunciado de la pregunta|Retroalimentación)$/;
  const SCORE = /^Se puntúa/;
  const PREV_CORRECT = /^La respuesta correcta es:/;
  const PREGUNTA_HDR = /^Pregunta \d+$/;
  const PURE_NUM = /^\d+$/;

  for (let qi = 0; qi < anchors.length; qi++) {
    const respIdx = anchors[qi];
    const prevRespIdx = qi > 0 ? anchors[qi - 1] : -1;

    // ── Extract question text ───────────────────────────────────────────
    let questionText = '';
    let enunciadoIdx = -1;

    for (let j = prevRespIdx + 1; j < respIdx; j++) {
      if (lines[j] === 'Enunciado de la pregunta') enunciadoIdx = j;
    }

    if (enunciadoIdx !== -1) {
      const textLines = [];
      for (let j = enunciadoIdx + 1; j < respIdx; j++) {
        const l = lines[j];
        if (l && !PURE_NUM.test(l)) textLines.push(l);
      }
      questionText = textLines.join(' ').trim();
    } else {
      const textLines = [];
      const start = prevRespIdx !== -1 ? prevRespIdx + 1 : 0;
      for (let j = start; j < respIdx; j++) {
        const l = lines[j];
        if (!l) continue;
        if (SKIP.test(l) || SCORE.test(l) || PREV_CORRECT.test(l) || PREGUNTA_HDR.test(l) || PURE_NUM.test(l)) continue;
        textLines.push(l);
      }
      questionText = textLines.join(' ').trim();
    }

    // ── Extract options A–D and correct answer ──────────────────────────
    const options = [];
    let curLabel = null;
    let curLines = [];
    let correctText = '';

    for (let j = respIdx + 1; j < lines.length; j++) {
      const l = lines[j];

      if (/^[A-D]\.$/.test(l)) {
        if (curLabel !== null) {
          options.push({ label: curLabel, text: curLines.join(' ').trim() });
        }
        curLabel = l[0];
        curLines = [];
      } else if (l === 'Retroalimentación') {
        if (curLabel !== null) {
          options.push({ label: curLabel, text: curLines.join(' ').trim() });
          curLabel = null; curLines = [];
        }
        if (j + 1 < lines.length && PREV_CORRECT.test(lines[j + 1])) {
          correctText = lines[j + 1].replace(/^La respuesta correcta es:\s*/, '').trim();
        }
        break;
      } else if (l && curLabel !== null) {
        curLines.push(l);
      }
    }

    if (!questionText || options.length < 2) continue;

    // Match correct answer to option index
    let correctIdx = options.findIndex(o => o.text === correctText);
    if (correctIdx === -1) {
      // Fuzzy: find option whose text is contained in correctText or vice-versa
      correctIdx = options.findIndex(o =>
        correctText.includes(o.text) || o.text.includes(correctText)
      );
    }
    if (correctIdx === -1) correctIdx = 0;

    questions.push({
      question: questionText,
      options: options.map(o => o.text),
      correct: correctIdx,
      explanation: null,
    });
  }

  return questions;
}

// ── Subject / file discovery ───────────────────────────────────────────────

function getSubjects() {
  return fs.readdirSync(DATA_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name);
}

function getSubjectFiles(subject) {
  const dir = path.join(DATA_DIR, subject);
  const files = fs.readdirSync(dir);
  const units = files
    .filter(f => /^u\d+\.txt$/i.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0]);
      const nb = parseInt(b.match(/\d+/)[0]);
      return na - nb;
    });
  const hasPs = files.some(f => f.toLowerCase() === 'ps.txt');
  return { units, hasPs };
}

function loadQuestions(subject, filename) {
  const filePath = path.join(DATA_DIR, subject, filename);
  console.log('[path]', path.resolve(filePath));

  let content = fs.readFileSync(filePath, 'utf-8');
  console.log('[raw]', JSON.stringify(content.slice(0, 300)));
  console.log('[raw] isNewFormat=' + isNewFormat(content));

  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1); // strip BOM
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');    // normalize line endings

  console.log('[fixed] isNewFormat=' + isNewFormat(content));

  const useNew = isNewFormat(content);
  const questions = useNew ? parseQuestionsNew(content) : parseQuestions(content);
  console.log('[loadQuestions] ' + subject + '/' + filename + ': parser=' + (useNew ? 'new' : 'moodle') + ', questions=' + questions.length);
  return questions;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deduplicateByQuestion(questions) {
  const seen = new Set();
  return questions.filter(q => {
    if (!q || !q.question) return false;
    const key = q.question.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── API endpoints ──────────────────────────────────────────────────────────

app.get('/api/subjects', (req, res) => {
  try {
    const subjects = getSubjects()
      .map(name => {
        const { units, hasPs } = getSubjectFiles(name);
        return { name, units, hasPs };
      })
      .filter(s => s.units.length > 0 || s.hasPs);
    res.json(subjects);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/questions/:subject/:file', (req, res) => {
  try {
    const { subject, file } = req.params;
    // Sanitize: only allow alphanumeric, dots, underscores
    if (!/^[\w.]+$/.test(subject) || !/^[\w.]+$/.test(file)) {
      return res.status(400).json({ error: 'Invalid path' });
    }
    const questions = loadQuestions(subject, file);
    res.json(questions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Questions for "mixed" mode: all units combined, deduplicated
app.get('/api/questions/:subject', (req, res) => {
  try {
    const { subject } = req.params;
    if (!/^[\w.]+$/.test(subject)) return res.status(400).json({ error: 'Invalid path' });
    const { units } = getSubjectFiles(subject);
    let all = [];
    for (const u of units) {
      all = all.concat(loadQuestions(subject, u));
    }
    res.json(deduplicateByQuestion(all));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Final exam: 25 from ps.txt + 15 from units, cross-deduplicated
app.get('/api/final/:subject', (req, res) => {
  try {
    const { subject } = req.params;
    if (!/^[\w.]+$/.test(subject)) return res.status(400).json({ error: 'Invalid path' });

    const { units, hasPs } = getSubjectFiles(subject);
    if (!hasPs) return res.status(400).json({ error: 'No ps.txt found for this subject' });

    const psPool = deduplicateByQuestion(loadQuestions(subject, 'ps.txt'));
    console.log(`[/api/final/${subject}] psPool: ${psPool.length} questions`);

    let unitRaw = [];
    for (const u of units) unitRaw = unitRaw.concat(loadQuestions(subject, u));
    const unitPool = deduplicateByQuestion(unitRaw);
    console.log(`[/api/final/${subject}] unitPool: ${unitPool.length} questions`);

    const psPick = shuffle(psPool).slice(0, 25);

    const psKeys = new Set(
      psPick.map(q => q.question.toLowerCase().replace(/\s+/g, ' ').trim())
    );
    const unitFiltered = unitPool.filter(
      q => q.question && !psKeys.has(q.question.toLowerCase().replace(/\s+/g, ' ').trim())
    );
    const unitPick = shuffle(unitFiltered).slice(0, 15);
    console.log(`[/api/final/${subject}] psPick=${psPick.length} unitPick=${unitPick.length}`);

    res.json(shuffle([...psPick, ...unitPick]));
  } catch (e) {
    console.error(`[/api/final] Error:`, e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Generador de Exámenes → http://localhost:${PORT}`);
});
