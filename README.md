# Generador de Exámenes DAW

Simulador de exámenes para el Grado Superior DAW. Lee los ficheros `.txt` del disco en tiempo real y no requiere reinicios al añadir contenido nuevo.

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
│   └── index.html
├── si/          ← Sistemas Informáticos
│   ├── u1.txt
│   ├── u2.txt
│   └── ps.txt   ← Prueba semestral (opcional)
├── ed/          ← Entornos de Desarrollo (cuando exista)
└── bd/          ← Bases de Datos (cuando exista)
```

## Escalabilidad automática

| Acción | Efecto sin tocar el código |
|--------|---------------------------|
| Crear carpeta `ed/` con sus `.txt` | Nueva asignatura aparece en el menú |
| Añadir `u8.txt` a `si/` | Modo 2 (examen conjunto) la incluye |
| Añadir `ps.txt` a cualquier asignatura | Activa el Modo 3 (simulacro final) |

## Modos de examen

- **Modo 1 — Por unidad**: todas las preguntas de la unidad elegida, en orden aleatorio
- **Modo 2 — Conjunto**: mezcla de todas las unidades de la asignatura
- **Modo 3 — Simulacro final**: 25 preguntas de `ps.txt` + 15 de las unidades → 40 en total (solo si existe `ps.txt`)

## Sistema de puntuación

| Resultado | Puntos |
|-----------|--------|
| Acierto | +0.25 |
| Fallo | −(0.25 / 3) |
| En blanco | 0 |

La nota final se escala a 10.

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
