import type { ComponentProps } from "react";

/** Contenedor blanco con borde y sombra suave; `interactive` agrega el hover de codigo-ui. */
export function Card({
  interactive = false,
  className = "",
  ...props
}: ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-card ${
        interactive
          ? "transition hover:border-brand-300 hover:shadow-card-hover"
          : ""
      } ${className}`}
      {...props}
    />
  );
}
