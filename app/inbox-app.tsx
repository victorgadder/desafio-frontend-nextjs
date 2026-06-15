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
  const [sendWithEnter, setSendWithEnter] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
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
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkTheme(mediaQuery.matches);
  }, []);

  useEffect(() => {
    if (!isMobileViewport && !selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, isMobileViewport, selectedConversationId]);

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
    setIsMobileChatOpen(true);
    setComposerError(null);
  }

  function handleBackToConversations() {
    setIsMobileChatOpen(false);
    setComposerError(null);
  }

  function sendDraftMessage() {
    const text = draft.trim();
    if (!selectedConversationId || !text || sendMutation.isPending) return;

    sendMutation.mutate({ conversationId: selectedConversationId, text });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendDraftMessage();
  }

  const isConversationsLoading = conversationsQuery.isLoading;
  const hasConversationsError = conversationsQuery.isError;
  const showMobileChat = isMobileChatOpen && Boolean(selectedConversation);

  return (
    <main
      className={`h-dvh overflow-hidden bg-[#f5f7f8] text-slate-950 dark:bg-slate-950 dark:text-slate-100 ${
        isDarkTheme ? "dark" : ""
      }`}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className={showMobileChat ? "hidden lg:block" : undefined}>
          <AppHeader
            agent={meQuery.data}
            isLoading={meQuery.isLoading}
            isError={meQuery.isError}
            isSyncing={meQuery.isFetching || conversationsQuery.isFetching}
            isOffline={meQuery.isError || conversationsQuery.isError}
            isDarkTheme={isDarkTheme}
            onToggleTheme={() => setIsDarkTheme((current) => !current)}
            onRetry={() => meQuery.refetch()}
          />
        </div>

        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside
            className={`min-h-0 flex-col overflow-hidden rounded border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex ${
              showMobileChat ? "hidden" : "flex"
            }`}
          >
            <div className="shrink-0 border-b border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-semibold">Conversas</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {conversations.length} atendimentos no inbox
                  </p>
                </div>
              </div>

              <label className="mt-4 block">
                <span className="sr-only">Buscar conversa</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-11 w-full rounded border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:ring-emerald-900"
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

          <section
            className={`min-h-0 flex-col overflow-hidden rounded border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex ${
              showMobileChat ? "flex" : "hidden"
            }`}
          >
            <ChatPanel
              conversation={selectedConversation}
              messages={messagesQuery.data ?? []}
              isLoading={messagesQuery.isLoading}
              isFetching={messagesQuery.isFetching}
              isError={messagesQuery.isError}
              onRetry={() => messagesQuery.refetch()}
              onBack={handleBackToConversations}
              showBackButton={showMobileChat}
              messagesEndRef={messagesEndRef}
            />

            <Composer
              value={draft}
              disabled={!selectedConversationId}
              isSending={sendMutation.isPending}
              isSuggesting={suggestionMutation.isPending}
              sendWithEnter={sendWithEnter}
              error={composerError}
              onChange={setDraft}
              onSendWithEnterChange={setSendWithEnter}
              onSubmit={handleSubmit}
              onSendRequest={sendDraftMessage}
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
