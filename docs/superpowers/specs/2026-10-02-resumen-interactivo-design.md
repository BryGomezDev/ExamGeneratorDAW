# Spec: Resúmenes Interactivos + Restyle Dark Theme

**Fecha:** 2026-10-02  
**Repo:** Generador de Exámenes DAW  
**Estado:** Aprobado — listo para writing-plans

---

## 1. Objetivo

Reorganizar la app en dos secciones desde la home:

1. **Pruebas Test** — todo lo existente (asignatura → modos → examen/resultados/repaso/histórico). Sin cambios funcionales.
2. **Resúmenes Interactivos** — asignatura → unidad → viewer interactivo generado desde JSON.

Restyle completo de la app con un tema oscuro (paleta Claude Design). Los resúmenes cubren 10 unidades de 4 asignaturas (lm, prog, ip, ipe) extraídas exclusivamente de los PDFs del temario.

---

## 2. Decisiones de arquitectura

| Decisión | Elección | Alternativas descartadas |
|---|---|---|
| Fichero del viewer | `public/summaries.html` separado | Todo en `index.html` (demasiado grande), ruta Express (mezcla responsabilidades) |
| Tokens CSS compartidos | `public/style.css` enlazado desde ambos HTML | Duplicar tokens en cada HTML |
| Deep-link test → resumen | URL params `?subject=&unit=` en `index.html` | Navegar sin params (UX pobre) |
| Renderer | Vanilla JS inline en `summaries.html`, mismo patrón que `index.html` | Framework externo |
| Datos resúmenes | `data/<asig>/u<N>.resumen.json` junto a los `.txt` | BD, endpoint generativo |

---

## 3. Ficheros afectados

| Fichero | Acción | Notas |
|---|---|---|
| `public/style.css` | **Nuevo** | Solo tokens + reset + foco. ~50 líneas. |
| `public/index.html` | **Modificado** | Restyle + home 2 secciones + deep-link. Cambios quirúrgicos, sin tocar lógica de test. |
| `public/summaries.html` | **Nuevo** | Viewer completo. ~1 400 líneas estimadas. |
| `server.js` | **Modificado** | Nuevo endpoint + campo `summaryUnits` en `/api/subjects`. Diff mínimo. |
| `data/lm/u0.resumen.json` | **Nuevo** | Fase 2 (piloto: u1), fase 3 (u0, u2) |
| `data/lm/u1.resumen.json` | **Nuevo** | Piloto (fase 2) |
| `data/lm/u2.resumen.json` | **Nuevo** | Fase 3 |
| `data/prog/u{0,1,2}.resumen.json` | **Nuevos** | Fase 3 |
| `data/ip/u{1,2}.resumen.json` | **Nuevos** | Fase 3 |
| `data/ipe/u{1,2}.resumen.json` | **Nuevos** | Fase 3 |
| `CLAUDE.md` | **Actualizado** | Fase 4 |
| `README.md` | **Actualizado** | Fase 4 |

**No se tocan:** ningún `.txt` de preguntas, `package.json`, `vercel.json`.

---

## 4. Sistema CSS (`public/style.css`)

Solo tokens, reset y foco de teclado. Ningún componente ni clase de layout. ~50 líneas.

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  /* Superficie */
  --bg:           #161826;
  --surface:      #232532;
  --border:       #3f424d;

  /* Texto */
  --text:         #e9e9ed;
  --text-body:    #cfd3e5;
  --text-muted:   #9397ab;
  --text-subtle:  #75798c;   /* solo decorativo, no informativo */

  /* Acento */
  --accent:       #9184d9;
  --accent-light: #b5abfc;
  --accent-bg:    #2b2741;
  --accent-line:  #423a6a;

  /* Error */
  --error:        #c96a8e;
  --error-bg:     #3a1f2e;

  /* Acierto — ~7.5:1 sobre --surface (WCAG AA) */
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

### Contraste verificado

| Token | Sobre | Ratio | WCAG |
|---|---|---|---|
| `--text #e9e9ed` | `--bg` | ~14:1 | AAA ✓ |
| `--text-body #cfd3e5` | `--bg` | ~10:1 | AAA ✓ |
| `--text-muted #9397ab` | `--bg` | ~5.2:1 | AA ✓ |
| `--accent-light #b5abfc` | `--bg` | ~7.1:1 | AAA ✓ |
| `--success #4ade80` | `--surface` | ~7.5:1 | AAA ✓ |
| `--error #c96a8e` | `--surface` | ~4.6:1 | AA ✓ |
| `--text-subtle #75798c` | `--bg` | ~3.8:1 | ⚠ solo decorativo |

### Uso de colores en estados de test y quiz

| Estado | `background` | `border` |
|---|---|---|
| Opción sin seleccionar | `--surface` | `--border` |
| Opción seleccionada (sin corregir) | `--accent-bg` | `--accent` |
| Opción correcta (tras corregir) | `--success-bg` | `--success` |
| Opción errónea seleccionada | `--error-bg` | `--error` |

---

## 5. Cambios en `index.html`

### 5a. Home con dos secciones

Sustituir la grid de asignaturas por dos tarjetas grandes:

```
┌─────────────────────────┐  ┌─────────────────────────┐
│  📝 Pruebas Test        │  │  📖 Resúmenes           │
│  Pon a prueba tus       │  │  Interactivos           │
│  conocimientos con      │  │  Repasa el temario con  │
│  preguntas tipo test.   │  │  resúmenes visuales e   │
│                         │  │  interactivos.          │
│  [Empezar →]            │  │  [Explorar →]           │
└─────────────────────────┘  └─────────────────────────┘
```

"Empezar" → screen de selección de asignatura (flujo actual).  
"Explorar" → `summaries.html`.

### 5b. Deep-link init (~12 líneas al inicio del `<script>`)

```js
(function () {
  const p = new URLSearchParams(location.search);
  const subj = p.get('subject'), unit = p.get('unit');
  if (subj && unit) {
    history.replaceState({}, '', location.pathname);
    document.addEventListener('DOMContentLoaded', () =>
      startUnitExam(subj, `u${unit}.txt`));
  }
})();
```

`startUnitExam(subject, file)` es la función existente que hace fetch a `/api/questions/:subject/:file` y lanza el examen en modo 1. Si no existe con ese nombre, se renombra al exponer.

### 5c. Restyle (sin cambios funcionales)

- Añadir `<link rel="stylesheet" href="style.css">` y eliminar el `@import` de Google Fonts inline.
- Reemplazar la paleta azul (`--primary`, `--accent`, `--bg`, etc.) por las nuevas variables de `style.css`.
- Los colores de acierto/fallo en el examen usan `--success`/`--success-bg` y `--error`/`--error-bg`.
- Sin tocar ninguna función JS del flujo de test.

---

## 6. Cambios en `server.js`

Diff mínimo: una función auxiliar + un campo en el map de `/api/subjects` + un endpoint nuevo.

### 6a. Función auxiliar

```js
function getSummaryUnits(subject) {
  const dir = path.join(DATA_DIR, subject);
  return fs.readdirSync(dir)
    .filter(f => /^u\d+\.resumen\.json$/i.test(f))
    .map(f => f.replace('.resumen.json', ''))
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
}
```

### 6b. `/api/subjects` — añadir `summaryUnits`

```js
// en el .map() existente, añadir:
summaryUnits: getSummaryUnits(name)
// resultado: { name, units, hasPs, summaryUnits: ['u0','u1','u2'] }
```

### 6c. Nuevo endpoint

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

`:unit` acepta solo dígitos, por lo que u0 funciona sin caso especial.

---

## 7. Esquema JSON de resúmenes

Fichero: `data/<asig>/u<N>.resumen.json`

```jsonc
{
  "subject":    "lm",          // código de asignatura
  "unit":       1,             // entero (0, 1, 2…)
  "title":      "Reconocimiento de las características de los lenguajes de marcas",
  "intro":      "Párrafo de contexto general de la unidad…",
  "objectives": [
    "Clasificar los lenguajes de marcas según su tipo.",
    "Conocer la evolución histórica: SGML → HTML → XML."
  ],

  "sections": [
    {
      "id":    "s1",
      "label": "1.1 Clasificación y características",
      "blocks": [
        { "type": "text",      "content": "Párrafo explicativo…" },
        { "type": "cards",     "items": [
            { "kicker": "Tipo 1", "title": "De procedimiento", "desc": "…", "example": "Nroff" }
        ]},
        { "type": "accordion", "items": [
            { "title": "Texto plano", "content": "Sin formato, solo caracteres estándar…" }
        ]},
        { "type": "timeline",  "items": [
            { "year": "1986 (ISO 8879)", "label": "SGML", "detail": "Descendiente de GML (IBM)…" }
        ]},
        { "type": "flipcards", "items": [
            { "term": "Etiqueta", "def": "Texto entre < y >; de inicio o de fin." }
        ]},
        { "type": "chips",     "items": ["XML → HTML", "Android Studio", "Bases de datos"] },
        { "type": "table",
          "headers": ["Gramática", "Sintaxis", "Ventaja"],
          "rows":    [["DTD", "No-XML", "Ligera y antigua"]]
        },
        { "type": "code",      "language": "xml",
          "content": "<note>\n  <to>Ana</to>\n  <body>Hola</body>\n</note>"
        }
      ]
    }
  ],

  "glossary": [
    { "term": "SGML", "def": "Standard Generalized Markup Language (ISO 8879, 1986)." }
  ],

  "quiz": [
    {
      "question":    "¿En qué tipo de clasificación se incluyen XML y HTML?",
      "options":     ["De procedimiento", "De presentación", "Descriptivo/semántico"],
      "correct":     2,
      "explanation": "XML y HTML son descriptivos: no imponen representación ni orden fijos."
    }
  ]
}
```

**Reglas:**
- `unit` es entero (no string). El renderer muestra "Unidad 0", "Unidad 1", etc.
- `objectives`, `glossary`, `quiz` pueden ser `[]` pero deben existir.
- `quiz` tiene entre 6 y 10 ítems por unidad.
- Errores del temario: incluir en el `content` del bloque `text` como `"⚠ Ojo: …"`.
- Contenido inventado: prohibido. Si algo no queda claro en el PDF, omitir y anotar en el informe final.
- `ip`: gramática explicada en español; ejemplos y vocabulario en inglés.

---

## 8. `public/summaries.html` — arquitectura del renderer

### 8a. Estado

```js
const state = {
  screen:    'subjects',  // 'subjects' | 'units' | 'summary'
  subjects:  [],          // array de { name, summaryUnits, units }
  subject:   null,
  unitNum:   null,        // entero
  summary:   null,        // JSON completo cargado
  section:   'intro',     // id de sección activa en sidebar
  open:      {},          // { [`${sectionId}-${blockIdx}-${itemIdx}`]: bool }
  flipped:   {},          // { [key]: bool }
  search:    '',
  answers:   {},          // { [qIdx]: optIdx }
  submitted: false,
};
```

### 8b. Ciclo render

```js
function render() {
  document.getElementById('app').innerHTML =
    state.screen === 'subjects' ? renderSubjects() :
    state.screen === 'units'    ? renderUnits()    :
                                  renderSummary();
  bindEvents();
}
```

`bindEvents()` usa event delegation sobre `#app` — un único listener `click`/`input` que despacha por `data-action`. Sin `onclick="..."` en HTML generado.

### 8c. Layout del viewer (`renderSummary`)

```
┌────────────────────────────────────────────────────────┐
│ header: LENGUAJE DE MARCAS (accent) / Unidad 1        │
│         "Reconocimiento de las características…"       │
├──────────────┬─────────────────────────────────────────┤
│ nav sticky   │ main                                    │
│              │                                         │
│ · Introducción│ <sección activa renderizada>           │
│ · 1.1 Clasif.│                                         │
│ · 1.2 Ámbitos│                                         │
│ · Glosario   │                                         │
│ · Quiz       │                                         │
│              │                                         │
└──────────────┴─────────────────────────────────────────┘
```

Móvil (<640px): nav se colapsa a un `<select>` o scroll horizontal; main a columna completa.

### 8d. Renderer de bloques

```
renderBlock(block, sectionId, blockIdx)
  switch block.type:
    'text'      → <p class="body">
    'cards'     → flex-wrap de .card (surface + border)
    'accordion' → lista de rows toggle (data-action="toggle-open")
    'timeline'  → columna con border-left accent-line + dots
    'flipcards' → perspective + rotateY CSS (data-action="flip")
    'chips'     → flex-wrap de pills (accent-bg, accent-light text)
    'table'     → <table> responsive (thead accent-light)
    'code'      → <pre><code> (surface, border accent-line, font monospace)
```

### 8e. Quiz de autoevaluación

Antes de enviar: opciones con estado seleccionado (accent-bg / accent).  
Tras "Comprobar respuestas":

```
Por pregunta:
  ┌ badge "✓ Acertada" (success) o "✗ Fallida" (error)
  │ texto de la pregunta
  │ opciones (correcta → success-bg/success; errónea elegida → error-bg/error)
  └ explicación en text-body

Footer:
  Resultado: X / N   [Reintentar]   [Hacer el test →]  ← solo si unit txt existe
```

"Hacer el test →" enlaza a `index.html?subject=<asig>&unit=<N>`.

---

## 9. Fuentes de contenido por unidad

| Asig. | Unidad | PDFs a leer |
|---|---|---|
| lm | U0 | `U0 Introducción a los lenguajes de marcas.pdf` |
| lm | U1 | PDF principal + `U1 Síntesis (7).pdf` + `U1 DIAPOSITIVAS….pdf` |
| lm | U2 | PDF principal + `U2 Síntesis (6).pdf` + `Diapositivas del directo lunes 28….pdf` |
| prog | U0 | PDF principal (descartar duplicado `(1)` si idéntico) |
| prog | U1 | PDF principal + PDF `RESUMEN` + `U1 Diagrama de flujo.pdf` (comparar duplicados `(1)`) |
| prog | U2 | PDF principal + PDF `RESUMEN` |
| ip | U1 | `U1 Living in the Present.pdf` + `Summary U1….pdf` + `Present Simple.pdf` + `U1 Adverbs of frequency.pdf` + `Verb To Be….pdf` + `Verb Have got….pdf` + `U1 RESUMEN Present Simple….pdf` |
| ip | U2 | `U2 What do you like.pdf` + `Summary U2….pdf` + gramáticas U2 (`Like and dislike verbs`, `Prepositions of time`, `Pronouns and Possessive forms`, `There is and there are`, `Connectors`, `WH-Question`, `U2 Prepositions of time.pdf`, `U2 Vocabulary….pdf`) |
| ipe | U1 | `U1 Economía y administración nociones básicas.pdf` + `U1 Síntesis….pdf` + `U1 DIAPOSITIVAS….pdf` + `Infografía - U1 Personas jurídicas.pdf` |
| ipe | U2 | `U2 El sistema fiscal.pdf` + `U2 Síntesis….pdf` + `U2 DIAPOSITIVAS….pdf` + `Resumen_IRPF. Preguntas más comunes.pdf` |

**Ignorados:** Temporalización PDFs, `(práctica).pdf` lm/U0, `Grammar exercises Answer key`, `How to write an essay…docx`, `.docx` de resúmenes, `pseint-w64-*`, `MSTeamsSetup.exe`.

---

## 10. Plan de fases y commits

### Fase 1 — Restyle + dos secciones
**Commit:** `feat: restyle dark theme + two-section home`

- Crear `style.css`
- Restyle `index.html` (nueva home, paleta oscura, deep-link init)
- Shell de `summaries.html` (screens subjects/units sin renderer)
- Verificar: `npm run dev` + todos los modos de test OK

### Fase 2 — Renderer + backend + piloto lm/u1
**Commit:** `feat: summary renderer + backend + pilot lm/u1`

- Cambios `server.js`
- Renderer completo en `summaries.html`
- `data/lm/u1.resumen.json`
- Verificar app completa

**→ PARAR. Mostrar piloto al usuario. Solo continuar con aprobación explícita.**

### Fase 3 — Resto de unidades
**Commit:** `feat: resúmenes todas las unidades`

Agentes en paralelo (uno por asignatura) generan los 9 JSONs restantes:
- `agente-lm` → `u0.resumen.json`, `u2.resumen.json`
- `agente-prog` → `u0`, `u1`, `u2`
- `agente-ip` → `u1`, `u2`
- `agente-ipe` → `u1`, `u2`

### Fase 4 — Revisión y despliegue
**Commit:** `fix: revisión accesibilidad, docs y despliegue`

- Accessibility Auditor: contraste WCAG + foco teclado
- API Tester: endpoints summary + coherencia
- Code Reviewer: over-engineering check
- Actualizar `CLAUDE.md` + `README.md`
- Verificar config Vercel (git remote + `.vercel/`) y desplegar
- Informe final: unidades generadas, fuentes, notas ⚠, huecos

---

## 11. Criterios de aceptación

- [ ] `npm run dev` arranca sin errores tras cada fase
- [ ] Todos los modos de test (por unidad, conjunto, simulacro, histórico) funcionan igual
- [ ] `summaries.html` renderiza los 10 tipos de bloque sin errores de consola
- [ ] Quiz muestra ✓/✗ por pregunta con explicación; verde/rojo distintos del morado de selección
- [ ] "Hacer el test" desde quiz lanza el examen directamente (modo 1, unidad correcta)
- [ ] Unidad 0 se muestra como "Unidad 0" sin caso especial en el código
- [ ] Contraste WCAG AA en todos los textos informativos
- [ ] Foco de teclado visible en todos los elementos interactivos
- [ ] Vercel desplegado y accesible en `exam-generator-daw.vercel.app`
