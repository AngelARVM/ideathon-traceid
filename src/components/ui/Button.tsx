import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-xs hover:bg-brand-700",
  secondary:
    "border border-gray-200 bg-white text-gray-800 shadow-xs hover:border-brand-300 hover:text-brand-700",
  ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
  danger: "bg-red-600 text-white shadow-xs hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs sm:text-sm",
  md: "h-11 px-5 text-sm",
};

type StyleProps = { variant?: Variant; size?: Size };

const classes = (variant: Variant, size: Size, className = "") =>
  `${base} ${variants[variant]} ${sizes[size]} ${className}`;

/** Botón con las variantes de codigo-ui: primario verde, secundario con borde, fantasma y peligro. */
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & StyleProps) {
  return (
    <button
      type={type}
      className={classes(variant, size, className)}
      {...props}
    />
  );
}

/** Enlace con el aspecto de `Button`. */
export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={classes(variant, size, className)} {...props} />;
}
