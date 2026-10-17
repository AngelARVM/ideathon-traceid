# Apéndice de transición — de TraceID a marketplace regional de subproductos agroindustriales

**Estado:** guía de transición para el próximo agente. **Fuente de producto:** [`ideathon_agro_marketplace_contexto.md`](./ideathon_agro_marketplace_contexto.md), aportado por el usuario el 17-10-2026. **Fuente técnica:** estado actual de este repositorio. El brief es contexto de producto, no una especificación técnica cerrada.

**Para la siguiente conversación con Pocock:** leer ambos archivos de `pivot/`, cuestionar supuestos y hacer las preguntas necesarias antes de regenerar las especificaciones. La petición posterior del usuario de profundizar en las preguntas prevalece sobre el máximo de cinco preguntas sugerido en el brief.

## 1. Mandato y precedencia

El proyecto deja de ser una plataforma de trazabilidad bovina. El nuevo objetivo es un MVP que conecte oferentes de subproductos agrícolas o agroindustriales con compradores cercanos, permita negociar una oferta y registre un acuerdo sin procesar pagos ni logística.

Conservar el despliegue existente en **Vercel**, su **PostgreSQL de Vercel**, **Prisma** y **Docker Compose para PostgreSQL local**. La existencia y configuración concreta del proyecto en Vercel fueron informadas por el usuario; este repositorio no contiene una configuración `vercel.json` ni acredita por sí solo el estado del servicio remoto. Verificar los ajustes del proyecto antes de tocar el despliegue, sin exponer secretos.

Este apéndice reemplaza el **objetivo de producto** de `base.md` y de `docs/01`–`10`. Esos documentos describen TraceID y sirven como inventario histórico, no como requisitos vigentes del marketplace. Las ADR sobre Better Auth y Prisma siguen siendo decisiones técnicas útiles; la ADR de Hedera queda como antecedente histórico. Respetar `AGENTS.md` y, antes de escribir código Next.js, leer la guía pertinente en `node_modules/next/dist/docs/` para la versión instalada.

## 2. Inventario de conservación

| Componente actual | Decisión | Instrucción para el próximo agente |
|---|---|---|
| `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `biome.json`, `postcss.config.mjs`, `src/app/`, `src/app/globals.css` | **Conservar la base** | Seguir con Next.js 16, React, TypeScript y las herramientas actuales. Cambiar pantallas, navegación, textos, marca y metadatos según el marketplace. Retirar dependencias solo cuando sus usos desaparezcan. |
| `prisma.config.ts`, `src/db/client.ts`, `src/db/index.ts`, generador Prisma y `DATABASE_URL` | **Conservar** | Mantener Prisma 7 con PostgreSQL y el adaptador `@prisma/adapter-pg`. Adaptar el esquema con migraciones nuevas. Comprobar conexión y generación de cliente en local y en el build de Vercel. |
| Modelos `User`, `Session`, `Account`, `Verification` y ruta `src/app/api/auth/[...all]/route.ts` | **Conservar** | Reutilizar Better Auth y las cuentas existentes. Mantener las tablas y su compatibilidad mientras haya sesiones o usuarios reales. Revisar `AUTH_URL`, `AUTH_SECRET` y el dominio del despliegue. |
| `src/lib/auth.ts`, `src/lib/session.ts`, `src/lib/auth-actions.ts`, `src/proxy.ts`, `src/app/login/` | **Adaptar** | Conservar autenticación y la validación de permisos en servidor. Sustituir rutas `/animals`, redirecciones, textos y permisos de organización que ya no correspondan. El `proxy` solo hace un chequeo optimista; cada lectura privada y mutación debe autorizarse en la capa de datos o en la acción. |
| `docker-compose.yml`, `Makefile` y `.env.example` | **Conservar y ajustar** | Seguir usando Compose para una base local. Puede mantenerse el nombre interno `traceid` mientras se migran datos; cambiar nombres, puertos o volumen requiere un plan explícito para no perder datos locales. Retirar variables de Hedera cuando ya no haya referencias. Revisar los comandos peligrosos de `Makefile`, en especial `reset`. |
| `prisma/migrations/` | **Conservar historial** | Añadir migraciones compatibles con la base desplegada. No editar ni borrar migraciones ya aplicadas, ni usar `prisma migrate reset` en Vercel. |
| `src/lib/ids.ts`, `src/lib/password.ts`, utilidades de interfaz generales (`ThemeToggle`, estructura de layout) | **Reutilizar selectivamente** | Mantener solo utilidades realmente usadas. Actualizar claves de almacenamiento, navegación, logos y mensajes que aún digan TraceID. |
| `scripts/seed.ts` | **Reescribir de forma segura** | El seed actual crea usuarios bovinos y rechaza bases remotas salvo `--allow-remote`; además `--reset` borra datos. Preparar fixtures del marketplace idempotentes y separados de datos reales. No ejecutar el seed actual contra la base de Vercel. |
| `src/app/animals/**`, `src/lib/animals/**`, `src/lib/identifiers*`, `src/lib/records/**`, `src/lib/outbox/**`, `src/lib/chain/**`, `scripts/drain.ts`, `contracts/traceid/**`, `prototype/**` | **Reemplazables o eliminables** | Son flujos y código de trazabilidad bovina/Hedera. Retirarlos del producto nuevo cuando no haya importaciones ni scripts dependientes. El prototipo es una referencia histórica, no una UI a adaptar obligatoriamente. |
| Componentes `Record*`, `HashChip`, `EnvironmentBanner`, `NewIdField` y assets de TraceID | **Reemplazables** | Eliminar mensajes de cadena, hashes, testnet, caravana y trazabilidad; reutilizar solo estilos o componentes realmente genéricos. |
| Tablas de dominio `Organization`, `Membership`, `Establishment`, `Lot`, `Animal`, `AnimalIdentifier`, `AnimalLotHistory`, `Record`, `Outbox` y sus enums | **Rediseñar con cuidado** | Ninguna representa por sí sola una oferta, propuesta o acuerdo. `Organization`/`Membership` podrían servir para propiedad de ofertas si el MVP requiere empresas; decidirlo explícitamente. Mantener tablas antiguas mientras se verifica qué datos remotos existen; limpiar en una migración posterior y deliberada. |

## 3. Producto que debe reemplazar a TraceID

Implementar y especificar primero el recorrido de demo de extremo a extremo:

1. Un oferente publica una oferta de **un** subproducto con material, categoría, características, cantidad, unidad, localidad aproximada, disponibilidad y precio de referencia opcional. Puede editarla o retirarla.
2. Un comprador busca y filtra por material, localidad o distancia aproximada, volumen y disponibilidad. La cercanía no equivale a rentabilidad logística.
3. El comprador selecciona **una oferta por operación** y propone cantidad, precio y mensaje. El oferente acepta o rechaza. No hace falta chat ni contrapropuesta para el MVP.
4. El comprador confirma la propuesta aceptada. Persistir partes, oferta, cantidad, unidad, precio pactado, fecha y comentario de cierre opcional; mostrar el resumen solo a las partes.
5. En la misma operación de base de datos, impedir sobreventa y descontar la cantidad confirmada. La propuesta sin confirmar no reserva stock.
6. Mostrar al menos una oferta **estimada/futura** con fecha y señal visual. No permitir confirmarla mientras siga estimada.
7. Permitir recorrer comprador y vendedor con personas de demo precargadas **sin cerrar sesión**, sin convertir el selector en una vía de suplantación en producción. Definir de forma explícita qué datos y acciones habilita ese modo y proteger las escrituras en servidor.

Pagos, entrega, transporte, certificaciones, validación sanitaria, facturación, reputación, matching con IA y carrito múltiple quedan fuera del MVP. El registro representa un **acuerdo declarado**, no prueba intercambio de dinero o mercadería. No afirmar aptitud de un material para un uso ni ahorros cuantificados sin sustento.

## 4. Contratos y decisiones antes de implementar

- Definir entidades nuevas `Offer`, `Proposal` y `Agreement` (nombres finales a elegir) y estados/transiciones. Separar oferta `disponible`, `estimada` y `retirada`; propuesta `pendiente`, `aceptada`, `rechazada` y `confirmada` o modelar la confirmación en el acuerdo. Evitar estados redundantes imposibles de sincronizar.
- Acordar quién puede vender y comprar: usuario individual, organización existente o ambos. No traducir automáticamente `MembershipRole` (`owner`, `admin`, `operator`, `professional`) a roles comerciales. Una persona podría actuar en ambos lados; verificar propiedad de cada recurso y de cada acuerdo.
- Definir unidades permitidas y comparación de cantidades. Usar precisión decimal para cantidad y precio; no usar valores de coma flotante para stock o dinero. Congelar unidad, cantidad y precio en el acuerdo.
- Definir localidad y ubicación aproximada sin publicar dirección privada exacta. Documentar fuente y limitación del cálculo de distancia; mapa y geolocalización precisa no son necesarios para demostrar el flujo.
- Resolver las cinco decisiones abiertas del brief con el menor alcance viable. Si no hay respuesta, usar NEA/Corrientes como escenario de demo, localidad con distancia aproximada, una propuesta sin contrapropuesta, “Comprar” como inicio de negociación sin pago y comprobante interno consultable por las partes. Registrar esas elecciones como supuestos revisables.
- Validar que dos o tres ejemplos de subproductos sean plausibles en la región antes de incluirlos. Marcar precio, volumen y fechas de fixtures como ficticios.

## 5. Secuencia técnica segura

1. Hacer inventario del despliegue y de la base actual: variables necesarias, dominio de autenticación, comando de build, migraciones aplicadas y presencia de datos que deban conservarse. No copiar credenciales a documentos ni ejecutar cambios remotos durante esta inspección.
2. Escribir las nuevas especificaciones de producto y contratos de dominio. El brief sugiere `docs/00`–`05`, pero esos nombres no son obligatorios. Marcar explícitamente `docs/01`–`10` como legado o reemplazarlos de forma ordenada para que no queden dos fuentes normativas contradictorias. Conservar las ADR históricas y añadir una ADR del pivot si afecta decisiones técnicas.
3. Añadir modelos nuevos y una migración **aditiva**. Probarla en PostgreSQL local con Docker Compose, incluyendo una base que ya tenga las migraciones TraceID aplicadas. No renombrar o reutilizar tablas de animales como ofertas.
4. Implementar catálogo, oferta, propuesta y acuerdo; adaptar autenticación, rutas y selector de demo. La confirmación debe ser atómica: autorizar comprador y vendedor, verificar estado de oferta y propuesta, verificar stock y descontarlo una sola vez. Manejar reintentos o doble confirmación sin crear acuerdos duplicados.
5. Sustituir branding y contenido en home, login, navegación, footer, metadatos, icono, mensajes y páginas 404. Quitar rutas bovinas y enlaces rotos tras completar el nuevo flujo.
6. Retirar código Hedera, contrato, outbox, scripts y dependencias sin uso del runtime/build. No borrar las migraciones históricas. La eliminación física de tablas legadas, si hace falta, va en una migración posterior tras revisar datos, copias de seguridad y dependencias.
7. Actualizar `.env.example`, `README.md`, `docs/07-setup-and-deployment.md` o su reemplazo, comandos del `Makefile` y procedimiento de Vercel. Conservar `DATABASE_URL` y la integración PostgreSQL; al cambiar dominio o marca, revisar `AUTH_URL`/orígenes y variables del entorno. No asumir que Docker Compose corre en Vercel.
8. Verificar localmente migración, seed, build y flujo de demo; luego preparar el despliegue usando las variables y la base existente. Revisar el plan de aplicación de migraciones antes de ejecutarlas sobre la base remota.

## 6. Pruebas y documentación que deben cambiar

Los tests actuales de `src/lib/identifiers*`, `src/lib/records/**`, `src/lib/outbox/**` y `src/lib/chain/**` prueban el dominio anterior; retirarlos junto con ese código. Conservar la infraestructura de `npm test`, `npm run typecheck`, `npm run lint` y `npm run build`, y crear pruebas útiles para las reglas nuevas:

- Oferta futura o retirada: no confirmable. Propuesta rechazada: no confirmable.
- Un usuario no puede editar la oferta ajena ni leer acuerdos de terceros, aunque manipule parámetros o el selector de demo.
- Cantidad cero, negativa, unidad incompatible o mayor que el stock: rechazo.
- Dos confirmaciones simultáneas o reintentos: a lo sumo un acuerdo y sin stock negativo.
- Al confirmar, el resumen conserva cantidad, unidad y precio pactados aunque luego cambie la oferta.
- Recorrido completo con personas precargadas: publicación → búsqueda → propuesta → aceptación → confirmación → acuerdo visible y stock actualizado.

Actualizar criterios de aceptación, riesgos, arquitectura, modelo de datos, flujos y plan de implementación para el marketplace. El README debe explicar arranque local y límites reales del MVP. Las instrucciones del brief dirigidas a Pocock son insumos para esa planificación, **no** una orden de generar todos esos documentos o implementar funcionalidades sin validar alcance.

## 7. Condición de terminado para el agente que ejecute el pivot

La app desplegable ya no muestra flujos activos de animales o Hedera; conserva el stack y puede migrar una base existente sin pérdida accidental. Con PostgreSQL local y fixtures, el flujo completo del apartado 3 funciona, las escrituras respetan autorización y stock, las ofertas futuras se distinguen, las pruebas relevantes pasan y la documentación describe el producto realmente implementado. El despliegue en Vercel sigue usando su proyecto y PostgreSQL existentes, con verificación explícita de migraciones y variables.
