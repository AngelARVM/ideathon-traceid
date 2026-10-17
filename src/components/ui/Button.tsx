import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-campo-600 text-white shadow-sm hover:bg-campo-700",
  secondary:
    "border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800",
  ghost:
    "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
};

type StyleProps = { variant?: Variant; size?: Size };

const classes = (variant: Variant, size: Size, className = "") =>
  `${base} ${variants[variant]} ${sizes[size]} ${className}`;

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

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={classes(variant, size, className)} {...props} />;
}
