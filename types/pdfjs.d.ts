// pdfjs-dist no publica un mapa `exports`, así que TypeScript no resuelve el
// import por ruta directa. El contrato que la plataforma usa está declarado
// en `components/lector-pdf.tsx`; aquí solo se abre la puerta al módulo.
declare module "pdfjs-dist/legacy/build/pdf.mjs";
