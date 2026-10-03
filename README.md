# Generador de Exámenes DAW

Simulador de exámenes y visor de resúmenes interactivos para el Grado Superior DAW. Lee los ficheros `.txt` y `.json` del disco en tiempo real y no requiere reinicios al añadir contenido nuevo.

## Instalación y arranque

```bash
npm install
npm run dev      # desarrollo — terminal abierta, logs en pantalla
```

Para uso normal en segundo plano (con pm2):

```bash
npm install -g pm2          # una sola vez
npm start                   # arranca en segundo plano
```

Abre el navegador en **http://localhost:3000**

## Scripts npm

| Comando | Acción |
|---------|--------|
| `npm run dev` | Servidor en primer plano con logs |
| `npm start` | Servidor en segundo plano (pm2) |
| `npm run validate` | Valida todos los ficheros `data/*/u*.resumen.json` |
| `npm run qa` | QA Playwright sobre todos los resúmenes |

## Gestión con pm2

| Comando | Acción |
|---------|--------|
| `pm2 start server.js --name examenes-daw` | Primer arranque |
| `pm2 restart examenes-daw` | Reiniciar tras cambios en el código |
| `pm2 logs examenes-daw` | Ver logs en tiempo real |
| `pm2 stop examenes-daw` | Parar el servidor |
| `pm2 delete examenes-daw` | Eliminar el proceso de pm2 |
| `pm2 startup` | Arranque automático al iniciar el sistema |

## Estructura de carpetas

```
Generador de Exámenes/
├── server.js
├── package.json
├── public/
│   ├── index.html        ← Simulador de exámenes
│   └── summaries.html    ← Visor de resúmenes interactivos
└── data/
    └── si/               ← Sistemas Informáticos (ejemplo)
        ├── u1.txt
        ├── u2.txt
        ├── ps.txt             ← Prueba semestral (opcional)
        └── u1.resumen.json    ← Resumen interactivo (opcional)
```

## Escalabilidad automática

| Acción | Efecto sin tocar el código |
|--------|---------------------------|
| Crear carpeta `data/ed/` con sus `.txt` | Nueva asignatura aparece en el menú |
| Añadir `u8.txt` a `data/si/` | Modo 2 (examen conjunto) la incluye |
| Añadir `ps.txt` a cualquier asignatura | Activa el Modo 3 (simulacro final) |
| Añadir `u1.resumen.json` a cualquier asignatura | La unidad aparece en Resúmenes |

## Modos de examen

- **Modo 1 — Por unidad**: todas las preguntas de la unidad elegida, en orden aleatorio
- **Modo 2 — Conjunto**: mezcla de todas las unidades de la asignatura
- **Modo 3 — Simulacro final**: 25 preguntas de `ps.txt` + 15 de las unidades (solo si existe `ps.txt`)

## Sistema de puntuación

| Resultado | Puntos |
|-----------|--------|
| Acierto | +0.25 |
| Fallo | −(0.25 / 3) |
| En blanco | 0 |

La nota final se escala a 10. El modo por unidad no aplica penalización.

## Formato de los ficheros `.txt`

Exportación estándar de Moodle. Cada pregunta sigue el patrón:

```
Pregunta NRespuesta

A.
Opción A

B.
Opción B

C.
Opción C

D.
Opción D
Retroalimentación
La respuesta correcta es: Opción correcta
```

También se soporta el formato nativo `PREGUNTA: / A: / B: / C: / D: / RESPUESTA: / EXPLICACION:`.

## Resúmenes Interactivos

Accesibles en **http://localhost:3000/summaries.html**. Cada unidad se define en un fichero JSON independiente.

**Ubicación:** `data/<asignatura>/u<N>.resumen.json`

**Cómo añadir una unidad:**
1. Crear `data/<asignatura>/u<N>.resumen.json` con la estructura requerida.
2. Ejecutar `npm run validate` y corregir los errores que reporte.
3. Reiniciar el servidor (`pm2 restart examenes-daw` o `npm run dev`).
4. Abrir `/summaries.html`, verificar que aparece la unidad y ejecutar `npm run qa`.

**Tipos de bloque disponibles:**

| Tipo | Uso |
|------|-----|
| `text` | Párrafo de texto plano |
| `cards` | Tarjetas con título, subtítulo y descripción |
| `accordion` | Lista colapsable de título + contenido |
| `timeline` | Línea temporal con año, etiqueta y detalle |
| `flipcards` | Tarjetas giratorias término / definición |
| `chips` | Etiquetas visuales (lista de strings) |
| `table` | Tabla con cabeceras y filas |
| `code` | Bloque de código con fuente monospace |
