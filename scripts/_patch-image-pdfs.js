'use strict';
const fs = require('fs');
const path = require('path');

function load(rel) {
  const p = path.join(__dirname, '..', rel);
  return { p, j: JSON.parse(fs.readFileSync(p, 'utf8')) };
}
function save({ p, j }) {
  fs.writeFileSync(p, JSON.stringify(j, null, 2), 'utf8');
  console.log('saved', path.relative(path.join(__dirname, '..'), p));
}

// ── prog/u1 s8 — Diagramas de flujo ──────────────────────────────────────
{
  const f = load('data/prog/u1.resumen.json');
  const s8 = f.j.sections.find(s => s.id === 's8');
  if (!s8) { console.error('prog/u1: s8 not found'); process.exit(1); }

  // Replace/update the symbols table with official ANSI names
  const tableIdx = s8.blocks.findIndex(b => b.type === 'table');
  const newTable = {
    type: 'table',
    headers: ['Simbolo ANSI', 'Nombre oficial', 'Uso'],
    rows: [
      ['Flecha / Linea', 'Linea de flujo', 'Indica la direccion y secuencia del proceso'],
      ['Cometa / Globo', 'Anotacion', 'Agrega comentarios o aclaraciones al diagrama'],
      ['Paralelogramo', 'Entrada / Salida', 'Representa lectura de datos o escritura de resultados'],
      ['Rectangulo', 'Proceso', 'Operacion o instruccion de calculo o asignacion'],
      ['Rombo', 'Decision', 'Bifurcacion condicional: si / no o verdadero / falso'],
      ['Ovalo / Elipse', 'Terminal', 'Marca el inicio (Inicio) o el fin (Fin) del diagrama'],
      ['Rectangulo doble', 'Proceso predefinido', 'Invoca una subrutina o procedimiento ya definido'],
      ['Paralelogramo', 'Proceso / Salida', 'Impresion o visualizacion de resultados en pantalla'],
      ['Circulo pequeno', 'Conector de pagina', 'Une partes del diagrama en la misma pagina'],
      ['Pentagono', 'Conector fuera de pagina', 'Enlaza con una continuacion en pagina diferente']
    ]
  };
  if (tableIdx >= 0) s8.blocks[tableIdx] = newTable;
  else s8.blocks.push(newTable);

  // Add cards block for the 3 structural control types (if not present)
  const hasCards = s8.blocks.some(b => b.type === 'cards');
  if (!hasCards) {
    s8.blocks.push({
      type: 'cards',
      items: [
        {
          kicker: 'Estructura 1',
          title: 'Secuencial',
          desc: 'Las instrucciones se ejecutan una tras otra en el orden en que aparecen, sin bifurcaciones ni repeticiones.',
          example: 'Leer A → Calcular B = A*2 → Mostrar B'
        },
        {
          kicker: 'Estructura 2',
          title: 'Alternativa simple',
          desc: 'Un rombo de decision evalua una condicion. Si es verdadera se ejecuta un bloque; si es falsa se salta (IF sin ELSE).',
          example: 'Si nota >= 5 entonces mostrar "Aprobado"'
        },
        {
          kicker: 'Estructura 3',
          title: 'Alternativa doble',
          desc: 'Un rombo de decision con dos ramas: una para la condicion verdadera y otra para la falsa (IF-ELSE).',
          example: 'Si nota >= 5 entonces "Aprobado" sino "Suspenso"'
        }
      ]
    });
  }

  f.j._sources = f.j._sources || {};
  f.j._sources['s8'] = 'U1 Diagrama de flujo.pdf (infografia — simbolos ANSI y estructuras de control)';
  save(f);
}

// ── ipe/u1 s9 — Tipos de personas juridicas ──────────────────────────────
{
  const f = load('data/ipe/u1.resumen.json');
  const s9 = f.j.sections.find(s => s.id === 's9');
  if (!s9) { console.error('ipe/u1: s9 not found'); process.exit(1); }

  const hasCards = s9.blocks.some(b => b.type === 'cards');
  if (!hasCards) {
    s9.blocks.push({
      type: 'cards',
      items: [
        {
          kicker: 'S.A.',
          title: 'Sociedad Anonima',
          desc: 'Capital minimo 60.000 EUR dividido en acciones libremente transmisibles. Responsabilidad limitada al capital aportado. Apta para grandes empresas y cotizacion en bolsa.'
        },
        {
          kicker: 'S.L.',
          title: 'Sociedad de Responsabilidad Limitada',
          desc: 'Capital minimo 1 EUR dividido en participaciones (no acciones). Transmision restringida. La forma mas usada por PYMES en Espana.'
        },
        {
          kicker: 'S.L.N.E.',
          title: 'Sociedad Limitada Nueva Empresa',
          desc: 'Variante simplificada de la S.L. para emprendedores. Constitucion rapida telematica. Capital minimo 1 EUR, maximo 120.202 EUR.'
        },
        {
          kicker: 'S.Coop.',
          title: 'Sociedad Cooperativa',
          desc: 'Agrupacion de personas con actividad empresarial comun. Los socios participan en la gestion y reparten los resultados segun su actividad. Puede ser de primero o segundo grado.'
        },
        {
          kicker: 'S.C.',
          title: 'Sociedad Colectiva',
          desc: 'Todos los socios responden ilimitada y solidariamente de las deudas sociales con su patrimonio personal. Poco usada por el alto riesgo personal.'
        },
        {
          kicker: 'S.Com.',
          title: 'Sociedad Comanditaria',
          desc: 'Dos tipos de socios: colectivos (gestion y responsabilidad ilimitada) y comanditarios (solo aportan capital y su responsabilidad es limitada).'
        },
        {
          kicker: 'S.A.L./S.L.L.',
          title: 'Sociedad Laboral',
          desc: 'S.A. o S.L. en la que la mayoria del capital pertenece a trabajadores con contrato indefinido. Fomenta la participacion de los empleados en la empresa.'
        },
        {
          kicker: 'S.A.T.',
          title: 'Sociedad Agraria de Transformacion',
          desc: 'Entidad para la produccion, transformacion y comercializacion de productos agricolas, ganaderos o forestales. Sin animo de lucro predominante.'
        }
      ]
    });
  }

  f.j._sources = f.j._sources || {};
  f.j._sources['s9'] = 'Infografia - U1 Personas juridicas.pdf (tipos de sociedades mercantiles)';
  save(f);
}

// ── ipe/u2 s9 — IRPF ─────────────────────────────────────────────────────
{
  const f = load('data/ipe/u2.resumen.json');
  const s9 = f.j.sections.find(s => s.id === 's9');
  if (!s9) { console.error('ipe/u2: s9 not found'); process.exit(1); }

  const noteExists = s9.blocks.some(
    b => b.type === 'text' && b.content && b.content.includes('ingresos aporta al Estado')
  );
  if (!noteExists) {
    s9.blocks.unshift({
      type: 'text',
      content: 'El IRPF es el impuesto que mas ingresos aporta al Estado, por encima del IVA y del Impuesto sobre Sociedades. Grava la renta obtenida durante el ano natural por las personas fisicas residentes en Espana.'
    });
  }

  f.j._sources = f.j._sources || {};
  f.j._sources['s9'] = 'Resumen_IRPF. Preguntas mas comunes.pdf (relevancia recaudatoria del IRPF)';
  save(f);
}

// ── lm/u2 s2 — Evolucion del HTML ────────────────────────────────────────
{
  const f = load('data/lm/u2.resumen.json');
  const s2 = f.j.sections.find(s => s.id === 's2');
  if (!s2) { console.error('lm/u2: s2 not found'); process.exit(1); }

  const hasTimeline = s2.blocks.some(b => b.type === 'timeline');
  if (!hasTimeline) {
    s2.blocks.push({
      type: 'timeline',
      items: [
        { year: '1991', label: 'HTML 1.0', detail: 'Primera propuesta de Tim Berners-Lee para compartir documentos en el CERN.' },
        { year: '1995', label: 'HTML 2.0', detail: 'Primera especificacion formal publicada por el IETF. Establece la base del lenguaje.' },
        { year: '1997', label: 'HTML 3.2', detail: 'W3C publica la primera recomendacion oficial. Incluye tablas, applets y texto alrededor de imagenes.' },
        { year: '1997', label: 'HTML 4.0', detail: 'Introduce hojas de estilo (CSS), scripts y mayor accesibilidad.' },
        { year: '1999', label: 'HTML 4.01', detail: 'Version estable de referencia durante mas de una decada. Tres variantes: Strict, Transitional, Frameset.' },
        { year: '2014', label: 'HTML5', detail: 'Gran salto: audio, video, canvas, APIs de geolocalizacion, almacenamiento local y semantica enriquecida. Sigue evolucionando como "living standard".' }
      ]
    });
  }

  f.j._sources = f.j._sources || {};
  f.j._sources['s2'] = 'Diapositivas del directo lunes 28 de septiembre de 2026.pdf (linea temporal HTML)';
  save(f);
}

console.log('\nDone.');
