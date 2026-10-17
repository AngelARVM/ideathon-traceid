# Contexto inicial para Pocock — Marketplace local de subproductos agroindustriales

> Este documento es un **brief de producto** para conversar con Pocock y derivar especificaciones (`.md`) que puedan ejecutar agentes de desarrollo. **No es una especificación técnica definitiva.** Primero cuestionar supuestos, identificar vacíos y acotar un MVP demostrable en una ideathon de la vertical **Agro**.

## 1. Objetivo de la ideathon

Construir un MVP muy pequeño, funcional y demostrable que resuelva una necesidad concreta del sector agro: **conectar generadores de subproductos agrícolas o agroindustriales con productores que pueden aprovecharlos como insumos, priorizando operaciones locales para reducir la barrera logística**.

El éxito no se mide por cantidad de funcionalidades, sino por demostrar de extremo a extremo que un subproducto que hoy se desecha, regala o comercializa con escaso valor puede encontrar un comprador cercano con necesidades compatibles.

## 2. Problema

Tras la cosecha o el procesamiento agroindustrial se generan subproductos o remanentes. Según el caso, su propietario puede no tener un canal eficiente para comercializarlos y puede descartarlos, entregarlos gratuitamente o venderlos a precio muy bajo.

Al mismo tiempo, otras actividades productivas podrían utilizarlos como materia prima. Sin embargo, una operación económicamente atractiva en origen puede dejar de serlo por el costo y la complejidad del transporte. La información sobre disponibilidad, ubicación, volumen y características está fragmentada.

**Hipótesis de producto:** si ambas partes descubren ofertas compatibles dentro de una zona cercana, pueden generar oportunidades comerciales que antes no se concretaban.

No asumir que todo subproducto es comerciable o apto para cualquier uso: pueden existir restricciones sanitarias, regulatorias, ambientales o de calidad según material, origen y destino. El MVP no certifica aptitud.

## 3. Usuarios y roles

### Vendedor / oferente

Productor agrícola o establecimiento agroindustrial que genera subproductos.

Puede:
- Publicar una oferta con tipo de subproducto, categoría, volumen, unidad, características, ubicación aproximada, precio de referencia y disponibilidad.
- Editar o retirar sus propias ofertas.
- Publicar una **oferta estimada o futura** (cantidad proyectada y fecha estimada), identificada claramente como no disponible todavía.
- Recibir propuestas de compra y aceptarlas o rechazarlas.
- Ver los acuerdos cerrados.

### Comprador / demandante

Productor o empresa que utiliza esos materiales como insumos.

Puede:
- Explorar y filtrar ofertas por subproducto/categoría, ubicación o distancia, volumen y disponibilidad.
- Ver detalles de una oferta y su cercanía aproximada.
- Seleccionar una oferta para iniciar una compra (carrito simplificado).
- Proponer cantidad y precio, y dejar un mensaje para negociar.
- Confirmar el acuerdo una vez aceptado por el vendedor.
- Añadir un comentario de cierre que quede asociado al registro de la operación.

### Cambio de roles para la demo

Debe existir un **selector visible de rol/persona de demostración**, sin cerrar sesión. Se utiliza para recorrer el flujo completo con datos precargados. Esto es una comodidad de demo, **no** un mecanismo de autorización real para cambiar la identidad de otros usuarios en producción.

## 4. Propuesta de valor y diferenciación

No competir inicialmente como un marketplace agropecuario generalista. El foco específico es:

1. **Subproductos y remanentes**, no commodities principales.
2. **Descubrimiento geográfico**, ya que la distancia puede determinar si una operación es viable.
3. **Compatibilidad básica de oferta y demanda** mediante material, volumen, unidad, características y fecha de disponibilidad.
4. **Ofertas futuras** para anticipar oportunidades de comercialización antes de que se genere el subproducto.
5. **Registro consultable del acuerdo**, sin intervenir en el movimiento del dinero.

La app no garantiza que el transporte sea rentable: muestra la proximidad y permite negociar; la logística queda inicialmente fuera del sistema.

## 5. Flujo mínimo de demostración

1. Un vendedor publica un subproducto disponible en una localidad, con características, cantidad y precio orientativo.
2. Un comprador ubicado en otra localidad cercana abre el catálogo y filtra por tipo de material y distancia.
3. El comprador consulta la oferta, elige una cantidad y envía una propuesta de precio con un mensaje.
4. Se cambia al rol/persona del vendedor desde el selector de demo.
5. El vendedor acepta la propuesta (o la rechaza; no hace falta chat en tiempo real).
6. El comprador confirma la operación y, opcionalmente, escribe un comentario de cierre.
7. La plataforma registra el acuerdo, muestra un comprobante/resumen y actualiza el volumen disponible.

Un segundo ejemplo con una oferta futura puede demostrar la diferenciación, aunque no necesariamente necesita cerrar una operación.

## 6. Reglas iniciales de negocio

- Cada oferta pertenece a un vendedor y describe **un solo tipo de subproducto**.
- Campos mínimos: título/material, categoría, descripción breve, cantidad, unidad, ubicación, disponibilidad (`disponible` o `estimada`), precio de referencia opcional y características relevantes.
- Una oferta estimada lleva fecha estimada e identificación visual; **no se puede confirmar una compra hasta que pase a disponible**, salvo que Pocock proponga un flujo mucho más simple y explícito.
- Catálogo orientado primero a ofertas locales. Distancia aproximada calculada entre localidades o coordenadas aproximadas; no exigir dirección privada exacta.
- Cantidad y precio negociados quedan congelados al confirmar el acuerdo.
- Carrito de **una sola oferta por operación** en el MVP. No implementar checkout multi-vendedor ni multi-producto.
- Negociación básica: comprador crea una propuesta, vendedor acepta o rechaza. Como máximo, permitir una contrapropuesta si su costo de implementación resulta bajo; de lo contrario, excluirla del MVP.
- Una vez confirmado el acuerdo, guardar en la base de datos las partes, oferta, cantidad, unidad, precio pactado, fecha y comentario opcional. Los detalles del acuerdo solo deben ser visibles para las partes involucradas.
- Descontar la cantidad comprometida de la oferta al confirmar; impedir confirmar una cantidad superior al stock disponible. La reserva provisional de stock durante la negociación queda fuera del MVP.
- El pago, la entrega y la logística ocurren **fuera de la plataforma**. La plataforma registra un acuerdo comercial, no verifica que el dinero o la mercadería hayan sido intercambiados.

## 7. Fuera de alcance inicial

- Procesamiento de pagos o integraciones con PSP.
- Cotización y contratación de transporte o rutas optimizadas.
- Mensajería en tiempo real, notificaciones complejas y disputas.
- KYC, reputación, calificaciones, facturación, impuestos y documentos fiscales.
- Certificaciones de calidad, inspección física y validación de aptitud sanitaria.
- Matching con IA, predicción sofisticada de oferta y algoritmos de recomendación.
- Gestión multiempresa, permisos complejos y panel administrativo completo.
- Reservas parciales y concurrencia avanzada más allá de evitar sobreventa al confirmar.
- Múltiples ofertas por carrito y checkout masivo.

## 8. Datos demostrativos sugeridos

Preparar datos ficticios de **una región del NEA argentino**, con localidades cercanas y otras lejanas. Elegir **dos o tres subproductos reales y plausibles** de cadenas productivas de la región; validar sus usos y restricciones antes de fijar ejemplos. Para cada oferta, incluir volumen, unidad, fecha y precio ficticio claramente identificados como datos de prueba.

Mostrar visualmente por qué cercanía + volumen + características facilita el encuentro. No afirmar ahorros de logística o beneficios económicos numéricos sin un modelo y datos que los sustenten.

## 9. Criterios de éxito del MVP

El producto está listo para demo cuando es posible, con datos precargados y sin cambiar credenciales:

- Crear, editar, retirar y listar ofertas.
- Encontrar una oferta cercana aplicando filtros útiles.
- Enviar una propuesta de cantidad/precio.
- Cambiar a la persona vendedora y aceptar la propuesta.
- Volver a la compradora y confirmar el acuerdo.
- Consultar el registro del acuerdo y observar el cambio de stock.
- Mostrar al menos una oferta futura, diferenciada de una oferta disponible.

## 10. Qué necesito de Pocock

No generar directamente una implementación amplia. Trabajar en este orden:

1. **Revisar críticamente el brief:** detectar supuestos, contradicciones, requisitos sobredimensionados y decisiones que falten.
2. **Formular solo preguntas bloqueantes** (máximo 5, priorizadas). Para otras incertidumbres, proponer el supuesto más sencillo.
3. **Definir un MVP de ideathon estricto:** separar `Must have`, `Nice to have` y `Out of scope`, con especial atención al tiempo de implementación y al flujo de demo.
4. **Diseñar contratos de dominio y estados:** ofertas, propuestas y acuerdos; transiciones válidas; cantidades y unidades; stock; distancias aproximadas; ofertas futuras.
5. **Proponer una arquitectura mínima**, consistente con las herramientas y el equipo; evitar microservicios y sobreingeniería.
6. **Generar documentos Markdown accionables**, con requisitos funcionales, modelo de datos, flujos, API/acciones, criterios de aceptación y pruebas mínimas.
7. **Dividir el trabajo en tareas pequeñas para agentes**, con dependencias, archivos o dominios que cada agente puede tocar, definición de terminado e integración.
8. **Priorizar una demo end-to-end sobre funcionalidades periféricas** y declarar qué se simula, qué se persiste y qué se integra realmente.

### Entregables solicitados a Pocock

- `docs/00-product-brief.md` — problema, usuarios, alcance, supuestos y criterios de éxito.
- `docs/01-mvp-scope.md` — corte de alcance, historias mínimas y exclusiones.
- `docs/02-domain-and-flows.md` — entidades, estados, reglas y flujos.
- `docs/03-architecture.md` — decisiones técnicas mínimas, datos, seguridad básica y persistencia de acuerdos.
- `docs/04-acceptance-criteria.md` — escenarios verificables para demo.
- `docs/05-agent-tasks.md` — tareas ejecutables en orden de dependencia, con propietarios/agentes sugeridos y puntos de integración.

No tratar nombres o estructura de archivos como requisitos rígidos si Pocock propone una alternativa más simple.

## 11. Decisiones abiertas que Pocock debe resolver primero

1. **Región inicial:** ¿NEA/Corrientes como escenario de demo u otra región agroproductiva?
2. **Ubicación:** ¿localidad y distancia aproximada son suficientes, o se requiere geolocalización/mapa?
3. **Negociación:** ¿una oferta y una aceptación, o una sola contrapropuesta opcional?
4. **Compra:** ¿el botón "Comprar" representa confirmar un acuerdo entre partes (sin pagos), tal como propone este brief?
5. **Registro del acuerdo:** ¿basta un comprobante interno consultable por comprador y vendedor con estado, condiciones y comentario opcional?

**Restricción principal:** ante un conflicto entre alcance y tiempo, conservar únicamente lo necesario para demostrar que un generador de subproductos encuentra un comprador local y ambos llegan a un acuerdo registrable.
