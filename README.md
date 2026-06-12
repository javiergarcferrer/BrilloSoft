# Licitaciones RD

Aplicación web para explorar y buscar procesos de compras y licitaciones públicas de
República Dominicana, construida sobre la [API de datos abiertos de la DGCP](https://datosabiertos.dgcp.gob.do/api-dgcp/docs/index.html).

## Funcionalidades

- **Buscador en vivo** de procesos publicados, con búsqueda por palabra clave
  (título, descripción, institución, código) sin acentos ni mayúsculas.
- **Filtros**: estado del proceso, modalidad, rango de fechas de publicación y
  procesos dirigidos a MIPYMES.
- **Orden**: más recientes, cierre de ofertas más próximo, mayor/menor monto.
- **Alertas de cierre**: cada tarjeta indica cuántos días faltan para el fin de
  recepción de ofertas (rojo ≤ 2 días, ámbar ≤ 7).
- **Detalle del proceso**: cronograma completo, montos, artículos solicitados con
  precios estimados, documentos descargables y enlace directo al Portal
  Transaccional.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Sin base de datos: las rutas API (`app/api/procesos`) hacen proxy a la DGCP con
  caché de 5 minutos. La búsqueda por texto escanea hasta 6,000 registros del rango
  de fechas seleccionado y filtra en el servidor.

## Desarrollo

```bash
npm install
npm run dev
```

## Despliegue

Pensada para Vercel: push a `main` y se despliega sola. No requiere variables de
entorno.
