# Auditoría antes de publicar — Generador de Exámenes DAW

**Fecha:** 24/10/2026 · **Alcance:** cambios pendientes de push, que son la funcionalidad "Test extra" (`extraQuiz`) y el resumen prog/u6. Esta auditoría actualiza la del 10/10/2026. Del resto del código revisado entonces no ha cambiado nada relevante.
**Destino:** Vercel (`vercel.json` enruta todo a `server.js`). Publicar = `git push` a `master`.

En cada hallazgo se indica si está **(comprobado)**, es decir, visto en el código con archivo y línea, o si es **(interpretación)**, es decir, mi lectura del riesgo.

---

## Resumen ejecutivo

**No hay hallazgos críticos, altos ni medios.** Solo tres de severidad baja, que no bloquean el push.

| ID | Severidad | Hallazgo | Ubicación |
|---|---|---|---|
| E1 | Bajo | Las opciones del quiz son `<div role="button">`, no radios accesibles. Ya pasaba antes y el test extra hereda el mismo patrón | `summaries.html` (renderQuizSection) |
| E2 | Bajo | La validación de `extraQuiz` depende del validador local (`npm run validate`), no del servidor. Igual que el resto del JSON | `scripts/validate-summaries.js` |
| E3 | Bajo | `public/subjects-config.js` (mapa asignatura→bloque) se sirve en público. Solo contiene códigos de asignatura, nada sensible | `public/subjects-config.js` |

---

## 1. Seguridad

**XSS** (*cross-site scripting*): se produce cuando un texto se inserta en la página como HTML y el navegador ejecuta código que venía dentro de él.

- **(comprobado)** El renderer del quiz ahora es genérico: `renderQuizSection(questions, answers, submitted, title, actNs)`. Sigue escapando todo con `esc()`: preguntas, opciones y explicación del quiz, y el título del test extra, tanto en el `<h2>` de la sección como en el nav (`summaries.html`, ~línea 545).
- **(comprobado)** `actNs` vale siempre `''` o `'eq'`, que son literales del código. Nunca viene de datos, así que los atributos `data-action` e `id` que forma no son inyectables.
- **(comprobado)** Los nuevos estados `eqAnswers` y `eqSubmitted` solo guardan enteros, que salen de `parseInt` sobre `data-qi` y `data-oi`. Se reinician al cambiar de unidad (~línea 606).
- **(comprobado)** No hay secretos en los cambios. `server.js` no ha cambiado desde la auditoría anterior.
- **(interpretación)** El contenido de `extraQuiz` lo escribes tú en el repo y pasa por `esc()`. No hay ninguna entrada del usuario que llegue al DOM.

## 2. Responsive

- **(comprobado)** El nav gana un elemento ("Test extra U6–U7 · 10 Q"). A ≤640 px el nav ya es una tira horizontal con scroll (`summaries.html`, breakpoint 640 px), así que un elemento más no desborda la página.
- **(comprobado)** La pantalla del test extra usa las mismas clases que el quiz (`quiz-item`, `quiz-option`, `quiz-score-card`), cuyo comportamiento en móvil ya estaba revisado.
- **(interpretación)** A 375, 768 y 1440 px no debería cambiar nada respecto al quiz actual. Solo he visto la captura de escritorio de `docs/qa/fase3/prog-u6-extra-quiz.png`; no he probado en un navegador a 375 px.

## 3. Despliegue

- **(comprobado)** `data/prog/u6.resumen.json` está en el índice de git. No hace falta ningún cambio en el servidor: `/api/summary/prog/6` sirve el JSON completo, con `extraQuiz` incluido.
- **(comprobado)** Las unidades sin `extraQuiz` no muestran el elemento en el nav. Lo dice el QA negativo de Claude Code sobre las otras 17 unidades; lo he contrastado con el código (`${d.extraQuiz ? … : ''}`).
- **(comprobado)** El índice de git incluye además `data/lm/u3.txt`, `data/lm/u4.txt`, `data/prog/u4.txt` y `data/prog/u5.txt`, que son los tests que añadiste tú. Si alguno no estaba publicado todavía, saldrá en producción con este push.

## 4. Arquitectura (cambio)

- **Flujo del test extra:** clic en el nav "Test extra" (`nav-section`, `extra-quiz`) → `renderActiveSection()` → `<div id="eq-section">` + `renderQuizSection(eq.questions, state.eqAnswers, state.eqSubmitted, eq.title, 'eq')`.
- **Acciones:** `select-answer-eq`, `submit-eq` y `retry-eq` vuelven a pintar solo `#eq-section`.
- **Botón "Hacer el test →":** queda excluido del test extra con `!actNs`.
- **Esquema:** `extraQuiz` es un campo opcional documentado en `CLAUDE.md`. El validador lo comprueba sin el límite de 6–10 preguntas y sin el aviso de sesgo, porque las opciones no se reordenan (hay respuestas tipo "a) y c)").

---

## Arreglos antes de publicar

**Ninguno es obligatorio.** Opcional, para más adelante: convertir las opciones de los dos quizzes en un grupo de radios accesible (`role="radiogroup"` / `role="radio"` + `aria-checked`), es decir, E1.
