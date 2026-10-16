/** Isotipo del prototipo: cabeza vacuna esquemática con un nodo. */
export function LogoMark({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 4l3 5h8l3-5" />
      <path d="M7 9v4c0 3 2 5 5 5s5-2 5-5V9" />
      <circle cx="12" cy="13" r="1.5" className="fill-amber-400 stroke-none" />
      <path d="M12 18v3" />
    </svg>
  );
}
