export function ArrowIcon({ className = "", newTab = false }: { className?: string; newTab?: boolean }) {
  return (
    <>
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        className={`size-4 shrink-0 ${className}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 11 11 5M6 5h5v5" />
      </svg>
      {newTab && <span className="sr-only"> (opens in a new tab)</span>}
    </>
  );
}
