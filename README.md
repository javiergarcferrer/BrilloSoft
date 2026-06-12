# Licitaciones RD

Aplicación web para encontrar oportunidades de compras públicas de República
Dominicana y saber **qué piden y cómo proceder** en cada una, construida sobre la
[API de datos abiertos de la DGCP](https://datosabiertos.dgcp.gob.do/api-dgcp/docs/index.html).

## Funcionalidades

**Encontrar**

- Buscador en vivo con búsqueda por palabra clave insensible a acentos y
  mayúsculas (título, descripción, institución, código).
- Filtros: estado, modalidad, institución (autocompletado sobre las ~705
  unidades de compra activas), rango de fechas y dirigidos a MIPYMES; presets de
  un toque (Abiertas ahora, Cierran pronto, Mayor monto, Para MIPYMES).
- Los filtros viven en la URL: cualquier búsqueda se puede compartir o guardar.
- Panel `/estadisticas`: panorama del mercado de los últimos 30 días.

**Decidir**

- Detalle por proceso: cronograma, monto, artículos con precios estimados y
  total, documentos con el pliego/fichas destacados como "Empieza por aquí".
- **Precios históricos de adjudicación** por subclase UNSPSC (mín/mediana/máx
  realmente contratados + ejemplos enlazados) para cotizar con datos.
- **Adjudicación — quién ganó**: proveedor, RPE, monto y enlace al contrato.

**Proceder**

- Checklist "Cómo participar" según el estado del proceso (pliego → RPE →
  preparar oferta → presentar a tiempo), con enlaces a la DGCP y al Portal
  Transaccional.
- `/guia`: guía completa para nuevos proveedores (RPE, modalidades, documentos
  habituales, glosario de estados, consejos).

**Seguir**

- Seguimiento ★ (localStorage) con la vista `/seguimiento` ordenada por cierre.
- Exportar resultados a CSV.
- **RSS por búsqueda** (`/api/feed?q=…`): suscríbete a una palabra clave desde
  cualquier lector RSS/Zapier/Slack y entérate de los procesos nuevos.
- Compartir cualquier proceso por WhatsApp o copiar enlace.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4.
- Sin base de datos ni variables de entorno: las rutas API hacen proxy a la DGCP
  con caché (5 min listados, 1 h precios, 24 h instituciones), timeout de 25 s y
  un reintento.
- La búsqueda por texto escanea hasta 6,000 registros del rango de fechas y
  filtra en el servidor.

## Desarrollo

```bash
npm install
npm run dev
```

## Despliegue

Pensada para Vercel: push a `main` y se despliega sola.
