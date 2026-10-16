/**
 * Un hash en pantalla. Se muestra truncado pero con el valor completo en el `title` y en el
 * atributo de datos, porque el hash es la evidencia: nunca se oculta del todo.
 */
export function HashChip({
  value,
  label,
  className = "",
}: {
  value: string | null;
  label?: string;
  className?: string;
}) {
  if (!value) {
    return (
      <span className="text-xs text-stone-500 dark:text-stone-500">—</span>
    );
  }

  return (
    <span className={`inline-flex items-baseline gap-1.5 min-w-0 ${className}`}>
      {label ? (
        <span className="text-xs text-stone-500 dark:text-stone-400 shrink-0">
          {label}
        </span>
      ) : null}
      <code
        title={value}
        className="font-mono-num text-xs bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded truncate"
      >
        {value.length > 20 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value}
      </code>
    </span>
  );
}
