# M4 — Home y elección de persona

**Fase:** paralela, después de M0. **Estimado:** 40–50 min. Es el hito más visual. Conviene que lo revise una persona del equipo con el PDF abierto.
**Contrato:** [`docs/00-mvp-spec.md`](../00-mvp-spec.md), §1, §2 (D1, D11 y D12), §7, §10, §12.1 y §12.4. Referencia visual: `ReValor NEA - Marketplace B2B _ Google AI Studio.pdf`, en la raíz del repo.

## Objetivo

La home `/` es lo primero que ve el jurado. Tiene dos estados:

- **Sin persona:** presenta SubMarket y permite elegir una de las 6 personas de demo en un clic.
- **Con persona:** home estilo PDF, con hero, categorías, lotes recientes y "cómo funciona".

## Archivos permitidos

- `src/app/page.tsx`, que reemplaza el placeholder de M0.
- `src/app/_home/**`, carpeta privada para los componentes y consultas de la home.

## Contenido

### Sin persona: selector de personas

- Hero: "SubMarket — Lo que sobra, vale." y, como subtítulo, una línea del producto: "Conectamos a quienes generan subproductos agroindustriales con compradores cercanos del NEA."
- Aviso: "Esta es una demo con empresas ficticias. Elegí una persona para recorrer la plataforma."
- Dos columnas: **Vendedores** y **Compradores**. Cada tarjeta muestra el nombre, la tagline, la localidad con su provincia y un ícono por rol. Cada tarjeta es un `<form action={selectPersona}>` con el `userId`.
- Debajo, el resumen "Cómo funciona" (ver más abajo).

### Con persona: home del marketplace

1. **Hero:**
   - saludo "Hola, <nombre>" con el rol y la localidad;
   - un formulario GET que dirige a `/ofertas`, con un select de categoría y un select de radio;
   - un CTA según el rol: "Publicar oferta" (seller) o "Publicar demanda" (buyer).
2. **Categorías:** una tarjeta por cada `Category` con su label, un ícono de `lucide-react` y la cantidad de ofertas activas (`available` o `estimated`) de esa categoría, consultada desde `_home/queries.ts`. Cada tarjeta enlaza a `/ofertas?categoria=<cat>`.
3. **Lotes cerca tuyo:** las 4 ofertas activas más cercanas a la persona, con `OfferCard` y distancia, y el enlace "Ver todos" a `/ofertas`. Si hay alguna estimada en el radio de 200 km, se incluye al menos una para que la diferencia se vea.
4. **Para un buyer, "Tus demandas":** sus demandas abiertas con el conteo de compatibles. Si no tiene, el CTA de publicar una. **Para un seller, "Demandas cerca tuyo":** las 3 demandas abiertas más cercanas, con enlace a `/demandas/<id>`.
   - Para no depender de M2, las consultas son propias, en `_home/queries.ts`. El conteo de compatibles puede omitirse si complica.
5. **Cómo funciona,** en 3 pasos (adaptados del PDF y sin promesas fuera de alcance):
   1. Publicá o buscá un subproducto cerca tuyo.
   2. Proponé cantidad y precio; el vendedor acepta o contraoferta.
   3. Confirmá el acuerdo y coordiná flete y pago por fuera.
   - **No** mencionar báscula obligatoria, certificados de trazabilidad, "verificación" ni INTI.

## Reglas de contenido

- Ninguna cifra de impacto: ni "ahorrá X%" ni toneladas recuperadas inventadas. Los conteos son reales, salidos de la base.
- Ningún email, teléfono ni dirección de contacto. El footer ya es de M0.
- Lenguaje de cercanía: "aprox., en línea recta". Nada de "flete más barato".

## Notas de Next.js 16

- La página lee la cookie, así que el contenido personalizado va dentro de `<Suspense>`. El hero estático puede quedar fuera, en el shell (§7).
- Las consultas a la base por persona no se cachean con `use cache` (§7).

## Definición de terminado

- [ ] En una ventana privada, `/` muestra las 6 personas. Un clic en Feedlot Resistencia vuelve a `/ofertas` (comportamiento de `selectPersona`) y, al entrar de nuevo a `/`, se ve la home personalizada.
- [ ] Los conteos por categoría coinciden con el seed: cascarilla 2, chips 1, aserrín 1, pellets 0 y orujos 2.
- [ ] Como Granja Avícola Bella Vista, "Lotes cerca tuyo" muestra primero las pulpas de Bella Vista (0 km).
- [ ] La home se ve bien en mobile (375 px) y en desktop, con tema claro y oscuro.
- [ ] `npm run typecheck` y `npm run lint` pasan.
