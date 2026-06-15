export function SyncBadge({ isOffline, isSyncing }: { isOffline: boolean; isSyncing: boolean }) {
  const status = isOffline
    ? {
        label: "Offline",
        dotClass: "bg-red-500",
        className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
      }
    : isSyncing
      ? {
          label: "Sincronizando",
          dotClass: "bg-amber-500",
          className:
            "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
        }
      : {
          label: "Online",
          dotClass: "bg-emerald-500",
          className:
            "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
        };

  return (
    <span
      className={`inline-flex h-8 w-fit items-center gap-2 rounded-full border px-3 text-xs font-medium ${status.className}`}
      aria-live="polite"
    >
      <span className={`size-2 rounded-full ${status.dotClass}`} aria-hidden="true" />
      {status.label}
    </span>
  );
}
