# SubMarket

Marketplace regional (NEA) de subproductos agroindustriales. Lo que sobra, vale.

Los vendedores publican **ofertas** de subproductos (cascarilla de arroz, chips y aserrín de pino, pulpa de cítricos) con cantidad en toneladas, precio en ARS/Tn y características (humedad, poder calorífico, presentación). Los compradores publican **demandas** y ven las ofertas compatibles. El comprador propone; el vendedor acepta, rechaza o contraoferta una vez; al confirmar, el stock se descuenta de forma atómica y se genera un **comprobante** visible solo para las dos partes.

Contrato del MVP: [`docs/00-mvp-spec.md`](docs/00-mvp-spec.md). Guion de demo: §13 del contrato.

## Qué se simula y qué no

Es un **entorno demostrativo**: empresas y operaciones ficticias.

- **Identidad simulada.** No hay login: se elige una persona del seed y una cookie firmada la recuerda. Cualquiera puede elegir cualquier persona.
- **Sin pagos ni facturación.** El acuerdo es "declarado" entre las partes; SubMarket no cobra ni procesa dinero.
- **Sin flete.** El flete es un dato informativo de la oferta; no se cotiza ni contrata.
- **Sin verificación.** El análisis de laboratorio se muestra como "declarado por el vendedor, no verificado por SubMarket". No hay KYC, reputación ni certificación.
- **Distancias aproximadas.** Haversine entre centros de localidad, en línea recta. Sin mapa ni direcciones.

## Arranque local

Requiere Node ≥ 20.12 y Docker.

```bash
npm install
cp .env.example .env.local   # completar PERSONA_SECRET: openssl rand -base64 32
make db                      # Postgres en Docker, migraciones y seed de demo
make up                      # app en el primer puerto libre desde 3000
```

Otros comandos: `make down` (para Postgres), `make reset` (borra la base y vuelve a sembrar), `npm test` (los tests con base corren solo si `DATABASE_URL` apunta a localhost), `npm run typecheck`, `npm run lint`, `npm run build`.

## Variables de entorno

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Postgres. En local coincide con `docker-compose.yml`. Secreta. |
| `PERSONA_SECRET` | Firma la cookie de persona. Obligatoria en producción; en desarrollo hay un valor fijo con aviso. |

No hace falta ninguna otra variable (ni Better Auth ni Hedera).

## Resetear la demo

```bash
npm run db:seed -- --reset-demo
```

Borra propuestas, acuerdos y lo creado durante la demo, y restaura ofertas y demandas del seed. Contra la base de Vercel lo corre una persona del equipo, a mano (D15):

```bash
DATABASE_URL=<vercel> npm run db:migrate
DATABASE_URL=<vercel> npm run db:seed -- --allow-remote --reset-demo
```

## Personas

| Persona | Rol | Localidad |
|---|---|---|
| Molinos del Iberá | Vendedor · molino arrocero | Mercedes |
| Forestal Virasoro | Vendedor · aserradero y chipeadora | Gobernador Virasoro |
| Citrícola Bella Vista | Vendedor · planta juguera | Bella Vista |
| Granja Avícola Bella Vista | Comprador · producción avícola | Bella Vista |
| Yerbatera Oberá | Comprador · secadero de yerba mate | Oberá |
| Feedlot Resistencia | Comprador · engorde bovino | Resistencia |

Se elige en `/` y se cambia desde el selector del header. Al cambiar, se vuelve a la página actual; si la nueva persona no puede verla, se va a la página más cercana que sí puede ver.
