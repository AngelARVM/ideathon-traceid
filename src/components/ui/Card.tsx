import type { ComponentProps } from "react";

/** Contenedor blanco con borde y sombra suave; `interactive` agrega un hover con borde y sombra. */
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
