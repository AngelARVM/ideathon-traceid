# SubMarket

**Lo que sobra, vale.** Marketplace regional de subproductos agroindustriales para el NEA (Corrientes, Misiones y Chaco).

**Staging:** https://ideathon-traceid.vercel.app/

> ⚠️ El ambiente de staging es una demo con recursos mínimos y **no soporta muchas conexiones simultáneas**. Si varias personas la usan a la vez puede responder lento o devolver errores momentáneos; en ese caso, esperar unos segundos y recargar. Para una prueba sin interferencias, levantar el proyecto en local (ver [Levantar el proyecto](#levantar-el-proyecto-en-local)).

---

## La idea

Tras la cosecha o el procesamiento agroindustrial quedan subproductos: cascarilla de arroz en los molinos, chips y aserrín en los aserraderos, pulpa en las plantas jugueras. Muchas veces su dueño no tiene un canal para venderlos y termina descartándolos, regalándolos o vendiéndolos a muy bajo precio.

Al mismo tiempo, otras actividades cercanas podrían usarlos como insumo: una granja avícola que necesita cama para los galpones, un secadero de yerba que busca biomasa para la caldera, un feedlot que suplementa la dieta del ganado. La información sobre qué hay disponible, dónde, cuánto y con qué características está dispersa, y la distancia puede decidir si una operación conviene o no.

**SubMarket conecta a quienes generan esos subproductos con compradores cercanos.** El vendedor publica una oferta; el comprador la encuentra por cercanía y características; negocian una propuesta, y la plataforma registra el acuerdo. Pago, flete y entrega ocurren fuera de la plataforma.

### Qué lo diferencia

1. **Foco en subproductos y remanentes**, no en commodities principales.
2. **Descubrimiento por cercanía**: cada oferta muestra la distancia aproximada al comprador y se puede filtrar por radio.
3. **Compatibilidad entre oferta y demanda**: por material, volumen, características (humedad, poder calorífico, presentación) y fecha de disponibilidad.
4. **Ofertas estimadas**: el vendedor puede anunciar un lote que todavía no generó (por ejemplo, la próxima zafra) para anticipar compradores.
5. **Registro del acuerdo**: un comprobante con los términos finales, visible solo para las dos partes, sin intervenir en el dinero.

---

## Funcionalidades

**Para quien vende**

- Publicar, editar y retirar ofertas de un subproducto, con cantidad en toneladas, precio de referencia en $/Tn, localidad y características (humedad, poder calorífico, presentación, flete, báscula y análisis de laboratorio declarado).
- Publicar ofertas **estimadas**, con fecha prevista; se pueden negociar, pero no confirmar hasta que el vendedor las marque como disponibles.
- Ver las demandas de los compradores y responder con una oferta precargada desde la demanda.
- Recibir propuestas y **aceptarlas, rechazarlas o hacer una contraoferta** (una sola vez).
- Panel "Mis ofertas" con inventario, ofertas estimadas, retiradas y acuerdos cerrados.

**Para quien compra**

- Explorar el catálogo con filtros por categoría, radio de distancia, provincia, disponibilidad, humedad máxima, poder calorífico mínimo, presentación, precio máximo, stock mínimo, báscula y búsqueda por texto; ordenar por distancia, precio, stock o antigüedad.
- Ver el detalle de cada oferta con su distancia aproximada y una calculadora de carga que lleva directo a proponer.
- Enviar una propuesta de cantidad, precio y mensaje; aceptar o rechazar la contraoferta del vendedor.
- Publicar **demandas** y ver las ofertas compatibles (misma categoría, dentro del radio, disponibles a tiempo), con indicaciones como "cubre X de Y Tn" o "sobre tu precio máximo".
- Confirmar el acuerdo con un comentario de cierre.

**Para ambos**

- Un contador en el encabezado indica cuántas propuestas esperan una acción.
- Al confirmar, el stock de la oferta se descuenta y se genera un **comprobante** con cantidad, precio, total y los datos de la oferta en ese momento. Solo lo ven comprador y vendedor; cualquier otra persona recibe "no encontrado".

---

## Cómo funciona la negociación

```
Comprador propone ──► Vendedor ──┬── acepta ───────────► Comprador confirma ──► Acuerdo
                                 ├── rechaza ──► fin (el comprador puede volver a proponer)
                                 └── contraoferta ──► Comprador ──┬── acepta ──► Acuerdo
                                                                  └── rechaza ──► fin
```

- Hay **una sola contraoferta** posible; no hay contra-contraoferta.
- Las propuestas **no reservan stock**. Si el vendedor acepta una cantidad mayor a la disponible, se le avisa, pero el control real ocurre al confirmar.
- La **confirmación** verifica y descuenta el stock en un solo paso: dos confirmaciones simultáneas no pueden vender la misma mercadería dos veces.
- Una oferta **estimada** admite propuestas y aceptación, pero la confirmación queda bloqueada, con el motivo visible, hasta que pase a disponible.

---

## Qué se simula y qué no

Es un **entorno demostrativo**: empresas, precios, volúmenes y operaciones son ficticios, y la app lo indica con un banner fijo.

- **Identidad simulada.** No hay login: se elige una de las personas de demo y la app la recuerda. Cualquiera puede elegir cualquier persona; dentro de esa identidad, los permisos sí se respetan (nadie puede editar ofertas ajenas ni ver acuerdos de otros).
- **Sin pagos ni facturación.** El acuerdo es "declarado" entre las partes; SubMarket no cobra ni procesa dinero.
- **Sin flete.** El flete es un dato informativo de la oferta; no se cotiza ni se contrata.
- **Sin verificación de calidad.** El análisis de laboratorio se muestra como "declarado por el vendedor, no verificado por SubMarket". No hay KYC, reputación ni certificación sanitaria. Los usos de cada subproducto se describen como "usos habituales", no como usos aprobados.
- **Distancias aproximadas.** Se calculan en línea recta entre los centros de cada localidad. No hay mapa ni direcciones exactas.

Quedan fuera del MVP, entre otros: chat en tiempo real, notificaciones, reputación, matching con IA, carrito con varias ofertas, reserva de stock y panel de administración.

---

## Personas de demo

| Persona | Rol | Localidad |
|---|---|---|
| Molinos del Iberá | Vendedor · molino arrocero | Mercedes (Corrientes) |
| Forestal Virasoro | Vendedor · aserradero y chipeadora | Gobernador Virasoro (Corrientes) |
| Citrícola Bella Vista | Vendedor · planta juguera | Bella Vista (Corrientes) |
| Granja Avícola Bella Vista | Comprador · producción avícola | Bella Vista (Corrientes) |
| Yerbatera Oberá | Comprador · secadero de yerba mate | Oberá (Misiones) |
| Feedlot Resistencia | Comprador · engorde bovino | Resistencia (Chaco) |

La persona se elige en la página de inicio y se cambia en cualquier momento desde el selector del encabezado, sin cerrar sesión. Así una sola persona puede recorrer la negociación de los dos lados.

Los datos precargados incluyen seis ofertas (cascarilla de arroz en Mercedes y Corrientes, chips de pino en Virasoro, aserrín en Santo Tomé, pulpa de cítricos fresca en Bella Vista y una oferta **estimada** de pulpa para la zafra 2027) y tres demandas (cascarilla para cama de pollo, chips para secadero y pulpa para suplementación).

---

## Guion de demo (≈ 10 minutos)

Funciona igual en staging y en local. Conviene empezar con los datos recién restaurados (ver [Restaurar los datos de demo](#restaurar-los-datos-de-demo)); si alguien ya usó la demo, los números de stock pueden diferir.

1. **Elegir comprador.** Abrir la página de inicio y elegir **Granja Avícola Bella Vista**.
2. **Buscar por cercanía.** En *Explorar*, filtrar por "Cascarilla de arroz" y radio de 200 km. Aparecen las ofertas de Corrientes (≈ 118 km) y Mercedes (≈ 120 km), ordenadas por distancia.
3. **Ver la oferta y proponer.** Abrir la oferta de Mercedes: distancia, humedad, poder calorífico, báscula y el análisis "declarado por el vendedor". Proponer **80 Tn a $ 26.000/Tn** con un mensaje.
4. **Responder como vendedor.** Cambiar a **Molinos del Iberá** desde el selector del encabezado. El contador de *Propuestas* muestra 1 pendiente. Abrirla y **contraofertar $ 27.500/Tn**.
5. **Cerrar como comprador.** Volver a **Granja Avícola Bella Vista**, abrir la propuesta y **aceptar la contraoferta** con el comentario "Retiramos el lunes con camión propio".
6. **Ver el comprobante.** 80 Tn × $ 27.500 = **$ 2.200.000**, las dos partes y la leyenda "acuerdo declarado". En *Explorar*, la oferta de Mercedes ahora muestra **570 Tn** (antes 650).
7. **Oferta estimada.** Cambiar a **Feedlot Resistencia** y abrir su demanda de pulpa. Entre las compatibles aparece "Pulpa de cítricos — zafra 2027", marcada como **Estimada** con fecha 01/05/2027. Se puede proponer, pero la confirmación queda bloqueada y la app explica por qué.
8. **Publicar y gestionar.** Como **Citrícola Bella Vista**, publicar una oferta nueva, editarla y retirarla. Luego, como comprador, abrir la demanda "Chips para secadero" y ver su oferta compatible de Virasoro.
9. **Privacidad del acuerdo.** Copiar la dirección del comprobante del paso 6, cambiar a **Yerbatera Oberá** y abrirla: responde "no encontrado".

---

## Levantar el proyecto en local

Requisitos: **Node.js 20.12 o superior** y **Docker** (para la base de datos).

```bash
npm install
cp .env.example .env.local   # completar PERSONA_SECRET con: openssl rand -base64 32
make up                      # levanta Postgres, crea las tablas, carga los datos de demo y arranca la app
```

La consola muestra la dirección (por ejemplo `http://localhost:3000`; si ese puerto está ocupado, usa el siguiente libre). Abrirla en el navegador y seguir el [guion de demo](#guion-de-demo--10-minutos).

Otros comandos útiles:

| Comando | Qué hace |
|---|---|
| `make db` | Solo levanta la base y carga los datos, sin arrancar la app. |
| `make down` | Detiene la base y conserva los datos. |
| `make reset` | Borra la base y la vuelve a crear desde cero con los datos de demo. |
| `make up PORT=3100` | Arranca la app en un puerto específico. |

### Variables de entorno

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL. El valor de `.env.example` ya coincide con `docker-compose.yml`. |
| `PERSONA_SECRET` | Firma la cookie que recuerda a la persona elegida. Obligatoria en producción; en desarrollo hay un valor fijo con aviso. |

No hace falta ninguna otra variable.

### Restaurar los datos de demo

```bash
npm run db:seed -- --reset-demo
```

Borra propuestas, acuerdos y todo lo creado durante la prueba, y restaura el stock de las ofertas originales. Sirve para repetir el guion desde cero. En staging lo hace una persona del equipo antes de cada presentación.

---

## Pruebas

```bash
npm test            # tests automáticos
npm run typecheck   # chequeo de tipos
npm run lint        # estilo y errores comunes
npm run build       # build de producción
```

Los tests cubren el corazón de la negociación:

- **Términos efectivos y totales:** con y sin contraoferta, y el redondeo de toneladas × precio (incluido el caso del guion, 80 Tn × $ 27.500).
- **Acciones permitidas** en cada estado de una propuesta, para comprador, vendedor y terceros.
- **Bloqueos de confirmación:** oferta estimada, retirada o con stock insuficiente.
- **Distancias** entre localidades.
- **Confirmación contra la base de datos** (solo si `DATABASE_URL` apunta a la base local; si no, se saltean): el stock insuficiente no descuenta, dos confirmaciones simultáneas generan un único acuerdo, otro comprador no puede confirmar y el comprobante conserva sus términos aunque la oferta se edite después.

Para correr también estos últimos, tener la base local levantada (`make db`) antes de `npm test`.

---

## Tecnología

Next.js 16 (App Router) con React 19 y TypeScript, Tailwind CSS v4, Prisma 7 sobre PostgreSQL (Docker en local, PostgreSQL de Vercel en staging), Biome y el runner de tests nativo de Node. Desplegado en Vercel.

## Documentación

- [`docs/00-mvp-spec.md`](docs/00-mvp-spec.md): contrato del MVP (decisiones, modelo de datos, estados, reglas y guion de demo).
- [`docs/specs/`](docs/specs/): especificación de cada hito de desarrollo.
- [`docs/adr/`](docs/adr/): decisiones técnicas.
- [`docs/pivot/`](docs/pivot/): brief original de la ideathon y transición desde el producto anterior.
