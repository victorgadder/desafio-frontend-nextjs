"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  getConversations,
  getMe,
  getMessages,
  sendMessage,
  suggestReply,
  type Agent,
  type Conversation,
  type Message,
} from "@/lib/api";

const CONVERSATIONS_QUERY_KEY = ["conversations"] as const;
const ME_QUERY_KEY = ["me"] as const;
const EMPTY_CONVERSATIONS: Conversation[] = [];

function messagesQueryKey(conversationId: string) {
  return ["messages", conversationId] as const;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatConversationDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatPhone(phone: string) {
  if (phone.length !== 13) return phone;

  return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
}

function updateConversationPreview(
  queryClient: QueryClient,
  conversationId: string,
  text: string,
  createdAt: string,
) {
  queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (current) => {
    if (!current) return current;

    const updated = current.map((conversation) =>
      conversation.id === conversationId
        ? { ...conversation, lastMessage: text, lastMessageAt: createdAt, unread: 0 }
        : conversation,
    );

    return updated.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
  });
}

export function InboxApp() {
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [composerError, setComposerError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
  });

  const conversationsQuery = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: getConversations,
    refetchInterval: 10_000,
  });

  const conversations = conversationsQuery.data ?? EMPTY_CONVERSATIONS;

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );

  const messagesQuery = useQuery({
    queryKey: selectedConversationId ? messagesQueryKey(selectedConversationId) : ["messages"],
    queryFn: () => getMessages(selectedConversationId ?? ""),
    enabled: Boolean(selectedConversationId),
    refetchInterval: selectedConversationId ? 6_000 : false,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messagesQuery.data?.length, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const term = normalizeText(search);
    if (!term) return conversations;

    return conversations.filter((conversation) => {
      const searchable = normalizeText(
        `${conversation.contactName} ${conversation.contactPhone} ${conversation.lastMessage}`,
      );
      return searchable.includes(term);
    });
  }, [conversations, search]);

  const sendMutation = useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      sendMessage(conversationId, text),
    onMutate: async ({ conversationId, text }) => {
      setComposerError(null);
      const key = messagesQueryKey(conversationId);
      await queryClient.cancelQueries({ queryKey: key });
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_QUERY_KEY });

      const previousMessages = queryClient.getQueryData<Message[]>(key);
      const previousConversations =
        queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY);
      const createdAt = new Date().toISOString();
      const optimisticId = `optimistic-${createdAt}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        direction: "out",
        body: text,
        status: "sent",
        createdAt,
      };

      queryClient.setQueryData<Message[]>(key, (current = []) => [...current, optimisticMessage]);
      updateConversationPreview(queryClient, conversationId, text, createdAt);
      setDraft("");

      return { previousMessages, previousConversations, optimisticId };
    },
    onError: (_error, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(messagesQueryKey(variables.conversationId), context.previousMessages);
      }

      if (context?.previousConversations) {
        queryClient.setQueryData(CONVERSATIONS_QUERY_KEY, context.previousConversations);
      }

      setDraft(variables.text);
      setComposerError("Nao foi possivel enviar. Revise a conexao e tente novamente.");
    },
    onSuccess: (message, variables, context) => {
      queryClient.setQueryData<Message[]>(messagesQueryKey(variables.conversationId), (current = []) =>
        current.map((item) => (item.id === context?.optimisticId ? message : item)),
      );
      updateConversationPreview(
        queryClient,
        variables.conversationId,
        message.body,
        message.createdAt,
      );
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: messagesQueryKey(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });

  const suggestionMutation = useMutation({
    mutationFn: (conversationId: string) => suggestReply(conversationId),
    onSuccess: (data) => {
      setComposerError(null);
      setDraft(data.suggestion);
    },
    onError: () => {
      setComposerError("Nao foi possivel gerar uma sugestao agora.");
    },
  });

  function handleSelectConversation(conversationId: string) {
    setSelectedConversationId(conversationId);
    setComposerError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!selectedConversationId || !text || sendMutation.isPending) return;

    sendMutation.mutate({ conversationId: selectedConversationId, text });
  }

  const isConversationsLoading = conversationsQuery.isLoading;
  const hasConversationsError = conversationsQuery.isError;

  return (
    <main className="min-h-screen bg-[#f5f7f8] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <AppHeader
          agent={meQuery.data}
          isLoading={meQuery.isLoading}
          isError={meQuery.isError}
          isSyncing={meQuery.isFetching || conversationsQuery.isFetching}
          isOffline={meQuery.isError || conversationsQuery.isError}
          onRetry={() => meQuery.refetch()}
        />

        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="min-h-[320px] overflow-hidden rounded border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-semibold">Conversas</h1>
                  <p className="text-sm text-slate-500">
                    {conversations.length} atendimentos no inbox
                  </p>
                </div>
              </div>

              <label className="mt-4 block">
                <span className="sr-only">Buscar conversa</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-11 w-full rounded border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  placeholder="Buscar por contato, telefone ou mensagem"
                  type="search"
                />
              </label>
            </div>

            <ConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId}
              isLoading={isConversationsLoading}
              isError={hasConversationsError}
              search={search}
              onRetry={() => conversationsQuery.refetch()}
              onSelectConversation={handleSelectConversation}
            />
          </aside>

          <section className="min-h-[560px] overflow-hidden rounded border border-slate-200 bg-white">
            <ChatPanel
              conversation={selectedConversation}
              messages={messagesQuery.data ?? []}
              isLoading={messagesQuery.isLoading}
              isFetching={messagesQuery.isFetching}
              isError={messagesQuery.isError}
              onRetry={() => messagesQuery.refetch()}
              messagesEndRef={messagesEndRef}
            />

            <Composer
              value={draft}
              disabled={!selectedConversationId}
              isSending={sendMutation.isPending}
              isSuggesting={suggestionMutation.isPending}
              error={composerError}
              onChange={setDraft}
              onSubmit={handleSubmit}
              onSuggest={() => {
                if (selectedConversationId) suggestionMutation.mutate(selectedConversationId);
              }}
            />
          </section>
        </section>
      </div>
    </main>
  );
}

function AppHeader({
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

function SyncBadge({ isOffline, isSyncing }: { isOffline: boolean; isSyncing: boolean }) {
  const status = isOffline
    ? {
        label: "Offline",
        dotClass: "bg-red-500",
        className: "border-red-200 bg-red-50 text-red-700",
      }
    : isSyncing
      ? {
          label: "Sincronizando",
          dotClass: "bg-amber-500",
          className: "border-amber-200 bg-amber-50 text-amber-700",
        }
      : {
          label: "Online",
          dotClass: "bg-emerald-500",
          className: "border-emerald-200 bg-emerald-50 text-emerald-700",
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

function ConversationList({
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
      <div className="space-y-3 p-4" aria-label="Carregando conversas">
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
    <ul className="max-h-[calc(100vh-220px)] overflow-y-auto p-2">
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

function ChatPanel({
  conversation,
  messages,
  isLoading,
  isFetching,
  isError,
  onRetry,
  messagesEndRef,
}: {
  conversation?: Conversation;
  messages: Message[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!conversation) {
    return (
      <div className="grid h-[calc(100%-156px)] min-h-[400px] place-items-center border-b border-slate-200">
        <StateMessage
          title="Selecione uma conversa"
          description="Escolha um atendimento na lista para ver o historico e responder."
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100%-156px)] min-h-[400px] flex-col border-b border-slate-200">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar conversation={conversation} />
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{conversation.contactName}</h2>
            <p className="truncate text-sm text-slate-500">{formatPhone(conversation.contactPhone)}</p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>{isFetching ? "Atualizando" : "Sincronizado"}</p>
          <p>{formatConversationDate(conversation.lastMessageAt)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#eef4f1] px-4 py-5">
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

function Composer({
  value,
  disabled,
  isSending,
  isSuggesting,
  error,
  onChange,
  onSubmit,
  onSuggest,
}: {
  value: string;
  disabled: boolean;
  isSending: boolean;
  isSuggesting: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSuggest: () => void;
}) {
  return (
    <form className="space-y-3 bg-white p-4" onSubmit={onSubmit}>
      <label className="block">
        <span className="sr-only">Mensagem</span>
        <textarea
          value={value}
          disabled={disabled || isSending}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-20 w-full resize-none rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="Digite uma resposta para o cliente"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5 text-sm text-red-600" role={error ? "alert" : undefined}>
          {error}
        </div>
        <div className="flex gap-2">
          <button
            className="h-10 rounded border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={disabled || isSuggesting}
            onClick={onSuggest}
          >
            {isSuggesting ? "Sugerindo..." : "Sugerir com IA"}
          </button>
          <button
            className="h-10 rounded bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={disabled || isSending || value.trim().length === 0}
          >
            {isSending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Avatar({ conversation }: { conversation: Conversation }) {
  return (
    <span
      className="grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
      style={{ backgroundColor: conversation.avatarColor }}
      aria-hidden="true"
    >
      {initials(conversation.contactName)}
    </span>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === "out";

  return (
    <div
      className={`max-w-[82%] rounded px-3 py-2 shadow-sm sm:max-w-[68%] ${
        isOutbound ? "bg-[#dcf8c6]" : "bg-white"
      }`}
    >
      <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
      <div className="mt-1 flex items-center justify-end gap-2 text-[11px] text-slate-500">
        <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
        {isOutbound ? <span>{message.status}</span> : null}
      </div>
    </div>
  );
}

function StateMessage({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mx-auto max-w-sm px-6 py-10 text-center">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {actionLabel && onAction ? (
        <button
          className="mt-4 h-10 rounded border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-3" aria-label="Carregando mensagens">
      <div className="h-16 w-2/3 animate-pulse rounded bg-white" />
      <div className="ml-auto h-16 w-3/5 animate-pulse rounded bg-emerald-100" />
      <div className="h-16 w-1/2 animate-pulse rounded bg-white" />
    </div>
  );
}
