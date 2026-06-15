import type { RefObject } from "react";
import type { Conversation, Message } from "@/lib/api";
import { Avatar } from "./avatar";
import { MessageBubble } from "./message-bubble";
import { MessageSkeleton } from "./message-skeleton";
import { StateMessage } from "./state-message";
import { formatConversationDate, formatPhone } from "./utils";

export function ChatPanel({
  conversation,
  messages,
  isLoading,
  isFetching,
  isError,
  onRetry,
  onBack,
  showBackButton,
  messagesEndRef,
}: {
  conversation?: Conversation;
  messages: Message[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  onBack: () => void;
  showBackButton: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}) {
  if (!conversation) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center border-b border-slate-200">
        <StateMessage
          title="Selecione uma conversa"
          description="Escolha um atendimento na lista para ver o historico e responder."
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col border-b border-slate-200">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {showBackButton ? (
            <button
              className="grid size-14 shrink-0 place-items-center rounded-full text-4xl leading-none text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 lg:hidden"
              type="button"
              aria-label="Voltar para a lista de conversas"
              onClick={onBack}
            >
              <span aria-hidden="true">‹</span>
            </button>
          ) : null}
          <Avatar conversation={conversation} />
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{conversation.contactName}</h2>
            <p className="truncate text-sm text-slate-500">{formatPhone(conversation.contactPhone)}</p>
          </div>
        </div>
        <div className="hidden text-right text-xs text-slate-500 sm:block">
          <p>{isFetching ? "Atualizando" : "Sincronizado"}</p>
          <p>{formatConversationDate(conversation.lastMessageAt)}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#eef4f1] px-4 py-5">
        {isLoading ? (
          <MessageSkeleton />
        ) : isError ? (
          <StateMessage
            title="Nao foi possivel carregar o historico"
            description="Tente atualizar as mensagens desta conversa."
            actionLabel="Recarregar"
            onAction={onRetry}
          />
        ) : messages.length === 0 ? (
          <StateMessage
            title="Historico vazio"
            description="Envie a primeira mensagem para iniciar o atendimento."
          />
        ) : (
          <ol className="space-y-3">
            {messages.map((message) => (
              <li
                className={`flex ${message.direction === "out" ? "justify-end" : "justify-start"}`}
                key={message.id}
              >
                <MessageBubble message={message} />
              </li>
            ))}
          </ol>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
