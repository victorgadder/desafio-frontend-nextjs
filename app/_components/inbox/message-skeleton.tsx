export function MessageSkeleton() {
  return (
    <div className="space-y-3" aria-label="Carregando mensagens">
      <div className="h-16 w-2/3 animate-pulse rounded bg-white" />
      <div className="ml-auto h-16 w-3/5 animate-pulse rounded bg-emerald-100" />
      <div className="h-16 w-1/2 animate-pulse rounded bg-white" />
    </div>
  );
}
