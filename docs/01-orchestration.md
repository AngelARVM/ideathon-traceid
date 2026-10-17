# SubMarket: cómo orquestar el trabajo en paralelo

**Para:** el equipo, que decide qué persona pone a trabajar a su agente sobre cada hito.
**Contrato común:** [`00-mvp-spec.md`](./00-mvp-spec.md). **Specs por hito:** [`specs/`](./specs/).
**Presupuesto:** unas 3 h hasta la entrega.

## 1. Mapa de hitos

```
                  ┌──► M1 Ofertas ─────────────┐
                  │                            │
 M0 Bootstrap ────┼──► M3 Negociación/acuerdos ┼──► M5 Integración y entrega
  (secuencial)    │                            │      (secuencial)
                  ├──► M2 Demandas ────────────┤
                  │                            │
                  └──► M4 Home/personas ───────┘
```

| Hito | Spec | Depende de | Prioridad para la demo | Estimado |
|---|---|---|---|---|
| M0 | [M0-bootstrap](./specs/M0-bootstrap.md) | — | Bloqueante | 40–50 min |
| M1 | [M1-offers](./specs/M1-offers.md) | M0 | **Crítica**: sin catálogo y detalle no hay entrada a la negociación | 60–75 min |
| M3 | [M3-negotiation-agreements](./specs/M3-negotiation-agreements.md) | M0. Integra con M1 solo por un enlace. | **Crítica**: es el corazón de la demo | 75–90 min |
| M2 | [M2-demands](./specs/M2-demands.md) | M0 | Alta: es la diferenciación "compatibles" | 45–60 min |
| M4 | [M4-home-personas](./specs/M4-home-personas.md) | M0 | Media: M0 ya deja una home funcional mínima | 40–50 min |
| M5 | [M5-integration-qa](./specs/M5-integration-qa.md) | M1–M4 | Bloqueante para entregar | 30–40 min |

## 2. Cronograma sugerido (T = arranque)

| Tramo | Qué pasa |
|---|---|
| **T+0:00 → T+0:45** | **Un** agente hace M0. Mientras tanto, el resto del equipo lee `00-mvp-spec.md` y su hito, y hojea el PDF. Quien maneja Vercel prepara `PERSONA_SECRET` en el proyecto. **Nadie** escribe código de M1–M4 antes de que M0 esté commiteado: sin el esquema y los módulos compartidos, nada compila. |
| **T+0:45** | Commit de M0. Cada agente paralelo crea su rama desde ese commit. La persona de Vercel corre la migración y el seed contra la base remota (D15) y prueba el deploy. |
| **T+0:45 → T+2:15** | M1, M2, M3 y M4 en paralelo. A los 45 minutos de este tramo (T+1:30), checkpoint de 5 min en el que cada uno dice "voy bien / voy atrasado" (§6). |
| **T+2:15 → T+2:45** | M5: merges, build, guion de demo en local, deploy y guion en Vercel. |
| **T+2:45 → T+3:00** | Margen. `--reset-demo` en Vercel. Nadie mergea nada nuevo. |

## 3. Cómo repartir según cuántos agentes haya

| Agentes en paralelo | Reparto recomendado |
|---|---|
| **4** | Uno por hito: M1, M2, M3 y M4. |
| **3** | M1 · M3 · **M2 y después M4** en el mismo agente. M4 se recorta a "selector de personas + categorías + lotes cercanos" si no llega. |
| **2** | M1 y después M2 · M3 y después M4. |

Asignar **M3** a la persona o el agente con más contexto del dominio, y **M4** a alguien que pueda mirar el resultado contra el PDF. El agente que hizo M0 puede tomar M1 o M3 sin perder contexto.

## 4. Reglas de integración

1. **Propiedad de archivos.** Cada spec lista los archivos que su hito puede tocar. Ningún hito edita archivos de otro, ni los compartidos de §12.1 del contrato, ni `prisma/schema.prisma`. Si de verdad hace falta un cambio compartido:
   - se pide en el canal del equipo;
   - lo hace **una** persona en `main`;
   - los demás hacen rebase.
2. **Ramas.** `m1-offers`, `m2-demands`, `m3-negotiation` y `m4-home`, todas desde el commit de M0. Commits pequeños.
3. **Orden de merge a `main` en M5:** M1, después M3, después M2, después M4. Con la propiedad de archivos respetada no debería haber conflictos. El orden prioriza tener primero el camino crítico de la demo (§13, pasos 2–6).
4. **Merge temprano permitido.** Si M1 termina antes, se mergea apenas pase `typecheck`, `lint` y su definición de terminado. M3 puede así probar el flujo completo antes de M5.
5. **Antes de cada merge:** `npm run typecheck && npm run lint && npm run build`.
6. **Base de datos.** Cada agente usa su Postgres **local** (`make db`). Nadie apunta a la base de Vercel salvo la persona responsable (D15). Para repetir pruebas: `npm run db:seed -- --reset-demo`.
7. **Puerto.** `make up` busca un puerto libre, así que varios agentes en la misma máquina no chocan. Si comparten base local, `--reset-demo` le borra las propuestas al otro. Avisar antes de correrlo.

## 5. Cómo lanzar a cada agente

Prompt sugerido, que se adapta según el hito:

> Estás implementando el hito **M\<n\>** de SubMarket. Leé, en este orden: `AGENTS.md`, `docs/00-mvp-spec.md` y `docs/specs/M<n>-<nombre>.md`. El spec del hito define los archivos que podés tocar: no modifiques nada fuera de esa lista; si necesitás un cambio compartido, detenete y avisá. Antes de escribir código Next.js, leé las guías de `node_modules/next/dist/docs/` que cita el spec. Trabajá en la rama `m<n>-<nombre>`. No corras comandos contra bases remotas. Terminá cuando se cumpla la "Definición de terminado" del spec, y reportá qué verificaste y qué no.

## 6. Plan de recorte si el tiempo no alcanza

En el checkpoint de T+1:30, se recorta en este orden. Lo primero de la lista es lo primero que se saca:

1. **M4:** solo el selector de personas sin persona, más categorías y lotes cercanos con persona. Se sacan las demandas de la home y "Cómo funciona".
2. **M2:** se saca la edición de demandas. Quedan crear, retirar y el detalle con compatibles, que es lo que se demuestra.
3. **M1:** se sacan los filtros `minKcal` y `presentation`. Se mantienen categoría, radio, disponibilidad y humedad.
4. **M3:** nunca se recorta el camino propuesta → contraoferta → confirmar → comprobante. Si aprieta, se sacan `/agreements` (la lista; el detalle queda) y el aviso de stock en la aceptación.
5. **M5:** los tests con base pasan a ser opcionales. Los tests puros y el guion de demo son obligatorios.

Lo que **nunca** se recorta, porque es la condición de la demo (brief §9):

- publicar, editar y retirar ofertas;
- filtrar por cercanía;
- proponer, aceptar o contraofertar, y confirmar;
- el comprobante visible solo para las partes;
- el stock actualizado;
- la oferta estimada diferenciada y no confirmable.

## 7. Señales de alarma

- Un hito modificó `schema.prisma` o un archivo de §12.1 sin avisar: frenar y reconciliar antes de seguir.
- Hay errores de "blocking route" o de `cookies()` fuera de `<Suspense>` en dev: revisar §7 del contrato, no desactivar `cacheComponents` por cuenta propia.
- Las distancias no coinciden con §13: revisar las coordenadas del seed antes que la fórmula.
- Alguien quiere correr `prisma migrate reset` o el seed con `--allow-remote` desde un agente: no.
