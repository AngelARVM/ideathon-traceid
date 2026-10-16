Quiero que transformes la siguiente descripción en los archivos Markdown necesarios para especificar, diseñar y planificar el proyecto. En esta etapa no implementes código.

Modelo sugerido para el trabajo posterior en Codex: GPT-6.1, esfuerzo de razonamiento alto.

El objetivo es obtener documentación coherente, accionable y dividida en etapas pequeñas, con requisitos, arquitectura, modelo de datos, integración blockchain, criterios de aceptación y configuración técnica. Separá los requisitos confirmados de las decisiones propuestas y las preguntas pendientes. Evitá ampliar innecesariamente el alcance del MVP.

**Contexto y propósito**

El proyecto es una plataforma de trazabilidad individual de ganado bovino, inicialmente dirigida a productores del nordeste argentino (NEA). Internamente se presenta como una ideathon, pero buscamos construir un MVP funcional.

La propuesta consiste en registrar el historial de cada animal de forma pública, verificable y resistente a modificaciones posteriores.

Las hipótesis de valor son:

- Facilitar el acceso a mercados que valoran la trazabilidad.
- Respaldar un posible diferencial de precio.
- Reducir tiempos operativos al centralizar el historial.
- Facilitar la consulta y verificación por productores, profesionales y compradores.

Estos beneficios son hipótesis a validar, no resultados garantizados. La plataforma tampoco constituye, por sí sola, una certificación sanitaria ni reemplaza los sistemas oficiales.

La expansión futura contempla otras especies y regiones, sin implementarlas en el MVP.

**Concepto central**

Cada animal tiene una cadena lógica de registros dentro de Stellar; no se crea una blockchain independiente por animal.

Cada eslabón representa un hito de su vida. Las operaciones fundamentales son:

1. Crear una cadena para un animal, incluyendo su registro inicial.
2. Agregar registros a una cadena existente.
3. Listar las cadenas o animales registrados.
4. Consultar el historial completo de un animal.
5. Agregar un registro terminal que cierre su cadena.

Una cadena cerrada no admite nuevos hitos ordinarios. La política para posibles rectificaciones posteriores al cierre debe quedar definida explícitamente.

**Identificación del animal**

Cada animal debe tener un identificador interno estable y un identificador individual oficial, tomando como referencia el sistema vigente de SENASA para bovinos en Argentina.

Verificá y documentá el formato oficial antes de definir validaciones. Conservá los identificadores como texto, incluidos sus ceros iniciales. No confundas el identificador del animal con el del establecimiento.

El MVP permitirá ingresar y buscar manualmente ese identificador. También tendrá un QR propio que abra el historial público del animal. Este QR es un acceso a la plataforma y no reemplaza el dispositivo oficial.

No se requiere integración con lectores RFID ni con sistemas de SENASA. Diseñá el modelo para poder incorporarlas posteriormente y contemplar cambios o reemplazos de identificación sin crear otro animal ni perder el historial.

**Registros de trazabilidad**

Tipos iniciales:

- Alta o identificación inicial.
- Pesaje.
- Vacunación.
- Desparasitación.
- Alimentación.
- Traslado.
- Venta.
- Entrega a frigorífico.
- Muerte.
- Otro hito, con descripción acotada.

Cada tipo tendrá campos y validaciones propios. Definí una propuesta mínima; por ejemplo, peso y unidad para pesajes, o producto y dosis para tratamientos.

Todos los registros deben contemplar:

- Identificador único.
- Animal al que pertenecen.
- Tipo y versión del esquema.
- Fecha y hora del hecho declarado.
- Fecha y hora de incorporación al registro.
- Autor o identificador verificable del responsable de la carga.
- Datos específicos del hito.
- Secuencia y referencia al registro anterior.
- Hash del contenido y referencias de la operación en Stellar.
- Indicador de registro terminal, cuando corresponda.

El orden de la cadena es el de incorporación. Un hecho cargado con retraso puede tener una fecha anterior, pero no debe insertarse reescribiendo la cadena.

La venta no cierra automáticamente la vida del animal. Para el MVP, proponemos muerte y entrega a frigorífico como cierres posibles; documentá que entrega a frigorífico representa el fin del seguimiento dentro de este alcance y no demuestra la faena.

**Inmutabilidad y rectificaciones**

Los registros confirmados no se editan ni eliminan. Los errores se corrigen mediante un nuevo registro que referencia al original y explica la rectificación, conservando ambos.

Diferenciá claramente:

- Integridad del contenido registrado.
- Identidad y autorización de quien lo cargó.
- Veracidad del hecho declarado.

La blockchain permite verificar integridad y orden, pero no garantiza por sí sola la veracidad de los datos ingresados.

**Plataforma web**

El MVP debe incluir:

- Autenticación para las operaciones de escritura.
- Lista de animales con búsqueda por identificación y filtros básicos.
- Identificación rápida y acceso al animal por QR.
- Alta de un animal y su primer registro.
- Carga sencilla de nuevos hitos.
- Cierre explícito de una cadena, con confirmación.
- Historial público del animal, sin necesidad de iniciar sesión.
- Visualización de hashes y referencias de Stellar.
- Estados claros para registros pendientes, confirmados y fallidos.

La interfaz estará en español y será usable desde un teléfono. Priorizá pocos pasos para encontrar un animal y cargar un hito.

**Historial público y verificación**

El detalle del historial debe obtener los registros directamente desde Stellar. PostgreSQL puede servir para búsquedas, índices y funcionamiento operativo, pero no debe ser la única fuente del contenido presentado como historial verificado.

Guardar únicamente un hash en Stellar y el contenido en PostgreSQL no satisface este requisito.

Evaluá como propuesta inicial un contrato Soroban con registros estructurados persistentes y acceso paginado. Justificá la solución elegida y documentá sus costos, límites, TTL, archivado y restauración. No dependas exclusivamente de eventos recientes del RPC para reconstruir toda la vida del animal.

Cada hito debe mostrar o permitir consultar:

- Contenido público registrado.
- Hash del contenido.
- Hash del registro anterior.
- Hash de la transacción.
- Red y contrato.
- Referencia al ledger y enlace al explorador, cuando estén disponibles.
- Resultado de la verificación de integridad.

Definí una serialización canónica y un algoritmo de hash, incluyendo exactamente qué campos se firman o hashean. Evitá dependencias circulares, como incluir el hash de la transacción dentro del contenido que origina esa misma transacción.

Distinguí los datos reconstruibles desde el contrato de los metadatos de transacción que puedan requerir un índice o acceso histórico.

Si Stellar no está disponible, la interfaz debe indicar que no pudo verificar el historial. No debe presentar datos de caché como recién verificados.

**Usuarios, organizaciones y lotes**

La base debe permitir que varias personas trabajen sobre los mismos animales.

El modelo debe diferenciar:

- Organización o ámbito propietario de los registros.
- Usuarios y membresías.
- Establecimientos.
- Lotes o agrupaciones de animales.
- Animales.
- Registros y autores.

Un animal puede cambiar de lote sin perder su identidad ni su historial.

A futuro, un dueño o administrador podrá asignar operarios, veterinarios, ingenieros agrónomos u otros colaboradores.

La gestión completa de invitaciones, asignaciones y permisos queda fuera del MVP. Sin embargo, deben existir relaciones y controles de autorización básicos que permitan incorporarla sin rehacer el modelo. Para la demo pueden utilizarse usuarios y membresías precargados.

“Editar” significa administrar datos operativos o preparar cargas; nunca modificar un hito ya confirmado en blockchain.

Definí cómo se relaciona el usuario autenticado con la cuenta que firma en Stellar. Si se propone una cuenta custodial del backend para simplificar el MVP, explicá qué confianza se deposita en la plataforma y qué identidad queda realmente acreditada en la red.

**Datos públicos y privados**

La lectura del historial de trazabilidad es pública. Las credenciales, datos de autenticación, contactos personales y demás información administrativa privada no deben publicarse en blockchain.

Definí explícitamente qué campos son públicos y cuáles permanecen en PostgreSQL. No incluyas información sensible en campos libres por defecto.

**Arquitectura y consistencia**

Tecnologías requeridas:

- Next.js con TypeScript.
- PostgreSQL.
- Docker Compose para levantar PostgreSQL localmente.
- Stellar Testnet.
- Despliegue manual, por ahora.

Si se utiliza Soroban, incorporá su contrato y herramientas necesarias al diseño técnico.

Proponé una arquitectura sencilla, adecuada para un MVP. Documentá:

- Responsabilidad de PostgreSQL y de Stellar.
- Flujo desde la carga hasta la confirmación.
- Validaciones y autorización tanto en la aplicación como en el contrato.
- Prevención de cadenas duplicadas para un mismo identificador.
- Idempotencia y protección contra doble envío.
- Concurrencia cuando dos usuarios agregan hitos al mismo animal.
- Reintentos y conciliación si Stellar confirma y falla la actualización de PostgreSQL.
- Gestión de claves y firma exclusivamente del lado servidor si se utiliza custodia.
- Política de actualización del contrato y su efecto sobre la promesa de inmutabilidad.

El contrato debe impedir sobrescribir registros, agregar hitos sin autorización o continuar una cadena cerrada, según la política definida. No alcanza con ocultar esas acciones en la interfaz.

**Configuración y documentación técnica**

Todos los prerrequisitos deben explicarse paso a paso, sin asumir experiencia previa con Stellar.

Documentá:

- Versiones compatibles de las herramientas.
- Instalación y ejecución local.
- Docker Compose, conexión a PostgreSQL, migraciones y datos de demostración.
- Creación de cuentas y claves de Stellar Testnet.
- Obtención de fondos de prueba mediante Friendbot.
- RPC, identificador de red y demás endpoints necesarios.
- Compilación, despliegue e inicialización del contrato.
- Obtención y configuración del identificador del contrato.
- Configuración de autenticación.
- Arranque y despliegue manual de la aplicación.
- Verificación de una operación real en Testnet.
- Recuperación de la demo después de un reinicio de Testnet.

Para cada variable de entorno, cuenta, credencial, API key o URL, indicá:

- Para qué sirve.
- Si es obligatoria u opcional.
- Cómo obtenerla.
- Si es pública o secreta.
- Dónde configurarla.
- Un ejemplo seguro, sin secretos reales.

No inventes dependencias de servicios pagos ni API keys que el proveedor no requiera. Incluí enlaces oficiales y un `.env.example` en el plan de implementación.

Aclarar que Testnet es un entorno demostrativo sujeto a reinicios y no ofrece conservación permanente del historial.

**Fuera del alcance inicial**

- Mainnet.
- NFTs, tokens, pagos y compraventa dentro de la plataforma.
- Integraciones oficiales con SENASA.
- Lectores RFID, sensores y hardware.
- Gestión avanzada de colaboradores.
- Transferencia automatizada de permisos entre organizaciones por una venta.
- Otras especies y países.
- Aplicaciones móviles nativas.
- Automatización del despliegue.

No agregues estas funcionalidades como dependencias del MVP.

**Documentación esperada**

Organizá los Markdown para cubrir, sin duplicaciones innecesarias:

- Visión, hipótesis de valor y alcance.
- Requisitos funcionales y reglas de negocio.
- Flujos de usuario y pantallas.
- Arquitectura y decisiones técnicas.
- Modelo de datos y esquemas de hitos.
- Contrato e integración con Stellar.
- Configuración local, credenciales y despliegue manual.
- Plan de implementación por etapas.
- Criterios de aceptación y estrategia de pruebas.
- Riesgos, supuestos y decisiones pendientes.

Como recorrido mínimo de aceptación, debe ser posible crear un animal, registrar varios hitos, encontrarlos en Stellar, consultar públicamente su historial, verificar su integridad, cerrar su cadena y comprobar que no acepta nuevos hitos ordinarios.

También deben contemplarse pruebas de duplicación, permisos, concurrencia, reintentos, fallos de sincronización y rectificación.

Si encontrás una contradicción o una decisión que cambia sustancialmente el alcance, señalala y proponé una opción concreta. No sustituyas silenciosamente un requisito central por una implementación más simple.
