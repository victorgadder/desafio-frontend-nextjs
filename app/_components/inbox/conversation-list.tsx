import type { Conversation } from "@/lib/api";
import { Avatar } from "./avatar";
import { StateMessage } from "./state-message";
import { formatConversationDate, formatPhone } from "./utils";

export function ConversationList({
  conversations,
  selectedConversationId,
  isLoading,
  isError,
  search,
  onRetry,
  onSelectConversation,
}: {
  conversations: Conversation[];
  selectedConversationId: string | null;
  isLoading: boolean;
  isError: boolean;
  search: string;
  onRetry: () => void;
  onSelectConversation: (conversationId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-4" aria-label="Carregando conversas">
        <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="animate-pulse rounded border border-slate-100 p-3" key={index}>
            <div className="flex gap-3">
              <div className="size-11 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-slate-200" />
                <div className="h-3 w-full rounded bg-slate-100" />
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <StateMessage
        title="Nao foi possivel carregar as conversas"
        description="Confira a URL da API e tente novamente."
        actionLabel="Tentar de novo"
        onAction={onRetry}
      />
    );
  }

  if (conversations.length === 0) {
    return (
      <StateMessage
        title={search ? "Nenhuma conversa encontrada" : "Sem conversas por enquanto"}
        description={
          search
            ? "Ajuste a busca para ver outros contatos."
            : "Quando um cliente chamar, o atendimento vai aparecer aqui."
        }
      />
    );
  }

  return (
    <ul className="h-full overflow-y-auto p-2">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <button
            className={`flex w-full gap-3 rounded p-3 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              selectedConversationId === conversation.id ? "bg-emerald-50" : ""
            }`}
            type="button"
            aria-current={selectedConversationId === conversation.id ? "true" : undefined}
            aria-pressed={selectedConversationId === conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <Avatar conversation={conversation} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-semibold">{conversation.contactName}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  {formatConversationDate(conversation.lastMessageAt)}
                </span>
              </span>
              <span className="mt-1 block truncate text-sm text-slate-600">
                {conversation.lastMessage}
              </span>
              <span className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate text-xs text-slate-400">
                  {formatPhone(conversation.contactPhone)}
                </span>
                {conversation.unread > 0 ? (
                  <span className="grid min-w-6 place-items-center rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                    {conversation.unread}
                  </span>
                ) : null}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
