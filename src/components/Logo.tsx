import Image from "next/image";
import dark from "../../public/images/brand/submarket-logo-dark.webp";
import light from "../../public/images/brand/submarket-logo-light.webp";

/**
 * Marca de SubMarket. La versión clara va sobre fondos blancos (header, menú mobile); `inverted`
 * usa la versión oscura, para fondos oscuros como el footer.
 */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Image
      src={inverted ? dark : light}
      alt="SubMarket"
      loading={inverted ? "lazy" : "eager"}
      sizes="160px"
      // El fondo casi blanco del logo claro se funde con el blanco del header.
      className={`h-8 w-auto select-none sm:h-9 ${inverted ? "rounded-md" : "mix-blend-multiply"}`}
    />
  );
}
