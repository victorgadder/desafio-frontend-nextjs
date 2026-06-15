export function MessageSkeleton() {
  return (
    <div className="space-y-3" aria-label="Carregando mensagens">
      <div className="h-16 w-2/3 animate-pulse rounded bg-white dark:bg-slate-800" />
      <div className="ml-auto h-16 w-3/5 animate-pulse rounded bg-emerald-100 dark:bg-emerald-950" />
      <div className="h-16 w-1/2 animate-pulse rounded bg-white dark:bg-slate-800" />
    </div>
  );
}
