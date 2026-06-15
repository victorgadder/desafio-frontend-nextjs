"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { AppHeader } from "./_components/inbox/app-header";
import { ChatPanel } from "./_components/inbox/chat-panel";
import { Composer } from "./_components/inbox/composer";
import { ConversationList } from "./_components/inbox/conversation-list";
import { searchConversations } from "./_components/inbox/utils";
import {
  getConversations,
  getMe,
  getMessages,
  sendMessage,
  suggestReply,
  type Conversation,
  type Message,
} from "@/lib/api";

const CONVERSATIONS_QUERY_KEY = ["conversations"] as const;
const ME_QUERY_KEY = ["me"] as const;
const EMPTY_CONVERSATIONS: Conversation[] = [];

function messagesQueryKey(conversationId: string) {
  return ["messages", conversationId] as const;
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

  const filteredConversations = useMemo(
    () => searchConversations(conversations, search),
    [conversations, search],
  );

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
    <main className="h-dvh overflow-hidden bg-[#f5f7f8] text-slate-950">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <AppHeader
          agent={meQuery.data}
          isLoading={meQuery.isLoading}
          isError={meQuery.isError}
          isSyncing={meQuery.isFetching || conversationsQuery.isFetching}
          isOffline={meQuery.isError || conversationsQuery.isError}
          onRetry={() => meQuery.refetch()}
        />

        <section className="grid min-h-0 flex-1 grid-rows-[minmax(180px,32vh)_minmax(0,1fr)] gap-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:grid-rows-1">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded border border-slate-200 bg-white">
            <div className="shrink-0 border-b border-slate-200 p-4">
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

            <div className="min-h-0 flex-1">
              <ConversationList
                conversations={filteredConversations}
                selectedConversationId={selectedConversationId}
                isLoading={isConversationsLoading}
                isError={hasConversationsError}
                search={search}
                onRetry={() => conversationsQuery.refetch()}
                onSelectConversation={handleSelectConversation}
              />
            </div>
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden rounded border border-slate-200 bg-white">
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
