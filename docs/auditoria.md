# Auditoría antes de publicar — Generador de Exámenes DAW

**Fecha:** 10/10/2026 · **Alcance:** estado actual del repo antes del push del lote U3/U4 (resúmenes prog/u3, prog/u4, lm/u3, ip/u3, ipe/u3; validador; arreglo del botón "Hacer el test"). Sustituye a la auditoría del 03/10/2026.
**Destino:** Vercel (`vercel.json`: todas las rutas → `server.js`, Express). Publicar = `git push` a `master` (interpretación: integración Git de Vercel; no lo he comprobado en el panel de Vercel).

**Cómo leer este informe**

- **(comprobado)**: lo he visto en el código; se cita el archivo y la línea.
- **(interpretación)**: es mi lectura del riesgo y no se puede verificar línea por línea.

---

## Resumen ejecutivo

**No hay hallazgos críticos ni altos.** Los arreglos de la auditoría anterior siguen en el código.

| ID | Severidad | Hallazgo | Ubicación |
|---|---|---|---|
| N1 | Medio | El push publicará también el **test de IPE U3** (`data/ipe/u3.txt` está en el índice de git), aunque este lote se planteó sin tests | índice de git |
| N2 | Bajo | En móvil (375 px), la tabla de 5 columnas de prog/u4 obliga a desplazarse en horizontal. Se puede usar, pero es incómodo | `data/prog/u4.resumen.json` + `summaries.html:253` |
| N3 | Bajo | Se suben a GitHub scripts de un solo uso (`scripts/_patch-image-pdfs.js`, `scripts/qa-fase3.js`). No se sirven en la web | índice de git |
| N4 | Bajo | `d.subject` y `sec.id` (que vienen del JSON) se insertan sin escapar en atributos e identificadores. Hoy no es explotable porque los JSON los escribes tú y se validan | `summaries.html:492, 840` |

---

## 1. Seguridad

**XSS** (*cross-site scripting*): se produce cuando un texto acaba insertado en la página como HTML y el navegador ejecuta un `<script>` o un atributo `on...=` que venía dentro de ese texto.

### Lo que está bien (comprobado)

- `summaries.html` define `esc()` (líneas 401-405), que sustituye `& < > " '`. Todo el contenido del temario pasa por ella antes de insertarse con `innerHTML`: preguntas, opciones y explicación del quiz (líneas 799, 808 y 810), glosario (líneas 672-673), tablas (889 y 891) y el código de unidad (535).
- **Única entrada del usuario: el buscador del glosario.** El texto que escribes solo se usa para filtrar (líneas 663-666) y nunca llega al DOM, así que no hay vía de XSS.
- **Botón nuevo "Hacer el test →"** (líneas 760-763). La condición usa `state.subject.units`, que viene de `/api/subjects`. El enlace escapa `subject` y `unit` con `esc()`, y `unitNum` es un entero porque sale de `parseInt` (línea 584).
- **API de resúmenes** (`server.js:290-303`). Valida los parámetros con `^[a-z0-9]+$` y `^\d+$`, así que no se puede salir de la carpeta con `..`. Los errores 500 devuelven `'Error interno'` (líneas 228, 241, 257 y 286).
- **Secretos.** He buscado `api_key`, `password`, `secret`, `token`, `PRIVATE KEY` y `AKIA` en `public/`, `server.js`, `data/`, `scripts/` y `package.json`. Solo aparecen como palabras del temario (por ejemplo, `<input type='password'>` en lm/u2), no como credenciales.

### N4 — Bajo · Valores del JSON sin escapar en identificadores (comprobado / interpretación)

```js
// summaries.html:492 — d.subject viene del JSON; luego se escapa al pintarlo (línea 535)
const unitCode = `${d.subject.toUpperCase()}-U${String(d.unit).padStart(2, '0')}`;
// summaries.html:840 — sectionId (sec.id del JSON) va sin esc() a data-key / id
const key = `${sectionId}-${blockIdx}-${i}`;
```

**Interpretación:** solo podría explotarse si alguien metiera un JSON malicioso en `data/`, y ese alguien ya tendría acceso al repo. En los 5 JSON nuevos he comprobado que todos los `id` siguen el patrón `s\d+`. Para cerrarlo del todo, el validador podría exigir ese patrón. No bloquea el push.

### N3 — Bajo · Scripts de un solo uso en GitHub (comprobado)

El índice de git incluye `scripts/_patch-image-pdfs.js` y `scripts/qa-fase3.js`. **No se publican en la web**: Express solo sirve `public/` (`server.js:9`) y la API. Lo único que hacen es ocupar sitio en el repositorio de GitHub.

---

## 2. Diseño responsive

Un **breakpoint** es una regla CSS (`@media (max-width: …)`) que cambia el diseño a partir de cierto ancho de pantalla. Hay uno en `summaries.html:331` (640 px: una sola columna y menú horizontal desplazable) y otro en `index.html:511` (600 px).

| Ancho | Resultado |
|---|---|
| **375 px** | La navegación usa `short`, que mide como mucho 25 caracteres en los JSON nuevos (comprobado), así que el título largo de ip/u3 s5 no rompe el menú. Tablas y código tienen `overflow-x: auto` (líneas 253 y 255). **N2:** la tabla de 5 columnas de prog/u4 se desplaza en horizontal (interpretación: se puede usar, pero es incómodo). |
| **768 px** | Diseño de escritorio con menú lateral. Las tablas de 3-4 columnas caben (interpretación, deducida del CSS). |
| **1440 px** | Sin problemas: el contenido tiene un ancho máximo fijo (interpretación). |

No he abierto un navegador en estos anchos. Las capturas del QA de Claude Code solo son de escritorio (1280 px).

---

## 3. Problemas de despliegue

### N1 — Medio · El test de IPE U3 se publicará con este push (comprobado / interpretación)

`data/ipe/u3.txt` (7404 bytes, del 09/10) está en el índice de git. El servidor detecta solo los `u<N>.txt` (`server.js:164-176`). Con el push, aparecerá en producción el test por unidad de IPE U3, contará en el modo conjunto y en el simulacro, y el resumen de ipe/u3 mostrará el botón "Hacer el test →".

**No puedo confirmar esto:** si ese test ya estaba publicado antes. Intenté consultar `/api/subjects` en producción y la petición no salió. Si no lo quieres publicado aún: `git rm --cached data/ipe/u3.txt` y commit.

### Rutas, punto de entrada y datos (comprobado)

- `vercel.json` manda todas las rutas a `server.js`. Express sirve `public/index.html` como raíz y `summaries.html` desde la misma carpeta, con rutas relativas.
- Los 5 JSON nuevos están en el índice de git (`data/*/u3.resumen.json` y `data/prog/u4.resumen.json`). Los nombres van en minúsculas y coinciden con lo que construye el servidor (`u${unit}.resumen.json`), así que no hay problema con las mayúsculas en Linux.
- Hay ficheros internos en git (`CLAUDE.md`, `docs/superpowers/…`, `docs/auditoria.*`) que **no se sirven**: Vercel los incluye en el despliegue, pero ninguna ruta los expone (interpretación).
- `docs/qa/`, `qa_screenshots/`, `extract_pdfs.py`, `docs/stitch/` y `.claude/settings.local.json` están en `.gitignore` y no aparecen en el índice (comprobado).

### Después del push (verificación)

1. `/api/summary/prog/4` y `/api/summary/ip/3` devuelven el JSON.
2. En `/summaries.html`, el botón "Hacer el test →" **no** aparece en lm/u3 y **sí** en lm/u2.

---

## 4. Arquitectura (cambios desde la auditoría anterior)

- **`public/summaries.html`**: el visor de resúmenes. El único cambio es la condición de `testLink` (línea 760).
- **`scripts/validate-summaries.js`** (no se despliega): ignora `/**` antes de buscar Markdown (línea 17) y avisa (WARN) cuando más de la mitad de las respuestas correctas están en la misma posición (líneas 129-134).
- **`data/<cod>/u<N>.resumen.json`**: 5 unidades nuevas con el esquema de siempre.

**Flujo de un dato:** clic en una unidad (`select-unit`, línea 584) → `loadSummary()` hace `fetch('/api/summary/<cod>/<N>')` (línea 649) → `server.js:290` valida, lee y devuelve el JSON → `render()` → `renderBlock()` escapa cada campo con `esc()` → DOM. La lista de unidades con test viaja en `/api/subjects` (`server.js:222-223`) y la usa la condición del botón.

---

## Arreglos rápidos antes de publicar (por prioridad)

1. **N1 (Medio):** decide si quieres publicar ya el test de IPE U3. Si no, ejecuta `git rm --cached data/ipe/u3.txt` y haz commit antes del push.
2. **N3 (Bajo, opcional):** `git rm --cached scripts/_patch-image-pdfs.js scripts/qa-fase3.js` y añádelos a `.gitignore`.
3. **N4 (Bajo, opcional):** en el validador, exigir que `sections[].id` cumpla `^s\d+$`.
4. **N2 (Bajo):** no requiere acción.

### `.gitignore`: líneas a añadir (opcional, N3)

```gitignore
# Scripts de un solo uso (QA de la fase 3 y parche de PDFs-imagen); no forman parte de la app
scripts/_patch-image-pdfs.js
scripts/qa-fase3.js
```

### `.vercelignore` (opcional)

Con Express, solo `public/` y la API son accesibles, así que no es imprescindible. Si quieres reducir lo que se sube a la función de Vercel:

```gitignore
# Documentación interna y material de trabajo: no lo usa el servidor
docs/
CLAUDE.md
scripts/
```
