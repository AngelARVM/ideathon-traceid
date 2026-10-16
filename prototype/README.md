# prototype/ — referencia visual, no es código de la app

Prototipo de UI generado en AI Studio y migrado a Next.js (commit `4272b37`). Todo funciona sobre
datos simulados (`lib/traceApi.ts`: hash falso, latencia y fallos aleatorios, sesión en
`localStorage`).

Se conserva **solo como referencia visual** (paleta, tipografías, composición de pantallas) para
las etapas S2 y S5. No se compila, no se lintea y no lo sirve Next.js: está excluido en
`tsconfig.json` y `biome.json`, y los imports `@/…` ya no resuelven desde acá.

Al implementar una pantalla real, copiá lo visual que sirva a `src/` y reescribí los datos contra
el modelo de `docs/05-data-model.md`. No importes nada desde esta carpeta.
