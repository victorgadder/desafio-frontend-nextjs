import type { Agent } from "@/lib/api";
import { initials } from "./utils";
import { SyncBadge } from "./sync-badge";

export function AppHeader({
  agent,
  isLoading,
  isError,
  isSyncing,
  isOffline,
  onRetry,
}: {
  agent?: Agent;
  isLoading: boolean;
  isError: boolean;
  isSyncing: boolean;
  isOffline: boolean;
  onRetry: () => void;
}) {
  const agentInitials = agent ? initials(agent.name) : isError ? "!" : "...";
  const agentName = isLoading
    ? "Carregando agente"
    : isError
      ? "Agente indisponivel"
      : agent?.name;
  const agentRole = isError ? "Falha ao carregar perfil" : agent?.role ?? "Suporte";

  return (
    <header className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-emerald-700">NeoFibra WhatsApp</p>
        <h2 className="text-2xl font-semibold tracking-normal">Inbox de atendimento</h2>
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        <SyncBadge isOffline={isOffline} isSyncing={isSyncing} />

        <div className="flex items-center gap-3 rounded border border-slate-200 bg-white px-3 py-2">
          <div
            className={`grid size-9 place-items-center rounded-full text-sm font-semibold text-white ${
              isError ? "bg-red-600" : "bg-slate-900"
            }`}
          >
            {agentInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{agentName}</p>
            <p className={`truncate text-xs ${isError ? "text-red-600" : "text-slate-500"}`}>
              {agentRole}
            </p>
          </div>
          {isError ? (
            <button
              className="h-8 rounded border border-red-200 px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              type="button"
              onClick={onRetry}
            >
              Tentar
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
