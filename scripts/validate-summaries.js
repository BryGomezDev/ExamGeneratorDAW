#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const BLOCK_TYPES = new Set(['text','cards','accordion','timeline','flipcards','chips','table','code']);
const MD_RE = /\*\*|__/;

let errors = 0;

function fail(file, msg) {
  console.error(`  FAIL [${file}] ${msg}`);
  errors++;
}

function checkText(file, loc, val) {
  if (typeof val === 'string' && MD_RE.test(val))
    fail(file, `Markdown en "${loc}": ${val.substring(0,60)}`);
}

function deepCheckText(file, loc, obj) {
  if (typeof obj === 'string') { checkText(file, loc, obj); return; }
  if (Array.isArray(obj)) { obj.forEach((v,i) => deepCheckText(file, `${loc}[${i}]`, v)); return; }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) deepCheckText(file, `${loc}.${k}`, v);
  }
}

function req(file, loc, obj, ...fields) {
  for (const f of fields)
    if (obj[f] === undefined || obj[f] === null || obj[f] === '')
      fail(file, `${loc}.${f} requerido`);
}

function checkBlock(file, loc, b) {
  if (!BLOCK_TYPES.has(b.type)) { fail(file, `${loc}.type desconocido: ${b.type}`); return; }
  deepCheckText(file, loc, b);
  switch (b.type) {
    case 'text':
    case 'code':
      if (!b.content) fail(file, `${loc}.content requerido`);
      break;
    case 'cards':
      if (!Array.isArray(b.items)||b.items.length===0) { fail(file, `${loc}.items vacío`); break; }
      b.items.forEach((it,i) => { if (!it.title) fail(file, `${loc}.items[${i}].title requerido`); });
      break;
    case 'accordion':
      if (!Array.isArray(b.items)||b.items.length===0) { fail(file, `${loc}.items vacío`); break; }
      b.items.forEach((it,i) => {
        if (!it.title) fail(file, `${loc}.items[${i}].title requerido`);
        if (!it.content) fail(file, `${loc}.items[${i}].content requerido`);
      });
      break;
    case 'timeline':
      if (!Array.isArray(b.items)||b.items.length===0) { fail(file, `${loc}.items vacío`); break; }
      b.items.forEach((it,i) => {
        if (!it.year) fail(file, `${loc}.items[${i}].year requerido`);
        if (!it.label) fail(file, `${loc}.items[${i}].label requerido`);
      });
      break;
    case 'flipcards':
      if (!Array.isArray(b.items)||b.items.length===0) { fail(file, `${loc}.items vacío`); break; }
      b.items.forEach((it,i) => {
        if (!it.term) fail(file, `${loc}.items[${i}].term requerido`);
        if (!it.def)  fail(file, `${loc}.items[${i}].def requerido`);
      });
      break;
    case 'chips':
      if (!Array.isArray(b.items)||b.items.length===0) fail(file, `${loc}.items vacío`);
      break;
    case 'table':
      if (!Array.isArray(b.headers)||b.headers.length===0) fail(file, `${loc}.headers requerido`);
      if (!Array.isArray(b.rows)||b.rows.length===0) fail(file, `${loc}.rows requerido`);
      break;
  }
}

function validate(file) {
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch(e) { fail(file, `No se pudo leer: ${e.message}`); return; }
  let j;
  try { j = JSON.parse(raw); } catch(e) { fail(file, `JSON inválido: ${e.message}`); return; }

  const f = path.relative(process.cwd(), file);

  // Top-level required
  if (!j.subject) fail(f, 'subject requerido');
  if (j.unit === undefined || j.unit === null || typeof j.unit !== 'number') fail(f, 'unit debe ser número');
  if (!j.title) fail(f, 'title requerido');
  if (!j.intro) fail(f, 'intro requerido');
  if (!j.objectives) fail(f, 'objectives requerido');

  deepCheckText(f, 'root', { title: j.title, intro: j.intro });

  // Sections
  if (!Array.isArray(j.sections)||j.sections.length===0) { fail(f, 'sections vacío'); }
  else j.sections.forEach((s,si) => {
    const loc = `sections[${si}]`;
    req(f, loc, s, 'id', 'label', 'short');
    if (s.short && s.short.length > 25) fail(f, `${loc}.short demasiado largo: ${s.short.length} chars`);
    if (!Array.isArray(s.blocks)||s.blocks.length===0) fail(f, `${loc}.blocks vacío`);
    else s.blocks.forEach((b,bi) => checkBlock(f, `${loc}.blocks[${bi}]`, b));
  });

  // Glossary
  if (!Array.isArray(j.glossary)||j.glossary.length===0) fail(f, 'glossary vacío');
  else j.glossary.forEach((g,gi) => {
    if (!g.term) fail(f, `glossary[${gi}].term requerido`);
    if (!g.def)  fail(f, `glossary[${gi}].def requerido`);
    deepCheckText(f, `glossary[${gi}]`, g);
  });

  // Quiz
  if (!Array.isArray(j.quiz)) { fail(f, 'quiz requerido'); return; }
  if (j.quiz.length < 6 || j.quiz.length > 10) fail(f, `quiz debe tener 6-10 preguntas, tiene ${j.quiz.length}`);
  j.quiz.forEach((q,qi) => {
    const loc = `quiz[${qi}]`;
    if (!q.question) fail(f, `${loc}.question requerido`);
    if (!Array.isArray(q.options)||q.options.length===0) fail(f, `${loc}.options requerido`);
    if (q.correct === undefined || q.correct === null) fail(f, `${loc}.correct requerido`);
    else if (q.correct < 0 || q.correct >= (q.options||[]).length)
      fail(f, `${loc}.correct=${q.correct} fuera de rango (${(q.options||[]).length} opciones)`);
    if (!q.explanation) fail(f, `${loc}.explanation requerido`);
    deepCheckText(f, loc, q);
  });
}

// Discover all resumen JSONs
const dataDir = path.join(__dirname, '..', 'data');
const files = fs.readdirSync(dataDir).flatMap(subject => {
  const subDir = path.join(dataDir, subject);
  if (!fs.statSync(subDir).isDirectory()) return [];
  return fs.readdirSync(subDir)
    .filter(f => /^u\d+\.resumen\.json$/.test(f))
    .map(f => path.join(subDir, f));
}).sort();

console.log(`Validando ${files.length} archivos...\n`);
files.forEach(f => {
  const rel = path.relative(process.cwd(), f);
  process.stdout.write(`  ${rel} ... `);
  const before = errors;
  validate(f);
  console.log(errors === before ? 'OK' : '');
});

console.log(`\n${errors === 0 ? '✓ Todo correcto.' : `✗ ${errors} error(es) encontrado(s).`}`);
process.exit(errors > 0 ? 1 : 0);
