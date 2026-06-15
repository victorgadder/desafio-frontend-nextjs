export function ThemeToggle({
  isDarkTheme,
  onToggle,
  className = "",
}: {
  isDarkTheme: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      className={`grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 ${className}`}
      type="button"
      aria-label={isDarkTheme ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-pressed={isDarkTheme}
      onClick={onToggle}
      title={isDarkTheme ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {isDarkTheme ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M20.99 13.38A8.5 8.5 0 1 1 10.62 3.01 7 7 0 0 0 20.99 13.38Z" />
    </svg>
  );
}
