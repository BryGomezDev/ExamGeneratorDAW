# QA Visual Report — Nocturne Editorial (v2)
Fecha: 2026-10-03
Capturas: docs/qa/ (gitignored, generadas con qa_capture_full.js)
Referencia Stitch: docs/stitch/stitch_daw_exam_study_platform/

---

## A. Capturas tomadas

54 archivos .png en docs/qa/ (3 anchos × 18 pantallas)

### index.html (9 pantallas × 3 = 27 archivos)
landing, asignaturas, unidades, test-pregunta, test-hover, test-acierto, test-fallo, resultados, historico

### summaries.html — visor (9 pantallas × 3 = 27 archivos)
visor-asignaturas, visor-unidades, visor-intro, visor-s1-clasificacion,
visor-s3-evolucion, visor-s4-etiquetas, visor-glosario,
visor-quiz-respondiendo, visor-quiz-revisada

---

## B. Comparación visor vs Stitch — lado a lado

### Metodología
Para cada sección se compara la captura `docs/qa/<nombre>-1920.png`
con `docs/stitch/stitch_daw_exam_study_platform/<carpeta>/screen.png`.
Se documentan las diferencias que quedan tras la ronda de correcciones v2.

---

### B.1 Introducción

| Captura nueva (docs/qa/) | Referencia Stitch |
|--------------------------|-------------------|
| `visor-intro-1920.png` | `visor_resumen_introducci_n/screen.png` |
| `visor-intro-1366.png` | — |
| `visor-intro-375.png`  | — |

| # | Elemento | Stitch | Nuevo | Estado |
|---|----------|--------|-------|--------|
| 1 | Cabecera unidad | Breadcrumb + kicker (nombre completo LM) + "Unidad 1" (display grande) + subtítulo — A ANCHO COMPLETO sobre dos columnas | **CORREGIDO** — idéntica estructura: breadcrumb "← Unidades / LM-U01", kicker "LENGUAJE DE MARCAS Y SISTEMAS DE GESTIÓN DE LA INFORMACIÓN", "Unidad 1" en display, subtítulo en outline | ✅ PASS |
| 2 | Nav lateral — panel | Stitch intro: nav SIN panel (items de texto sueltos sin fondo ni borde) | **CORREGIDO** — nav sin background ni border-right; items flotantes con hover sutil | ✅ PASS |
| 3 | Nav lateral — ítem activo | Píldora redondeada, `bg-surface-container`, `box-shadow inset 2px primary`, punto (●) a la derecha | **CORREGIDO** — idéntico comportamiento con `.nav-dot` de 6px y `box-shadow: inset 2px 0 0 0 var(--primary)` | ✅ PASS |
| 4 | Etiquetas nav | "Introducción", "1.1 Clasificación", "1.2 Ámbitos"… (cortas) | **CORREGIDO** — campo `short` del JSON; ítems cortos en nav | ✅ PASS |
| 5 | Nav Autoevaluación | Badge "10 Q" | **CORREGIDO** — `${quizCount} Q` dinámico; ya no dice "Quiz" | ✅ PASS |
| 6 | Global nav header | Stitch muestra barra superior fija con links (Inicio, Asignaturas…) | No existe; se oculta en summary mode (decisión de diseño preexistente) | Mantenido — diferencia menor, sin ruta limpia para añadir la nav global sin afectar el layout completo |

---

### B.2 Sección 1.1 — Clasificación

| Captura nueva | Referencia Stitch |
|--------------|-------------------|
| `visor-s1-clasificacion-1920.png` | `visor_resumen_1.1_clasificaci_n/screen.png` |

| # | Elemento | Stitch | Nuevo | Estado |
|---|----------|--------|-------|--------|
| 1 | Cards tipo 1/2/3 | Fondo ligeramente diferente por tipo | Fondo uniforme `--surface-variant` para los tres | Mantenido — distinción por color de fondo no está en el token set; las tarjetas son legibles |
| 2 | Acordeones | Íconos `+/−` a la derecha, fondo agrupado | Implementado identicamente | ✅ PASS |

---

### B.3 Sección 1.3 — Evolución

| Captura nueva | Referencia Stitch |
|--------------|-------------------|
| `visor-s3-evolucion-1920.png` | `visor_resumen_1.3_evoluci_n/screen.png` |

| # | Elemento | Stitch | Nuevo | Estado |
|---|----------|--------|-------|--------|
| 1 | Timeline | Bullets circulares purple, tarjeta expandible por item | Timeline con bullets `--primary-container`, año + título + detalle flat | Mantenido — diferencia cosmética de profundidad; contenido completo |

---

### B.4 Sección 1.4 — Flipcards

| Captura nueva | Referencia Stitch |
|--------------|-------------------|
| `visor-s4-etiquetas-1920.png` | `visor_resumen_1.4_etiquetas_y_atributos/screen.png` |

| # | Elemento | Stitch | Nuevo | Estado |
|---|----------|--------|-------|--------|
| 1 | Altura uniforme de flipcards | 3 cards misma altura en fila | **CORREGIDO** — `height:100%` en `.flipcard` y `.flipcard-inner`; `align-items:stretch` en grid | ✅ PASS |
| 2 | Tabla "Anatomía y sintaxis" | Tabla comparativa 4 columnas + bloque de código | No está en el JSON piloto (ausencia de contenido, no bug del renderer) | Pendiente Fase 3 (añadir al JSON) |

---

### B.5 Glosario

| # | Stitch | Nuevo | Estado |
|---|--------|-------|--------|
| 1 | Buscador + lista term/def | Idéntico | ✅ PASS |
| 2 | Badges de categoría por término | No implementado | Mantenido — los badges de categoría requieren un campo `category` en cada glosario que no existe en el schema; no es prioritario |

---

### B.6 Quiz — Respondiendo

| # | Stitch | Nuevo | Estado |
|---|--------|-------|--------|
| 1 | Preguntas en tarjetas | **CORREGIDO** — cada `.quiz-item` con `background: var(--surface-container)`, `border`, `border-radius` | ✅ PASS |
| 2 | Barra de progreso visual | Sin barra de progreso; contador de texto | Mantenido — la barra requiere un contenedor adicional; el contador "X / 10 respondidas" es suficiente para v1 |

---

### B.7 Quiz — Revisión

| Captura nueva | Referencia Stitch |
|--------------|-------------------|
| `visor-quiz-revisada-1920.png` | `visor_resumen_autoevaluaci_n_revisi_n_y_feedback/screen.png` |

| # | Elemento | Stitch | Nuevo | Estado |
|---|----------|--------|-------|--------|
| 1 | Score card arriba | Score card ARRIBA antes de las preguntas | **CORREGIDO** — `topHtml` se renderiza antes que `items` | ✅ PASS |
| 2 | Badge resultado por pregunta | Píldora `Acertada`/`Fallida` alineada a la derecha del título de cada pregunta | **CORREGIDO** — `.quiz-badge-inline` en `.quiz-q-header` con `justify-content:space-between` | ✅ PASS |
| 3 | Plural correcto | "1 correcta / 9 incorrectas" | **CORREGIDO** — lógica `correct === 1 ? 'correcta' : 'correctas'` | ✅ PASS |
| 4 | Reintentar arriba | Botones reintentar/test junto al score card | **CORREGIDO** — `quiz-footer` justo debajo del score card | ✅ PASS |

---

## C. Defectos resueltos en esta ronda (v2)

| # | Defecto | Fix aplicado |
|---|---------|-------------|
| 1 | Cabecera dentro de columna derecha | Movida a `.summary-page-header` sobre el grid |
| 2 | Nav con panel de fondo | Eliminados `background` y `border-right` de `.summary-nav` |
| 3 | Ítems nav sin etiqueta corta | Campo `short` en JSON + JS fallback a `label` |
| 4 | Sticky nav roto en autoevaluación | `top: 0` en CSS; eliminada dependencia de JS hack |
| 5 | Kicker con nombre corto | `SUBJECT_FULL_NAMES` map |
| 6 | Flipcards alturas inconsistentes | `height: 100%` en `.flipcard` y `.flipcard-inner` |
| 7 | Score card quiz al fondo | Renderizado como `topHtml` antes de preguntas |
| 8 | Badge resultado como div de ancho completo | Reemplazado por `.quiz-badge-inline` pill alineado a la derecha |
| 9 | Plural "correctas" siempre plural | Condicional `correct === 1 ? 'correcta' : 'correctas'` |
| 10 | Badge nav quiz = "Quiz" fijo | Dinámico `${quizCount} Q` |

---

## D. Diferencias que permanecen (justificadas)

| # | Diferencia vs Stitch | Por qué se mantiene |
|---|---------------------|---------------------|
| 1 | Sin global nav header en summary mode | Decisión de diseño preexistente; añadir la barra requiere refactor de layout |
| 2 | Cards tipo 1/2/3 mismo color de fondo | No hay tokens de diferenciación por tipo en el design system; legibilidad no afectada |
| 3 | Timeline plano vs tarjeta expandible | La diferencia es cosmética; el contenido está íntegro |
| 4 | Sin barra de progreso en quiz respondiendo | Contador de texto cubre la necesidad; barra es mejora menor para Fase 3 |
| 5 | Sin badges de categoría en glosario | Requiere campo `category` no definido en el schema actual |
| 6 | Tabla "Anatomía y sintaxis" s4 ausente | Contenido pendiente en JSON, no bug del renderer |
| 7 | Nav usa íconos de Material Symbols en Stitch | Stitch los tiene vía CDN de Google Fonts; nuestra build no lo carga |

---

## E. Contraste WCAG (sin cambios desde v1)

| Par | Ratio | Req AA | Resultado |
|-----|-------|--------|-----------|
| `--success` / `--success-bg` | 8.45:1 | ≥4.5:1 | ✅ PASS |
| `--error` / `--error-bg` | 8.74:1 | ≥4.5:1 | ✅ PASS |
| `--on-surface` / `--surface-container` | 12.66:1 | ≥4.5:1 | ✅ PASS |
| `--primary` / `--surface-container` | 9.57:1 | ≥4.5:1 | ✅ PASS |

---

## F. Veredicto v2

**APROBADO** — los 7 puntos del prompt de corrección están implementados y verificados.
Los 7 defectos pendientes de la tabla D son diferencias cosméticas o de contenido (no de
renderer), todas documentadas con justificación. Ningún defecto rompe funcionalidad ni
legibilidad. Listo para Fase 3 (JSONs restantes) una vez el usuario dé aprobación.
