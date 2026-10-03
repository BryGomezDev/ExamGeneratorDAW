# Auditoría antes de publicar — Generador de Exámenes DAW

Fecha: 2026-10-03 · Alcance: estado local del repo antes del `git push` que publicará en `exam-generator-daw.vercel.app`.

> Cómo leer este informe: cada hallazgo indica **severidad**, **archivo:línea** y si es **(comprobado)** —visto en el código— o **(interpretación)** —mi lectura del riesgo—. No se ha modificado ningún archivo del proyecto; aplicar arreglos y publicar es un paso aparte.

**Nota importante sobre el tipo de proyecto.** La skill está pensada para webs estáticas, pero esta app **no es estática pura**: es un servidor Express (`server.js`) que Vercel ejecuta como función. Solo se sirve por HTTP lo que hay en `public/` más la API `/api/*` **(comprobado, `server.js:9`)**. El resto del repo (docs, scripts, CLAUDE.md…) no se sirve en la web, pero **sí viaja a GitHub** con el push.

---

## Resumen ejecutivo

| # | Severidad | Hallazgo | Archivo |
|---|---|---|---|
| S1 | **Alto** | El test pinta preguntas, opciones y explicaciones con `innerHTML` sin escapar: las etiquetas HTML del temario (`<link>`, `<video>`, `<form>`…) desaparecen o se convierten en elementos reales | `public/index.html:1054, 1125-1126, 1202, 1215` |
| D1 | **Alto** | `data/lm/u2.txt` y `data/prog/u3.txt` existen en local pero **no están en git**: en producción no habrá test de LM U2 ni de Programación U3 | `data/` + índice de git |
| S2 | Medio | Con el push se suben a GitHub ficheros internos: `.claude/settings.local.json` (rutas locales e historial de comandos), planes, informes de QA y 60 capturas (20 obsoletas) | índice de git |
| D2 | Medio | Probablemente el push **publica automáticamente** (integración Git de Vercel); no hay vuelta atrás "en local" | (interpretación) |
| R1 | Medio | En móvil (375 px) la miga de pan de la cabecera del test se corta ("Prue…") | `public/index.html:40-52` |
| D3 | Medio | Verificar tras el despliegue que Vercel incluye los nuevos `*.resumen.json` | `vercel.json` |
| S3 | Bajo | La API devuelve `e.message` en los errores 500 (puede revelar rutas del servidor) | `server.js:238, 252, 268, 303` |
| S4 | Bajo | La validación de parámetros admite `..` | `server.js:246, 260, 276, 309` |
| S5 | Bajo | Mensajes de error de `fetch` insertados con `innerHTML` | `public/index.html:843, 963` |

No se han encontrado **secretos** (claves de API, tokens, contraseñas) en el código **(comprobado)**: búsqueda de `api_key`, `password`, `secret`, `token`, `BEGIN … PRIVATE KEY`, `AKIA`, `ghp_`, `sk-`, `Bearer` en `.js/.json/.html/.md/.py` fuera de `node_modules`. Las coincidencias eran texto del temario ("tokens" de diseño, `<input type='password'>` en el resumen de LM U2).

---

## 1. Seguridad

**XSS (Cross-Site Scripting)**: cuando un texto se mete en la página con `innerHTML` sin "escapar" (convertir `<` en `&lt;`, etc.), el navegador lo interpreta como HTML. Si ese texto viene de una persona, podría inyectar código que se ejecute en el navegador de otra.

### S1 — Alto · Contenido del test sin escapar (comprobado)

`public/index.html`:

```js
// 1054 — opciones de la pregunta
btn.innerHTML = `<span class="option-label">${labels[displayIdx]}</span><span>${q.options[origIdx]}</span>`;

// 1125-1126 — caja de feedback: respuesta correcta + explicación
const explPart = q.explanation ? `<br><br>${q.explanation}` : '';
fb.innerHTML = `${prefix} <strong>${correctText}</strong>${explPart}`;

// 1202 y 1215 — pantalla de repaso
<div class="review-q-text">${q.question}</div>
optDiv.innerHTML = `<strong>${icon}</strong> ${q.options[origIdx]}`;
```

Los ficheros de preguntas contienen etiquetas HTML como texto **(comprobado)**:

- `data/lm/u2.txt:39` — "La etiqueta `<link>` se coloca en el `<head>`… `<!DOCTYPE html>`"
- `data/lm/u2.txt:47` — "`<article>`, `<section>`, `<nav>`… el elemento `<video>`"
- `data/lm/u2.txt:79` — "`<form>`… `<dialog>`… `<figure>`… `<progress>`"
- `data/lm/u1.txt:63` — "`<p>`, `<div>` o `<nombre>`… `<br/>`"

**Efecto (interpretación)**: en el test de Lenguaje de marcas las explicaciones pierden palabras clave justo en la materia donde importan ("La etiqueta  se coloca en el …"), y algunas generan elementos reales dentro de la caja (un `<video>` vacío, un `<form>`, una barra `<progress>`). No es un XSS explotable hoy porque el contenido lo escribes tú, no los usuarios; pasaría a serlo si algún día las preguntas vinieran de fuera. La pregunta en sí se pinta bien porque usa `textContent` (`index.html:1041`).

`summaries.html` **sí** escapa todo con su función `esc()` (`summaries.html:401`) **(comprobado)**: no tiene este problema.

### S2 — Medio · Qué se sube a GitHub sin hacer falta (comprobado / interpretación)

Ficheros **seguidos por git** (leído del índice `.git/index`, 77 entradas) que no forman parte de la app:

| Fichero | Por qué no debería subirse |
|---|---|
| `.claude/settings.local.json` | Configuración local de Claude Code: contiene rutas de tu equipo (`C:/Users/BryDev/...`) y el historial de comandos permitidos. "local" indica que no es para compartir. |
| `docs/qa/fase3/*.png` (60) | Capturas de QA. Las 20 `*-sections.png` son **obsoletas e idénticas** entre sí (de la QA inválida anterior). |
| `docs/qa/qa-report.md`, `docs/superpowers/plans/*`, `docs/superpowers/specs/*` | Documentación interna de trabajo. |
| `scripts/_patch-image-pdfs.js`, `scripts/qa-fase3.js` | Scripts de un solo uso / sustituidos por `qa-summaries.js`. |
| `CLAUDE.md` | Instrucciones para el asistente. Inofensivo, pero interno. |

**No seguidos** (no se suben, correcto): `docs/stitch/`, `docs/diseno-resumen-referencia.txt`, `qa_screenshots/` (~4 MB), `qa_capture*.js`, `extract_pdfs.py`, `.superpowers/` (tiene su propio `.gitignore` con `*`).

**Riesgo real (interpretación)**: ninguno de estos ficheros se sirve en la web (Express solo publica `public/`). El riesgo depende de si el repositorio `github.com/BryGomezDev/ExamGeneratorDAW` es **público**: **No puedo confirmar esto** (la consulta a la API de GitHub devolvió 403 desde esta sesión). Si es público, cualquiera puede leer lo anterior.

### S3 — Bajo · Mensajes de error internos en la API (comprobado)

```js
// server.js:238, 252, 268, 303
res.status(500).json({ error: e.message });
```

Un error de lectura de fichero devuelve el mensaje de Node, que incluye la **ruta absoluta del servidor** (p. ej. `ENOENT: no such file or directory, open '/var/task/data/…'`) (interpretación). Además `server.js:189-202` escribe en el log los primeros 300 caracteres de cada fichero leído: inofensivo, pero ruidoso en producción.

### S4 — Bajo · Validación de parámetros permite `..` (comprobado)

```js
// server.js:246
if (!/^[\w.]+$/.test(subject) || !/^[\w.]+$/.test(file)) { … }
```

`[\w.]+` acepta `..`, así que `subject=..` apunta fuera de `data/`. **Interpretación**: el impacto es bajo porque lo leído pasa por el parser de preguntas (solo devuelve bloques con formato de pregunta) o por un nombre fijo (`u<N>.resumen.json`), pero conviene cerrarlo: asignatura `^[a-z0-9]+$`, fichero `^(u\d+|ps)\.txt$`.

### S5 — Bajo · `e.message` con innerHTML en el cliente (comprobado)

`public/index.html:843` y `963` pintan el mensaje de error de `fetch` con `innerHTML`. El texto lo genera el propio código o el servidor, no el usuario: riesgo bajo; usar `textContent`.

---

## 2. Diseño responsive

**Breakpoint**: regla CSS que cambia el diseño a partir de un ancho de pantalla (`@media (max-width: …)`).

Breakpoints existentes **(comprobado)**:
- `public/index.html:511` → `@media (max-width: 600px)`: reduce paddings y tamaños.
- `public/summaries.html:331` → `@media (max-width: 640px)`: nav lateral → pestañas horizontales con scroll, una columna.
- `public/style.css`: ninguno (solo tokens).

| Ancho | Test (`index.html`) | Resúmenes (`summaries.html`) |
|---|---|---|
| **375 px** | **R1 (Medio)**: cabecera con `h1` y botones `white-space: nowrap` (`index.html:40, 63`) + miga de pan con `overflow: hidden` (`:47`) → la miga se corta ("Prue…") (comprobado en CSS; visto en `docs/qa/test-pregunta-375.png` de la QA). | Correcto: tablas y código con `overflow-x: auto` (`summaries.html:253, 255, 888, 896`) (comprobado). |
| **768 px** | Layout de escritorio con contenedores `max-width` 700–900 px: cabe (interpretación). | Sin breakpoint entre 641 y 1180 px: nav lateral + contenido. Cabe; el contenido queda algo estrecho (interpretación). |
| **1440 px** | Correcto. | Correcto: contenedor centrado `max-width: 1180px` (`summaries.html:38, 72`). |

---

## 3. Problemas de despliegue

**Cómo se despliega (comprobado + interpretación)**: `vercel.json` empaqueta `server.js` con `@vercel/node` y envía todas las rutas a Express. No existe la carpeta `.vercel/` (no se ha desplegado con la CLI desde este equipo) y el remoto es `github.com/BryGomezDev/ExamGeneratorDAW` (`.git/config`). Lo más probable es que Vercel esté conectado al repo y **despliegue automáticamente cada push a `master`** (**No puedo confirmar esto** sin acceso al panel de Vercel).

### D1 — Alto · Ficheros de test que no se publicarán (comprobado)

En local existen `data/lm/u2.txt` y `data/prog/u3.txt`, pero **no están en el índice de git**. Vercel construye desde el repo, así que en producción:
- Lenguaje de marcas mostrará el test de U1 pero **no el de U2**.
- Programación **no tendrá U3**.

En local todo funciona porque el servidor lee la carpeta tal cual: el típico "funciona en mi máquina".

### D2 — Medio · Publicar = hacer push (interpretación)

Si la integración Git está activa, `git push` publica sin paso intermedio. Conviene hacer el push solo después de aplicar los arreglos y repasar en local.

### D3 — Medio · Inclusión de los JSON en la función de Vercel (interpretación)

`server.js` lee `data/` con rutas dinámicas (`path.join(DATA_DIR, subject, …)`). Hoy funciona en producción con `data/si/*.txt`, lo que indica que Vercel ya incluye `data/`. Aun así, tras el despliegue hay que comprobar que `GET /api/subjects` devuelve `summaryUnits` con contenido. Si llegara vacío, se fuerza con `"config": { "includeFiles": ["data/**"] }` en el build de `vercel.json`.

### D4 — Bajo · Rutas, mayúsculas y punto de entrada (comprobado)

- **Ruta absoluta**: una ruta que empieza por `/` asume que la app vive en la raíz del dominio. La app usa `fetch('/api/...')` (`index.html:788-803`, `summaries.html:652, 905`). En Vercel vive en la raíz: **correcto**.
- **Mayúsculas**: Windows ignora mayúsculas en los nombres de fichero y Linux (Vercel) no; `.git/config` tiene `ignorecase = true`. Hoy todos los nombres (`style.css`, `summaries.html`, carpetas `ip/ipe/lm/prog/si`) coinciden en minúsculas con sus referencias: **correcto**. Riesgo futuro si se renombra algo cambiando solo mayúsculas.
- **Punto de entrada**: `public/index.html` lo sirve `express.static` en `/` (`server.js:9`); `public/summaries.html` en `/summaries.html`: **correcto**.
- **Dependencia externa**: fuentes Inter y JetBrains Mono desde Google Fonts (`style.css:1`). Si Google Fonts no responde, cae a `system-ui`: aceptable.

---

## 4. Arquitectura

| Archivo | Qué hace | Depende de |
|---|---|---|
| `server.js` | Express: sirve `public/` como estático y expone la API. Parsea los `.txt` de preguntas (formato `PREGUNTA:` y Moodle), deduplica y mezcla. | `express`, `fs`, `data/` |
| `public/style.css` | Tokens de diseño "Nocturne Editorial" (colores, tipografía, radios), reset y foco. | Google Fonts |
| `public/index.html` | SPA del **test**: landing (Pruebas Test / Resúmenes), asignatura → modo → examen → resultados → repaso → histórico (`localStorage`). Enlace directo `?subject=&unit=`. | `style.css`, `/api/subjects`, `/api/questions/*`, `/api/final/*` |
| `public/summaries.html` | SPA de **resúmenes**: asignatura → unidad → visor (nav, 8 tipos de bloque, glosario con búsqueda, autoevaluación). Escapa todo con `esc()`. | `style.css`, `/api/subjects`, `/api/summary/*` |
| `data/<asig>/u<N>.txt`, `ps.txt` | Bancos de preguntas del test. | — |
| `data/<asig>/u<N>.resumen.json` | Contenido de cada resumen (secciones, glosario, quiz). | — |
| `scripts/validate-summaries.js` | `npm run validate`: valida el esquema de todos los JSON. | Node |
| `scripts/qa-summaries.js` | `npm run qa`: recorre las 10 unidades con Playwright y guarda capturas. | `playwright` (dev) |
| `vercel.json` | Despliegue de `server.js` como función. | Vercel |

**Flujo de un resumen**: `summaries.html` hace `fetch('/api/subjects')` → `server.js:228` lista carpetas de `data/` y, con `getSummaryUnits()` (`server.js:179`), las unidades con `u<N>.resumen.json` → el usuario elige unidad → `fetch('/api/summary/lm/1')` → `server.js:307` valida, lee y parsea el JSON → `render()` / `renderSummary()` construyen el HTML con `esc()` → la delegación de eventos en `#app` gestiona nav, acordeones, flipcards y quiz.

**Flujo de un test**: `index.html` → `/api/questions/lm/u2.txt` → `loadQuestions()` → `parseQuestionsNew()` → JSON `{question, options, correct, explanation}` → `renderQuestion()` (pregunta con `textContent`, **opciones con `innerHTML`**) → `chooseAnswer()` → `showFeedback()` (**`innerHTML`**) → `saveToHistory()` en `localStorage`.

La separación servidor (datos) / cliente (pintado) se cumple. La diferencia de criterio entre los dos HTML (uno escapa y el otro no) es el origen de S1.

---

## Arreglos rápidos antes de publicar (por prioridad)

1. **S1 (Alto)** — En `index.html`, añadir la misma `esc()` de `summaries.html` y aplicarla a `q.options[...]`, `correctText`, `q.explanation` y `q.question` en las líneas 1054, 1125-1126, 1202 y 1215 (o construir esos nodos con `textContent`). Probar con la pregunta de `<link>` de LM U2.
2. **D1 (Alto)** — Si quieres esos tests en producción: `git add data/lm/u2.txt data/prog/u3.txt` y commit.
3. **S2 (Medio)** — Dejar de seguir lo interno:
   - `git rm --cached .claude/settings.local.json`
   - `git rm --cached docs/qa/fase3/*-sections.png` (obsoletas)
   - Decidir si `docs/qa/`, `docs/superpowers/` y los scripts de un solo uso deben estar en el repo; si no, `git rm --cached` y añadirlos al `.gitignore`.
4. **S3 + S4 (Bajo)** — Respuesta genérica `{ error: 'Error interno' }` en los 500 y regex estrictas (`^[a-z0-9]+$`, `^(u\d+|ps)\.txt$`). Quitar los `console.log` de contenido en `loadQuestions`.
5. **R1 (Medio)** — En `≤600px`, ocultar la miga de pan o reducir el `h1`.
6. **Tras el push** — Abrir producción y comprobar: `/api/subjects` (con `summaryUnits`), `/summaries.html` → una unidad de cada asignatura, y el test de LM U2 con la pregunta de `<link>`.

### `.gitignore` propuesto (añadir)

El hosting de destino es Vercel con despliegue desde GitHub, así que lo que importa es **qué entra en el repo**. El equivalente práctico al `.surgeignore` es el `.gitignore`:

```gitignore
# Ya existentes
node_modules/
.env
docs/qa/*.png

# Configuración local del asistente (rutas e historial de tu equipo)
.claude/settings.local.json
.superpowers/

# Capturas y material de QA (pesan y no son parte de la app)
docs/qa/
qa_screenshots/
qa_capture*.js

# Material de diseño y trabajo interno
docs/stitch/
docs/diseno-resumen-referencia.txt
docs/superpowers/

# Scripts de un solo uso
extract_pdfs.py
scripts/_patch-image-pdfs.js
scripts/qa-fase3.js
```

> Ojo: `.gitignore` solo afecta a ficheros **no seguidos todavía**. Para los que ya están en git hay que hacer `git rm --cached <ruta>` (no borra tu copia local).

### `.vercelignore` opcional

Reduce lo que se sube a Vercel en despliegues por CLI. **No puedo confirmar** si tu proyecto lo aplica también en los despliegues desde Git; no hace daño tenerlo:

```text
docs/
qa_screenshots/
qa_capture*.js
extract_pdfs.py
scripts/
.claude/
.superpowers/
CLAUDE.md
```
