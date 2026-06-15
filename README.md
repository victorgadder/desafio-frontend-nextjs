# Inbox de Atendimento WhatsApp com IA

Frontend em Next.js para um painel de atendimento via WhatsApp. A aplicação consome a API fornecida pelo desafio e entrega lista de conversas, histórico do chat, envio de mensagens com atualização otimista e sugestão de resposta com IA.

## Como Rodar

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse http://localhost:3000.

A URL da API já vem configurada em `.env.example`:

```bash
NEXT_PUBLIC_API_URL=https://8tymn68hp9.execute-api.us-east-1.amazonaws.com
```

## Scripts

```bash
npm run dev        # ambiente local
npm run lint       # validação de lint
npm run typecheck  # checagem TypeScript
npm run build      # build de produção
```

## O Que Foi Implementado

- Lista de conversas com busca por nome, telefone e última mensagem.
- Indicador de não lidas, última mensagem e horário da conversa.
- Tela de chat com bolhas separando cliente e atendente.
- Envio de mensagem com atualização otimista.
- Botão para sugerir resposta com IA usando `POST /ai/suggest`.
- Toggle `Enviar com ENTER`, mantendo `Shift + Enter` para quebra de linha.
- Estados de loading, erro e vazio para lista, chat e composição.
- Polling para manter conversas e mensagens sincronizadas.
- Badge de status com `Online`, `Sincronizando` e `Offline`.
- Layout desktop com lista e chat lado a lado.
- Layout mobile em fluxo lista-conversa, com botão de voltar no chat.
- Rolagem interna na lista e no histórico, mantendo o composer fixo no rodapé.
- `CHANGELOG.md` versionando as principais mudanças do projeto.

## Decisões De Arquitetura

### Server E Client Components

`app/page.tsx` fica como Server Component simples e renderiza `InboxApp`. Ele não precisa de estado, eventos ou APIs do navegador.

A interface principal fica em `app/inbox-app.tsx` como Client Component porque depende de estado local, eventos de formulário, React Query, polling, mutações, `matchMedia` e manipulação de interação do usuário.

Essa separação deixa a rota limpa e torna explícito que a interatividade pertence à camada client-side.

### Organização De Componentes

A feature do inbox foi separada em componentes internos dentro de `app/_components/inbox`:

- `app-header.tsx`: cabeçalho do produto, agente e status de sincronização.
- `conversation-list.tsx`: lista, busca, estados vazios, erro e loading.
- `chat-panel.tsx`: header da conversa, histórico e estados do chat.
- `composer.tsx`: textarea, envio, sugestão de IA e toggle de ENTER.
- `message-bubble.tsx`: bolhas de mensagens.
- `avatar.tsx`, `sync-badge.tsx`, `state-message.tsx` e `message-skeleton.tsx`: peças reutilizáveis de UI.
- `utils.ts`: formatação de datas, telefone, iniciais e busca local.

Com isso, `InboxApp` concentra a orquestração: seleção de conversa, queries, mutations, cache, polling e estado do mobile.

### API Centralizada

O arquivo `lib/api.ts` continua sendo o contrato de comunicação com o backend. A UI importa funções como `getConversations`, `getMessages`, `sendMessage` e `suggestReply`, sem conhecer detalhes de Axios, base URL ou rotas.

Isso reduz acoplamento entre interface e transporte HTTP e facilita testes futuros.

### React Query

React Query foi usado para cache, loading, erro, polling, invalidação e atualização otimista:

- `["me"]` carrega o atendente logado.
- `["conversations"]` carrega a lista e faz polling a cada 10 segundos.
- `["messages", conversationId]` carrega o histórico da conversa selecionada e faz polling a cada 6 segundos.

Escolhi polling por ser suficiente para o escopo do desafio e simples de defender. Em produção, eu avaliaria WebSocket ou Server-Sent Events para reduzir latência e chamadas repetidas.

### Atualização Otimista

No envio de mensagem, a mensagem aparece imediatamente no chat antes da resposta do servidor. A mutação:

1. Cancela queries em andamento da conversa.
2. Salva snapshots de mensagens e conversas.
3. Insere uma mensagem temporária no cache.
4. Atualiza o preview da conversa.
5. Troca a mensagem temporária pela resposta real quando o backend confirma.
6. Restaura o estado anterior se houver erro.

Essa escolha melhora a percepção de velocidade sem esconder falhas, porque em caso de erro o texto volta para o campo de composição.

### Sincronização E Falhas Parciais

O estado do perfil do agente (`/me`) foi separado do estado da lista (`/conversations`). Se o perfil falhar, o header mostra um estado próprio e oferece retry, mas a lista continua disponível se as conversas carregarem corretamente.

O badge geral de sincronização usa os estados das queries principais para exibir `Online`, `Sincronizando` ou `Offline`.

### Experiência Mobile

No desktop, a interface mantém o padrão de inbox: lista à esquerda e chat à direita.

No mobile, a experiência muda para um fluxo mais próximo do WhatsApp:

- primeiro aparece a lista de contatos;
- ao tocar em uma conversa, o chat ocupa a tela;
- o header do chat mostra botão de voltar, avatar, nome e telefone;
- o composer fica fixo no rodapé;
- mensagens e lista têm rolagem interna.

O estado de abertura do chat mobile é separado do estado da conversa selecionada para preservar o comportamento desktop e evitar renderizar lista e chat empilhados.

### UX E Acessibilidade

A tela usa controles nativos (`button`, `input`, `textarea`, `form`) para manter acessibilidade básica. Também foram adicionados:

- `sr-only` em labels visuais.
- `aria-label` em skeletons e botões iconográficos.
- `role="alert"` para erros do composer.
- `aria-live="polite"` no badge de sincronização.
- `aria-current` e `aria-pressed` na conversa selecionada.
- `aria-pressed` no toggle `Enviar com ENTER`.
- foco visível em botões e campos.
- estados vazios e mensagens de erro com ação de tentar novamente.

## O Que Faria Com Mais Tempo

- Adicionar testes com React Testing Library para busca, envio otimista, erro de mutação e fluxo mobile lista-conversa.
- Usar WebSocket ou SSE para atualização em tempo real.
- Marcar mensagens como lidas ao abrir a conversa, se a API oferecesse essa rota.
- Persistir a preferência `Enviar com ENTER` no `localStorage`.
- Adicionar animações leves na transição mobile entre lista e chat.
- Adicionar virtualização se a lista de mensagens pudesse ficar muito grande.

## Changelog

As mudanças relevantes estão versionadas em [CHANGELOG.md](CHANGELOG.md).

## Validação

Os comandos abaixo foram executados com sucesso:

```bash
npm run lint
npm run typecheck
npm run build
```
